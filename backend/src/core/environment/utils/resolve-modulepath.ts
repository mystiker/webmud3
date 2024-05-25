import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * This function is isolated since it uses the import.meta object.
 */
export function resolveModulePath(importMetaUrl: string): string {
  const __filename = fileURLToPath(import.meta.resolve(importMetaUrl));

  return dirname(__filename);
}
