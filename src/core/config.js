require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  // Ollama (lokal)
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3',
  // Ekstern API (OpenAI-kompatibel: OpenAI, Groq, Mistral, Gemini osv.)
  aiProvider: process.env.AI_PROVIDER || 'ollama', // 'ollama' eller 'api'
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.API_KEY || '',
  apiModel: process.env.API_MODEL || 'gpt-4o',
};
