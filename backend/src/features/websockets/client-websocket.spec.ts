import net from 'net';

import { ClientWebSocket } from './client-websocket';

describe('MudRpc', () => {
  let client: net.Socket;
  let mudRpc: ClientWebSocket;

  beforeEach(() => {
    client = new net.Socket();

    mudRpc = ClientWebSocket.connect(client);
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
});
