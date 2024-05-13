import net, { Socket } from 'net';
import tls from 'tls';

import { Server } from 'socket.io';
import { NGXLogger } from '../../ngxlogger/ngxlogger.js';

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

import { v4 as uuidv4 } from 'uuid';
import { TelnetClient } from '../../features/telnet/telnet-client.js';
import { DefaultMudConfig } from '../config/default-mud-config.js';
import { DefaultSecretConfig } from '../config/default-secret-config.js';

export const setupSocketIO = (
  server: HttpServer | HttpsServer,
  secretConfig: typeof DefaultSecretConfig,
  mudConfig: typeof DefaultMudConfig,
  serverId: string,
) => {
  const MudConnections = {};
  const Socket2Mud = {};

  const logger = NGXLogger.getInstance();

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

    // console.log('S01-socket:'+socket.id+' user connected: ',real_ip);
    logger.addAndShowLog('SRV:' + real_ip, 'LOG', 'S01-socket user connected', [
      socket.id,
    ]);

    if (
      typeof Socket2Mud === 'undefined' ||
      typeof Socket2Mud[socket.id] === 'undefined'
    ) {
      socket.emit(
        'connecting',
        socket.id,
        real_ip,
        serverId,
        function (action, oMudOb) {
          logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S02-connecting:', [
            action,
            oMudOb,
          ]);
        },
      );
    } else {
      socket.emit(
        'disconnecting',
        socket.id,
        real_ip,
        serverId,
        function (action) {
          logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S02-disconnecting:', [
            action,
          ]);
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
      logger.log2console(log);
    });

    socket.on('mud-gmcp-outgoing', (id, mod, msg, data) => {
      if (typeof id !== 'string' || typeof MudConnections[id] === 'undefined') {
        logger.addAndShowLog(
          'SRV:' + real_ip,
          'ERROR',
          'mud-gmcp-outgoing MudConn undefined',
          [id],
        );
        return;
      }
      const mudConn = MudConnections[id];
      const mudSocket = mudConn.socket;
      const gheader = '' + mod + '.' + msg + ' ';
      const mudOb = mudConn.mudOb;
      if (gheader.toLowerCase() == 'core.browserinfo ') {
        data = mudOb.browser;
        data.client = mudOb.client;
        data.version = mudOb.version;
        data.real_ip = real_ip;
      }
      const jsdata = JSON.stringify(data);
      const b1 = Buffer.from(gheader);
      const b2 = Buffer.from(jsdata);
      const buf = Buffer.concat([b1, b2], b1.length + b2.length);
      logger.addAndShowLog('SRV:' + real_ip, 'DEBUG', 'mud-gmcp-outgoing', [
        socket.id,
        mod,
        msg,
        data,
      ]);
      mudSocket.writeSub(201 /* TELOPT_GMCP */, buf);
    });

    socket.on('mud-input', (id, inpline) => {
      if (typeof id !== 'string' || typeof MudConnections[id] === 'undefined') {
        logger.addAndShowLog(
          'SRV:' + real_ip,
          'ERROR',
          'mud-input MudConn undefined',
          [id],
        );
        return;
      }
      const mudConn = MudConnections[id];
      const mudSocket = mudConn.socket;
      const mudOptions = mudSocket?.mudOptions;
      // console.log('mudConn: ',mudConn);
      // console.log('mudSocket: ',mudSocket);
      // console.log('mudOptions: ',mudOptions);
      if (typeof inpline !== 'undefined' && inpline !== null) {
        mudSocket.write(inpline.toString(mudOptions.charset) + '\r\n');
        logger.addAndShowLog('SRV:' + real_ip, 'TRACE', 'mud-input', [inpline]);
      }
    });

    socket.on('mud-disconnect', (id, cb) => {
      if (typeof id !== 'string' || typeof MudConnections[id] === 'undefined') {
        logger.addAndShowLog(
          'SRV:' + real_ip,
          'ERROR',
          'mud-disconnect MudConn undefined',
          [id],
        );
        cb('error', id);
        return;
      }
      const mudConn = MudConnections[id];
      const mudSocket = mudConn.socket;
      const mudOb = mudConn.mudOb;
      mudSocket.end();
      Socket2Mud[socket.id] = Socket2Mud[socket.id].filter((mid) => mid != id);
      if (Socket2Mud[socket.id].length == 0) {
        delete Socket2Mud[socket.id];
      }
      logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'mud-disconnected', [
        socket.id,
        mudOb,
      ]);
      socket.emit('mud-disconnected', id);
      delete MudConnections[id];
      cb(undefined, id);
    });

    io.on('mud-window-size', (id, height, width) => {
      if (typeof id !== 'string' || typeof MudConnections[id] === 'undefined') {
        logger.addAndShowLog(
          'SRV:' + real_ip,
          'ERROR',
          'mud-window-size MudConn undefined',
          [id],
        );
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
      const buf = mudSocket.sizeToBuffer(width, height);
      logger.addAndShowLog('SRV:' + real_ip, 'TRACE', 'NAWS-buf', [
        buf,
        width,
        height,
      ]);
      mudSocket.writeSub(31 /* TELOPT_NAWS */, buf);
    });

    socket.on('mud-list', function (data, callback) {
      callback(mudConfig.muds);
    });

    socket.on('error', function (error) {
      logger.addAndShowLog('SRV:' + real_ip, 'ERROR', 'S01-socket error', [
        socket.id,
        error.message,
      ]);
    });

    socket.on('disconnecting', function (reason) {
      logger.addAndShowLog(
        'SRV:' + real_ip,
        'INFO',
        'S01-socket disconnecting',
        [socket.id, reason],
      );
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
      // if (cfg.other.storage.active) {
      //     dbsocket.emit('chat-message', chatOB);
      // }
      socket.emit('chat-message', chatOB);
    });

    socket.on('keep-alive', function (level, callback) {
      logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S01-socket keep alive ', [
        socket.id,
        level,
      ]);
      callback(level);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      logger.addAndShowLog(
        'SRV:' + real_ip,
        'INFO',
        'S01-socket reconnect_attempt',
        [socket.id, attemptNumber],
      );
    });

    socket.on('disconnect', function () {
      // TODO disconnect all mudclients...
      logger.addAndShowLog(
        'SRV:' + real_ip,
        'INFO',
        'S01-socket user disconnected',
        [socket.id],
      );
      if (
        typeof Socket2Mud === 'undefined' ||
        typeof Socket2Mud[socket.id] === 'undefined'
      ) {
        return;
      }
      Socket2Mud[socket.id].forEach(function (id) {
        let mudSocket, mudOb;
        const mudConn = MudConnections[id];
        if (typeof mudConn !== 'undefined') {
          mudSocket = mudConn.socket;
          if (typeof mudSocket !== 'undefined') {
            mudSocket.end();
          }
          mudOb = mudConn.mudOb;
          if (typeof mudOb !== 'undefined') {
            logger.addAndShowLog(
              'SRV:' + real_ip,
              'ERROR',
              'S01-socket socket-disconnect-mudOb',
              [socket.id, mudOb],
            );
          }
        }
        delete MudConnections[id];
      });
      delete Socket2Mud[socket.id];
    });

    socket.on('mud-connect', function (mudOb, callback) {
      const id = uuidv4(); // random, unique id!
      let tsocket, mudcfg;
      logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'mud-connect', [
        socket.id,
        mudOb,
      ]);
      if (typeof mudOb.mudname === 'undefined') {
        logger.addAndShowLog('SRV:' + real_ip, 'FATAL', 'Undefined mudname', [
          socket.id,
          mudOb,
        ]);
        callback({ error: 'Missing mudname' });
        return;
      }
      if (mudConfig.muds.hasOwnProperty(mudOb.mudname)) {
        mudcfg = mudConfig.muds[mudOb.mudname];
      } else {
        logger.addAndShowLog(
          'SRV:' + real_ip,
          'FATAL',
          'Unknown mudnameUnknown mudname',
          [socket.id, mudOb],
        );
        return;
      }
      mudOb.real_ip = real_ip;
      let gmcp_support;
      let charset = 'ascii';
      if (mudcfg.hasOwnProperty('mudfamily')) {
        if (
          mudConfig.hasOwnProperty('mudfamilies') &&
          typeof mudConfig.mudfamilies[mudcfg.mudfamily] !== 'undefined'
        ) {
          const fam = mudConfig.mudfamilies[mudcfg.mudfamily];
          if (
            typeof fam.GMCP !== 'undefined' &&
            fam.GMCP === true &&
            typeof fam.GMCP_Support !== 'undefined'
          ) {
            gmcp_support = fam.GMCP_Support;
            gmcp_support.mudfamily = mudcfg.mudfamily;
          }
          charset = fam.charset;
        }
      }
      try {
        logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S02-socket-open', [
          socket.id,
          mudcfg,
        ]);
        if (mudcfg.ssl === true) {
          tsocket = tls.connect({
            host: mudcfg.host,
            port: mudcfg.port,
            rejectUnauthorized: mudcfg.rejectUnauthorized,
          });
        } else {
          tsocket = net.createConnection({
            host: mudcfg.host,
            port: mudcfg.port,
          });
        }
        const mudSocket = new TelnetClient(
          tsocket,
          { bufferSize: 65536 },
          socket as unknown as Socket,
          {
            debugflag: true,
            id,
            gmcp_support,
            charset,
          },
        );
        mudSocket.on('close', function () {
          logger.addAndShowLog(
            'SRV:' + real_ip,
            'DEBUG',
            'mud-disconnect=>close',
            [socket.id],
          );
          socket.emit('mud-disconnected', id);
        });
        mudSocket.on('data', function (buffer) {
          socket.emit('mud-output', id, buffer.toString('utf8'));
        });
        // Todo[myst]: 'debug' event is not emitted by MudSocket any more
        // mudSocket.on('debug', function (dbgOb) {
        //   logger.addAndShowLog('SRV:' + real_ip, 'DEBUG', 'mud-debug', [
        //     socket.id,
        //     dbgOb,
        //   ]);
        // });
        MudConnections[id] = {
          socket: mudSocket,
          mudOb,
          socketID: socket.id,
        };
        if (typeof Socket2Mud[socket.id] === 'undefined') {
          Socket2Mud[socket.id] = [id];
        } else {
          Socket2Mud[socket.id].push[id];
        }
        logger.addAndShowLog(
          'SRV:' + real_ip,
          'INFO',
          'S02-socket mud-connect:',
          [socket.id, mudOb],
        );
        callback({ id, socketID: socket.id, serverID: serverId });
      } catch (error) {
        logger.addAndShowLog('SRV:' + real_ip, 'ERROR', 'mud-connect catch', [
          socket.id,
          error,
        ]);
        callback({ error: error.toString('utf8') });
      }
    });

    socket.emit(
      'connected',
      socket.id,
      real_ip,
      serverId,
      function (action, oMudOb) {
        logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S02-connected:', [
          action,
          oMudOb,
        ]);
      },
    );
  });

  return io;
};
