import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import net from 'net';
import { Server, Socket } from 'socket.io';
import tls from 'tls';

import { logger } from '../../features/logger/winston-logger.js';
import { TelnetClient } from '../../features/telnet/telnet-client.js';
import { Environment } from '../environment/environment.js';
import { ClientToServerEvents } from './types/client-to-server-events.js';
import { InterServerEvents } from './types/inter-server-events.js';
import { ServerToClientEvents } from './types/server-to-client-events.js';

type MudConnections = {
  [socketId: string]: TelnetClient | undefined;
};

export class SocketManager {
  private readonly clientWebSocket: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents
  >;

  private readonly mudConnections: MudConnections = {};

  public constructor(server: HttpServer | HttpsServer, socketPath: string) {
    this.clientWebSocket = new Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents
    >(server, {
      path: socketPath,
      transports: ['websocket'],
    });

    this.clientWebSocket.on('connection', (socket) => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} connected`, {
        socketId: socket.id,
      });

      this.handleClientConnection(socket);

      if (this.mudConnections[socket.id] !== undefined) {
        logger.info(
          `[Socket-Manager] [Client] ${socket.id} allready got an established telnet connection. Emitting 'mudConnected'`,
          {
            socketId: socket.id,
          },
        );

        this.clientWebSocket.emit('mudConnected');
      }
    });
  }

  private handleClientConnection(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents
    >,
  ) {
    socket.on('error', (error: Error) => {
      logger.error(`[Socket-Manager] [Client] ${socket.id} error`, {
        socketId: socket.id,
        error: error,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} disconnect`, {});

      const telnetClient = this.mudConnections[socket.id];

      if (telnetClient !== undefined) {
        if (telnetClient !== null) {
          telnetClient.disconnect();
        }

        delete this.mudConnections[socket.id];
      }
    });

    socket.on('mudInput', (data: string) => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} mudInput`, {
        input: data,
      });

      const telnetClient = this.mudConnections[socket.id];

      if (telnetClient === undefined || telnetClient.isConnected === false) {
        logger.error(
          `[Socket-Manager] [Client] ${socket.id} no telnet connection established - can not send message to mud!`,
          {
            socketId: socket.id,
          },
        );

        return;
      }

      telnetClient.sendMessage(
        // data.toString(Environment.getInstance().charset) + '\r\n',
        `${data}\r\n`,
      );
    });

    socket.on('mudConnect', () => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} mudConnect`);

      const environment = Environment.getInstance();

      const telnetClient = this.mudConnections[socket.id];

      if (telnetClient === undefined || telnetClient.isConnected === false) {
        logger.info(
          `[Socket-Manager] [Client] ${socket.id} had no active telnet connection .. creating new one..`,
        );

        const telnetConnection = createTelnetConnection(environment);

        const telnetClient = new TelnetClient(telnetConnection, {
          bufferSize: 65536,
        });

        // Todo[myst]: Refactor to proper event handling - this is a very important event routing here!
        telnetClient.on('data', (data: string | Buffer) => {
          this.clientWebSocket.emit('mudOutput', data.toString('utf8'));
        });

        this.mudConnections[socket.id] = telnetClient;

        logger.info(
          `[Socket-Manager] [Client] ${socket.id} .. telnet connection established. Emitting 'mudConnected'`,
        );

        this.clientWebSocket.emit('mudConnected');

        return;
      }
    });

    socket.on('mudDisconnect', () => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} mudDisconnect`);

      const telnetClient = this.mudConnections[socket.id];

      if (telnetClient !== undefined && telnetClient.isConnected) {
        telnetClient.disconnect();

        this.clientWebSocket.emit('mudDisconnected');
      }
    });
  }
}

function createTelnetConnection(environment: Environment) {
  let socket;

  if (environment.tls !== undefined) {
    socket = tls.connect({
      host: environment.telnetHost,
      port: environment.telnetPort,
      rejectUnauthorized: true, //Todo[myst]: was mudcfg.rejectUnauthorized but true for unitopia,
    });

    logger.info(`[Socket-Manager] created https connection for telnet`, {
      host: environment.telnetHost,
      port: environment.telnetPort,
      rejectUnauthorized: true,
    });
  } else {
    socket = net.createConnection({
      host: environment.telnetHost,
      port: environment.telnetPort,
    });

    logger.info(`[Socket-Manager] created http connection for telnet`, {
      host: environment.telnetHost,
      port: environment.telnetPort,
    });
  }

  return socket;
}
