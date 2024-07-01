export interface IEnvironment {
  readonly telnetHost: string;
  readonly telnetPort: number;

  readonly tls?: {
    cert: string;
    key: string;
  };

  readonly projectRoot: string;

  readonly charset: string;

  readonly socketTimeout: number;

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
