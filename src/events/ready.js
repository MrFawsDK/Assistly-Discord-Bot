const logger = require('../core/logger');
const { loadCommands } = require('../core/commandHandler');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.success(`Bot online som ${client.user.tag}`);
    await loadCommands(client);
  },
};
