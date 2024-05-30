import { Manager } from 'socket.io-client';

import { IoPlatform } from './io-platform';
import { IoSocket } from './io-socket';

export class IoManager {
  ManagerId = '';
  manager: Manager | undefined = undefined;
  socketList: Record<string, IoSocket> = {};
  url: string;
  uplink: IoPlatform;
  serverID?: string;
  constructor(myUrl: string, nsp: string, up: IoPlatform) {
    const other: IoManager = this;
    this.ManagerId = this.url = myUrl;
    this.uplink = up;
    this.manager = new Manager(this.url, {
      path: nsp,
      transports: ['websocket'],
    });
    this.manager.reconnection(true);
    this.manager.reconnectionAttempts(10);
    this.manager.on('error', (error) => {
      if (error.message == 'websocket error') {
        console.warn('S17 websocket error');
      } else {
        console.error('S17 manager error', error);
      }
    });
    this.manager.on('reconnect', (attempt) => {
      other.send2AllMuds(
        '\r\n [Verbindung wiederhergestellt!]\r\n',
        'reconnected',
        other,
      );
      console.error('S18 manager reconnect', attempt);
    });
    this.manager.on('reconnect_attempt', (attempt) => {
      if (attempt == 1) {
        other.send2AllMuds(
          '\r\n [Verbindungswiederherstellung in Arbeit]\r\n',
          'reconnecting',
          other,
        ); //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      }
      console.error('S19 manager reconnect-attempt', attempt);
    });
    this.manager.on('reconnect_error', (error) => {
      if (error.message == 'websocket error') {
        // console.warn('S20 websocket error')
      } else {
        console.error('S20 manager reconnect_error', error);
      }
    });
    this.manager.on('reconnect_failed', () => {
      console.error('S21 manager reconnect_failed');
    });
    this.manager.on('ping', () => {
      // console.error('S22 manager ping');
    });
    this.reportId('IoManager', this.ManagerId, this);
  }
  public send2AllMuds(msg: string, action: string, other: IoManager) {
    // TODO implement
    console.trace('IoManager:send2AllMuds', other, action, msg);
    if (typeof other === 'undefined') {
      return;
    }
    Object.values(other.socketList).forEach((sock: IoSocket) => {
      if (typeof sock !== 'undefined') {
        sock.send2AllMuds(msg, action);
      } else {
        console.trace('send2AllMuds with empty sock', action, msg);
      }
    });
  }

  public reportId(type: string, id: string, ob: any) {
    if (type === 'IoSocket') {
      this.socketList[id] = ob;
    }
    this.uplink.reportId(type, id, ob);
  }

  public getIdObject(type: string): IoSocket | IoManager | IoPlatform {
    if (type === 'IoManager') {
      return this as IoManager;
    }
    return this.uplink.getIdObject(type);
  }

  public compareServerID(id: string): boolean {
    if (typeof this.serverID === 'undefined') {
      this.serverID = id;
      this.reportId('IoSocket', this.serverID, this);
    } else if (this.serverID !== id) {
      console.warn('serverID-Change', this.serverID, id);
      this.reportId('IoManager', this.serverID, null);
      this.serverID = id;
      this.reportId('IoManager', this.serverID, this);
      return false;
    }
    return true;
  }

  public openSocket(nsp: string): IoSocket {
    const ioSocket = new IoSocket(nsp, this);
    ioSocket.socketConnect(nsp);
    return ioSocket;
  }
}
