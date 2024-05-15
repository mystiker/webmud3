import { SocketsService } from '@mudlet3/frontend/features/sockets';
import { localEcho } from './local-echo';

export function sendMessage(
  inpmessage: string | undefined,
  mudc_id: string | undefined,
  v: any,
  inpHistory: string[],
  other: any,
  socketsService: SocketsService,
) {
  if (inpmessage === undefined) {
    throw new Error('inpmessage is undefined');
  }

  if (mudc_id !== undefined) {
    socketsService.mudSendData(mudc_id, inpmessage);
  }

  if (v.inpType == 'text' && inpmessage != '') {
    localEcho(other, inpmessage, other.ansiService, other.mudlines);
    if (
      inpHistory.length == 0 ||
      (inpHistory.length > 0 && inpHistory[0] != inpmessage)
    ) {
      inpHistory.unshift(inpmessage);
    }
  }

  other.inpmessage = '';
}
