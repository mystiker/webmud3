import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { Server, Socket } from 'socket.io';

import { logger } from '../../shared/utils/logger.js';
// Todo: Refactor Dependency
import { TelnetClient } from '../telnet/telnet-client.js';
import { ClientToServerEvents } from './types/client-to-server-events.js';
import { InterServerEvents } from './types/inter-server-events.js';
import { ServerToClientEvents } from './types/server-to-client-events.js';

type MudConnections = {
  [socketId: string]: {
    telnet: TelnetClient | undefined;
  };
};

export class SocketManager {
  private readonly mudConnections: MudConnections = {};

  public constructor(
    server: HttpServer | HttpsServer,
    private readonly telnetOptions: {
      telnetHost: string;
      telnetPort: number;
      useTls: boolean;
    },
  ) {
    const clientWebSockets = new Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents
    >(server, {
      path: '/socket.io',
      transports: ['websocket'],
      connectionStateRecovery: {},
    });

    clientWebSockets.on('connection', (socket) => {
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

        socket.emit('mudConnected');
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
    });

    socket.on('mudInput', (data: string) => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} mudInput`, {
        input: data,
      });

      const telnetClient = this.mudConnections[socket.id]?.telnet;

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

      const telnetClient = this.mudConnections[socket.id]?.telnet;

      if (telnetClient === undefined || telnetClient.isConnected === false) {
        logger.info(
          `[Socket-Manager] [Client] ${socket.id} had no active telnet connection .. creating new one..`,
        );

        const telnetClient = new TelnetClient(
          this.telnetOptions.telnetHost,
          this.telnetOptions.telnetPort,
          this.telnetOptions.useTls,
        );

        telnetClient.on('data', (data: string | Buffer) => {
          socket.emit('mudOutput', data.toString('utf8'));
        });

        telnetClient.on('close', () => {
          logger.info(
            `[Socket-Manager] [Client] ${socket.id} telnet connection closed. Emitting 'mudDisconnected'`,
          );

          this.mudConnections[socket.id].telnet = undefined;

          socket.emit('mudDisconnected');
        });

        this.mudConnections[socket.id] = {
          telnet: telnetClient,
        };

        logger.info(
          `[Socket-Manager] [Client] ${socket.id} .. telnet connection established. Emitting 'mudConnected'`,
        );

        socket.emit('mudConnected');

        return;
      }
    });

    socket.on('mudDisconnect', () => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} mudDisconnect`);

      const telnetClient = this.mudConnections[socket.id]?.telnet;

      if (telnetClient !== undefined && telnetClient.isConnected) {
        telnetClient.disconnect();
      }
    });
  }
}
