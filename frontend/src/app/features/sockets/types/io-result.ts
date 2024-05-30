import { MudListItem, MudSignals } from '@mudlet3/frontend/shared';

export interface IoResult {
  IdType: string;
  Id: string | null;
  MsgType: string | null;
  ErrorType: string | null;
  Data: unknown;
  musi?: MudSignals;
  mudlist?: MudListItem[];
}
