const { SlashCommandBuilder } = require('discord.js');
const { ask } = require('../services/ollamaService');
const { buildDetailedEmbed } = require('../Utils/embedBuilder');
const { cleanResponse, truncate } = require('../Utils/formatResponse');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spørgsmål')
    .setDescription('Stil et spørgsmål og få et kort svar + detaljeret forklaring')
    .addStringOption(opt =>
      opt
        .setName('spørgsmål')
        .setDescription('Dit spørgsmål')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const spørgsmål = interaction.options.getString('spørgsmål');

    const prompt =
      'Besvar det følgende spørgsmål på dansk i to klart adskilte sektioner.\n' +
      'Sektion 1 starter med præcis linjen: KORT SVAR:\n' +
      'Skriv 1-2 sætninger der besvarer spørgsmålet direkte og præcist.\n' +
      'Sektion 2 starter med præcis linjen: DETALJERET FORKLARING:\n' +
      'Giv en grundig, detaljeret og informativ forklaring. Brug gerne punkter, eksempler og underpunkter. Jo mere viden jo bedre.\n\n' +
      `Spørgsmål: ${spørgsmål}`;

    const raw = await ask(prompt);
    const cleaned = cleanResponse(raw);

    // Split på de to sektioner
    const kortMatch = cleaned.match(/KORT SVAR:\s*([\s\S]*?)(?=DETALJERET FORKLARING:|$)/i);
    const detaljMatch = cleaned.match(/DETALJERET FORKLARING:\s*([\s\S]*)/i);

    const kortSvar = kortMatch ? truncate(kortMatch[1].trim(), 300) : truncate(cleaned, 300);
    const detaljeret = detaljMatch ? truncate(detaljMatch[1].trim(), 1000) : '';

    const embed = buildDetailedEmbed(`💬 ${spørgsmål}`, kortSvar, detaljeret || '_Ingen detaljeret forklaring tilgængelig._', interaction.user);

    await interaction.editReply({ embeds: [embed] });
  },
};
