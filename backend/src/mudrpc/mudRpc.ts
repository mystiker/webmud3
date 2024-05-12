import EventEmitter from 'events';

// [ Request, ID, App, Funktion, Argumente, ... ]
// Request ist die Art des Paketes (2: Aufruf, 1: Antwort auf Aufruf, 0: Fehler bei Aufruf)
// ID ist eine eindeutige ID, um die Antwort/Fehler dem Aufruf zuzuordnen
// App ist das Objekt, wo die Funktion aufgerufen werden soll (z.b. "mail" fuer Mail-Funktionen)
// Antwort: [ Request, ID, Fehlertext bzw. Rueckgabewert ]
// Fuer die Authentifizierung haben wir "mud", "password"

/**
 * Represents a MudRpc client that connects to a server using a stream.
 * Emits events for connection, disconnection, error, and message.
 */
export class MudRpc extends EventEmitter {
  /**
   * Represents the MudRpc class.
   * @constructor
   * @param {object} client - The client object used for communication.
   */
  private constructor(client) {
    super();

    let i_id = 1000;
    const cache = {};

    let buffer = '';

    client.on('connect', () => {
      this.emit('connected');
    });

    client.on('data', (data) => {
      // console.log('data:',data.toString());
      buffer += data.toString();
      let boundary = buffer.indexOf('\n');
      while (boundary !== -1) {
        const input = buffer.substring(0, boundary);
        buffer = buffer.substring(boundary + 1);
        // console.log('input:',input);
        this.emit('message', JSON.parse(input));
        boundary = buffer.indexOf('\n');
      }
    });

    client.on('error', (error) => {
      this.emit('error', error);
    });

    this.on('message', (data) => {
      // console.log("rpc-message: ",data);
      const r_id = data[1];
      const r_req = data[0];
      let r_cb;
      if (
        typeof cache[r_id] !== 'undefined' &&
        typeof cache[r_id].cb !== 'undefined'
      ) {
        r_cb = cache[r_id].cb;
      } else {
        this.emit('error', 'response without request: ' + r_id);
        return;
      }
      if (r_req == 0) {
        r_cb(data[2], null); // internal error from mudrpc...
      } else if (r_req == 1) {
        r_cb(null, data[2]);
      }
    });
    this.on('request', (app, data, cb) => {
      i_id = i_id + 1;
      cache[i_id] = { cb };
      const s2 = JSON.stringify(data);
      const s1 =
        '[ 2, ' +
        i_id +
        ', "' +
        app +
        '", ' +
        s2.substr(1, s2.length - 2) +
        ' ]\n';
      const b1 = Buffer.from(s1);
      client.write(b1);
      // console.log("rpc-request: ",s1);
    });
    client.on('end', () => {
      console.log('MudRpc: disconnected from server');
      this.emit('disconnected');
    });
  }

  public static connect(stream) {
    return new MudRpc(stream);
  }
}
