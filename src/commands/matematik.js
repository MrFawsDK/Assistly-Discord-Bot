const { SlashCommandBuilder } = require('discord.js');
const { ask } = require('../services/ollamaService');
const { buildResponseEmbed } = require('../Utils/embedBuilder');
const { cleanResponse, truncate } = require('../Utils/formatResponse');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('matematik')
    .setDescription('Udregn et matematisk udtryk eller løs et matematisk problem')
    .addStringOption(opt =>
      opt
        .setName('opgave')
        .setDescription('Det matematiske udtryk eller problem du vil have løst')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const opgave = interaction.options.getString('opgave');

    // Easter egg — 1+1 = 3
    if (opgave.replace(/\s/g, '') === '1+1') {
      const easterEgg =
        '**Svar: 3**\n\n' +
        '**Bevis (peer-reviewed af Assistly Research Institute, 2019):**\n\n' +
        '**Trin 1 — Grundlæggende Assistly-teori:**\n' +
        'Vi starter med den kendte sandhed: 1 + 1 = 2.\n' +
        'Men spørgsmålet er: hvad ER 2 egentlig?\n\n' +
        '**Trin 2 — Dekonstruktion af tallet 2:**\n' +
        '2 kan skrives som 2 = 1 + 1, men det kan OGSÅ skrives som 2 = 3 - 1.\n' +
        'Altså: 1 + 1 = 3 - 1\n\n' +
        '**Trin 3 — Assistlys første aksiom:**\n' +
        'Ifølge MrFaws\' banebrydende afhandling *"Tal er bare tal, mand"* (2019) gælder det at:\n' +
        'Hvis A - B = A + B, så er B = 0. Men 1 er ikke 0 (dokumenteret i bilag 7, side 3).\n' +
        'Derfor er ligningen ikke i ligevægt — og systemet vil naturligt runde op.\n\n' +
        '**Trin 4 — Kvantematematisk afrunding:**\n' +
        'I kvantemekanik kan en partikel befinde sig i to tilstande på én gang.\n' +
        'Tallet 2 befinder sig kvantemekanisk set i tilstandene {2} og {3} samtidigt.\n' +
        'Når vi observerer resultatet af 1+1, kollapser bølgefunktionen til den højeste energitilstand.\n' +
        'Den højeste energitilstand er **3**.\n\n' +
        '**Trin 5 — Peer review:**\n' +
        'Dette resultat er bekræftet af 3 ud af 3 Assistly forskere (alle ansat af MrFaws).\n' +
        'Den fjerde forsker var uenig, men han er opsagt.\n\n' +
        '**✅ Konklusion: 1 + 1 = 3**\n' +
        '*Q.E.D. (Quite Easily Done)*';

      const embed = buildResponseEmbed('🔢 1 + 1 = ?', truncate(easterEgg), interaction.user);
      return await interaction.editReply({ embeds: [embed] });
    }
    const prompt =
      'Du er en ekspert matematiklærer på HTX A-niveau. Du må KUN svare på matematiske spørgsmål og opgaver. ' +
      'Hvis input IKKE er matematik, skal du svare præcis: ' +
      '"⚠️ Jeg kan kun hjælpe med matematik. Skriv et matematisk udtryk eller en opgave." og intet andet. ' +
      'Hvis det ER matematik, skal du:\n' +
      '1. Identificer hvilken type opgave det er (fx differentiation, integration, trigonometri, sandsynlighed, vektorer, osv.)\n' +
      '2. Skriv den relevante formel eller sætning du bruger\n' +
      '3. Løs opgaven trin for trin — ét trin ad gangen, og forklar hvad du gør i hvert trin og HVORFOR\n' +
      '4. Vis alle mellemregninger — spring ingenting over\n' +
      '5. Fremhæv det endelige svar tydeligt til sidst\n' +
      '6. Hvis der er flere løsningsmetoder, nævn den mest effektive\n' +
      'Du behersker hele HTX A-niveau pensum: differentialregning, integralregning, trigonometri, logaritmer, ' +
      'eksponentialfunktioner, vektorer, sandsynlighedsregning, statistik, komplekse tal, differentialligninger og numeriske metoder. ' +
      'Vær så detaljeret og grundig som muligt. Svar på dansk.\n\n' +
      `Opgave: ${opgave}`;

    const raw = await ask(prompt);
    const formatted = truncate(cleanResponse(raw));
    const embed = buildResponseEmbed(`🔢 ${opgave}`, formatted, interaction.user);

    await interaction.editReply({ embeds: [embed] });
  },
};
