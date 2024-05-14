export interface TelnetState {
  [option: string]: {
    server: 'do' | 'dont' | 'will' | 'wont';
    client: 'do' | 'dont' | 'will' | 'wont';
  };
}
