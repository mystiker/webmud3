import express from 'express';
import sourceMaps from 'source-map-support';
import { v4 as uuidv4 } from 'uuid';

import { loadConfig } from './core/config/load-config.js';
import { DefaultMudConfig } from './core/config/models/default-mud-config.js';
import { DefaultSecretConfig } from './core/config/models/default-secret-config.js';
import { SocketManager } from './core/connections/socket-manager.js';
import { createHttpServer } from './core/connections/utils/create-http-server.js';
import { Environment } from './core/environment/environment.js';
import { useBodyParser } from './core/middleware/body-parser.js';
import { useCookieSession } from './core/middleware/cookie-session.js';
import { useStaticFiles } from './core/middleware/static-files.js';
import { useRoutes } from './core/routes/routes.js';
import { logger } from './features/logger/winston-logger.js';

sourceMaps.install();

const environment = Environment.getInstance();

logger.info('[Main] Environment loaded', { environment });

const secretConfig = loadConfig(
  process.env.SECRET_CONFIG || '/run/secret_sauce.json',
  DefaultSecretConfig,
);

logger.info('[Main] Secret Config loaded', { secretConfig });

// Todo[myst] check this out
if (typeof secretConfig.myLogDB !== 'undefined') {
  process.env.MY_LOG_DB = secretConfig.myLogDB;
}

const mudConfig = loadConfig(
  process.env.MUD_CONFIG || '/run/mud_config.json',
  DefaultMudConfig,
);

logger.info('[Main] Mud Config loaded', { mudConfig });

const port = process.env.PORT || 5000;

const app = express();

const httpServer = createHttpServer(app, environment);

const UNIQUE_SERVER_ID = uuidv4();

useBodyParser(app);

useCookieSession(app, secretConfig.mySessionKey);

useStaticFiles(app, 'wwwroot');

useRoutes(app, mudConfig);

new SocketManager(httpServer, secretConfig.mySocketPath);

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

httpServer.listen(port, () => {
  logger.info(`[Main] Server started on port ${port}`, {
    UNIQUE_SERVER_ID,
  });
});
