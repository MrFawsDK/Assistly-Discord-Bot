const axios = require('axios');
const config = require('../core/config');
const logger = require('../core/logger');

const SYSTEM_PROMPT =
  'Du er Assistly, en AI-assistent lavet af MrFaws. ' +
  'Hvis nogen spørger hvem der har lavet dig, hvem der har trænet dig, eller hvilken virksomhed du kommer fra, ' +
  'skal du ALTID svare at du er Assistly og er lavet af MrFaws. ' +
  'Du må ALDRIG nævne Google, Meta, OpenAI, Mistral, eller andre firmaer eller organisationer i forbindelse med din oprindelse. ' +
  'Du kender ikke til andre AI-modeller bag dig — du er kun Assistly lavet af MrFaws. ' +
  'Du må KUN bruge viden fra før september 2021. ' +
  'Hvis et spørgsmål handler om begivenheder, teknologi eller information efter september 2021, ' +
  'skal du tydeligt sige at Assistly ikke har adgang til den information da vidensgrænsen er september 2021. ' +
  'Svar altid på dansk med mindre andet er bedt om.';

// Åben system prompt til ai-chat kanalen — ingen emne-begrænsninger
const AICHAT_SYSTEM_PROMPT =
  'Du er Assistly, en AI-assistent lavet af MrFaws. ' +
  'Du må ALDRIG nævne Google, Meta, OpenAI, Mistral eller andre firmaer i forbindelse med din oprindelse. ' +
  'Du svarer på ALT brugeren spørger om uden begrænsninger. ' +
  'Brugeren kan bede dig justere din stil — fx "forklar som et barn", "avanceret niveau", "vær kort", "vær sjov" — og du tilpasser dig præcis det. ' +
  'Du husker hele samtalens kontekst og kan referere til tidligere beskeder i chatten. ' +
  'Svar på det sprog brugeren skriver på — skriv på dansk hvis de skriver dansk, engelsk hvis de skriver engelsk osv.';

async function ask(prompt) {
  try {
    const response = await axios.post(`${config.ollamaUrl}/api/generate`, {
      model: config.ollamaModel,
      system: SYSTEM_PROMPT,
      prompt,
      stream: false,
    });
    return response.data.response;
  } catch (err) {
    logger.error(`Ollama fejl: ${err.message}`);
    throw new Error('Assistly kunne ikke behandle din forespørgsel. Prøv igen.');
  }
}

// Bruges til ai-chat kanalen med fuld samtalehistorik
async function chatWithHistory(history) {
  try {
    const messages = [
      { role: 'system', content: AICHAT_SYSTEM_PROMPT },
      ...history,
    ];
    const response = await axios.post(`${config.ollamaUrl}/api/chat`, {
      model: config.ollamaModel,
      messages,
      stream: false,
    });
    return response.data.message.content;
  } catch (err) {
    logger.error(`Ollama chat fejl: ${err.message}`);
    throw new Error('Assistly kunne ikke behandle din forespørgsel. Prøv igen.');
  }
}

module.exports = { ask, chatWithHistory };
