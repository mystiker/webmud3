import fs from 'fs';

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

import { Express } from 'express';

import { logger } from '../../features/logger/winston-logger.js';
import { IEnvironment } from '../../shared/types/environment.js';

export function createHttpServer(
  app: Express,
  environment: IEnvironment,
): HttpServer | HttpsServer {
  if (environment.tls) {
    const options = {
      key: fs.readFileSync(environment.tls_key),
      cert: fs.readFileSync(environment.tls_cert),
    };

    console.log('INIT: https active');

    logger.debug('SRV://5000 : INIT: https active');

    return new HttpsServer(options, app);
  } else {
    return new HttpServer(app);
  }
}
