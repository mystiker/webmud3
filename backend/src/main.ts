import express from 'express';
import sourceMaps from 'source-map-support';
import { v4 as uuidv4 } from 'uuid';

import { SocketManager } from './core/connections/socket-manager.js';
import { createHttpServer } from './core/connections/utils/create-http-server.js';
import { Environment } from './core/environment/environment.js';
import { useBodyParser } from './core/middleware/body-parser.js';
import { useStaticFiles } from './core/middleware/static-files.js';
import { useRoutes } from './core/routes/routes.js';
import { logger } from './features/logger/winston-logger.js';

const SOCKET_PATH = '/socket.io';

sourceMaps.install();

const environment = Environment.getInstance();

logger.info('[Main] Environment loaded', { environment });

const app = express();

const httpServer = createHttpServer(app, environment);

const UNIQUE_SERVER_ID = uuidv4();

useBodyParser(app);

// Todo[myst]: What does this bring to the table?
// useCookieSession(app, secretConfig.mySessionKey);

useStaticFiles(app, 'wwwroot');

useRoutes(app);

new SocketManager(httpServer, SOCKET_PATH);

// function myCleanup() {
//   console.log('Cleanup starts.');
//   if (typeof MudConnections !== 'undefined') {
//     for (const key in MudConnections) {
//       // skip loop if the property is from prototype
//       if (!MudConnections.hasOwnProperty(key)) continue;
//       // get object.
//       const obj = MudConnections[key];
//       // message to all frontends...
//       io.emit('mud-disconnected', key);
//       // disconnect gracefully.
//       obj.socket.end();
//     }
//   }
//   console.log('Cleanup ends.');
// }

httpServer.listen(environment.port, environment.host, 10000, () => {
  logger.info(`[Main] Server started on port ${environment.port}`, {
    UNIQUE_SERVER_ID,
  });
});
