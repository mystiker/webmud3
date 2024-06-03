import { Express } from 'express';
import fs from 'fs';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

import { logger } from '../../../features/logger/winston-logger.js';
import { IEnvironment } from '../../environment/types/environment.js';

export function createHttpServer(
  app: Express,
  environment: IEnvironment,
): HttpServer | HttpsServer {
  if (environment.tls !== undefined) {
    const options = {
      key: fs.readFileSync(environment.tls.key),
      cert: fs.readFileSync(environment.tls.cert),
    };

    console.log('INIT: https active');

    logger.debug('SRV://5000 : INIT: https active');

    return new HttpsServer(options, app);
  } else {
    return new HttpServer(app);
  }
}
