const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { chatWithHistory, detectModerationIntent } = require('../services/ollamaService');
const { executeModeration } = require('../services/moderationService');
const logger = require('../core/logger');

// Gemmer samtalehistorik per kanal: channelId -> [{ role, content }, ...]
const channelHistory = new Map();

function buildNotifyEmbed(title, description, color = 0x2b8a3e) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.channel.name !== 'ai-chat') return;
    if (!message.content.trim()) return;

    const member = message.member;
    const isAdmin = member?.permissions?.has(PermissionsBitField.Flags.Administrator) || false;

    // Moderation kræver prefix: "admin slet" eller "admin do"
    if (isAdmin) {
      const moderationPrefix = message.content.match(/^admin\s+(slet|do)\b\s*(.*)$/i);
      if (!moderationPrefix) {
        // Ingen moderation-prefix -> fortsæt normalt AI chat-flow
      } else {
        const adminVerb = String(moderationPrefix[1] || '').toLowerCase();
        const remainder = (moderationPrefix[2] || '').trim();
        const commandBody = adminVerb === 'slet' ? `slet ${remainder}`.trim() : remainder;

        if (!commandBody) {
          await message.channel.send({
            embeds: [
              buildNotifyEmbed(
                'Moderation Kommando',
                'Brug formatet: `admin slet ...` eller `admin do ...`',
                0xf59f00
              ),
            ],
          });
          await message.delete().catch(() => {});
          return;
        }

      try {
        const intent = await detectModerationIntent(commandBody);
        if (intent?.isModeration && intent.action === 'deleteMessages') {
          const botPermissions = message.channel.permissionsFor(message.guild.members.me);
          const botCanManage = botPermissions?.has(PermissionsBitField.Flags.ManageMessages);
          const botCanReadHistory = botPermissions?.has(PermissionsBitField.Flags.ReadMessageHistory);

          if (!botCanManage) {
            await message.channel.send({
              embeds: [
                buildNotifyEmbed(
                  'Moderation Fejl',
                  'Jeg mangler tilladelsen "Manage Messages" for at kunne moderere.',
                  0xc92a2a
                ),
              ],
            });
            await message.delete().catch(() => {});
            return;
          }

          if (!botCanReadHistory) {
            await message.channel.send({
              embeds: [
                buildNotifyEmbed(
                  'Moderation Fejl',
                  'Jeg mangler tilladelsen "Read Message History" for at kunne scanne kanalen.',
                  0xc92a2a
                ),
              ],
            });
            await message.delete().catch(() => {});
            return;
          }

          const criteria = intent.criteria || {};
          const isSimpleCount = typeof criteria.count === 'number' && Object.keys(criteria).length === 1;
          if (!isSimpleCount) {
            // For kriterie-baseret moderation skal hele kanalen gennemsøges.
            intent.scanAll = true;
          }

          const result = await executeModeration(message.channel, message, intent);
          await message.channel.send({
            embeds: [
              buildNotifyEmbed(
                'Moderation Udført',
                `Slettet: ${result.deleted} besked(er)\nMatchede: ${result.matched}\nScannet: ${result.scanned}`,
                0x2b8a3e
              ),
            ],
          });

          // Fjern adminens moderation-besked fra kanalen for et rent chat-flow.
          await message.delete().catch(() => {});
          return;
        }

        await message.channel.send({
          embeds: [
            buildNotifyEmbed(
              'Moderation Ikke Genkendt',
              'Jeg kunne ikke forstå moderation-kriterierne. Prøv fx: `admin slet de sidste 5 beskeder` eller `admin do slet alle beskeder med ordet fisk`.',
              0xf59f00
            ),
          ],
        });
        await message.delete().catch(() => {});
        return;
      } catch (err) {
        logger.error(`Moderation fejl: ${err.message}`);
        await message.channel.send({
          embeds: [
            buildNotifyEmbed(
              'Moderation Fejl',
              'Moderation fejlede. Tjek bot-rettigheder og prøv igen.',
              0xc92a2a
            ),
          ],
        });
        await message.delete().catch(() => {});
        return;
      }
      }
    }

    // Hent eller opret historik for denne kanal
    if (!channelHistory.has(message.channel.id)) {
      channelHistory.set(message.channel.id, []);
    }
    const history = channelHistory.get(message.channel.id);

    // Tilføj brugerens besked til historikken
    history.push({ role: 'user', content: message.content });

    // Hold typing-indikatoren aktiv mens AI svarer
    await message.channel.sendTyping();
    const typingInterval = setInterval(() => message.channel.sendTyping().catch(() => {}), 8000);

    try {
      const response = await chatWithHistory(history);

      // Gem AI's svar i historikken
      history.push({ role: 'assistant', content: response });

      // Behold max 40 beskeder (20 runder) for ikke at løbe tør for kontekst
      if (history.length > 40) history.splice(0, history.length - 40);

      // Del svar op i 2000-tegns chunks hvis nødvendigt
      const chunks = response.match(/[\s\S]{1,2000}/g) || ['(intet svar)'];
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } catch (err) {
      logger.error(`AI-chat fejl: ${err.message}`);
      // Fjern den mislykkede brugerbesked fra historikken igen
      history.pop();
      await message.reply('❌ Assistly kunne ikke svare. Prøv igen.');
    } finally {
      clearInterval(typingInterval);
    }
  },
};
