import net, { Socket } from 'net';
import tls from 'tls';

import { Server } from 'socket.io';

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../features/logger/winston-logger.js';
import { TelnetClient } from '../../features/telnet/telnet-client.js';
import { MudConfig } from '../../shared/types/mud_config.js';
import { SecretConfig } from '../../shared/types/secure_config.js';
import { sizeToBuffer } from '../../shared/utils/size-to-buffer.js';
import { Environment } from '../environment/environment.js';
import { MudConnection } from './types/mud-connection.js';

type MudConnectionsMap = {
  [id: string]: MudConnection;
};

type SocketToMudMap = {
  [socketId: string]: string[];
};

export const setupSocketIO = (
  server: HttpServer | HttpsServer,
  secretConfig: SecretConfig,
  mudConfig: MudConfig,
  serverId: string,
) => {
  const MudConnections: MudConnectionsMap = {};

  const Socket2Mud: SocketToMudMap = {};

  const io = new Server(server, {
    path: secretConfig.mySocketPath,
    transports: ['websocket'],
  });

  // const io = require('socket.io')(http,{'path':'/socket.io','transports': ['websocket']});
  // io.set('origins', cfg.whitelist);

  io.on('connection', (socket) => {
    // nsp /mysocket.io/ instead of /
    // io.of(scfg.mySocket).on('connection', (socket) => { // nsp /mysocket.io/ instead of /

    const address = socket.handshake.address;

    let real_ip = socket.handshake.headers['x-forwarded-for'] || address;

    const real_index = real_ip.indexOf(',');

    if (real_index > -1) {
      real_ip = real_ip.slice(0, real_index);
    }

    logger.verbose(`SRV: ${real_ip} S01-socket user connected`, {
      socketId: socket.id,
    });

    if (
      typeof Socket2Mud === 'undefined' ||
      typeof Socket2Mud[socket.id] === 'undefined'
    ) {
      logger.info(`[Socket-Manager] [Client] emit message 'connecting'`, {
        socketId: socket.id,
        realIp: real_ip,
        serverId,
      });

      socket.emit(
        'connecting',
        socket.id,
        real_ip,
        serverId,
        function (action: string, oMudOb: string) {
          logger.info(`[Socket-Manager] [Client] responded to 'connecting'`, {
            action,
            oMudOb,
          });
        },
      );
    } else {
      logger.info(`[Socket-Manager] [Client] emit message 'disconnecting'`, {
        socketId: socket.id,
        realIp: real_ip,
        serverId,
      });

      socket.emit(
        'disconnecting',
        socket.id,
        real_ip,
        serverId,
        function (action: string) {
          logger.info(
            `[Socket-Manager] [Client] responded to 'disconnecting'`,
            {
              action,
            },
          );
        },
      );
    }

    /*
  { message: 'mud-output:',
    additional:
     [ '79c63aaf-8535-4c22-ae4d-b3ccd0593d47',
       'Tip: Bei Einstellungen Untermenue Zauberstab kann man sich den zuletzt\r\n        gelesenen Fehler merken lassen. Hat man den Fehler untersucht oder\r\n        bearbeitet, kann man dort wieder einsteigen und Kommentare\r\n        absetzen, oder als erledigt loeschen bzw. ins zugehoerige Done\r\n        verschieben.\r\n' ],
    level: 0,
    timestamp: '2019-10-13T07:12:34.943Z',
    fileName: './src/app/shared/socket.service.ts',
    lineNumber: '480',
    real_ip: '2003:c6:b707:9b00:a924:3e18:56b4:867' }
  2019-10-13T07:12:34.943Z TRACE [./src/app/shared/socket.service.ts:480] mud-output: 79c63aaf-8535-4c22-ae4d-b3ccd0593d47 Tip: Bei Einstellungen Untermenue Zauberstab kann man sich den zuletzt
          gelesenen Fehler merken lassen. Hat man den Fehler untersucht oder
          bearbeitet, kann man dort wieder einsteigen und Kommentare
          absetzen, oder als erledigt loeschen bzw. ins zugehoerige Done
          verschieben.
   */

    socket.on('ngx-log-producer', (log) => {
      log.real_ip = real_ip;

      logger.info(`SRV ${real_ip} ngx-log-producer`, log);
    });

    socket.on('mud-gmcp-outgoing', (id, mod, msg, data) => {
      if (typeof id !== 'string' || typeof MudConnections[id] === 'undefined') {
        logger.error(`SRV: ${real_ip} mud-gmcp-outgoing MudConn undefined`, {
          id,
        });

        return;
      }

      const mudConn = MudConnections[id];

      const mudSocket = mudConn.socket;

      const gheader = '' + mod + '.' + msg + ' ';

      if (gheader.toLowerCase() == 'core.browserinfo ') {
        data = mudConn.mudOb.browser;

        data.client = mudConn.mudOb.client;

        data.version = mudConn.mudOb.version;

        data.real_ip = real_ip;
      }

      const jsdata = JSON.stringify(data);

      const b1 = Buffer.from(gheader);

      const b2 = Buffer.from(jsdata);

      const buf = Buffer.concat([b1, b2], b1.length + b2.length);

      logger.debug(`SRV: ${real_ip} mud-gmcp-outgoing`, {
        socketId: socket.id,
        mod,
        msg,
        data,
      });

      mudSocket.writeSub(201 /* TELOPT_GMCP */, buf);
    });

    socket.on('mud-input', (id, inpline) => {
      if (typeof id !== 'string' || typeof MudConnections[id] === 'undefined') {
        logger.error(`SRV: ${real_ip} mud-input MudConn undefined`, { id });

        return;
      }

      const mudConn = MudConnections[id];

      const mudSocket = mudConn.socket;

      if (typeof inpline !== 'undefined' && inpline !== null) {
        mudSocket.write(
          inpline.toString(Environment.getInstance().charset) + '\r\n',
        );

        logger.verbose(`SRV: ${real_ip} mud-input`, { inpline });
      }
    });

    socket.on('mud-disconnect', (id: string, cb) => {
      if (typeof id !== 'string' || typeof MudConnections[id] === 'undefined') {
        logger.error(`SRV: ${real_ip} mud-disconnect MudConn undefined`, {
          id,
        });

        cb('error', id);

        return;
      }

      const mudConn = MudConnections[id];

      const mudSocket = mudConn.socket;

      const mudOb = mudConn.mudOb;

      mudSocket.end();

      Socket2Mud[socket.id] = Socket2Mud[socket.id].filter(
        (mid: string) => mid != id,
      );

      if (Socket2Mud[socket.id].length == 0) {
        delete Socket2Mud[socket.id];
      }

      logger.info(`SRV: ${real_ip} S01-socket mud-disconnect`, {
        socketId: socket.id,
        mudOb: JSON.stringify(mudOb),
      });

      socket.emit('mud-disconnected', id);

      delete MudConnections[id];

      cb(undefined, id);
    });

    io.on('mud-window-size', (id, height, width) => {
      if (typeof id !== 'string' || typeof MudConnections[id] === 'undefined') {
        logger.error(`SRV: ${real_ip} mud-window-size MudConn undefined`, {
          id,
        });

        return;
      }

      const mudConn = MudConnections[id];

      const mudSocket = mudConn.socket;

      const mudOb = mudConn.mudOb;

      if (mudOb.height == height && mudOb.width == width) {
        return;
      } else {
        mudOb.height = height;

        mudOb.width = width;

        MudConnections[id].mudOb = mudOb;
      }

      const buf = sizeToBuffer(width, height);

      logger.verbose(`SRV: ${real_ip} NAWS-buf`, {
        buf,
        width,
        height,
      });

      mudSocket.writeSub(31 /* TELOPT_NAWS */, buf);
    });

    // Todo[myst]: Multi Mud Support is no longer supported
    // socket.on('mud-list', function (data, callback) {
    //   callback(mudConfig.muds);
    // });

    socket.on('error', function (error) {
      logger.error(`SRV: ${real_ip} S01-socket error`, {
        socketId: socket.id,
        error: error.message,
      });
    });

    socket.on('disconnecting', function (reason) {
      logger.info(`SRV: ${real_ip} S01-socket disconnecting`, {
        socketId: socket.id,
        reason,
      });
    });

    socket.on('add-message', (message) => {
      const timeStamp = new Date().getTime();

      socket.emit('message', {
        type: 'new-message',
        text: message,
        date: timeStamp,
      });
    });

    socket.on('add-chat-message', (msgOb) => {
      const timeStamp = new Date().getTime();

      const chatOB = {
        type: 'new-message',
        from: msgOb.from,
        text: msgOb.text,
        date: timeStamp,
      };

      socket.emit('chat-message', chatOB);
    });

    socket.on('keep-alive', function (level, callback) {
      logger.info(`SRV: ${real_ip} S01-socket keep alive`, {
        socketId: socket.id,
        level,
      });

      callback(level);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      logger.info(`SRV: ${real_ip} S01-socket reconnect_attempt`, {
        socketId: socket.id,
        attemptNumber,
      });
    });

    socket.on('disconnect', function () {
      // TODO disconnect all mudclients...

      logger.info(`SRV: ${real_ip} S01-socket user disconnected`, {
        socketId: socket.id,
      });

      if (
        typeof Socket2Mud === 'undefined' ||
        typeof Socket2Mud[socket.id] === 'undefined'
      ) {
        return;
      }

      Socket2Mud[socket.id].forEach(function (id: string | number) {
        let mudSocket, mudOb;
        const mudConn = MudConnections[id];

        if (typeof mudConn !== 'undefined') {
          mudSocket = mudConn.socket;

          if (typeof mudSocket !== 'undefined') {
            mudSocket.end();
          }

          mudOb = mudConn.mudOb;

          if (typeof mudOb !== 'undefined') {
            logger.error(`SRV: ${real_ip} S01-socket socket-disconnect-mudOb`, {
              socketId: socket.id,
              mudOb: JSON.stringify(mudOb),
            });
          }
        }

        delete MudConnections[id];
      });

      delete Socket2Mud[socket.id];
    });

    // Todo[myst]: mudOb ist import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
    socket.on('mud-connect', (mudOb, callback) => {
      const environment = Environment.getInstance();

      const connectionId = uuidv4(); // random, unique id!

      logger.info(`[Socket-Manager] [Client] received message 'mud-connect'`, {
        socketId: socket.id,
        mudOb,
      });

      try {
        const telnetConnection = createConnection(environment);

        const unitopiaGmcpSupport = {
          Sound: {
            version: '1',
            standard: true,
            optional: false,
          },
          Char: {
            version: '1',
            standard: true,
            optional: false,
          },
          'Char.Items': {
            version: '1',
            standard: true,
            optional: false,
          },
          Comm: {
            version: '1',
            standard: true,
            optional: false,
          },
          Playermap: {
            version: '1',
            standard: false,
            optional: true,
          },
          Files: {
            version: '1',
            standard: true,
            optional: false,
          },
        };

        const mudSocket = new TelnetClient(
          telnetConnection,
          { bufferSize: 65536 },
          socket as unknown as Socket,
          {
            debugflag: true,
            id: connectionId,
            gmcp_support: unitopiaGmcpSupport,
            charset: environment.charset,
          },
        );

        logger.info(`[Socket-Manager] created telnet connection`, {
          host: environment.host,
          port: environment.port,
          gmcpSupport: unitopiaGmcpSupport,
          charset: environment.charset,
          debugflag: true,
        });

        mudSocket.on('close', () => {
          logger.info(`[Socket-Manager] [Telnet] received message 'close'`, {
            socketId: socket.id,
          });

          logger.info(
            `[Socket-Manager] [Client] emit message 'mud-disconnected'`,
            {
              socketId: socket.id,
            },
          );

          socket.emit('mud-disconnected', connectionId);
        });

        mudSocket.on('data', (buffer: string | Buffer) => {
          logger.info(`[Socket-Manager] [Telnet] received message 'data'`, {
            buffer,
          });

          logger.info(`[Socket-Manager] [Client] emit message 'mud-output'`, {
            socketId: socket.id,
          });

          socket.emit('mud-output', connectionId, buffer.toString('utf8'));
        });

        // Todo[myst]: 'debug' event is not emitted by MudSocket any more
        // mudSocket.on('debug', function (dbgOb) {
        //   logger.addAndShowLog('SRV:' + real_ip, 'DEBUG', 'mud-debug', [
        //     socket.id,
        //     dbgOb,
        //   ]);
        // });

        // Todo[myst]: Der ganze Block hier muss vereinfacht werden
        MudConnections[connectionId] = {
          socket: mudSocket,
          mudOb,
          socketID: socket.id,
        };

        if (typeof Socket2Mud[socket.id] === 'undefined') {
          Socket2Mud[socket.id] = [connectionId];
        } else {
          // Todo[myst]: Hier wurde vorher ein Array rein gepushed! Checken, ob das sinnig ist!
          Socket2Mud[socket.id].push(connectionId);
        }

        callback({ id: connectionId, socketId: socket.id, serverId: serverId });
      } catch (error: unknown) {
        logger.error(`[Socket-Manager] [Client] ERROR on 'mud-connect'`, {
          socketId: socket.id,
          error,
        });

        // Todo[myst]Aber hier ist es ein Buffer?!
        callback({ error: (error as Buffer).toString('utf8') });
      }
    });

    logger.info(`[Socket-Manager] [Client] emit message 'connected'`, {
      socketId: socket.id,
      realIp: real_ip,
      serverId,
    });

    socket.emit(
      'connected',
      socket.id,
      real_ip,
      serverId,
      (action: string, oMudOb: string) => {
        logger.info(`[Socket-Manager] [Client] responed to 'connected'`, {
          action,
          oMudOb,
        });
      },
    );
  });

  return io;
};

function createConnection(environment: Environment) {
  let socket;

  if (environment.tls !== undefined) {
    socket = tls.connect({
      host: environment.host,
      port: environment.port,
      rejectUnauthorized: true, //Todo[myst]: was mudcfg.rejectUnauthorized but true for unitopia,
    });

    logger.info(`[Socket-Manager] created https connection for telnet`, {
      host: environment.host,
      port: environment.port,
      rejectUnauthorized: true,
    });
  } else {
    socket = net.createConnection({
      host: environment.host,
      port: environment.port,
    });

    logger.info(`[Socket-Manager] created http connection for telnet`, {
      host: environment.host,
      port: environment.port,
    });
  }

  return socket;
}
