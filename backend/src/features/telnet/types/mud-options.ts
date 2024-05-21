interface GmcpEntry {
  version: string;
  standard: boolean;
  optional: boolean;
}

export interface MudOptions {
  gmcp_support: {
    Sound: GmcpEntry;
    Char: GmcpEntry;
    'Char.Items': GmcpEntry;
    Comm: GmcpEntry;
    Playermap: GmcpEntry;
    Files: GmcpEntry;
  };
  // Todo[myst] herausfinden, was das für eine ID ist
  id: string;
  debugflag: boolean;
  charset: string;
}
