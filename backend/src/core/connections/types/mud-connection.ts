// Todo[myst] okayish problem - fix this by restructuring
import { TelnetClient } from '../../../features/telnet/telnet-client.js';

export interface MudConnection {
  socket: TelnetClient;
  mudOb: {
    browser: string;
    client: string;
    version: string;
    mudname: string;
    real_ip: string;
    height: number;
    width: number;
  };
  socketID: string;
}
