const fs = require('fs');
const path = require('path');
const client = require('./core/client');
const config = require('./core/config');
const logger = require('./core/logger');

if (!config.token) {
  logger.error('DISCORD_TOKEN mangler i .env filen!');
  process.exit(1);
}

// Loader alle events automatisk fra events/
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(config.token);
