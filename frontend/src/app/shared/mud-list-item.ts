// Todo: Schauen, ob wir das entfernt bekommen. Der Client connected sich nicht zu Muds. Er connected sich ausschließlich zum Server.
// Todo: Löschen
export interface MudListItem {
  key: string;
  name: string;
  host: string;
  port: number;
  ssl: boolean;
  rejectUnauthorized: boolean;
  description: string;
  playerlevel: string;
  mudfamily: string;
}
