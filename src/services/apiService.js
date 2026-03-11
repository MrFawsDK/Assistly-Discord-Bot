// Bruges når AI_PROVIDER=api i .env
// Virker med enhver OpenAI-kompatibel API:
//   OpenAI:      API_BASE_URL=https://api.openai.com/v1
//   Groq:        API_BASE_URL=https://api.groq.com/openai/v1
//   Mistral:     API_BASE_URL=https://api.mistral.ai/v1
//   Together AI: API_BASE_URL=https://api.together.xyz/v1
//   Gemini:      API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai

const axios = require('axios');
const config = require('../core/config');

async function chat(messages) {
  const response = await axios.post(
    `${config.apiBaseUrl}/chat/completions`,
    { model: config.apiModel, messages },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
}

module.exports = { chat };
