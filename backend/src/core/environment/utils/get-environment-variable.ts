import { logger } from '../../../shared/utils/logger.js';
import { EnvironmentKeys } from '../types/environment-keys.js';

/**
 * Retrieves an environment variable.
 * @param {EnvironmentKeys} env - The environment variable key.
 * @returns {string} The value of the environment variable.
 * @throws Will throw an error if the environment variable is not set.
 */
export function getEnvironmentVariable(env: EnvironmentKeys): string;

/**
 * Retrieves an environment variable with an optional default value as backup.
 * @param {EnvironmentKeys} env - The environment variable key.
 * @param {boolean} throwError - Whether to throw an error if the variable is not set. This must be set to false in this case.
 * @param {string} [defaultValue] - The default value to use if the variable is not set.
 * @returns {string | null} The value of the environment variable, or the default value if not set.
 */
export function getEnvironmentVariable(
  env: EnvironmentKeys,
  throwError: false,
  defaultValue?: string,
): string | null;

/**
 * Retrieves an environment variable with optional error throwing and default value.
 * @param {EnvironmentKeys} env - The environment variable key.
 * @param {boolean} [throwError=true] - Whether to throw an error if the variable is not set.
 * @param {string} [defaultValue] - The default value to use if the variable is not set and throwError is false.
 * @returns {string | null} The value of the environment variable, or the default value if not set and throwError is false.
 * @throws Will throw an error if the environment variable is not set and throwError is true.
 */
export function getEnvironmentVariable(
  env: EnvironmentKeys,
  throwError: boolean = true,
  defaultValue?: string,
): string | null {
  const value = process.env[env];

  if (value === undefined || value === null || value === '') {
    if (throwError) {
      throw new Error(`Environment variable ${env} is not set`);
    } else {
      if (defaultValue !== undefined) {
        logger.warn(
          `[Environment] variable ${env} is not set. Using default value: ${defaultValue}`,
        );

        return defaultValue;
      } else {
        logger.warn(
          `[Environment] variable ${env} is not set and no default value provided.`,
        );

        return null;
      }
    }
  }

  return value;
}
