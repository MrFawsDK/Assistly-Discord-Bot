const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Vis hvad botten kan'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Assistly Kommandoer')
      .setDescription('Drevet af **Assistly** — lavet af MrFaws.')
      .setColor(0x5865f2)
      .addFields(
        {
          name: '🔍 /debug [kode]',
          value: 'Send et stykke kode og få en analyse fra Assistly der finder fejl og forklarer løsningen.',
        },
        {
          name: '💬 /spørgsmål [spørgsmål]',
          value: 'Stil et direkte spørgsmål og få et præcist svar fra Assistly.',
        },
        {
          name: '🔢 /matematik [opgave]',
          value: 'Løs matematiske udtryk og opgaver. Virker kun på matematik — alt andet afvises.',
        },
        {
          name: '❓ /help',
          value: 'Viser denne oversigt.',
        },
        {
          name: '⚠️ Vigtigt — Vidensgrænse',
          value:
            'Assistly har **kun viden frem til september 2021**.\n' +
            'Spørgsmål om nyere begivenheder, teknologier eller opdateringer efter den dato kan ikke besvares korrekt.',
        }
      )
      .setFooter({ text: 'Powered by Assistly — lavet af MrFaws' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
