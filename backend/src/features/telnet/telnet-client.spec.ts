import { Socket } from 'net';
import { TelnetClient } from './telnet-client';

jest.mock('net', () => ({
  Socket: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    on: jest.fn((event, handler) => {
      if (event === 'data') {
        process.nextTick(() => handler(Buffer.from([255, 251, 1])));
      }
    }),
  })),
}));

describe('TelnetClient', () => {
  let client: TelnetClient;
  let mockSocket: Socket;
  let clientConnection: Socket;

  beforeEach(() => {
    mockSocket = new Socket();
    clientConnection = new Socket();
    client = new TelnetClient(mockSocket, {}, clientConnection);
  });

  test('should create an instance without throwing', () => {
    expect(client).toBeDefined();
  });
});
