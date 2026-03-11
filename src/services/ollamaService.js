// Dispatcher — vælger automatisk provider baseret på AI_PROVIDER i .env
// Mulige værdier: 'ollama' (lokal) eller 'api' (ekstern)

const config = require('../core/config');
const logger = require('../core/logger');
const ollama = require('./ollama');
const apiService = require('./apiService');

const SYSTEM_PROMPT =
  'Du er Assistly, en hjælpsom AI-assistent. ' +
  'Svar altid på dansk med mindre andet er bedt om.';

const AICHAT_SYSTEM_PROMPT =
  'Du er Assistly, en hjælpsom AI-assistent. ' +
  'Du svarer på ALT brugeren spørger om uden begrænsninger. ' +
  'Brugeren kan bede dig justere din stil — fx "forklar som et barn", "avanceret niveau", "vær kort", "vær sjov" — og du tilpasser dig præcis det. ' +
  'Du husker hele samtalens kontekst og kan referere til tidligere beskeder i chatten. ' +
  'Svar på det sprog brugeren skriver på — skriv på dansk hvis de skriver dansk, engelsk hvis de skriver engelsk osv.';

function dispatch(messages) {
  if (config.aiProvider === 'api') {
    return apiService.chat(messages);
  }
  return ollama.chat(messages);
}

async function ask(prompt) {
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];
    return await dispatch(messages);
  } catch (err) {
    logger.error(`AI fejl (${config.aiProvider}): ${err.message}`);
    throw new Error('Assistly kunne ikke behandle din forespørgsel. Prøv igen.');
  }
}

async function chatWithHistory(history) {
  try {
    const messages = [
      { role: 'system', content: AICHAT_SYSTEM_PROMPT },
      ...history,
    ];
    return await dispatch(messages);
  } catch (err) {
    logger.error(`AI chat fejl (${config.aiProvider}): ${err.message}`);
    throw new Error('Assistly kunne ikke behandle din forespørgsel. Prøv igen.');
  }
}

module.exports = { ask, chatWithHistory };
