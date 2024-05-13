import { IEnvironment } from '../../shared/types/environment.js';

export class Environment implements IEnvironment {
  private static instance: Environment;

  public readonly tls: boolean;
  public readonly tls_cert: string;
  public readonly tls_key: string;

  private constructor() {
    this.tls = Boolean(process.env.TLS) || false;

    this.tls_cert = process.env.TLS_CERT || '';

    this.tls_key = process.env.TLS_KEY || '';
  }

  public static getInstance() {
    return this.instance || (this.instance = new this());
  }
}
