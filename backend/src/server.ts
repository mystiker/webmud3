import fs from 'fs';
import authRoutes from './mudrpc/authRoutes.js';

import { TelnetClient } from './features/telnet/telnet-client.js';

import net, { Socket } from 'net';
import tls from 'tls';
import { v4 as uuidv4 } from 'uuid';

import bodyParser from 'body-parser';
import session from 'cookie-session';
import express from 'express';
import path from 'path';

import { Server } from 'socket.io';

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

// loads module and registers app specific cleanup callback...
// const cleanup = require('./cleanup').Cleanup(myCleanup);
import { Environment } from './environment/environment.class.js';

import sourceMaps from 'source-map-support';
import { NGXLogger } from './ngxlogger/ngxlogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

sourceMaps.install();

process.stdin.resume(); // Prevents the program from closing instantly

const logger = new NGXLogger();

const cfg = Environment.getInstance();

const scfgfile = process.env.SECRET_CONFIG || '/run/secret_sauce.json';
let scfg;
try {
  scfg = JSON.parse(fs.readFileSync(scfgfile, 'utf8'));
} catch (error) {
  console.warn('secret config error', error);
  scfg = {
    env: 'local',
    mySocketPath: '/socket.io',
    mySocket: '/',
    mySessionKey: 'FyD32AnErszbmmU3sjTz',
    myLogDB: undefined,
  };
}

if (typeof scfg.myLogDB !== 'undefined') {
  process.env.MY_LOG_DB = scfg.myLogDB;
}

const mudcfgfile = process.env.MUD_CONFIG || '/run/mud_config.json';
let mcfg;
try {
  mcfg = JSON.parse(fs.readFileSync(mudcfgfile, 'utf8'));
} catch (error) {
  console.warn('mud config error', error);
  mcfg = {
    scope: 'server-default',
    href: '/',
    mudfamilies: {
      basistelnet: {
        charset: 'ascii',
        MXP: false,
        GMCP: false,
        GMCP_Support: {},
      },
      unitopia: {
        charset: 'utf8',
        MXP: true,
        GMCP: true,
        GMCP_Support: {
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
        },
      },
    },
    muds: {
      unitopia: {
        name: 'UNItopia',
        host: 'unitopia.de',
        port: 992,
        ssl: true,
        rejectUnauthorized: true,
        description: 'UNItopia via SSL',
        playerlevel: 'all',
        mudfamily: 'unitopia',
      },
      seifenblase: {
        name: 'Seifenblase',
        host: 'seifenblase.de',
        port: 3333,
        ssl: false,
        rejectUnauthorized: false,
        description: 'Seifenblase',
        playerlevel: 'all',
        mudfamily: 'basistelnet',
      },
    },
    routes: {
      '/': 'unitopia',
      seifenblase: 'seifenblase',
    },
  };
}

console.log('central config file', JSON.stringify(cfg, undefined, 2));
console.log('mud config file', JSON.stringify(mcfg, undefined, 2));

const app = express();

/* const cors = require('cors');
var corsOptions = {
    origin: function (origin, callback) {
        console.log("origin: ["+new Date().toUTCString()+"]: ",origin);
        callback(null, true);
        return;
      if (cfg.whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  } */
// app.use(cors(corsOptions));

let http;
let options;
if (cfg.tls) {
  options = {
    key: fs.readFileSync(cfg.tls_key),
    cert: fs.readFileSync(cfg.tls_cert),
  };
  http = new HttpsServer(options, app);
  console.log('INIT: https active');
  logger.addAndShowLog('SRV://5000', 'DEBUG', 'INIT: https active', []);
} else {
  http = new HttpServer(app);
}

// const io = require('socket.io')(http,{'path':'/socket.io','transports': ['websocket']});
const io = new Server(http, {
  path: scfg.mySocketPath,
  transports: ['websocket'],
});
// io.set('origins', cfg.whitelist);

const UNIQUE_SERVER_ID = uuidv4(); // changes per install!

// For being able to read request bodies
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: scfg.mySessionKey,
    // Todo[myst]: Diese beiden Properties gibt es nicht mehr in der neuesten Version von cookie-session - aber ich habe keine Zeit, das jetzt zu fixen
    // Wir wollen im besten Fall eh auf JWT umsteigen
    // resave: false,
    // saveUninitialized: true,
  }),
);

app.get('/socket.io-client/dist/*', (req, res) => {
  const mypath = req.path.substr(0);
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.socket ? req.socket.remoteAddress : null);
  logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'socket-Path:', [mypath]);
  res.sendFile(path.join(__dirname, 'node_modules' + mypath));
});

app.get('/manifest.webmanifest', function (req, res) {
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.socket ? req.socket.remoteAddress : null);
  let manif = 'manifest.webmanifest';
  switch (process.env.WEBMUD3_DISTRIBUTION_TYPE) {
    case 'unitopia-prod':
      manif = 'manifest.unitopia.webmanifest';
      break;
    case 'unitopia-test':
      manif = 'manifest.unitopia-test.webmanifest';
      break;
    case 'seifenblase':
      manif = 'manifest.seifenblase.webmanifest';
      break;
    default:
  }
  logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'manifest:', [manif]);
  fs.readFile(path.join(__dirname, 'dist', manif), function (err, data) {
    if (err) {
      res.sendStatus(404);
    } else {
      // modify the data here, then send it
      res.send(data);
    }
  });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/ace/*', (req, res) => {
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.socket ? req.socket.remoteAddress : null);
  const mypath = req.path.substr(5);
  logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'ace-Path:', [mypath]);
  res.sendFile(
    path.join(
      __dirname,
      'node_modules/ace-builds/src-min-noconflict/' + mypath,
    ),
  );
});

app.use('/api/auth', authRoutes);

app.get('/config/mud_config.json', (req, res) => {
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.socket ? req.socket.remoteAddress : null);
  logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'mud_config.json', []);
  res.json(mcfg);
  res.status(200);
});

app.get('*', (req, res) => {
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.socket ? req.socket.remoteAddress : null);
  logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'dist/index.html-Path:', [
    req.path,
  ]);
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const MudConnections = {};
const Socket2Mud = {};

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
      UNIQUE_SERVER_ID,
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
      UNIQUE_SERVER_ID,
      function (action) {
        logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S02-disconnecting:', [
          action,
        ]);
      },
    );
  }

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
  socket.on('error', function (error) {
    logger.addAndShowLog('SRV:' + real_ip, 'ERROR', 'S01-socket error', [
      socket.id,
      error.message,
    ]);
  });
  socket.on('disconnecting', function (reason) {
    logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S01-socket disconnecting', [
      socket.id,
      reason,
    ]);
  });
  socket.on('reconnect_attempt', (attemptNumber) => {
    logger.addAndShowLog(
      'SRV:' + real_ip,
      'INFO',
      'S01-socket reconnect_attempt',
      [socket.id, attemptNumber],
    );
  });
  socket.on('keep-alive', function (level, callback) {
    logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S01-socket keep alive ', [
      socket.id,
      level,
    ]);
    callback(level);
  });

  socket.on('add-message', (message) => {
    const timeStamp = new Date().getTime();
    io.emit('message', {
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

  socket.on('mud-list', function (data, callback) {
    callback(mcfg.muds);
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
    if (mcfg.muds.hasOwnProperty(mudOb.mudname)) {
      mudcfg = mcfg.muds[mudOb.mudname];
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
        mcfg.hasOwnProperty('mudfamilies') &&
        typeof mcfg.mudfamilies[mudcfg.mudfamily] !== 'undefined'
      ) {
        const fam = mcfg.mudfamilies[mudcfg.mudfamily];
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
        {
          debugflag: true,
          id,
          gmcp_support,
          charset,
        },
        socket as unknown as Socket,
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
      callback({ id, socketID: socket.id, serverID: UNIQUE_SERVER_ID });
    } catch (error) {
      logger.addAndShowLog('SRV:' + real_ip, 'ERROR', 'mud-connect catch', [
        socket.id,
        error,
      ]);
      callback({ error: error.toString('utf8') });
    }
  });

  socket.on('mud-window-size', (id, height, width) => {
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
    const mudOptions = mudSocket._moptions;
    // console.log('mudConn: ',mudConn);
    // console.log('mudSocket: ',mudSocket);
    // console.log('mudOptions: ',mudOptions);
    if (typeof inpline !== 'undefined' && inpline !== null) {
      mudSocket.write(inpline.toString(mudOptions.charset) + '\r\n');
      logger.addAndShowLog('SRV:' + real_ip, 'TRACE', 'mud-input', [inpline]);
    }
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
  socket.emit(
    'connected',
    socket.id,
    real_ip,
    UNIQUE_SERVER_ID,
    function (action, oMudOb) {
      logger.addAndShowLog('SRV:' + real_ip, 'INFO', 'S02-connected:', [
        action,
        oMudOb,
      ]);
    },
  );
});

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

http.listen(5000, () => {
  // logger.addAndShowLog
  console.log(
    'SRV//:5000',
    'INFO',
    "INIT: Server'backend' started on port 5000:",
    UNIQUE_SERVER_ID,
  );
});
