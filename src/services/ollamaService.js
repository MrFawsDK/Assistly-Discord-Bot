const axios = require('axios');
const config = require('../core/config');
const logger = require('../core/logger');

const SYSTEM_PROMPT =
  'Du er Assistly, en hjælpsom AI-assistent. ' +
  'Svar altid på dansk med mindre andet er bedt om.';

const AICHAT_SYSTEM_PROMPT =
  'Du er Assistly, en hjælpsom AI-assistent. ' +
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
