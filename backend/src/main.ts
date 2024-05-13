import { v4 as uuidv4 } from 'uuid';

import express from 'express';

// loads module and registers app specific cleanup callback...
// const cleanup = require('./cleanup').Cleanup(myCleanup);
import { Environment } from './core/environment/environment.js';

import sourceMaps from 'source-map-support';
import { DefaultMudConfig } from './core/config/default-mud-config.js';
import { DefaultSecretConfig } from './core/config/default-secret-config.js';
import { loadConfig } from './core/config/load-config.js';
import { createHttpServer } from './core/connections/http-server.js';
import { setupSocketIO } from './core/connections/socket-manager.js';
import { useBodyParser } from './core/middleware/body-parser.js';
import { useCookieSession } from './core/middleware/cookie-session.js';
import { useStaticFiles } from './core/middleware/static-files.js';
import { useRoutes } from './core/routes/routes.js';
import { logger } from './features/logger/winston-logger.js';

const environment = Environment.getInstance();

logger.info('Environment loaded', { environment });

sourceMaps.install();

const secretConfig = loadConfig(
  process.env.SECRET_CONFIG || '/run/secret_sauce.json',
  DefaultSecretConfig,
);

logger.info('Secret Config loaded', { secretConfig });

// Todo[myst] check this out
if (typeof secretConfig.myLogDB !== 'undefined') {
  process.env.MY_LOG_DB = secretConfig.myLogDB;
}

const mudConfig = loadConfig(
  process.env.MUD_CONFIG || '/run/mud_config.json',
  DefaultMudConfig,
);

logger.info('Mud Config loaded', { mudConfig });

const app = express();

const httpServer = createHttpServer(app, environment);

const UNIQUE_SERVER_ID = uuidv4();

useBodyParser(app);
useCookieSession(app, secretConfig.mySessionKey);
useStaticFiles(app, 'dist');

useRoutes(app, mudConfig);

setupSocketIO(httpServer, secretConfig, mudConfig, UNIQUE_SERVER_ID);

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

httpServer.listen(5000, () => {
  logger.info("INIT: Server'backend' started on port 5000", {
    UNIQUE_SERVER_ID,
  });
});
