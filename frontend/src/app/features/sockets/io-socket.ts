import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
import { MudListItem } from '@mudlet3/frontend/shared';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io-client';

import { IoManager } from './io-manager';
import { IoMud } from './io-mud';
import { IoPlatform } from './io-platform';
import { IoResult } from './types/io-result';

export class IoSocket {
  private SocketId: string;
  private socketEndpoint!: string;
  public socket!: Socket;
  public MudIndex: Record<string, IoMud> = {};
  private uplink?: IoManager;

  constructor(id: string, up: IoManager) {
    this.SocketId = id;
    this.uplink = up;
    this.reportId('IoSocket', id, this);
  }

  public addMud(mudConfig: MudConfig, nsp: string): Observable<IoResult> {
    const observable = new Observable<IoResult>((observer) => {
      if (this.socket === undefined) {
        this.socketEndpoint = nsp;
        this.socketConnect(nsp);
      } else if (this.socketEndpoint == nsp) {
      } else {
        observer.next({
          IdType: 'IoSocket:nsp',
          Id: nsp,
          MsgType: null,
          ErrorType: null,
          Data: this,
        });
        return;
      }

      //Todo[myst]: Extrem wichtig! refactor!
      new IoMud(this, mudConfig, observer);
    });

    return observable;
  }

  public socketConnect(socketEndpoint: string) {
    console.info('[myst] IoSocket:socketConnect() called with', {
      nsp: socketEndpoint,
    });

    const ioManager = this.uplink?.getIdObject('IoManager') as IoManager;
    const manager = ioManager.manager;

    if (manager === undefined) {
      throw new Error('S13 socket-undefined and should not be!');
    }

    if (this.socketEndpoint === undefined) {
      this.socketEndpoint = socketEndpoint;
    } else if (this.socketEndpoint != socketEndpoint) {
      return;
    } else {
      return;
    }

    this.reportId('IoSocket:nsp', socketEndpoint, this);

    this.socket = manager.socket('/');

    // Was only used for debugging
    // const engine = this.socket.io.engine;

    // engine.once('upgrade', () => {
    //   // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
    //   // console.log(engine.transport.name); // in most cases, prints "websocket"
    // });

    // engine.on('packet', ({ type, data }) => {
    //   // called for each packet received
    //   // console.log("packet",type,data);
    //   // console.log("packet",type);
    // });

    // engine.on('packetCreate', ({ type, data }) => {
    //   // called for each packet sent
    //   // console.log("packetCreate",type,data);
    //   // console.log("packetCreate",type);
    // });

    // engine.on('drain', () => {
    //   // called when the write buffer is drained
    //   // console.log("drain");
    // });

    // engine.on('close', (reason) => {
    //   // called when the underlying connection is closed
    //   console.log('close', reason);
    // });

    this.socket.on('connect', () => {
      console.info('[myst] IOSocket: socket connect');

      if (this.socket.id === undefined) {
        throw new Error('S13 socket-undefined and should not be!');
      }

      // Todo[myst]: erstmal auskommentiert
      // if (!this.compareSocketId(this.socket.id)) {
      //   this.send2AllMuds(
      //     '\r\n [Verbindungsabbruch durch Serverneustart-1 (Fenster aktualisieren!)]\r\n',
      //     'disconnect',
      //   );
      // }
    });

    this.socket.on('disconnect', (reason) => {
      // console.log('S23 socket-disconnect', other.socket.id, reason);
    });

    this.socket.on('connect_error', (error) => {
      if (error.message == 'websocket error') {
        // console.warn('S24 websocket error')
      } else {
        // console.error('S24 socket-connect error', other.socket.id, error);
      }
    });

    this.socket.emit('keep-alive', '1', (level: any) => {
      // console.log('S14 keep alive 1', other.socket.id, level);
    });

    this.socket.on('error', (error) => {
      // console.error('S15 socket-error:', other.socket.id, error);
    });

    this.socket.on('disconnecting', (id, real_ip, server_id, cb) => {
      console.info('[myst] [IOSocket]: socket disconnecting');
      // console.info('S16 socket disconnecting', other.socket.id, ' ');
      // other.send2AllMuds('\r\n [Verbindungsabbruch durch Serverneustart-2 (Fenster aktualisieren!)]\r\n','disconnect');
      cb('disconnected');
    });

    this.socket.on('connecting', (id, real_ip, server_id, cb) => {
      // console.log("S02.connecting.socketID/serverID: ",id,server_id);
      console.info('[myst] [IOSocket]: socket connecting');
      const notChanged =
        this.compareSocketId(id) && ioManager.compareServerID(server_id);
      if (notChanged) {
        cb('ok', undefined);
      } else {
        // other.send2AllMuds('\r\n [Verbindungsabbruch durch Serverneustart-3 (Fenster aktualisieren!)]\r\n','disconnect');
        cb(undefined, 'disconnected');
      }
    });

    this.socket.on('connected', (id, real_ip, server_id, cb) => {
      console.info('[myst] [IOSocket]: socket connected');

      // console.log('S02.connected.socketID/serverID: ', id, server_id);
      this.compareSocketId(id);
      ioManager.compareServerID(server_id);
      cb('ok', undefined);
    });

    this.socket.emit('keep-alive', '2', (level: any) => {
      // console.log('S14 keep alive 2', other.socket.id, level);
    });
  }

  public send2AllMuds(msg: string, action: string) {
    // TODO implement
    Object.values(this.MudIndex).forEach((mud) => {
      switch (action) {
        case 'disconnect':
          mud.connected = false;
          break;
        default:
          break;
      }

      const result: IoResult = {
        IdType: 'IoMud:SendToAllMuds',
        Id: action,
        MsgType: msg,
        ErrorType: null,
        Data: mud,
      };

      // Todo without this line the feature is not working
      // mud.eventBus.emit(result);
    });
  }

  public reportId(type: string, id: string, ob: any) {
    if (
      ob === null &&
      type === 'IoMud' &&
      Object.prototype.hasOwnProperty.call(this.MudIndex, id)
    ) {
      delete this.MudIndex[id];
      // console.log('Count IoMuds:', this.MudIndex.length, id);
    } else if (ob !== null && type === 'IoMud') {
      this.MudIndex[id] = ob;
    }

    this.uplink?.reportId(type, id, ob);
  }

  public getIdObject(type: string): this | IoManager | IoPlatform | undefined {
    if (type === 'IoSocket') {
      return this;
    }
    return this.uplink?.getIdObject(type) as unknown as
      | this
      | IoManager
      | IoPlatform
      | undefined;
  }

  private compareSocketId(id: string): boolean {
    if (typeof this.SocketId === 'undefined') {
      this.SocketId = id;
      this.reportId('IoSocket', this.SocketId, this);
    } else if (this.SocketId != id) {
      // console.warn('SocketId-Change', this.SocketId, id);
      this.reportId('IoSocket', this.SocketId, null);
      this.SocketId = id;
      this.reportId('IoSocket', this.SocketId, this);
      return false;
    }
    return true;
  }

  public mudList(): Observable<IoResult> {
    const other = this;

    const result: IoResult = {
      IdType: 'IoSocket',
      Id: other.SocketId,
      MsgType: 'mud-list',
      ErrorType: null,
      Data: null,
    };

    const observable = new Observable<IoResult>((observer) => {
      if (typeof other.socket === 'undefined') {
        // console.trace('mudList empty socket');
        return;
      }
      other.socket.emit(
        'mud-list',
        true,
        function (data: {
          [x: string]: {
            mudfamily: any;
            name: string;
            host: string;
            port: any;
            ssl: boolean;
            rejectUnauthorized: boolean;
            description: string;
            playerlevel: any;
          };
        }) {
          result.mudlist = [];
          Object.keys(data).forEach(function (key) {
            const item: MudListItem = {
              key: key,
              name: data[key].name,
              host: data[key].host,
              port: data[key].port,
              ssl: data[key].ssl,
              rejectUnauthorized: data[key].rejectUnauthorized,
              description: data[key].description,
              playerlevel: data[key].playerlevel,
              mudfamily: data[key].mudfamily,
            };
            result.mudlist?.push(item);
          });
          observer.next(result);
          // console.log('mudList: ', r.mudlist);
        },
      );
      return () => {
        // console.log('mud-list observer-complete');
      };
    });
    return observable;
  }
}
