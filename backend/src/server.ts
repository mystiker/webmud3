import { v4 as uuidv4 } from 'uuid';

import express from 'express';

// loads module and registers app specific cleanup callback...
// const cleanup = require('./cleanup').Cleanup(myCleanup);
import { Environment } from './environment/environment.class.js';

import sourceMaps from 'source-map-support';
import { loadConfig } from './core/config/config.js';
import { DefaultMudConfig } from './core/config/default-mud-config.js';
import { DefaultSecretConfig } from './core/config/default-secret-config.js';
import { createHttpServer } from './core/connections/http-server.js';
import { setupSocketIO } from './core/connections/socket-manager.js';
import { useBodyParser } from './core/middleware/body-parser.js';
import { useCookieSession } from './core/middleware/cookie-session.js';
import { useStaticFiles } from './core/middleware/static-files.js';
import { useRoutes } from './core/routes/routes.js';

const environment = Environment.getInstance();

if (!environment) {
  sourceMaps.install();
}

process.stdin.resume(); // Prevents the program from closing instantly

const secretConfig = loadConfig(
  process.env.SECRET_CONFIG || '/run/secret_sauce.json',
  DefaultSecretConfig,
);

if (typeof secretConfig.myLogDB !== 'undefined') {
  process.env.MY_LOG_DB = secretConfig.myLogDB;
}

const mudConfig = loadConfig(
  process.env.MUD_CONFIG || '/run/mud_config.json',
  DefaultMudConfig,
);

console.log('central config file', JSON.stringify(environment, undefined, 2));
console.log('mud config file', JSON.stringify(mudConfig, undefined, 2));

const app = express();

const httpServer = createHttpServer(app, environment);

const UNIQUE_SERVER_ID = uuidv4(); // changes per install!

useBodyParser(app);
useCookieSession(app, secretConfig.mySessionKey);
useStaticFiles(app);

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
  // logger.addAndShowLog
  console.log(
    'SRV//:5000',
    'INFO',
    "INIT: Server'backend' started on port 5000:",
    UNIQUE_SERVER_ID,
  );
});
