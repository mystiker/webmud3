import net from 'net';
import { MudRpc } from './mudRpc.js';

let SOCKETFILE;

if (typeof process.env.SOCKETFILE === 'undefined') {
  SOCKETFILE = '/run/sockets/testintern2';
} else {
  SOCKETFILE = process.env.SOCKETFILE;
}

let client; //  = net.createConnection(SOCKETFILE);

let mudConn; // = new mudRpc(client);

let connected = false;

/**
 * Looks like this should be a class, but it's not. - Exported a singleton of this
 */
export class RPCClient {
  private static instance: RPCClient;

  private constructor() {}

  public static getInstance() {
    return this.instance || (this.instance = new this());
  }

  public logon(name, pw, cb) {
    if (!connected) {
      console.log('reconnect mudRpc');
      client = net.createConnection(SOCKETFILE);
      mudConn = new MudRpc(client);
      mudConn.on('disconnected', function () {
        connected = false;
      });
      connected = true;
    }
    mudConn.emit('request', 'webmud3', ['password', name, pw], cb);
  }
}
