import EventEmitter from 'events';
import net from 'net';

// [ Request, ID, App, Funktion, Argumente, ... ]
// Request ist die Art des Paketes (2: Aufruf, 1: Antwort auf Aufruf, 0: Fehler bei Aufruf)
// ID ist eine eindeutige ID, um die Antwort/Fehler dem Aufruf zuzuordnen
// App ist das Objekt, wo die Funktion aufgerufen werden soll (z.b. "mail" fuer Mail-Funktionen)
// Antwort: [ Request, ID, Fehlertext bzw. Rueckgabewert ]
// Fuer die Authentifizierung haben wir "mud", "password"

export class ClientWebSocket extends EventEmitter {
  private readonly client: net.Socket;
  private buffer: string = '';
  private requestId: number = 1000;
  private callbacks: Record<number, () => void> = {};

  public constructor(client: net.Socket) {
    super();

    this.client = client;

    this.setupClientHandlers();
  }

  public static connect(socket: net.Socket): ClientWebSocket {
    return new ClientWebSocket(socket);
  }

  public sendRequest(app: string, data: unknown[], callback: () => void): void {
    const id = ++this.requestId;

    this.callbacks[id] = callback;

    const payload = JSON.stringify([2, id, app, ...data]) + '\n';

    this.client.write(Buffer.from(payload));
  }

  private setupClientHandlers(): void {
    this.client.on('connect', () => this.emit('connected'));

    this.client.on('data', (data) => this.handleData(data));

    this.client.on('error', (error) => this.emit('error', error));

    this.client.on('end', () => {
      console.log('MudRpc: disconnected from server');

      this.emit('disconnected');
    });
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();

    let boundary = this.buffer.indexOf('\n');

    while (boundary !== -1) {
      const input = this.buffer.substring(0, boundary);

      this.buffer = this.buffer.substring(boundary + 1);

      try {
        const message = JSON.parse(input);

        this.emit('message', message);
      } catch (error) {
        this.emit('error', 'Invalid JSON: ' + input);
      }

      boundary = this.buffer.indexOf('\n');
    }
  }
}
