import EventEmitter from 'events';
import { MudRpc } from './mudRpc';

describe('MudRpc', () => {
  let client;
  let mudRpc;

  beforeEach(() => {
    client = new EventEmitter();
    mudRpc = MudRpc.connect(client);
  });

  afterEach(() => {
    mudRpc.removeAllListeners();
  });

  test('should emit "connected" event when client connects', () => {
    const connectedHandler = jest.fn();
    mudRpc.on('connected', connectedHandler);

    client.emit('connect');

    expect(connectedHandler).toHaveBeenCalled();
  });

  test('should emit "message" event when receiving data from client', () => {
    const messageHandler = jest.fn();
    mudRpc.on('message', messageHandler);

    client.emit('data', '{"foo": "bar"}\n');

    expect(messageHandler).toHaveBeenCalledWith({ foo: 'bar' });
  });

  test('should emit "error" event when client encounters an error', () => {
    const errorHandler = jest.fn();
    mudRpc.on('error', errorHandler);

    client.emit('error', 'Connection error');

    expect(errorHandler).toHaveBeenCalledWith('Connection error');
  });

  test('should emit "disconnected" event when client disconnects', () => {
    const disconnectedHandler = jest.fn();
    mudRpc.on('disconnected', disconnectedHandler);

    client.emit('end');

    expect(disconnectedHandler).toHaveBeenCalled();
  });

  test('should send request to server and receive response', () => {
    const request = { app: 'mail', data: { subject: 'Hello', body: 'World' } };
    const response = { success: true };

    client.write = jest.fn();
    const writeSpy = jest.spyOn(client, 'write');

    mudRpc.emit('request', request.app, request.data, (error, result) => {
      expect(error).toBeNull();
      expect(result).toEqual(response);
    });

    expect(writeSpy).toHaveBeenCalledWith(expect.any(Buffer));
  });
});
