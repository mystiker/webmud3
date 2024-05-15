import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { IEnvironment } from '../../shared/types/environment.js';

export class Environment implements IEnvironment {
  private static instance: Environment;

  public readonly tls: boolean;
  public readonly tls_cert: string;
  public readonly tls_key: string;

  public readonly projectRoot: string;

  private constructor() {
    this.tls = Boolean(process.env.TLS) || false;

    this.tls_cert = process.env.TLS_CERT || '';

    this.tls_key = process.env.TLS_KEY || '';

    const __filename = fileURLToPath(import.meta.resolve('../../main.js'));

    this.projectRoot = dirname(__filename);
  }

  public static getInstance() {
    return this.instance || (this.instance = new this());
  }
}
