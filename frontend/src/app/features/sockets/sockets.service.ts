import { Injectable } from '@angular/core';
import { GmcpService } from '@mudlet3/frontend/features/gmcp';
import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
import { MudListItem } from '@mudlet3/frontend/shared';
import { Observable } from 'rxjs';
import { ServerConfigService } from '../../shared/server-config.service';
import { IoPlatform } from './io-platform';
import { IoSocket } from './io-socket';
import { IoResult } from './types/io-result';

@Injectable({
  providedIn: 'root',
})
export class SocketsService {
  // Todo: Check access modifiers
  private readonly platform: IoPlatform;
  protected readonly ioSocket: IoSocket;
  public mudlist: MudListItem[] = [];
  private socketUrl: string;
  private socketNsp: string;

  constructor(
    private srvcfg: ServerConfigService,
    private gmcpsrv: GmcpService,
  ) {
    this.platform = new IoPlatform(srvcfg, gmcpsrv);
    this.socketUrl = this.srvcfg.getBackend();
    this.socketNsp = this.srvcfg.getSocketNamespace();

    this.ioSocket = this.platform.connectSocket(this.socketUrl, this.socketNsp);
    const other = this;
    this.ioSocket
      .mudList()
      .toPromise()
      .then((data) => {
        other.mudlist = data?.mudlist ?? [];
        console.log('S42: mudlist:', other.mudlist);
      });
  }

  public mudConnect(mudConfig: MudConfig): Observable<IoResult> {
    return this.ioSocket.addMud(mudConfig, this.socketNsp);
  }

  public setMudOutputSize(_id: string, height: number, width: number) {
    const mud = this.ioSocket.MudIndex[_id];

    if (typeof mud !== 'undefined') {
      mud.setMudOutputSize(height, width);
    }
  }

  public mudSendData(data: string) {
    this.platform.mudSendData(data);
  }

  public sendGMCP(id: string, mod: string, msg: string, data: any): boolean {
    return this.platform.sendGMCP(id, mod, msg, data);
  }
}
