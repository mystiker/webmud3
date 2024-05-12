import net from 'net';
import { MudRpc } from './mudRpc.js';

// Todo{myst]: Macht das überhaupt was?
let SOCKETFILE;

if (typeof process.env.SOCKETFILE === 'undefined') {
  SOCKETFILE = '/run/sockets/testintern2';
} else {
  SOCKETFILE = process.env.SOCKETFILE;
}

/**
 * Represents an RPC client for interacting with a MudRpc server.
 */
export class RPCClient {
  private static instance: RPCClient;

  private client: net.Socket;
  private mudConn: MudRpc;

  public connected = false;

  private constructor() {}

  /**
   * Returns the singleton instance of the RPCClient class.
   * @returns The RPCClient instance.
   */
  public static getInstance() {
    return this.instance || (this.instance = new this());
  }

  /**
   * Logs in to the MudRpc server with the specified name and password.
   * @param name - The name of the user.
   * @param pw - The password of the user.
   * @param cb - The callback function to handle the login result.
   */
  public logon(
    name: unknown,
    pw: unknown,
    cb: (err: unknown, result: { name: unknown; adminp: unknown }) => void,
  ) {
    if (!this.connected) {
      console.log('reconnect mudRpc');
      this.client = net.createConnection(SOCKETFILE);
      this.mudConn = MudRpc.connect(this.client);
      this.mudConn.on('disconnected', function () {
        this.connected = false;
      });
      this.connected = true;
    }
    this.mudConn.emit('request', 'webmud3', ['password', name, pw], cb);
  }
}
