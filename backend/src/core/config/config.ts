import fs from 'fs';
import { DefaultMudConfig } from './default-mud-config.js';
import { DefaultSecretConfig } from './default-secret-config.js';

export const loadConfig = <
  T extends typeof DefaultMudConfig | typeof DefaultSecretConfig,
>(
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
