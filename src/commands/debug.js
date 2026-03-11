const { SlashCommandBuilder } = require('discord.js');
const { ask } = require('../services/ollamaService');
const { buildResponseEmbed } = require('../Utils/embedBuilder');
const { cleanResponse, truncate } = require('../Utils/formatResponse');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Få AI hjælp til at debugge kode')
    .addStringOption(opt =>
      opt
        .setName('kode')
        .setDescription('Koden du vil have debugget')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const kode = interaction.options.getString('kode');
    const prompt =
      `Du er en erfaren udvikler. Analyser denne kode, find fejl og forklar løsningen på dansk:\n\n${kode}`;

    const raw = await ask(prompt);
    const formatted = truncate(cleanResponse(raw));
    const embed = buildResponseEmbed('🔍 Assistly Debug Analyse', formatted, interaction.user);

    await interaction.editReply({ embeds: [embed] });
  },
};
