import { IEnvironment } from './types/environment.js';
import { getEnvironmentVariable } from './utils/get-environment-variable.js';
import { resolveModulePath } from './utils/resolve-modulepath.js';

/**
 * Environment class to handle environment variables and application settings.
 * Reads the environment variables once oppon initialisation and provides them as properties.
 */
export class Environment implements IEnvironment {
  private static instance: Environment;

  public readonly host: string;
  public readonly port: number;
  public readonly tls?: {
    cert: string;
    key: string;
  };
  public readonly charset: string;
  public readonly projectRoot: string;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes the environment variables.
   */
  private constructor() {
    const tls_cert = getEnvironmentVariable('TLS_CERT', false);

    const tls_key = getEnvironmentVariable('TLS_KEY', false);

    if (tls_cert !== null && tls_key !== null) {
      this.tls = {
        cert: tls_cert,
        key: tls_key,
      };
    }

    this.host = String(getEnvironmentVariable('HOST'));

    this.port = Number(getEnvironmentVariable('PORT'));

    this.charset = String(getEnvironmentVariable('CHARSET', false, 'utf8'));

    this.projectRoot = resolveModulePath('../../main.js');
  }

  /**
   * Gets the singleton instance of the Environment class.
   * @returns {Environment} The instance of the Environment class.
   */
  public static getInstance(): Environment {
    return this.instance || (this.instance = new this());
  }
}
