import { Injectable } from '@angular/core';
import { MudConfigService } from '@mudlet3/frontend/features/config';
import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
import { IoMud, SocketsService } from '@mudlet3/frontend/features/sockets';
import { wordWrap } from '@mudlet3/frontend/shared';
import { BehaviorSubject, Observable } from 'rxjs';
import { IMudMessage } from 'src/app/core/mud/types/mud-message';
import { mudProcessData } from './utils/mud-process-data';

@Injectable({
  providedIn: 'root',
})
export class MudService {
  private readonly outputLines = new BehaviorSubject<IMudMessage[]>([]);
  private readonly connected$ = new BehaviorSubject<boolean>(false);

  // Todo: Remove this Reference and diconnect from mud via socketsservive
  private ioMud?: IoMud;

  public readonly outputLines$: Observable<IMudMessage[]> =
    this.outputLines.asObservable();

  public readonly connectedStatus$: Observable<boolean> =
    this.connected$.asObservable();

  constructor(
    private readonly socketsService: SocketsService,
    private readonly mudConfigService: MudConfigService,
  ) {}

  public addOutputLine(...line: IMudMessage[]): void {
    this.outputLines.next([...this.outputLines.value, ...line]);
  }

  public sendMessage(message: string): void {
    this.socketsService.mudSendData(message);

    const useEcho = this.mudConfigService.webConfig.localEcho;

    if (useEcho) {
      const echoLine: IMudMessage = {
        type: 'echo',
        text: wordWrap(message, 75) + '\r\n',
      };

      this.addOutputLine(echoLine);
    }
  }

  public connect(): void {
    const cfg = this.mudConfigService.webConfig;

    console.log('Connecting to MUD:', cfg.mudname);

    const mudOb: MudConfig = {
      mudname: cfg.mudname,
      height: cfg.height,
      width: cfg.width,
    };

    // if (cfg.autoUser) {
    //   mudOb['user'] = cfg.autoUser;
    //   mudOb['token'] = cfg.autoToken;
    //   mudOb['password'] = cfg.autoPw || '';
    // }

    // Todo: Refactor in den socketsService
    this.socketsService.mudConnect(mudOb).subscribe(
      (ioResult) => {
        console.info('Received message:', ioResult);

        switch (ioResult.IdType) {
          case 'IoMud:SendToAllMuds':
            if (this.ioMud !== undefined) {
              mudProcessData(ioResult.MsgType ?? '');
            }
            return;
          case 'IoMud':
            this.ioMud = ioResult.Data as IoMud;

            if (this.ioMud === undefined) {
              return;
            }

            this.connected$.next(this.ioMud.connected);

            switch (ioResult.MsgType) {
              case 'mud-connect':
                console.info('Connected to MUD');
                this.connected$.next(true);
                return;
              case 'mud-signal':
                // Todo: Refacor
                // mudProcessSignals(this.ioMud.MudId, this, ioResult.musi);
                return;
              case 'mud-output':
                const ansiData = mudProcessData(ioResult.ErrorType ?? '');

                const mudLines: IMudMessage[] = ansiData.map((ansi) => ({
                  ...ansi,
                  type: 'mud',
                }));

                this.addOutputLine(...mudLines);
                return;
              case 'mud-disconnect':
                this.connected$.next(false);
                mudProcessData(ioResult.ErrorType ?? '');
                return;
              default:
                console.warn('Unknown MsgType with IoMud', ioResult);
            }
            break;
          default:
            console.warn('Unknown idType', ioResult);
        }
      },
      (error) => {
        console.error(error);
      },
    );
  }

  public disconnect(): void {
    if (this.ioMud) {
      this.ioMud.disconnectFromMudClient('refactor and remove this parameter');
      this.ioMud = undefined;
      this.connected$.next(false);
    }
  }
}
