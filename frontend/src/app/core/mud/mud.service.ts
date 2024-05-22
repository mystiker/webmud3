import { Injectable } from '@angular/core';
import { IAnsiData } from '@mudlet3/frontend/features/ansi';
import { MudConfig } from '@mudlet3/frontend/features/mudconfig';
import { IoMud, SocketsService } from '@mudlet3/frontend/features/sockets';
import { BehaviorSubject, Observable } from 'rxjs';
import { mudProcessData } from './utils/mud-process-data';

@Injectable({
  providedIn: 'root',
})
export class MudService {
  private readonly outputLines = new BehaviorSubject<IAnsiData[]>([]);

  private readonly connected$ = new BehaviorSubject<boolean>(false);

  public readonly outputLines$: Observable<IAnsiData[]> =
    this.outputLines.asObservable();

  public readonly connectedStatus$: Observable<boolean> =
    this.connected$.asObservable();

  // Todo[myst]: make this private
  public ioMud?: IoMud;
  private mudc_id?: string;

  // Todo[myst]: Make socketsService private
  constructor(public socketsService: SocketsService) {}

  // Todo[myst]: make this protected
  public getCurrentOutputLines(): IAnsiData[] {
    return this.outputLines.value;
  }

  public addOutputLine(...line: Partial<IAnsiData>[]): void {
    this.outputLines.next([
      ...this.outputLines.value,
      ...(line as IAnsiData[]),
    ]);
  }

  public connect(mudName: string, cfg: MudConfig): void {
    console.log('Connecting to MUD:', mudName);

    const mudOb: MudConfig = {
      mudname: mudName,
      height: cfg.height,
      width: cfg.width,
    };

    // if (cfg.autoUser) {
    //   mudOb['user'] = cfg.autoUser;
    //   mudOb['token'] = cfg.autoToken;
    //   mudOb['password'] = cfg.autoPw || '';
    // }

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
                this.mudc_id = this.ioMud.MudId;
                this.connected$.next(true);
                return;
              case 'mud-signal':
                // Todo: Refacor in
                // mudProcessSignals(this.ioMud.MudId, this, ioResult.musi);
                return;
              case 'mud-output':
                const ansiData = mudProcessData(ioResult.ErrorType ?? '');
                this.addOutputLine(...ansiData);
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
    if (this.mudc_id && this.ioMud) {
      this.ioMud.disconnectFromMudClient(this.mudc_id);
      this.ioMud = undefined;
      this.connected$.next(false);
      this.mudc_id = undefined;
    }
  }
}
