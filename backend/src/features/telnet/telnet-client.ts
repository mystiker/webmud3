import { Socket } from 'net';
import { TelnetSocket, TelnetSocketOptions } from 'telnet-stream';
import { TelnetCommands } from './models/telnet-commands.js';
import { TelnetOptions } from './models/telnet-options.js';
import { MudOptions } from './types/mud-options.js';
import { TelnetState } from './types/telnet-state.js';
import { sizeToBuffer } from './utils/size-to-buffer.js';

export class TelnetClient extends TelnetSocket {
  private state: TelnetState;

  private readonly tel = {
    ...TelnetOptions,
    opt2com: TelnetCommands,
  };

  private mudOptions?: MudOptions;

  private debugflag: boolean;

  private buf: Buffer | undefined;

  // topt: bufferSize, errorPolicy(discardBoth,keepData,keep_both)
  //       other options from stream: https://nodejs.org/api/stream.html
  constructor(
    _socket: Socket,
    topt: TelnetSocketOptions,
    socket_io: Socket,
    mudOptions?: MudOptions,
  ) {
    super(_socket, topt);
    console.log('MUDSOCKET: creating');
    this.state = {};

    this.mudOptions = mudOptions;

    this.debugflag = this.mudOptions?.debugflag || false;

    this.setupEventHandlers(socket_io);

    console.log('MUDSOCKET: created');
  }

  private setupEventHandlers(socket_io: Socket): void {
    this.on('close', () => this.handleClose(socket_io));
    this.on('command', (chunkData) => this.handleCommand(chunkData, socket_io));
    this.on('do', (chunkData) => this.handleDo(chunkData, socket_io));
    this.on('dont', (chunkData) => this.handleDont(chunkData, socket_io));
    this.on('will', (chunkData) => this.handleWill(chunkData, socket_io));
    this.on('wont', (chunkData) => this.handleWont(chunkData, socket_io));
    this.on('sub', (optin, chunkData) =>
      this.handleSub(optin, chunkData, socket_io),
    );
    this.on('error', (chunkData) => this.handleError(chunkData, socket_io));
  }

  private handleClose(socket_io: Socket): void {
    if (this.debugflag) {
      socket_io.emit('mud.debug', {
        id: this.mudOptions?.id,
        type: 'close',
        data: '',
      });
    }
  }

  private handleCommand(chunkData: number, socket_io: Socket): void {
    const cmd = this.tel.num2opt[chunkData.toString()];
    if (this.debugflag) {
      socket_io.emit('mud.debug', {
        id: this.mudOptions?.id,
        type: 'command',
        data: cmd,
      });
    }
  }

  private handleDo(chunkData: number, socket_io: Socket): void {
    const opt = this.tel.num2opt[chunkData.toString()];
    if (this.debugflag) {
      if (opt != 'TELOPT_TM') {
        // supress log for timemsg...
        console.log('MUDSOCKET: do:' + opt);
      }
      socket_io.emit('mud.debug', {
        id: this.mudOptions?.id,
        type: 'do',
        data: opt,
      });
    }
    this.state[opt] = { server: 'do', client: 'wont' };
    switch (opt) {
      case 'TELOPT_TM' /* timing mark */:
        this.writeWill(chunkData);
        break;
      case 'TELOPT_NAWS' /* window size */:
        this.state[opt] = { server: 'do', client: 'will' };
        this.writeWill(chunkData);
        socket_io.emit(
          'mud-get-naws',
          this.mudOptions?.id,
          (sizeOb: { width: number; height: number }) => {
            // Todo[myst] sizeOb war irgendwie ein boolean, aber auch ein objekt?
            // if (sizeOb === false) {
            //   return;
            // }
            this.buf = sizeToBuffer(sizeOb.width, sizeOb.height);
            if (this.debugflag) {
              console.log('MUDSOCKET: NAWS-buf:', this.buf, sizeOb);
            }
            this.writeSub(chunkData, this.buf);
          },
        );
        break; // TODO calc windows size and report...
      case 'TELOPT_TTYPE' /* terminal type */:
        this.state[opt] = { server: 'do', client: 'will' };
        this.writeWill(chunkData);
        break;
      default:
        this.writeWont(chunkData);
        break;
    }
  }

  private handleDont(chunkData: number, socket_io: Socket): void {
    const opt = this.tel.num2opt[chunkData.toString()];
    if (this.debugflag) {
      console.log('MUDSOCKET: dont:' + opt);
      socket_io.emit('mud.debug', {
        id: this.mudOptions?.id,
        type: 'dont',
        data: opt,
      });
    }
    this.state[opt] = { server: 'dont', client: 'wont' };
    switch (opt) {
      default:
        this.writeWont(chunkData);
        break;
    }
  }

  private handleWill(chunkData: number, socket_io: Socket): void {
    const opt = this.tel.num2opt[chunkData.toString()];
    if (this.debugflag) {
      console.log('MUDSOCKET: will:' + opt);
      socket_io.emit('mud.debug', {
        id: this.mudOptions?.id,
        type: 'will',
        data: opt,
      });
    }
    this.state[opt] = { server: 'will', client: 'dont' };
    switch (opt) {
      case 'TELOPT_ECHO' /* echo */:
        this.writeDo(chunkData);
        this.state[opt].client = 'do';
        socket_io.emit('mud-signal', {
          signal: 'NOECHO-START',
          id: this.mudOptions?.id,
        });
        break;
      case 'TELOPT_EOR':
        this.writeDont(chunkData);
        break; /* end or record */
      case 'TELOPT_CHARSET':
        this.writeDo(chunkData);
        break; /* charset */
      case 'TELOPT_GMCP' /* Generic MUD Communication Protocol */:
        if (typeof this.mudOptions?.gmcp_support !== 'undefined') {
          this.writeDo(chunkData);
          this.state[opt].client = 'do';
          socket_io.emit(
            'mud-gmcp-start',
            this.mudOptions.id,
            this.mudOptions.gmcp_support,
          );
        } else {
          this.writeDont(chunkData);
        }
        break;
      default:
        this.writeDont(chunkData);
        break;
    }
  }

  private handleWont(chunkData: number, socket_io: Socket): void {
    const opt = this.tel.num2opt[chunkData.toString()];
    if (this.debugflag) {
      console.log('MUDSOCKET: wont:' + opt);
      socket_io.emit('mud.debug', {
        id: this.mudOptions?.id,
        type: 'wont',
        data: opt,
      });
    }
    this.state[opt] = { server: 'wont', client: 'dont' };
    switch (opt) {
      case 'TELOPT_ECHO' /* echo */:
        this.writeDont(chunkData);
        socket_io.emit('mud-signal', {
          signal: 'NOECHO-END',
          id: this.mudOptions?.id,
        });
        break;
      default:
        this.writeDont(chunkData);
        break;
    }
  }

  private handleSub(optin: number, chunkData: Buffer, socket_io: Socket): void {
    const opt = this.tel.num2opt[optin.toString()];
    const subInput = new Uint8Array(chunkData);
    if (opt != 'TELOPT_GMCP' && this.debugflag) {
      console.log('MUDSOCKET: sub:' + opt + '|' + subInput);
    }
    switch (opt) {
      case 'TELOPT_TTYPE' /* terminal type */:
        if (subInput.length == 1 && subInput[0] == 1) {
          // TELQUAL_SEND
          const nullBuf = Buffer.alloc(1);
          nullBuf[0] = 0; // TELQUAL_IS
          this.buf = Buffer.from('WebMud3a');
          const sendBuf = Buffer.concat(
            [nullBuf, this.buf],
            this.buf.length + 1,
          );
          if (this.debugflag) {
            console.log('MUDSOCKET: TTYPE: ', sendBuf);
          }
          this.writeSub(optin, sendBuf);
        }
        break;
      case 'TELOPT_CHARSET' /* charset */:
        if (this.debugflag) {
          console.log('MUDSOCKET: SB CHARSET:', chunkData.toString());
        }
        if (subInput.length >= 1 && subInput[0] == 1) {
          // TELQUAL_SEND
          const nullBuf = Buffer.alloc(1);
          nullBuf[0] = 2; // ACCEPTED
          this.buf = Buffer.from('UTF-8');
          const sendBuf = Buffer.concat(
            [nullBuf, this.buf],
            this.buf.length + 1,
          );
          if (this.debugflag) {
            console.log('MUDSOCKET: SB-Accept CHARSET: ', sendBuf);
          }
          this.writeSub(optin, sendBuf);
        }
        break;
      case 'TELOPT_GMCP' /* Generic MUD Communication Protocol */:
        const tmpstr = chunkData.toString();
        let ix = tmpstr.indexOf(' ');
        const jx = tmpstr.indexOf('.');
        let jsdata = tmpstr.substr(ix + 1);
        if (ix < 0 || jsdata == '') {
          jsdata = '{}';
          ix = tmpstr.length;
        }
        if (this.debugflag) {
          console.log('MUDSOCKET: GMCP-incoming: ', tmpstr);
        }
        socket_io.emit(
          'mud-gmcp-incoming',
          this.mudOptions?.id,
          tmpstr.substr(0, jx),
          tmpstr.substr(jx + 1, ix - jx),
          JSON.parse(jsdata),
        );
        break;
    }
    socket_io.emit('mud.debug', {
      id: this.mudOptions?.id,
      type: 'sub',
      option: opt,
      data: chunkData,
    });
  }

  private handleError(chunkData: Error, socket_io: Socket): void {
    console.log('mudSocket-error:' + chunkData);
    if (this.debugflag) {
      socket_io.emit('mud.debug', {
        id: this.mudOptions?.id,
        type: 'error',
        data: chunkData,
      });
    }
  }
}
