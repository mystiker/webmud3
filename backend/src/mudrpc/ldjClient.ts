import { EventEmitter } from 'events';

export class LDJClient extends EventEmitter {
  constructor(stream) {
    super();
    let buffer = '';
    stream.on('connect', () => {
      this.emit('connected');
    });
    stream.on('data', (data) => {
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
    stream.on('error', (error) => {
      this.emit('error', error);
    });
  }

  static connect(stream) {
    return new LDJClient(stream);
  }
}
