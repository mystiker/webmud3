import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { Server, Socket } from 'socket.io';

import { TelnetClient } from '../../features/telnet/telnet-client.js';
import { logger } from '../../shared/utils/logger.js';
import { ClientToServerEvents } from './types/client-to-server-events.js';
import { InterServerEvents } from './types/inter-server-events.js';
import { MudConnections } from './types/mud-connections.js';
import { ServerToClientEvents } from './types/server-to-client-events.js';

const CONNECTION_TIMEOUT = 60 * 3 * 1000; //900_000; // 15 minutes

export class SocketManager extends Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents
> {
  private readonly mudConnections: MudConnections = {};

  public constructor(
    server: HttpServer | HttpsServer,
    private readonly telnetOptions: {
      telnetHost: string;
      telnetPort: number;
      useTls: boolean;
    },
  ) {
    super(server, {
      path: '/socket.io',
      transports: ['websocket'],
      connectionStateRecovery: {
        maxDisconnectionDuration: CONNECTION_TIMEOUT,
      },
    });

    this.on('connection', (socket) => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} connected`, {
        socketId: socket.id,
      });

      this.handleClientConnection(socket);

      if (this.mudConnections[socket.id] !== undefined) {
        logger.info(`[Socket-Manager] [Client] ${socket.id} was reconnecting`, {
          socketId: socket.id,
        });

        if (this.mudConnections[socket.id].telnet !== undefined) {
          logger.info(
            `[Socket-Manager] [Client] ${socket.id} allready got an established telnet connection. Emitting 'mudConnected'`,
            {
              socketId: socket.id,
            },
          );

          socket.emit('mudConnected');
        }

        logger.info(
          `[Socket-Manager] [Client] ${socket.id} resetting logout (statue in mud) timer`,
          {
            socketId: socket.id,
          },
        );

        if (this.mudConnections[socket.id].timer !== undefined) {
          clearTimeout(this.mudConnections[socket.id].timer);

          this.mudConnections[socket.id].timer = undefined;
        }
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

    socket.on('disconnect', (reason: string) => {
      logger.info(`[Socket-Manager] [Client] ${socket.id} disconnect`, {
        reason,
      });

      logger.info(
        `[Socket-Manager] [Client] ${socket.id} starting timer to close telnet connection in ${CONNECTION_TIMEOUT}ms`,
        {
          socketId: socket.id,
        },
      );

      this.mudConnections[socket.id].timer = setTimeout(() => {
        this.closeTelnetConnections(socket.id);
      }, CONNECTION_TIMEOUT);
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
          timer: undefined,
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

      this.closeTelnetConnections(socket.id);
    });
  }

  private closeTelnetConnections(socketId: string) {
    const telnetClient = this.mudConnections[socketId]?.telnet;

    if (telnetClient !== undefined && telnetClient.isConnected) {
      telnetClient.disconnect();

      this.mudConnections[socketId].telnet = undefined;
    }
  }
}
