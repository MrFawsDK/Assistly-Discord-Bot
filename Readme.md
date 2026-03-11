# Assistly — Discord AI Bot

Discord bot med AI-integration. Besvarer spørgsmål, debugger kode og løser matematik. Understøtter lokal Ollama og eksterne API'er (OpenAI, Groq, Mistral m.fl.).

## Kommandoer

| Kommando | Beskrivelse |
|----------|-------------|
| `/spørgsmål` | Stil et spørgsmål og få svar med uddybende forklaring |
| `/debug` | Analyser kode og få fejl identificeret og forklaret |
| `/matematik` | Løs matematiske opgaver trin for trin |
| `/aichat` | *(Admin)* Opret en `#ai-chat` kanal med fuld samtalehukommelse |
| `/help` | Vis alle kommandoer |

## Installation

**Krav:** Node.js 18+, Discord bot fra [Developer Portal](https://discord.com/developers/applications)

```bash
git clone https://github.com/dit-repo/assistly-bot
npm install
cp .env.example .env   # udfyld .env med dine værdier
npm start
```

## .env

```env
# Discord
DISCORD_TOKEN=dit_bot_token
CLIENT_ID=din_application_id
GUILD_ID=din_server_id

# Vælg provider: 'ollama' (lokal) eller 'api' (ekstern)
AI_PROVIDER=ollama

# Ollama — kræver https://ollama.com
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Ekstern API — OpenAI, Groq, Mistral, Together AI osv.
API_BASE_URL=https://api.groq.com/openai/v1
API_KEY=din-api-nøgle
API_MODEL=llama-3.3-70b-versatile
```

Se `.env.example` for flere eksempler på udbydere.
