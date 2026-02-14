const pino = require('pino');

const level = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level,
  base: { pid: false },
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;
