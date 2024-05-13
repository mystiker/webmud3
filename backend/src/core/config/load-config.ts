import fs from 'fs';
import { MudConfig } from '../../shared/types/mud_config.types.js';
import { SecretConfig } from '../../shared/types/secure_config.types.js';

export const loadConfig = <T extends MudConfig | SecretConfig>(
  path: fs.PathOrFileDescriptor,
  defaultConfig: T,
): T => {
  try {
    const data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data) as T;
  } catch (error: unknown) {
    console.warn(`${path} config error`, error);
    return defaultConfig;
  }
};
