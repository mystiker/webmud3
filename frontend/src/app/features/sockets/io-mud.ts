import { FileInfo, MudSignals } from '@mudlet3/frontend/shared';
import { Observer } from 'rxjs';
import { OneKeypadData } from '../../shared/keypad-data';

import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
import { IoManager } from './io-manager';
import { IoPlatform } from './io-platform';
import { IoSocket } from './io-socket';
import { IoResult } from './types/io-result';

export class IoMud {
  MudId = '';
  uplink?: IoSocket;
  mudConfig: MudConfig;
  connected = false;
  // eventBus: EventEmitter<IoResult> = new EventEmitter<IoResult>();

  constructor(
    up: IoSocket,
    cfg: MudConfig,
    private readonly observer: Observer<IoResult>,
  ) {
    this.uplink = up;
    this.mudConfig = cfg;
    const ioSocket = up.getIdObject('IoSocket') as IoSocket;
    const ioManager = up.getIdObject('IoManager') as IoManager;
    const ioPlatform = up.getIdObject('IoPlatform') as IoPlatform;

    const socket = ioSocket.socket;

    const other = this;

    cfg['browser'] = ioPlatform.srvcfg.getBrowserInfo();
    cfg['client'] = ioPlatform.srvcfg.getWebmudName();
    cfg['version'] = ioPlatform.srvcfg.getWebmudVersion();

    console.info('[myst] [IO-Mud]: emit mud-connect', {
      cfg,
    });

    socket.emit(
      'mud-connect',
      cfg,
      (data: { id: string; socketId: string; serverId: string }) => {
        console.info('[myst] [IO-Mud]: mud-connect callback called', {
          data,
        });

        // Die Id (VerbindungsId?) wird hier gespeichert
        up.reportId('IoMud', data.id, this);

        // const notChanged =
        //   ioManager.compareServerID(data.serverID) &&
        //   ioSocket.compareSocketId(data.socketID);
        // if (!notChanged) {
        // }

        this.MudId = data.id;
        this.connected = true;

        observer.next({
          IdType: 'IoMud',
          Id: data.id,
          MsgType: 'mud-signal',
          ErrorType: null,
          Data: this,
        });
      },
    );

    // this.eventBus.subscribe((fr) => {
    //   observer.next(fr);
    // });

    socket.on('mud-disconnected', function (id) {
      if (id != other.MudId) {
        console.error('S11: mud-disconnected:', id, other.MudId);
        other.disconnectFromMudClient(id);
        return;
      }
      other.connected = false;
      console.info('S11: mud-client disconnected-server');
      observer.next({
        IdType: 'IoMud',
        Id: other.MudId,
        MsgType: 'mud-disconnect',
        ErrorType: '\r\n [Verbindung getrennt]\r\n',
        Data: other,
      });
      other.disconnectFromMudClient(id);
    });
    socket.on('mud-output', function (id, buffer) {
      if (other.MudId !== id) {
        console.info('S26: mud-output: unknown id', other.MudId, id);
        return;
      }
      // console.debug('S26: mud-output:',id,buffer);
      observer.next({
        IdType: 'IoMud',
        Id: other.MudId,
        MsgType: 'mud-output',
        ErrorType: buffer,
        Data: other,
      });
    }); // mud-output
    socket.on('mud-get-naws', function (id, cb) {
      if (id != other.MudId) {
        console.error('S27: failed[mud-get-naws].unknown id=', id, other.MudId);
        cb(false);
        return;
      }
      const mySize = {
        height: other.mudConfig.height,
        width: other.mudConfig.width,
      };
      console.debug('S27: mud-get-naws: ', id, mySize);
      cb(mySize);
    });

    socket.on('mud-signal', function (sdata) {
      console.log(`[myst] [IO-Mud] received 'mud-signal'`, sdata);

      if (sdata.id !== other.MudId) {
        console.log('S28: mud-signal Different Ids', sdata.id, other.MudId);
        return;
      }
      const musi: MudSignals = {
        signal: sdata.signal,
        id: sdata.id,
      };

      const result: IoResult = {
        IdType: 'IoMud',
        Id: other.MudId,
        MsgType: 'mud-signal',
        ErrorType: null,
        Data: other,
        musi,
      };

      observer.next(result);
    });

    socket.on('mud-gmcp-start', function (id, gmcp_support) {
      if (other.MudId !== id) {
        console.log('S28: mud-signal Different Ids', id, other.MudId);
        return;
      }

      other.sendGMCP(id, 'Core', 'Hello', {
        client: ioPlatform.srvcfg.getWebmudName(),
        version: ioPlatform.srvcfg.getWebmudVersion(),
      });
      other.sendGMCP(id, 'Core', 'BrowserInfo', {}); // Will be filled from backend, as we don't trust here...
      // ioPlatform.gmcpsrv.set_gmcp_support(
      //   id,
      //   gmcp_support,
      //   function (_id: string, mod: string, onoff: boolean) {
      //     // console.debug('other.gmcpsrv.set_gmcp_support',_id,mod,onoff);
      //     other.mudSwitchGmcpModule(id, mod, onoff);
      //   },
      // );
      // other.sendGMCP(_id,'Core','Supports.Set',['Char 1','Char.Items 1','Comm 1','Playermap 1','Sound 1']);
      if (typeof other.mudConfig.user !== 'undefined') {
        other.sendGMCP(id, 'Char', 'Login', {
          name: other.mudConfig.user,
          password: other.mudConfig.password,
          token: other.mudConfig.token,
        });
      }
    });
    socket.on('mud-gmcp-incoming', function (id, mod, msg, data) {
      // console.info("G20: GMCP-incoming trace: ",id,mod,msg,data);
      if (other.MudId !== id) {
        console.log('G20: mud-gmcp-incoming Different Ids', other.MudId, id);
        return;
      }

      const result: IoResult = {
        IdType: 'IoMud',
        Id: other.MudId,
        MsgType: 'mud-signal',
        ErrorType: null,
        Data: other,
      };

      let fileinfo: FileInfo;
      let num: OneKeypadData;
      switch (mod.toLowerCase().trim()) {
        case 'core':
          switch (msg.toLowerCase().trim()) {
            case 'hello':
              other.mudConfig['gmcp-mudname'] = data.name;
              return;
            case 'goodbye':
              result.musi = {
                signal: 'Core.GoodBye',
                id: data,
              };
              observer.next(result);
              return;
            case 'ping':
              result.musi = {
                signal: 'Core.Ping',
                id: '',
              };
              observer.next(result);
              return;
            default:
              break;
          }
          break;
        case 'input':
          switch (msg.toLowerCase().trim()) {
            case 'completetext':
              result.musi = {
                signal: 'Input.CompleteText',
                id: data,
              };
              observer.next(result);
              return;
            case 'completechoice':
              result.musi = {
                signal: 'Input.CompleteChoice',
                id: data,
              };
              observer.next(result);
              return;
            case 'completenone':
              result.musi = {
                signal: 'Input.CompleteNone',
                id: '',
              };
              observer.next(result);
              return;
            default:
              break;
          }
          break;
        case 'char':
          switch (msg.toLowerCase().trim()) {
            case 'name':
              other.mudConfig['gmcp-charname'] = data.name;
              other.mudConfig['gmcp-fullname'] = data.fullname;
              other.mudConfig['gmcp-gender'] = data.gender;
              if (typeof data.wizard !== 'undefined' && data.wizard > 0) {
                other.mudConfig['gmcp-wizard'] = data.wizard;
                result.musi = {
                  signal: 'name@mud',
                  id: data.name + '@' + other.mudConfig['gmcp-mudname'],
                  wizard: data.wizard,
                };
                other.mudSwitchGmcpModule(id, 'Files 1', true);
                other.mudSwitchGmcpModule(id, 'Input 1', true);
                other.mudSwitchGmcpModule(id, 'Numpad 1', true);
              } else {
                result.musi = {
                  signal: 'name@mud',
                  id: data.name + '@' + other.mudConfig['gmcp-mudname'],
                };
                other.mudSwitchGmcpModule(id, 'Input 1', true);
                other.mudSwitchGmcpModule(id, 'Numpad 1', true);
              }
              // console.debug('GMCP-char-name-signal: ',titleSignal);
              observer.next(result);
              return;
            case 'statusvars':
              other.mudConfig['guild-varname'] = data.guild;
              other.mudConfig['race-varname'] = data.race;
              other.mudConfig['rank-varname'] = data.rank;
              return;
            case 'status':
              other.mudConfig['guild'] = data.guild;
              other.mudConfig['race'] = data.race;
              other.mudConfig['rank'] = data.rank;
              result.musi = {
                signal: 'status',
                id:
                  other.mudConfig['guild-varname'] +
                  '=' +
                  data.guild +
                  '|' +
                  other.mudConfig['race-varname'] +
                  '=' +
                  data.race +
                  '|' +
                  other.mudConfig['rank-varname'] +
                  '=' +
                  data.rank +
                  '|',
              };
              console.debug('GMCP-char-status-signal: ', result.musi);
              observer.next(result);
              return;
            case 'vitals':
              result.musi = {
                signal: 'vitals',
                id:
                  data.string +
                  '|' +
                  data.hp +
                  '|' +
                  data.maxhp +
                  '|' +
                  data.sp +
                  '|' +
                  data.maxsp,
              };
              console.debug('GMCP-char-vitals-signal: ', result.musi);
              observer.next(result);
              return;
            case 'stats':
              result.musi = {
                signal: 'stats',
                id:
                  'con=' +
                  data.con +
                  '|dex=' +
                  data.dex +
                  '|int=' +
                  data.int +
                  '|str=' +
                  data.str,
              };
              console.debug('GMCP-char-stats-signal: ', result.musi);
              observer.next(result);
              return;
            case 'items.list':
              result.musi = {
                signal: 'Char.Items.List',
                id: 'none',
                invEntries: data.items,
              };
              console.debug('GMCP-char-items-list-signal: ', result.musi);
              observer.next(result);
              return;
            case 'items.add':
              result.musi = {
                signal: 'Char.Items.Add',
                id: 'none',
                invEntry: data.item,
              };
              console.debug('GMCP-char-items-list-signal: ', result.musi);
              observer.next(result);
              return;
            case 'items.remove':
              result.musi = {
                signal: 'Char.Items.Remove',
                id: 'none',
                invEntry: data.item,
              };
              console.debug('GMCP-char-items-list-signal: ', result.musi);
              observer.next(result);
              return;
            default:
              break;
          }
          break;
        case 'sound':
          switch (msg.toLowerCase().trim()) {
            case 'url':
              other.mudConfig['sound-url'] = data.url;
              return;
            case 'event':
              result.musi = {
                signal: 'Sound.Play.Once',
                id: data.file,
                playSoundFile: other.mudConfig['sound-url'] + '/' + data.file,
              };
              // console.debug('soundSignal',soundSignal);
              observer.next(result);
              return;
            default:
              break;
          }
          break;
        case 'files':
          switch (msg.toLowerCase().trim()) {
            case 'url':
              fileinfo = {
                lasturl: data.url,
                newfile: data.newfile,
                writeacl: data.writeacl,
                temporary: data.temporary,
                saveActive: data.saveactive,
                filesize: data.filesize,
                closable: data.closable,
                title: data.title,
                file: data.file,
                path: data.path,
                filename: data.filename,
                filetype: data.filetype,
              };
              switch (data.filetype) {
                case '.c':
                case '.h':
                case '.inc':
                  fileinfo.edditortype = 'c_cpp';
                  break;
                default:
                  fileinfo.edditortype = 'text';
                  break;
              }
              fileinfo.save01_start = function (filepath) {
                console.debug('save01_start', filepath, fileinfo);
                other.sendGMCP(id, 'Files', 'OpenFile', {
                  file: filepath,
                  title: fileinfo.title,
                  flag: 1, // save flag!!!
                });
              };
              fileinfo.save03_saved = function (filepath) {
                console.debug('save03_saved', filepath, fileinfo);
                other.sendGMCP(id, 'Files', 'fileSaved', {
                  file: filepath,
                  title: fileinfo.title,
                  flag: 1, // save flag!!!
                });
                if (fileinfo.windowsId) {
                  if (fileinfo.temporary) {
                    fileinfo.save04_closing?.(fileinfo.windowsId);
                  } else {
                    fileinfo.save06_success?.(fileinfo.windowsId);
                  }
                }
              };
              result.musi = {
                signal: 'Files.URL',
                id: id,
                fileinfo: fileinfo,
              };
              // console.debug('fileSignal-1',fileSignal);
              observer.next(result);
              return;
            case 'directorylist':
              other.mudConfig['dir-current'] = data.path;
              other.mudConfig['dir-entries'] = data.entries;
              result.musi = {
                signal: 'Files.Dir',
                id: id,
                filepath: data.path,
                entries: data.entries,
              };
              // console.debug('dirSignal-1',dirSignal);
              observer.next(result);
              return;
            default:
              break;
          }
          break;
        case 'numpad':
          switch (msg.toLowerCase().trim()) {
            case 'sendlevel':
              num = new OneKeypadData(data.prefix);
              num.keys = data.keys;
              result.musi = {
                signal: 'Numpad.SendLevel',
                id: id,
                numpadLevel: num,
              };
              console.debug('Numpad.SendLevel-1', result);
              observer.next(result);
              return;
          }
          break;
        default:
          break;
      }
      console.warn('G20: GMCP-unknown:', mod, msg, data);
      return;
    });
  }
  public sendGMCP(id: string, mod: string, msg: string, data: any): boolean {
    if (id != this.MudId) {
      console.warn('G01: failed[GMCP_Send_packet].mudconn=', id, this.MudId);
      return false;
    }
    if (!this.connected) {
      console.warn('G01: not connected[GMCP_Send_packet].mudconn=', id);
      return false;
    }
    console.log('G01: GMCP-send:', id, mod, msg, data);
    this.uplink?.socket.emit('mud-gmcp-outgoing', id, mod, msg, data);
    return true;
  }
  public mudSwitchGmcpModule(
    _id: string,
    mod: string,
    onoff: boolean,
  ): boolean {
    console.log('mudSwitchGmcpModule-', mod, onoff);
    if (onoff) {
      return this.sendGMCP(_id, 'Core', 'Supports.Add', [mod]);
    } else {
      return this.sendGMCP(_id, 'Core', 'Supports.Remove', [mod]);
    }
  }
  public mudSendData(id: string, data: string) {
    if (id != this.MudId) {
      console.warn('G01: failed[GMCP_Send_packet].mudconn=', id, this.MudId);
      return false;
    }
    // console.debug('mudSendData-id ',id);
    // console.debug('mudSendData-data',id,data);
    this.uplink?.socket.emit('mud-input', id, data);
    return true;
  }
  public setMudOutputSize(height: number, width: number) {
    console.log('S05: resize', this.MudId, height, width);
    this.uplink?.socket.emit('mud-window-size', this.MudId, height, width);
  }
  public disconnectFromMudClient(id: string) {
    if (this.MudId == id) {
      this.connected = false;

      const result: IoResult = {
        IdType: 'IoMud',
        Id: id,
        MsgType: 'mud-disconnect',
        ErrorType: '\r\n [Verbindung getrennt]\r\n',
        Data: this,
      };

      this.observer.next(result);
      this.uplink?.reportId('IoMud', id, null);
      console.log('S06: disconnectFromMudClient known ids:', id);
    } else {
      this.uplink?.reportId('IoMud', id, null);
      console.log(
        'S06: disconnectFromMudClient different ids:',
        id,
        this.MudId,
      );
    }
  }
}
