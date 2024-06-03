import winston from 'winston';

// Comment this in if you want to log metadata
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const metadataFormat = winston.format((info) => {
  if (info.metadata && Object.keys(info.metadata).length > 0) {
    info.message += `\n${JSON.stringify(info.metadata)}`;
  }

  return info;
});

/**
 * Hinweis zu den unterstützen Log-Leveln in der Priotiätsreihenfolge:
 * - error
 * - warn
 * - info
 * - http
 * - verbose
 * - debug
 * - silly
 **/
const logger = winston.createLogger({
  level: 'debug',
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label'],
    }),
    metadataFormat(),
    winston.format.printf(
      (info) => `[${info.timestamp}] [${info.level}] ${info.message}`,
    ),
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `[${info.timestamp}] [${info.level}] ${info.message}`,
        ),
      ),
    }),
  ],
  exitOnError: false,
});

export { logger };
