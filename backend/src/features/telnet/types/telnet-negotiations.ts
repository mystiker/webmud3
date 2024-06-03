// Todo[myst]: type 'option' to specific keys
export interface TelnetNegotiations {
  [option: string]: {
    server: 'do' | 'dont' | 'will' | 'wont';
    client: 'do' | 'dont' | 'will' | 'wont';
  };
}
