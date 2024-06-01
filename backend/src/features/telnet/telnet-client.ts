import EventEmitter from 'events';
import { Socket } from 'net';
import { TelnetSocket, TelnetSocketOptions } from 'telnet-stream';

import { logger } from '../logger/winston-logger.js';
import { TelnetOptions } from './models/telnet-options.js';
import { TelnetNegotiations } from './types/telnet-negotiations.js';

type TelnetClientEvents = {
  data: [string | Buffer];
};

/**
 * Represents a client for handling telnet communication tailored for MUD games.
 */
export class TelnetClient extends EventEmitter<TelnetClientEvents> {
  private negotiations: TelnetNegotiations = {};

  private readonly telnetSocket: TelnetSocket;

  private connected: boolean = false;

  public get isConnected(): boolean {
    return this.connected;
  }

  public get getNegotiations(): TelnetNegotiations {
    return { ...this.negotiations };
  }

  /**
   * Constructs a TelnetClient instance.
   * @param telnetConnection - The socket connection to the MUD server.
   * @param telnetSocketOptions - Options for the Telnet socket.
   * @param clientConnection - The client socket connection.
   */
  constructor(
    telnetConnection: Socket,
    telnetSocketOptions: TelnetSocketOptions,
  ) {
    super();

    this.telnetSocket = new TelnetSocket(telnetConnection, telnetSocketOptions);

    this.telnetSocket.on('close', () => this.handleClose());

    this.telnetSocket.on('command', () => this.handleCommand());

    this.telnetSocket.on('do', (chunkData) => this.handleDo(chunkData));

    this.telnetSocket.on('dont', (chunkData) => this.handleDont(chunkData));

    this.telnetSocket.on('will', (chunkData) => this.handleWill(chunkData));

    this.telnetSocket.on('wont', (chunkData) => this.handleWont(chunkData));

    this.telnetSocket.on('sub', (optin, chunkData) =>
      this.handleSub(optin, chunkData),
    );

    this.telnetSocket.on('error', (chunkData) => this.handleError(chunkData));

    this.telnetSocket.on('data', (chunkData: string | Buffer) => {
      this.emit('data', chunkData);
    });

    logger.info(`[Telnet-Client] Created`, {
      telnetSocketOptions,
    });

    this.connected = true;
  }

  public sendMessage(data: string): void {
    this.telnetSocket.write(data);

    logger.info(`[Telnet-Client] [Telnet] TEST`, { test: this.negotiations });
  }

  public disconnect(): void {
    this.telnetSocket.end();

    this.connected = false;
  }

  // Todo[myst]: Establish connection here and do not accept it from outside via ctor
  // public connect(): void {
  //   this.telnetSocket.connect();
  // }

  private updateNegotiations(
    chunkData: number,
    action: 'will' | 'do' | 'wont' | 'dont',
  ): string {
    const opt = TelnetOptions.num2opt[chunkData.toString()];

    const stateAction = action === 'do' || action === 'will' ? 'do' : 'dont';

    this.negotiations[opt] = { server: stateAction, client: 'wont' };

    return opt;
  }

  private handleClose(): void {
    logger.info(`[Telnet-Client] [Telnet] Received message 'close'`);

    this.connected = false;
  }

  private handleCommand(): void {
    logger.info(`[Telnet-Client] [Telnet] Received message 'command'`);
  }

  private handleDo(chunkData: number): void {
    logger.verbose(`[Telnet-Client] [Telnet] Received message 'do'`);

    const opt = this.updateNegotiations(chunkData, 'do');

    if (opt === 'TELOPT_TM') {
      // Timing Mark
      this.telnetSocket.writeWill(chunkData);
    } else if (opt === 'TELOPT_NAWS') {
      // Window size
      this.negotiations[opt] = { server: 'do', client: 'will' };

      this.telnetSocket.writeWill(chunkData);

      // Spezielle Logik für NAWS
      // socket_io.emit(
      //   'mud-get-naws',
      //   this.mudOptions?.id,
      //   (sizeOb: { width: number; height: number }) => {
      //     const buf = sizeToBuffer(sizeOb.width, sizeOb.height);
      //     this.writeSub(chunkData, buf);
      //   },
      // );
    } else {
      this.telnetSocket.writeWont(chunkData);
    }
  }

  private handleDont(chunkData: number): void {
    logger.verbose(`[Telnet-Client] [Telnet] Received message 'dont'`);

    this.updateNegotiations(chunkData, 'dont');
  }

  private handleWill(chunkData: number): void {
    logger.verbose(`[Telnet-Client] [Telnet] Received message 'will'`);

    const opt = this.updateNegotiations(chunkData, 'will');

    if (opt === 'TELOPT_ECHO') {
      this.telnetSocket.writeDo(chunkData);

      this.negotiations[opt].client = 'do';

      // socket_io.emit('mud-signal', {
      //   signal: 'NOECHO-START',
      //   id: this.mudOptions?.id,
      // });
    } else if (opt === 'TELOPT_GMCP') {
      this.telnetSocket.writeDo(chunkData);

      this.negotiations[opt].client = 'do';

      // socket_io.emit(
      //   'mud-gmcp-start',
      //   this.mudOptions.id,
      //   this.mudOptions.gmcp_support,
      // );
    } else {
      this.telnetSocket.writeDont(chunkData);
    }
  }

  private handleWont(chunkData: number): void {
    logger.verbose(`[Telnet-Client] [Telnet] Received message 'wont'`);

    const opt = this.updateNegotiations(chunkData, 'wont');

    if (opt === 'TELOPT_ECHO') {
      this.telnetSocket.writeDont(chunkData);

      // socket_io.emit('mud-signal', {
      //   signal: 'NOECHO-END',
      //   id: this.mudOptions?.id,
      // });
    } else {
      this.telnetSocket.writeDont(chunkData);
    }
  }

  private handleSub(optin: number, chunkData: Buffer): void {
    logger.verbose(`[Telnet-Client] [Telnet] Received message 'sub'`);

    const opt = TelnetOptions.num2opt[optin.toString()];

    // Keine weitere Standardlogik; direkt die spezifische Logik implementieren
    if (opt === 'TELOPT_TTYPE' && new Uint8Array(chunkData)[0] === 1) {
      const nullBuf = Buffer.alloc(1, 0); // TELQUAL_IS

      const buf = Buffer.from('WebMud3a');

      const sendBuf = Buffer.concat([nullBuf, buf], buf.length + 1);

      this.telnetSocket.writeSub(optin, sendBuf);
    } else if (opt === 'TELOPT_CHARSET' && new Uint8Array(chunkData)[0] === 1) {
      const nullBuf = Buffer.alloc(1, 2); // ACCEPTED

      const buf = Buffer.from('UTF-8');

      const sendBuf = Buffer.concat([nullBuf, buf], buf.length + 1);

      this.telnetSocket.writeSub(optin, sendBuf);
    } else if (opt === 'TELOPT_GMCP') {
      const tmpstr = chunkData.toString();

      const ix = tmpstr.indexOf(' ');

      // const jx = tmpstr.indexOf('.');

      let jsdata = tmpstr.substr(ix + 1);
      if (ix < 0 || jsdata === '') jsdata = '{}';

      // socket_io.emit(
      //   'mud-gmcp-incoming',
      //   this.mudOptions?.id,
      //   tmpstr.substr(0, jx),
      //   tmpstr.substr(jx + 1, ix - jx),
      //   JSON.parse(jsdata),
      // );
    }
  }

  private handleError(chunkData: Error): void {
    logger.error(`[Telnet-Client] [Telnet] Received message 'error'`, {
      chunkData,
    });
  }
}
