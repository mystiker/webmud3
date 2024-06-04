// Das siegreiche Gnomi sagt: Es gibt so ein paar Telnet-Optionen, die m.E.
//         jeder Client unterstuetzen sollte: NAWS, CHARSET, EOR, ECHO,
//         STARTTLS.
// Das siegreiche Gnomi sagt: Ah, und SGA oder LINEMODE

import EventEmitter from 'events';
import { Socket } from 'net';
import { TelnetSocket, TelnetSocketOptions } from 'telnet-stream';

import { logger } from '../logger/winston-logger.js';
import { TelnetOptions } from './models/telnet-options.js';
import { TelnetNegotiations } from './types/telnet-negotiations.js';

const logNegotiation = (
  perspective: 'Received' | 'Send',
  action: string,
  option: number,
  data?: Buffer,
) => {
  logger.verbose(
    `[Telnet-Socket] ${perspective} ${action} for option ${TelnetOptions.num2opt[option]}`,
    data ? { data: data.toString() } : {},
  );
};

type TelnetClientEvents = {
  data: [string | Buffer];
  close: [boolean];
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

    this.telnetSocket = new TelnetSocketWrapper(
      telnetConnection,
      telnetSocketOptions,
    );

    this.telnetSocket.on('close', (hadErrors) => this.handleClose(hadErrors));

    this.telnetSocket.on('do', (option) => this.handleDo(option));

    this.telnetSocket.on('dont', (option) => this.handleDont(option));

    this.telnetSocket.on('will', (option) => this.handleWill(option));

    this.telnetSocket.on('wont', (option) => this.handleWont(option));

    this.telnetSocket.on('sub', (option, chunkData) =>
      this.handleSub(option, chunkData),
    );

    this.telnetSocket.on('data', (chunkData: string | Buffer) => {
      this.emit('data', chunkData);
    });

    logger.info(`[Telnet-Client] Created`, {
      telnetSocketOptions,
    });

    this.connected = true;
  }

  public sendMessage(data: string): void {
    logger.info(`[Telnet-Client] Send message`, {
      data,
    });

    this.telnetSocket.write(data);
  }

  public disconnect(): void {
    logger.info(`[Telnet-Client] Disconnect`);

    this.telnetSocket.end();

    this.connected = false;
  }

  // Todo[myst]: Establish connection here and do not accept it from outside via ctor
  // public connect(): void {
  //   this.telnetSocket.connect();
  // }

  private updateNegotiations(
    option: number,
    action: 'will' | 'do' | 'wont' | 'dont',
  ): string {
    const opt = TelnetOptions.num2opt[option.toString()];

    const stateAction = action === 'do' || action === 'will' ? 'do' : 'dont';

    this.negotiations[opt] = { server: stateAction, client: 'wont' };

    return opt;
  }

  private handleClose(hadErrors: boolean): void {
    this.connected = false;

    this.emit('close', hadErrors);
  }

  private handleDo(option: number): void {
    const opt = this.updateNegotiations(option, 'do');

    if (opt === 'TELOPT_CHARSET') {
      this.telnetSocket.writeWill(option);

      return;
    }

    if (opt === 'TELOPT_TM') {
      // Timing Mark

      this.telnetSocket.writeWill(option);
    } else if (opt === 'TELOPT_NAWS') {
      // Window size
      this.negotiations[opt] = { server: 'do', client: 'will' };

      this.telnetSocket.writeWill(option);

      // Todo[myst]: Re-Enable NAWS. See https://github.com/mystiker/webmud3/issues/33
      // this.telnetSocket.writeSub(option, sizeToBuffer(100, 2));

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
      this.telnetSocket.writeWont(option);
    }
  }

  private handleDont(option: number): void {
    this.updateNegotiations(option, 'dont');
  }

  private handleWill(option: number): void {
    const opt = this.updateNegotiations(option, 'will');

    if (opt === 'TELOPT_CHARSET') {
      this.telnetSocket.writeDo(option);

      this.negotiations[opt].client = 'do';

      return;
    }

    if (opt === 'TELOPT_ECHO') {
      this.telnetSocket.writeDo(option);

      this.negotiations[opt].client = 'do';

      // socket_io.emit('mud-signal', {
      //   signal: 'NOECHO-START',
      //   id: this.mudOptions?.id,
      // });
    } else if (opt === 'TELOPT_GMCP') {
      this.telnetSocket.writeDo(option);

      this.negotiations[opt].client = 'do';

      // socket_io.emit(
      //   'mud-gmcp-start',
      //   this.mudOptions.id,
      //   this.mudOptions.gmcp_support,
      // );
    } else {
      this.telnetSocket.writeDont(option);
    }
  }

  private handleWont(option: number): void {
    const opt = this.updateNegotiations(option, 'wont');

    if (opt === 'TELOPT_ECHO') {
      this.telnetSocket.writeDont(option);

      // socket_io.emit('mud-signal', {
      //   signal: 'NOECHO-END',
      //   id: this.mudOptions?.id,
      // });
    } else {
      this.telnetSocket.writeDont(option);
    }
  }

  private handleSub(option: number, chunkData: Buffer): void {
    const opt = TelnetOptions.num2opt[option.toString()];

    if (opt === 'TELOPT_TTYPE' && new Uint8Array(chunkData)[0] === 1) {
      const nullBuf = Buffer.alloc(1, 0); // TELQUAL_IS

      const buf = Buffer.from('WebMud3a');

      const sendBuf = Buffer.concat([nullBuf, buf], buf.length + 1);

      this.telnetSocket.writeSub(option, sendBuf);
    } else if (opt === 'TELOPT_CHARSET' && new Uint8Array(chunkData)[0] === 1) {
      const nullBuf = Buffer.alloc(1, 2); // ACCEPTED

      const buf = Buffer.from('UTF-8');

      const sendBuf = Buffer.concat([nullBuf, buf], buf.length + 1);

      this.telnetSocket.writeSub(option, sendBuf);
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
}

class TelnetSocketWrapper extends TelnetSocket {
  public override writeDo(option: number): void {
    logNegotiation('Send', 'do', option);

    super.writeDo(option);
  }

  public override writeDont(option: number): void {
    logNegotiation('Send', 'dont', option);

    super.writeDont(option);
  }

  public override writeWill(option: number): void {
    logNegotiation('Send', 'will', option);

    super.writeWill(option);
  }

  public override writeWont(option: number): void {
    logNegotiation('Send', 'wont', option);

    super.writeWont(option);
  }

  public override writeSub(option: number, buffer: Buffer): void {
    logNegotiation('Send', 'sub', option, buffer);

    super.writeSub(option, buffer);
  }

  constructor(socket: Socket, options?: TelnetSocketOptions) {
    super(socket, options);

    this.on('will', (option) => logNegotiation('Received', 'will', option));

    this.on('wont', (option) => logNegotiation('Received', 'wont', option));

    this.on('do', (option) => logNegotiation('Received', 'do', option));

    this.on('dont', (option) => logNegotiation('Received', 'dont', option));

    this.on('sub', (option, chunkData) =>
      logNegotiation('Received', 'sub', option, chunkData),
    );

    this.on('command', (command) =>
      logNegotiation('Received', 'command', command),
    );
  }
}
