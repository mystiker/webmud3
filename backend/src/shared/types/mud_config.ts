export interface GMCPFeatures {
  Sound?: GMCPFeature;
  Char?: GMCPFeature;
  'Char.Items'?: GMCPFeature;
  Comm?: GMCPFeature;
  Playermap?: GMCPFeature;
  Files?: GMCPFeature;
}

export interface GMCPFeature {
  version: string;
  standard: boolean;
  optional: boolean;
}

export interface MudFamily {
  charset: string;
  MXP: boolean;
  GMCP: boolean;
  GMCP_Support: GMCPFeatures;
}

export interface MudDetails {
  name: string;
  host: string;
  port: number;
  ssl: boolean;
  rejectUnauthorized: boolean;
  description: string;
  playerlevel: string;
  mudfamily: string;
}

export interface MudConfig {
  scope: string;
  href: string;
  mudfamilies: { [key: string]: MudFamily };
  muds: { [key: string]: MudDetails };
  routes: { [key: string]: string };
}
