const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aichat')
    .setDescription('Opret en AI-chat kanal hvor Assistly svarer på alle beskeder (Kun admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const existing = interaction.guild.channels.cache.find(c => c.name === 'ai-chat');
    if (existing) {
      return interaction.editReply(`Der eksisterer allerede en AI-chat kanal: ${existing}`);
    }

    try {
      const channel = await interaction.guild.channels.create({
        name: 'ai-chat',
        type: ChannelType.GuildText,
        topic: 'Skriv en besked og Assistly svarer automatisk.',
      });

      await interaction.editReply(`✅ AI-chat kanal oprettet: ${channel}\nAl tekst skrevet i kanalen vil blive besvaret af Assistly.`);
    } catch (err) {
      await interaction.editReply('❌ Kunne ikke oprette kanalen. Sørg for at botten har rettigheder til at administrere kanaler.');
    }
  },
};
