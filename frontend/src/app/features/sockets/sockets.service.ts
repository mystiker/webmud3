import { EventEmitter, Injectable } from '@angular/core';
import { Manager, Socket } from 'socket.io-client';

import { ServerConfigService } from '../../shared/server-config.service';
import { ClientToServerEvents } from './types/client-to-server-events';
import { IoResult } from './types/io-result';
import { ServerToClientEvents } from './types/server-to-client-events';

@Injectable({
  providedIn: 'root',
})
export class SocketsService {
  private readonly manager: Manager;
  private readonly socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  public mudConnectEvent = new EventEmitter<IoResult>();
  public mudDisconnectEvent = new EventEmitter<IoResult>();
  public mudOutputEvent = new EventEmitter<IoResult>();

  public constructor(serverConfigService: ServerConfigService) {
    const socketUrl = serverConfigService.getBackend();
    const socketNamespace = serverConfigService.getSocketNamespace();

    this.manager = new Manager(socketUrl, {
      path: socketNamespace,
      transports: ['websocket'],
    });

    this.manager.reconnection(true);
    this.manager.reconnectionAttempts(10);

    this.manager.on('error', (error: Error) => {
      this.handleError(error);
    });

    this.manager.on('reconnect', (attempt: number) => {
      this.handleReconnect(attempt);
    });

    this.manager.on('reconnect_attempt', (attempt: number) => {
      this.handleReconnectAttempt(attempt);
    });

    this.manager.on('reconnect_error', (error: Error) => {
      this.handleReconnectError(error);
    });

    this.manager.on('reconnect_failed', () => {
      this.handleReconnectFailed();
    });

    this.manager.on('ping', () => {
      this.handlePing();
    });

    this.socket = this.manager.socket('/');

    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on('disconnect', (reason: string) => {
      this.handleDisconnect(reason);
    });

    this.socket.on('mudConnected', () => {
      this.handleMudConnect();
    });

    this.socket.on('mudDisconnected', () => {
      this.handleMudDisconnect();
    });

    this.socket.on('mudOutput', (output: string) => {
      this.handleMudOutput(output);
    });
  }

  public connectToMud(): void {
    console.log(`[Sockets] Socket Service 'connectToMud`);
    this.socket.emit('mudConnect');
  }

  // Todo: Wohl eher 'disconnectFromMud'
  public disconnect() {
    console.log(`[Sockets] Socket Service 'disconnect`);
    throw new Error('Method not implemented.');
  }

  public sendMessage(message: string) {
    console.log(`[Sockets] Socket Service 'sendMessage`, { message });
    this.socket.emit('mudInput', message);
  }

  public sendGmcp(/*id: string, mod: string, msg: string, data: any*/): boolean {
    console.log(`[Sockets] Socket Service 'sendGmcp`);
    throw new Error('Method not implemented.');
  }

  private handleMudConnect = () => {
    this.mudConnectEvent.emit({
      IdType: 'IoMud',
      Id: 'UNKNOWN',
      MsgType: 'mud-connect',
      ErrorType: null,
      Data: this,
    });
  };

  private handleMudDisconnect = () => {
    this.mudDisconnectEvent.emit({
      IdType: 'IoMud',
      Id: 'REMOVE THIS PROPERTY',
      MsgType: 'mud-disconnect',
      ErrorType: '\r\n [Verbindung getrennt]\r\n',
      Data: this,
    });
  };

  private handleMudOutput = (output: string) => {
    this.mudOutputEvent.emit({
      IdType: 'IoMud',
      Id: 'REMOVE THIS PROPERTY',
      MsgType: 'mud-output',
      ErrorType: output,
      Data: this,
    });
  };

  private handleError = (error: Error) => {
    console.error('[Sockets] Socket Service Error:', error);
  };

  private handleReconnect = (attempt: number) => {
    console.info('[Sockets] Socket Service Reconnect:', attempt);
  };

  private handleReconnectAttempt = (attempt: number) => {
    console.info('[Sockets] Socket Service Reconnect Attempt:', attempt);
  };

  private handleReconnectError = (error: Error) => {
    console.error('[Sockets] Socket Service Reconnect Error:', error);
  };

  private handleReconnectFailed = () => {
    console.error('[Sockets] Socket Service Reconnect Failed');
  };

  private handlePing = () => {
    console.info('[Sockets] Socket Service Ping');
  };

  private handleConnect = () => {
    console.info('[Sockets] Socket Service Socket Connected');
  };

  private handleDisconnect = (reason: string) => {
    console.info('[Sockets] Socket Service Socket Disconnected:', reason);
  };
}

// Temporär auskommentierte Features
// this.socket.on('mud-get-naws', (nawsId: string, cb: () => void) => {
//   this.handleMudGetNaws(mudId, nawsId, cb);
// });
// this.socket.on('mud-signal', (sdata: any) => {
//   this.handleMudSignal(mudId, sdata, observer);
// });
// this.socket.on('mud-gmcp-start', (gmcpId: string, gmcp_support: any) => {
//   this.handleMudGmcpStart(mudId, gmcpId, gmcp_support);
// });
// this.socket.on(
//   'mud-gmcp-incoming',
//   (incomingId: string, mod: string, msg: string, data: any) => {
//     this.handleMudGmcpIncoming(mudId, incomingId, mod, msg, data);
//   },
// );

// private handleMudGetNaws = (
//   mudId: string,
//   nawsId: string,
//   cb: () => void,
// ) => {
//   cb({ height: this.mudConfig.height, width: this.mudConfig.width });
// };

// private handleMudSignal = (
//   id: string,
//   mudId: string,
//   sdata: any,
//   observer: Observer<IoResult>,
// ) => {
//   observer.next({
//     IdType: 'IoMud',
//     Id: mudId,
//     MsgType: 'mud-signal',
//     ErrorType: null,
//     Data: this,
//     musi: { signal: sdata.signal, id: sdata.id },
//   });
// };

// private handleMudGmcpStart = (
//   id: string,
//   mudId: string,
//   gmcpId: string,
//   gmcp_support: any,
// ) => {
//   this.sendGMCP(mudId, 'Core', 'Hello', {
//     client: this.mudConfig.client,
//     version: this.mudConfig.version,
//   });
// };

// private handleMudGmcpIncoming = (
//   id: string,
//   mudId: string,
//   incomingId: string,
//   mod: string,
//   msg: string,
//   data: any,
// ) => {
//   // Handle GMCP incoming messages
// };

// public sendGMCP(id: string, mod: string, msg: string, data: any): boolean {
//   if (!this.socket.connected) return false;
//   this.socket.emit('mud-gmcp-outgoing', id, mod, msg, data);
//   return true;
// }
