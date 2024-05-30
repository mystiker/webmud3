import { GmcpService } from '@mudlet3/frontend/features/gmcp';

import { ServerConfigService } from '../../shared/server-config.service';
import { IoManager } from './io-manager';
import { IoMud } from './io-mud';
import { IoSocket } from './io-socket';

export class IoPlatform {
  private idLookup: Record<string, IoMud | IoSocket | IoManager | this> = {};
  private managerList: Record<string, IoManager> = {};
  constructor(
    public srvcfg: ServerConfigService,
    public gmcpsrv: GmcpService,
  ) {}
  public reportId(type: string, id: string, ob: any) {
    if (type === 'IoManager') {
      this.managerList[id] = ob;
    }
    if (ob === null) {
      delete this.idLookup[type + ':' + id];
    }
    this.idLookup[type + ':' + id] = ob;
  }
  public getIdObject(type: string): IoSocket | IoManager | this {
    return this;
  }
  public querIdObject(
    type: string,
    id: string,
  ): IoMud | IoSocket | IoManager | IoPlatform {
    return this.idLookup[type + ':' + id];
  }

  public connectSocket(url: string, nsp: string) {
    const mngr = new IoManager(url, nsp, this);
    return mngr.openSocket(nsp);
  }

  public sendGMCP(id: string, mod: string, msg: string, data: any): boolean {
    const ioMud = this.querIdObject('IoMud', id) as IoMud;
    if (typeof ioMud === 'undefined') {
      console.warn('G10: Unknown Mud-Id', id);
      return false;
    }
    return ioMud.sendGMCP(id, mod, msg, data);
  }
  public mudSendData(data: string) {
    // Todo[myst]: Breaking change: we allow only for one connection
    const keys = Object.keys(this.idLookup).filter((key) =>
      key.startsWith('IoMud'),
    );

    if (keys.length === 0) {
      throw new Error('No connection to mud.');
    }

    if (keys.length > 1) {
      throw new Error('Only one mud connection is allowed.');
    }

    const ioMud = this.idLookup[keys[0]] as IoMud;

    return ioMud.mudSendData(data);
  }

  public sendPing(_id: string): boolean {
    return this.sendGMCP(_id, 'Core', 'Ping', '');
  }
  public send2AllMuds(msg: string, action: string) {
    // TODO implement
    Object.values(this.managerList).forEach((mngr) => {
      mngr.send2AllMuds(msg, action, mngr);
    });
  }
}
