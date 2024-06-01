import { Injectable } from '@angular/core';
import { MudConfigService } from '@mudlet3/frontend/features/config';
import { SocketsService } from '@mudlet3/frontend/features/sockets';
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

  public readonly outputLines$: Observable<IMudMessage[]> =
    this.outputLines.asObservable();

  public readonly connectedStatus$: Observable<boolean> =
    this.connected$.asObservable();

  constructor(
    private readonly socketsService: SocketsService,
    private readonly mudConfigService: MudConfigService,
  ) {
    socketsService.mudConnectEvent.subscribe(() => {
      console.info('Connected to MUD');
      this.connected$.next(true);
    });

    socketsService.mudDisconnectEvent.subscribe((ioResult) => {
      console.info('Disconnected from MUD');
      this.connected$.next(false);
      mudProcessData(ioResult.ErrorType ?? '');
    });

    socketsService.mudOutputEvent.subscribe((ioResult) => {
      const ansiData = mudProcessData(ioResult.ErrorType ?? '');

      const mudLines: IMudMessage[] = ansiData.map((ansi) => ({
        ...ansi,
        type: 'mud',
      }));

      this.addOutputLine(...mudLines);
    });
  }

  public addOutputLine(...line: IMudMessage[]): void {
    this.outputLines.next([...this.outputLines.value, ...line]);
  }

  public sendMessage(message: string): void {
    this.socketsService.sendMessage(message);

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
    this.socketsService.connectToMud();
  }

  public disconnect(): void {
    this.socketsService.disconnect();
    this.connected$.next(false);
  }
}
