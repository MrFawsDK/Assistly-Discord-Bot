// Bruges når AI_PROVIDER=ollama i .env
// Kræver at Ollama kører lokalt: https://ollama.com

const axios = require('axios');
const config = require('../core/config');

async function chat(messages) {
  const response = await axios.post(`${config.ollamaUrl}/api/chat`, {
    model: config.ollamaModel,
    messages,
    stream: false,
  });
  return response.data.message.content;
}

module.exports = { chat };
