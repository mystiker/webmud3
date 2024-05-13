import winston from 'winston';

const metadataFormat = winston.format((info) => {
  if (info.metadata && Object.keys(info.metadata).length > 0) {
    info.message += `\nMetadaten: ${JSON.stringify(info.metadata)}`;
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
      (info) => `${info.timestamp} ${info.level}:\t ${info.message}`,
    ),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}:\t ${info.message}`,
        ),
      ),
    }),
  ],
});

export { logger };
