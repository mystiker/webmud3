import fs from 'fs';

import { logger } from '../../features/logger/winston-logger.js';
import { MudConfig } from '../../shared/types/mud_config.js';
import { SecretConfig } from '../../shared/types/secure_config.js';

export const loadConfig = <T extends MudConfig | SecretConfig>(
  path: fs.PathOrFileDescriptor,
  defaultConfig: T,
): T => {
  try {
    const data = fs.readFileSync(path, 'utf8');

    return JSON.parse(data) as T;
  } catch (error: unknown) {
    logger.warn(
      `[Config] Could not load config at ${path} - revert to default.`,
    );

    return defaultConfig;
  }
};
