const logger = require('winston');
const { format, transports } = logger;
require('winston-daily-rotate-file');

const fileLogOptions = {
  format: format.combine(
    format.json(),
    // Shouldn't be used in production. Sorry. see https://github.com/winstonjs/logform#prettyprint
    // format.prettyPrint(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
  ),
  // winston-daily-rotate-file options
  datePattern: 'YYYY-MM-DD', // daily logs
  handleExceptions: true,
  maxFiles: '30d'
}

// code from: https://github.com/winstonjs/winston
const mainLoggers = logger.createLogger({
  level: 'info',
  format: format.combine( // Shared format of file and console loggers.
    format.metadata(),
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new transports.DailyRotateFile({
      ...fileLogOptions,
      level: 'info',
      // winston-daily-rotate-file options
      filename: 'logs/combined-%DATE%.log',
    }),
    new transports.DailyRotateFile({
      ...fileLogOptions,
      level: 'error',
      // winston-daily-rotate-file options
      filename: 'logs/error-%DATE%.log',
    }),
    // Console logger
    new transports.Console({
      format: logger.format.combine(
        format.timestamp({
          format: 'HH:mm:ss'
        }),
        format.colorize(),
        format.printf(info => `${info.timestamp} [${info.level}]: ${info.message} ${Object.keys(info.metadata).length > 0 ? '\n' + JSON.stringify(info.metadata) : ''}`),
        format.align(),
      ),
      level: 'info'
    })
  ]
});

logger.add(mainLoggers);
logger.log = logger.info; // Set alias, similar to console.log;

module.exports = logger;