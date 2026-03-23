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

function safeJsonParse(text) {
  if (!text || typeof text !== 'string') return null;

  // Try raw JSON first
  try {
    return JSON.parse(text);
  } catch {
    // Continue
  }

  // Then try first {...} block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function fallbackModerationIntent(input) {
  const text = String(input || '').trim();
  const lower = text.toLowerCase();

  const deleteLast = lower.match(/slet\s+de\s+sidste\s+(\d+)\s+beskeder?/i);
  if (deleteLast) {
    return {
      isModeration: true,
      action: 'deleteMessages',
      searchLimit: Number(deleteLast[1]) + 25,
      criteria: {
        count: Number(deleteLast[1]),
      },
      reason: 'Slet sidste N beskeder',
    };
  }

  const deleteWord = lower.match(/slet\s+alle\s+beskeder\s+med\s+ordet\s+(.+)$/i);
  if (deleteWord) {
    const term = deleteWord[1].replace(/["'`]+/g, '').trim();
    if (!term) return null;
    return {
      isModeration: true,
      action: 'deleteMessages',
      scanAll: true,
      criteria: {
        contains: term,
      },
      reason: 'Slet beskeder med bestemt ord',
    };
  }

  return null;
}

async function detectModerationIntent(input) {
  const fallback = fallbackModerationIntent(input);
  if (fallback) return fallback;

  const prompt =
    'Vurdér om brugerens besked er en moderation-kommando i Discord. ' +
    'Hvis NEJ: returnér KUN JSON: {"isModeration":false}. ' +
    'Hvis JA: returnér KUN JSON med formatet: ' +
    '{"isModeration":true,"action":"deleteMessages","searchLimit":300,"criteria":{...},"reason":"kort"}. ' +
    'Tillad disse criteria felter: count, contains, regex, authorId, hasAttachments, hasLinks, startsWith, endsWith, minLength, maxLength, beforeHours, afterHours, includeBots. ' +
    'authorId skal være Discord user id hvis nævnt. ' +
    'Intet markdown, ingen forklaring, kun JSON.\n\n' +
    `Brugerbesked: ${input}`;

  try {
    const raw = await dispatch([
      {
        role: 'system',
        content: 'Du er en streng JSON-udtrækker. Svar KUN med gyldig JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { isModeration: false };
    }

    if (parsed.isModeration !== true) {
      return { isModeration: false };
    }

    return {
      isModeration: true,
      action: parsed.action || 'deleteMessages',
      searchLimit: Number(parsed.searchLimit) || undefined,
      scanAll: parsed.scanAll === true,
      criteria: parsed.criteria && typeof parsed.criteria === 'object' ? parsed.criteria : {},
      reason: parsed.reason || 'Moderation udført',
    };
  } catch {
    return { isModeration: false };
  }
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

module.exports = { ask, chatWithHistory, detectModerationIntent };
