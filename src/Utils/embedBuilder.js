const { EmbedBuilder } = require('discord.js');

function buildResponseEmbed(title, description, user) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x5865f2)
    .setFooter({
      text: `Assistly • Spurgt af ${user.username}`,
      iconURL: user.displayAvatarURL(),
    })
    .setTimestamp();
}

function buildDetailedEmbed(title, shortAnswer, detailedAnswer, user) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(`**Kort svar:**\n${shortAnswer}`)
    .addFields({ name: '📖 Detaljeret forklaring', value: detailedAnswer })
    .setColor(0x5865f2)
    .setFooter({
      text: `Assistly • Spurgt af ${user.username}`,
      iconURL: user.displayAvatarURL(),
    })
    .setTimestamp();
}

module.exports = { buildResponseEmbed, buildDetailedEmbed };
