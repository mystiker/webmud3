import net from 'net';
import { ClientWebSocket } from '../features/websockets/client-web-socket.js';

// Todo[myst]: Macht das überhaupt was?
const SOCKETFILE = process.env.SOCKETFILE || '/run/sockets/testintern2';

// Todo:[myst]: Evaluieren, ob dir diese Klase überhaupt brauchen. Erscheint mir nur ein schwacher Wrapper um ClientWebSocket zu sein.
export class RPCClient {
  private static instance: RPCClient;
  private client: net.Socket;
  private mudConn: ClientWebSocket;
  public connected = false;

  private constructor() {}

  public static getInstance(): RPCClient {
    if (!this.instance) {
      this.instance = new RPCClient();
    }
    return this.instance;
  }

  private ensureConnection(): void {
    if (!this.connected) {
      console.log('Attempting to reconnect to MudRpc...');
      this.client = net.createConnection({ path: SOCKETFILE }, () => {
        console.log('Connected to MudRpc');
        this.connected = true;
      });
      this.client.on('error', (error) => {
        console.error('Connection error:', error);
        this.connected = false;
      });
      this.client.on('end', () => {
        console.log('Disconnected from MudRpc');
        this.connected = false;
      });

      this.mudConn = ClientWebSocket.connect(this.client);
    }
  }

  public logon(
    name: string,
    pw: string,
    cb: (err: Error | null, result?: { name: string; adminp: boolean }) => void,
  ): void {
    this.ensureConnection();
    this.mudConn.emit('request', 'webmud3', ['password', name, pw], cb);
  }
}
