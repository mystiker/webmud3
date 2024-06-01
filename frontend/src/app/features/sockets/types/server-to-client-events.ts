export interface ServerToClientEvents {
  mudOutput: (data: string) => void;
  mudDisconnected: () => void;
  mudConnected: () => void;
}
