import { io,Manager,Socket } from "socket.io-client";
import { MudConfig } from '../mudconfig/mud-config';
import { Observable,Observer } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { MudSignals, FileInfo } from '../mud/mud-signals';
import { ServerConfigService } from './server-config.service';
import { GmcpService } from '../gmcp/gmcp.service';

export interface HashTable<T> {
   [key: string]: T;
}

export class IoResult {
    IdType:string;
    Id:string;
    MsgType:string;
    ErrorType:string;
    Data:any;
    musi?:MudSignals;
    constructor(type:string,id:string,msgType:string,error:string,data:any) {
        this.IdType = type;
        this.Id = id;
        this.MsgType = msgType;
        this.ErrorType = error;
        this.Data = data;
    }
    public static getResult(type:string,id:string,msgType:string,error:string,data:any) :IoResult {
        return new IoResult(type,id,msgType,error,data);
    }
}

export class IoMud {
    MudId: string='';
    uplink?:IoSocket;
    mudConfig:MudConfig;
    connected:boolean=false;
    eventBus:EventEmitter<IoResult>=new EventEmitter<IoResult>();

    constructor(up:IoSocket,cfg:MudConfig,observer:Observer<IoResult>) {
        this.uplink = up;
        this.mudConfig = cfg;
        const ioSocket = (up.getIdObject('IoSocket')as IoSocket);
        const ioManager = (up.getIdObject('IoManager')as IoManager);
        const ioPlatform = (up.getIdObject('IoPlatform')as IoPlatform);
        const socket = ioSocket.socket;
        const other = this;
        socket.emit('mud-connect', cfg, function(data){
          if (typeof data.id !== 'undefined') {
            other.MudId = data.id;
            up.reportId('IoMud',data.id,other);
            ioManager.compareServerID(data.serverID);
            ioSocket.compareSocketId(data.socketID);
            other.connected = true;
            console.info('S10: mud-connect: '+data.id+' socket: '+data.socketID);
            observer.next(IoResult.getResult('IoMud',data.id,'mud-connect',null,other));
          } else {
            console.error('S10: mud-connect-error: ',data);
            observer.next(IoResult.getResult('IoMud',null,null,'mud-connect-error',other));
          }
        });
        socket.on('mud-disconnected', function(id) {
          if (id != other.MudId) {
            console.error('S11: mud-disconnected:',id,other.MudId);
            observer.next(IoResult.getResult('IoMud',id,null,'mud-disconnect-error',other));
            return;
          }
          other.connected = false;
          console.info('S11: mud-client disconnected-server');
          observer.next(IoResult.getResult('IoMud',other.MudId,'mud-disconnect','\r\n(Verbindung getrennt)\r\n',other));
        });
        socket.on('mud-output', function(id,buffer) {
          if (other.MudId !== id) {
            console.info('S26: mud-output: unknown id',other.MudId,id);
            return;
          }
          // console.debug('S26: mud-output:',id,buffer);
          observer.next(IoResult.getResult('IoMud',other.MudId,'mud-output',buffer,other));
        }); // mud-output
        socket.on('mud-get-naws', function(id,cb) {
          if (id != other.MudId) {
            console.error('S27: failed[mud-get-naws].unknown id=',id,other.MudId);
            cb(false);
            return;
          }
          let mySize = {
            height : other.mudConfig.height,
            width : other.mudConfig.width,
          }
          console.debug('S27: mud-get-naws: ',id,mySize);
          cb(mySize);
        })
        socket.on('mud-signal',function(sdata){
          if (sdata.id !== other.MudId) {
              console.log('S28: mud-signal Different Ids',sdata.id,other.MudId);
            return;
          }
          let musi : MudSignals = {
            signal : sdata.signal,
            id : sdata.id,
          }
          console.log('S28:mudReceiveSignals',musi);
          const r = IoResult.getResult('IoMud',other.MudId,'mud-signal',null,other);
          r.musi = musi;
          observer.next(r);
        })
        socket.on('mud-gmcp-start', function(id,gmcp_support){
          if (other.MudId !== id) {
              console.log('S28: mud-signal Different Ids',id,other.MudId);
              return;
          }
          
          other.sendGMCP(id,'Core','Hello',{
            'client':ioPlatform.srvcfg.getWebmudName(),
            'version':ioPlatform.srvcfg.getWebmudVersion()});
            other.sendGMCP(id,'Core','BrowserInfo', {}); // Will be filled from backend, as we don't trust here...
            ioPlatform.gmcpsrv.set_gmcp_support(id,gmcp_support,function (_id:string,mod:string,onoff:boolean) {
            // console.debug('other.gmcpsrv.set_gmcp_support',_id,mod,onoff);
            other.mudSwitchGmcpModule(id,mod,onoff);
          });
          // other.sendGMCP(_id,'Core','Supports.Set',['Char 1','Char.Items 1','Comm 1','Playermap 1','Sound 1']);
          if (typeof other.mudConfig.user !== 'undefined') {
            other.sendGMCP(id,'Char','Login',{
              name:other.mudConfig.user,
              password:other.mudConfig.password,
              token:other.mudConfig.token,
            });
          }
        })
        socket.on('mud-gmcp-incoming',function(id,mod,msg,data){
          console.info("G20: GMCP-incoming trace: ",id,mod,msg,data);
          if (other.MudId !== id) {
            console.log('G20: mud-gmcp-incoming Different Ids',other.MudId,id);
            return;
          }
          const r = IoResult.getResult('IoMud',other.MudId,'mud-signal',null,other);
          switch (mod.toLowerCase().trim()) {
            case 'core':
              switch (msg.toLowerCase().trim()) {
                case 'hello':
                  other.mudConfig['gmcp-mudname'] = data.name;
                  return;
                case 'goodbye':
                  r.musi = {
                    signal: 'Core.GoodBye',
                    id: data,
                  }
                  observer.next(r);
                  return;
                case 'ping':
                  r.musi = {
                    signal: 'Core.Ping',
                    id: '',
                  }
                  observer.next(r);
                  return;
                default:break;
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
                  r.musi = {
                    signal: 'name@mud',
                    id: data.name + '@' + other.mudConfig['gmcp-mudname'],
                    wizard: data.wizard,
                  }
                  other.mudSwitchGmcpModule(id,"Files 1",true);
                } else {
                  r.musi = {
                    signal: 'name@mud',
                    id: data.name + '@' + other.mudConfig['gmcp-mudname'],
                  }
                }
                // console.debug('GMCP-char-name-signal: ',titleSignal);
                observer.next(r);
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
                r.musi = {
                  signal:'status',
                  id: other.mudConfig['guild-varname']+"="+data.guild+"|"
                  + other.mudConfig['race-varname']+"="+data.race+"|"
                  + other.mudConfig['rank-varname']+"="+data.rank+"|"
                };
                console.debug('GMCP-char-status-signal: ',r.musi);
                observer.next(r);
                return;
              case 'vitals':
                r.musi= {
                  signal:'vitals',
                  id:data.string+'|'+data.hp+'|'+data.maxhp+'|'+data.sp+'|'+data.maxsp
                };
                console.debug('GMCP-char-vitals-signal: ',r.musi);
                observer.next(r);
                return;
              case 'stats':
                r.musi = {
                  signal:'stats',
                  id:'con='+data.con+'|dex='+data.dex+'|int='+data.int+'|str='+data.str
                };
                console.debug('GMCP-char-stats-signal: ',r.musi);
                observer.next(r);
                return;
                default:break;
            }
            break;
            case 'sound':
              switch (msg.toLowerCase().trim()) {
                case 'url':
                  other.mudConfig['sound-url'] = data.url;
                  return;
                case 'event':
                  r.musi = {
                    signal: 'Sound.Play.Once',
                    id: data.file,
                    playSoundFile: other.mudConfig['sound-url']+'/'+data.file,
                  }
                  // console.debug('soundSignal',soundSignal);
                  observer.next(r);
                  return;
                default:
                  break;
              }
              break;
            case 'files':
              switch(msg.toLowerCase().trim()) {
                case 'url': 
                  let fileinfo : FileInfo = {
                    lasturl : data.url,
                    newfile : data.newfile,
                    writeacl : data.writeacl,
                    temporary : data.temporary,
                    saveActive : data.saveactive,
                    filesize : data.filesize,
                    closable: data.closable,
                    title: data.title,
                    file:data.file,
                    path:data.path,
                    filename:data.filename,
                    filetype:data.filetype,
                  }
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
                  fileinfo.save01_start = function(filepath) {
                    console.debug('save01_start',filepath,fileinfo);
                    other.sendGMCP(id,"Files","OpenFile",{
                      "file":filepath,
                      "title":fileinfo.title,
                      "flag":1,// save flag!!!
                    });
                  }
                  fileinfo.save03_saved = function(filepath) {
                    console.debug('save03_saved',filepath,fileinfo);
                    other.sendGMCP(id,"Files","fileSaved",{
                      "file":filepath,
                      "title":fileinfo.title,
                      "flag":1,// save flag!!!
                    });
                    if (fileinfo.temporary) {
                      fileinfo.save04_closing(fileinfo.windowsId);
                    } else {
                      fileinfo.save06_success(fileinfo.windowsId);
                    }
                  }
                  r.musi = {
                    signal: 'Files.URL',
                    id: id,
                    fileinfo: fileinfo,
                  }
                  // console.debug('fileSignal-1',fileSignal);
                  observer.next(r);
                  return;
                case 'directorylist':
                  other.mudConfig['dir-current'] = data.path;
                  other.mudConfig['dir-entries'] = data.entries;
                  r.musi = {
                    signal: 'Files.Dir',
                    id: id,
                    filepath: data.path,
                    entries: data.entries,
                  }
                  // console.debug('dirSignal-1',dirSignal);
                  observer.next(r);
                  return;
                default: break;
              }
            default: break;
          }
          console.warn('G20: GMCP-unknown:',mod,msg,data);return;
        });
    }
    public sendGMCP(id:string,mod:string,msg:string,data:any):boolean {
      if (id != this.MudId ) {
        console.warn('G01: failed[GMCP_Send_packet].mudconn=',id,this.MudId);
        return false;
      }
      if (!this.connected) {
        console.warn('G01: not connected[GMCP_Send_packet].mudconn=',id);
        return false;
      }
      console.debug('G01: GMCP-send:',id,mod,msg,data);
      this.uplink.socket.emit('mud-gmcp-outgoing',id,mod,msg,data);
    }
    public mudSwitchGmcpModule(_id:string,mod:string,onoff:boolean):boolean {
      if (onoff) {
        return this.sendGMCP(_id,'Core','Supports.Add',[mod]);
      } else {
        return this.sendGMCP(_id,'Core','Supports.Remove',[mod]);
      }
    }
    public mudSendData(id:string,data:string) {
      if (id != this.MudId ) {
        console.warn('G01: failed[GMCP_Send_packet].mudconn=',id,this.MudId);
        return false;
      }
      // console.debug('mudSendData-id ',id);
      // console.debug('mudSendData-data',id,data);
      this.uplink.socket.emit('mud-input',id,data);
    }
}

export class IoSocket {
    SocketId: string;
    nsp:string;
    socket: Socket;
    MudIndex: HashTable<IoMud> = {};
    uplink?:IoManager;
    constructor(id:string,up:IoManager) {
        this.SocketId = id;
        this.uplink = up;
        this.reportId('IoSocket',id,this);
    }
    public addMud(cfg:MudConfig,nsp:string): Observable<IoResult> {
        const other = this;
        let observable = new Observable<IoResult>(observer => {
            if (typeof other.socket === 'undefined') {
              other.nsp = nsp;
              other.socketConnect(nsp);
              console.info('S12: socket connected: ',other.SocketId,nsp);
            } else if (other.nsp == nsp) {
              console.info('S12: socket reconnected: ',other.SocketId,nsp);
            } else {
              console.info('S12: socket error: ',other.SocketId,other.nsp,nsp);
                observer.next(IoResult.getResult('IoSocket:nsp',nsp,null,null,other));
            }
            const myMud : IoMud = new IoMud(this,cfg,observer);
        });
        return observable;
    }
    public socketConnect(nsp:string) {
        const ioManager = (this.uplink.getIdObject('IoManager')as IoManager);
        const manager = ioManager.manager;
        if (typeof this.nsp === 'undefined') {
            this.nsp = nsp;
        } else if (this.nsp != nsp) {
            return;
        } else {
            return;
        }
        this.reportId('IoSocket:nsp',nsp,this);
        this.socket = manager.socket(nsp);
        const other = this;
        other.socket.on('connect', () => {
            console.log('S13 socket-Connected',other.socket.id);
            other.compareSocketId(other.socket.id);
        });
        other.socket.on('disconnect', (reason) => {
            console.log('S23 socket-disconnect',other.socket.id,reason);
        });
        other.socket.on('connect_error', (error) => {
            console.log('S24 socket-connect error',other.socket.id,error);
        });
        other.socket.emit('keep-alive','1',function(level){
          console.log("S14 keep alive 1",other.socket.id,level);
        });
        other.socket.on('error', function(error) {
          console.error('S15 socket-error:',other.socket.id,error);
        });
        other.socket.on('disconnecting', function(id,real_ip,server_id,cb) {
          console.info('S16 socket disconnecting',other.socket.id,' ');
          other.send2AllMuds('Verbindungsabbruch durch Serverneustart (Fenster aktualisieren!)','disconnect');
          cb('disconnected');
        });
        other.socket.on('connecting',function(id,real_ip,server_id,cb) {
            console.log("S02.connecting.socketID/serverID: ",id,server_id);
            other.compareSocketId(id);
            ioManager.compareServerID(server_id);
            cb('ok',undefined);
        });
        other.socket.on('connected',function(id,real_ip,server_id,cb) {
            console.log("S02.connected.socketID/serverID: ",id,server_id);
            other.compareSocketId(id);
            ioManager.compareServerID(server_id);
            cb('ok',undefined);
        });
        other.socket.emit('keep-alive','2',function(level){
          console.log("S14 keep alive 2",other.socket.id,level);
        });
    }
    public send2AllMuds(msg:string,action:string) { // TODO implement
        Object.values(this.MudIndex).forEach(mud => {
            switch (action) {
              case 'disconnect':
                  mud.connected = false;
                  break;
              default:
                  break;
            }
            const r = IoResult.getResult('IoMud:SendToAllMuds',action,msg,null,mud);
            mud.eventBus.emit(r);
        })
    }
    public reportId(type:string,id:string,ob:any){
        if (type == 'IoMud') {
            this.MudIndex[id] = ob;
        }
        this.uplink.reportId(type,id,ob);
    }
    public getIdObject(type:string):IoSocket|IoManager|IoPlatform{
        if (type == 'IoSocket') {
            return this;
        }
        return this.uplink.getIdObject(type);
    }
    public compareSocketId(id:string):boolean {
        if (typeof this.SocketId === 'undefined') {
            this.SocketId = id;
            this.reportId('IoSocket',this.SocketId,this);
        } else if (this.SocketId != id) {
            console.warn("SocketId-Change",this.SocketId,id);
            this.reportId('IoSocket',this.SocketId,null);
            this.SocketId = id;
            this.reportId('IoSocket',this.SocketId,this);
        }
        return true;
    }
}

export class IoManager {
    ManagerId:string = '';
    manager: Manager|undefined = undefined;
    socketList:HashTable<IoSocket>={};
    url:string;
    uplink: IoPlatform;
    serverID?:string;
    constructor(myUrl:string) {
        this.url = myUrl;
        this.manager = new Manager(this.url);
        this.manager.reconnection(true);
        this.manager.reconnectionAttempts(10);
        this.manager.on('error',(error) => {
            console.error('S17 manager error',error);
        });
        this.manager.on('reconnect',(attempt) => {
            console.error('S18 manager reconnect',attempt);
        });
        this.manager.on('reconnect_attempt',(attempt) => {
            console.error('S19 manager reconnect-attempt',attempt);
        });
        this.manager.on('reconnect_error',(error) => {
            console.error('S20 manager reconnect_error',error);
        });
        this.manager.on('reconnect_failed',() => {
            console.error('S21 manager reconnect_failed');
        });
        this.manager.on('ping',() => {
            console.error('S22 manager ping');
        });
    }
    public send2AllMuds(msg:string,action:string) { // TODO implement
        Object.values(this.socketList).forEach(sock => {
            sock.send2AllMuds(msg,action);
        })
    }
    public reportId(type:string,id:string,ob:any){
        if (type == 'IoSocket') {
            this.socketList[id] = ob;
        }
        this.uplink.reportId(type,id,ob);
    }
    public getIdObject(type:string):IoSocket|IoManager|IoPlatform{
        if (type == 'IoManager') {
            return this;
        }
        return this.uplink.getIdObject(type);
    }
    public compareServerID(id:string):boolean {
        if (typeof this.serverID === 'undefined') {
            this.serverID = id;
            this.reportId('IoSocket',this.serverID,this);
        } else if (this.serverID != id) {
            console.warn("serverID-Change",this.serverID,id);
            this.reportId('IoManager',this.serverID,null);
            this.serverID = id;
            this.reportId('IoManager',this.serverID,this);
        }
        return true;
    }
}

export class IoPlatform {
    private idLookup : HashTable<IoMud|IoSocket|IoManager|IoPlatform> = {};
    constructor(public srvcfg:ServerConfigService,public gmcpsrv:GmcpService) {
        
    }
    public reportId(type:string,id:string,ob:any){
        if (ob == null) {
            delete this.idLookup[type+':'+id];
        }
        this.idLookup[type+":"+id] = ob;
    }
    public getIdObject(type:string):IoSocket|IoManager|IoPlatform{
        return this;
    }
    public querIdObject(type:string,id:string):IoMud|IoSocket|IoManager|IoPlatform {
        return this.idLookup[type+":"+id];
    }
    
    public sendGMCP(id:string,mod:string,msg:string,data:any):boolean {
        const ioMud = this.querIdObject('IoMud',id) as IoMud;
        if (typeof ioMud === 'undefined') {
            console.warn("G10: Unknown Mud-Id",id);
            return false;
        }
        return ioMud.sendGMCP(id,mod,msg,data);
    }
    
    public sendPing(_id : string):boolean {
      return this.sendGMCP(_id,'Core','Ping','');
    }
}