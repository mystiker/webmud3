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

  public readonly outputLines$: Observable<IMudMessage[]> =
    this.outputLines.asObservable();

  public readonly connectedToMud$: Observable<boolean>;

  constructor(
    private readonly socketsService: SocketsService,
    private readonly mudConfigService: MudConfigService,
  ) {
    socketsService.onMudOutput.subscribe(({ data }) => {
      const ansiData = mudProcessData(data);

      const mudLines: IMudMessage[] = ansiData.map((ansi) => ({
        ...ansi,
        type: 'mud',
      }));

      this.addOutputLine(...mudLines);
    });

    this.connectedToMud$ = this.socketsService.connectedToMud$;
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
    this.socketsService.disconnectFromMud();
  }
}
