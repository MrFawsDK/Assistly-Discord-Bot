const { chatWithHistory } = require('../services/ollamaService');
const logger = require('../core/logger');

// Gemmer samtalehistorik per kanal: channelId -> [{ role, content }, ...]
const channelHistory = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.channel.name !== 'ai-chat') return;
    if (!message.content.trim()) return;

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
