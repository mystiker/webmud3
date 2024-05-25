export interface IEnvironment {
  readonly host: string;
  readonly port: number;

  readonly tls?: {
    cert: string;
    key: string;
  };

  readonly projectRoot: string;

  readonly charset: string;

  // backend: {
  //   host: string;
  //   port: number;
  // };
  // frontend: {
  //   host: string;
  //   port: number;
  // };
  // mudrpc: {
  //   socketfile: string;
  // };
  // webmud: {
  //   mudname: string;
  //   autoConnect: boolean;
  //   autoLogin: boolean;
  //   autoUser: string;
  //   autoToken: string;
  //   localEcho: boolean;
  // };
}
