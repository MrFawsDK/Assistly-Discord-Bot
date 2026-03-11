const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');
const logger = require('./logger');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  const commandData = [];

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
    logger.info(`Command loaded: /${command.data.name}`);
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    logger.info('Registrerer slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandData }
    );
    logger.success(`${commandData.length} slash command(s) registreret.`);
  } catch (err) {
    logger.error(`Kunne ikke registrere commands: ${err.message}`);
  }
}

module.exports = { loadCommands };
