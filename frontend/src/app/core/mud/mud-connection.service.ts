import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
import { IoMud, SocketsService } from '@mudlet3/frontend/features/sockets';
import { ServerConfigService } from '@mudlet3/frontend/shared';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MudConnectionService {
  private connectedSubject = new BehaviorSubject<boolean>(false);
  connected$ = this.connectedSubject.asObservable();
  private mudc_id?: string;
  private ioMud?: IoMud;

  constructor(
    private socketsService: SocketsService,
    private titleService: Title,
    private srvcfgService: ServerConfigService,
  ) {}

  connect(mudName: string, cfg: MudConfig) {
    console.log('MudConnectionService: Connecting to', mudName);
    if (mudName.toLowerCase() === 'disconnect') {
      this.disconnect();
      return;
    }

    const mudOb: MudConfig = {
      ...cfg,
      mudname: mudName,
      height: 90,
      width: 80,
    };

    this.titleService.setTitle(
      this.srvcfgService.getWebmudName() + ' ' + mudName,
    );

    this.socketsService.mudConnect(mudOb).subscribe(
      (ioResult) => {
        if (ioResult.IdType === 'IoMud') {
          this.ioMud = ioResult.Data as IoMud;
          this.mudc_id = this.ioMud.MudId;
          this.connectedSubject.next(this.ioMud.connected);
        }
      },
      (error) => {
        console.error('MudConnectionService: Connection error', error);
        this.connectedSubject.next(false);
      },
    );
  }

  disconnect() {
    console.log('MudConnectionService: Disconnecting');
    if (this.mudc_id) {
      if (this.ioMud) {
        this.ioMud.disconnectFromMudClient(this.mudc_id);
        this.ioMud = undefined;
      }
      this.connectedSubject.next(false);
      this.mudc_id = undefined;
    }
  }
}
