export type EnvironmentKeys =
  | 'HOST'
  | 'PORT'
  | 'TELNET_HOST'
  | 'TELNET_PORT'
  | 'SOCKET_TIMEOUT' // in milliseconds | default: 900000 (15 min) | determines how long messages are buffed for the disconnected frontend and when the telnet connection is closed
  | 'TLS'
  | 'TLS_CERT'
  | 'TLS_KEY'
  | 'CHARSET';
