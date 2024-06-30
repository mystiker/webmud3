import { TelnetClient } from '../../../features/telnet/telnet-client.js';

export type MudConnections = {
  [socketId: string]: {
    telnet: TelnetClient | undefined;
    timer: NodeJS.Timeout | undefined;
  };
};
