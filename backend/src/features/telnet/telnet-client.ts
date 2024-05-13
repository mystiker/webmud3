import { Socket } from 'net';
import { TelnetSocket, TelnetSocketOptions } from 'telnet-stream';
import { TelnetCommands } from './models/telnet-commands.js';
import { TelnetOptions } from './models/telnet-options.js';

export class TelnetClient extends TelnetSocket {
  state: object;

  private readonly tel = {
    ...TelnetOptions,
    opt2com: TelnetCommands,
  };

  _moptions: {
    gmcp_support?: unknown;
    id?: string;
    debugflag?: boolean;
  };
  debugflag: boolean;
  txtToBuffer(text: string) {
    const result = [];
    let i = 0;
    text = encodeURI(text);
    while (i < text.length) {
      const c = text.charCodeAt(i++);

      // if it is a % sign, encode the following 2 bytes as a hex value
      if (c === 37) {
        result.push(parseInt(text.substr(i, 2), 16));
        i += 2;

        // otherwise, just the actual byte
      } else {
        result.push(c);
      }
    }
    return Buffer.from(result);
  }

  val16ToBuffer(result: unknown[], val: number) {
    result.push((val & 0xff00) >> 8);
    result.push(val & 0xff);
    return result;
  }

  sizeToBuffer(w: number, h: number) {
    let result = [];
    result = this.val16ToBuffer(result, w);
    result = this.val16ToBuffer(result, h);
    return Buffer.from(result);
  }

  // topt: bufferSize, errorPolicy(discardBoth,keepData,keep_both)
  //       other options from stream: https://nodejs.org/api/stream.html
  constructor(
    _socket: Socket,
    topt: TelnetSocketOptions,
    mopt: {
      debugflag?: boolean;
      id?: string;
      gmcp_support?: boolean;
      charset?: string;
    },
    socket_io: Socket,
  ) {
    super(_socket, topt);
    console.log('MUDSOCKET: creating');
    this.state = {};

    let buf;
    this._moptions = mopt || {};
    this.debugflag =
      typeof this._moptions.debugflag !== 'undefined' &&
      this._moptions.debugflag &&
      typeof socket_io !== 'undefined';
    super.on('close', () => {
      if (this.debugflag) {
        socket_io.emit('mud.debug', {
          id: this._moptions.id,
          type: 'close',
          data: '',
        });
      }
    });
    super.on('command', (chunkData) => {
      const cmd = this.tel.num2opt[chunkData.toString()];
      if (this.debugflag) {
        socket_io.emit('mud.debug', {
          id: this._moptions.id,
          type: 'command',
          data: cmd,
        });
      }
    });
    super.on('do', (chunkData) => {
      const opt = this.tel.num2opt[chunkData.toString()];
      if (this.debugflag) {
        if (opt != 'TELOPT_TM') {
          // supress log for timemsg...
          console.log('MUDSOCKET: do:' + opt);
        }
        socket_io.emit('mud.debug', {
          id: this._moptions.id,
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
          socket_io.emit('mud-get-naws', this._moptions.id, (sizeOb) => {
            if (sizeOb === false) {
              return;
            }
            buf = this.sizeToBuffer(sizeOb.width, sizeOb.height);
            if (this.debugflag) {
              console.log('MUDSOCKET: NAWS-buf:', buf, sizeOb);
            }
            this.writeSub(chunkData, buf);
          });
          break; // TODO calc windows size and report...
        case 'TELOPT_TTYPE' /* terminal type */:
          this.state[opt] = { server: 'do', client: 'will' };
          this.writeWill(chunkData);
          break;
        default:
          this.writeWont(chunkData);
          break;
      }
    });
    super.on('dont', (chunkData) => {
      const opt = this.tel.num2opt[chunkData.toString()];
      if (this.debugflag) {
        console.log('MUDSOCKET: dont:' + opt);
        socket_io.emit('mud.debug', {
          id: this._moptions.id,
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
    });
    super.on('will', (chunkData) => {
      const opt = this.tel.num2opt[chunkData.toString()];
      if (this.debugflag) {
        console.log('MUDSOCKET: will:' + opt);
        socket_io.emit('mud.debug', {
          id: this._moptions.id,
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
            id: this._moptions.id,
          });
          break;
        case 'TELOPT_EOR':
          this.writeDont(chunkData);
          break; /* end or record */
        case 'TELOPT_CHARSET':
          this.writeDo(chunkData);
          break; /* charset */
        case 'TELOPT_GMCP' /* Generic MUD Communication Protocol */:
          if (typeof this._moptions.gmcp_support !== 'undefined') {
            this.writeDo(chunkData);
            this.state[opt].client = 'do';
            socket_io.emit(
              'mud-gmcp-start',
              this._moptions.id,
              this._moptions.gmcp_support,
            );
          } else {
            this.writeDont(chunkData);
          }
          break;
        default:
          this.writeDont(chunkData);
          break;
      }
    });
    super.on('wont', (chunkData) => {
      const opt = this.tel.num2opt[chunkData.toString()];
      if (this.debugflag) {
        console.log('MUDSOCKET: wont:' + opt);
        socket_io.emit('mud.debug', {
          id: this._moptions.id,
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
            id: this._moptions.id,
          });
          break;
        default:
          this.writeDont(chunkData);
          break;
      }
    });
    super.on('sub', (optin, chunkData) => {
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
            buf = Buffer.from('WebMud3a');
            const sendBuf = Buffer.concat([nullBuf, buf], buf.length + 1);
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
            buf = Buffer.from('UTF-8');
            const sendBuf = Buffer.concat([nullBuf, buf], buf.length + 1);
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
            this._moptions.id,
            tmpstr.substr(0, jx),
            tmpstr.substr(jx + 1, ix - jx),
            JSON.parse(jsdata),
          );
          break;
      }
      socket_io.emit('mud.debug', {
        id: this._moptions.id,
        type: 'sub',
        option: opt,
        data: chunkData,
      });
    });
    super.on('error', (chunkData) => {
      console.log('mudSocket-error:' + chunkData);
      if (this.debugflag) {
        socket_io.emit('mud.debug', {
          id: this._moptions.id,
          type: 'error',
          data: chunkData,
        });
      }
    });
    console.log('MUDSOCKET: created');
  }
}
