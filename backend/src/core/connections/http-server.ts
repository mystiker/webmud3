import fs from 'fs';

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

import { Express } from 'express';

import { NGXLogger } from '../../ngxlogger/ngxlogger.js';
import { IEnvironment } from '../environment/environment.interface';

export function createHttpServer(
  app: Express,
  environment: IEnvironment,
): HttpServer | HttpsServer {
  const logger = NGXLogger.getInstance();

  if (environment.tls) {
    const options = {
      key: fs.readFileSync(environment.tls_key),
      cert: fs.readFileSync(environment.tls_cert),
    };
    console.log('INIT: https active');
    logger.addAndShowLog('SRV://5000', 'DEBUG', 'INIT: https active', []);
    return new HttpsServer(options, app);
  } else {
    return new HttpServer(app);
  }
}
