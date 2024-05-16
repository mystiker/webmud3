// Todo: Das hat nichts in dieser Util Funktion zu suchen
import { IoMud, SocketsService } from '@mudlet3/frontend/features/sockets';

import { IAnsiData } from '@mudlet3/frontend/features/ansi';
import { KeypadData } from '@mudlet3/frontend/shared';
// Todo: Wahrscheinlich ist das auch eher shared

import { localEcho } from './local-echo';

export function onKeyDown(
  event: KeyboardEvent,
  v: any,
  keySetters: KeypadData,
  mudc_id: string | undefined,
  inpmessage: string | undefined,
  other: any,
  socketsService: SocketsService,
  sendMessage: () => void,
) {
  if (v.inpType != 'text') return;
  let modifiers = '';
  if (event.shiftKey) {
    modifiers += 'Shift';
  }
  if (event.ctrlKey) {
    modifiers += 'Ctrl';
  }
  if (event.altKey) {
    modifiers += 'Alt';
  }
  if (event.metaKey) {
    modifiers += 'Meta';
  }
  if (modifiers == 'CtrlAlt') return;
  if (modifiers == '' && event.key == 'Enter') {
    event.returnValue = false;
    event.preventDefault();
    sendMessage();
    return;
  }
  if (typeof keySetters === 'undefined') {
    console.log('keydown-1', modifiers, event.code);
    return;
  }
  if (event.code.startsWith('Numpad') || event.code.startsWith('F')) {
    modifiers += '|' + event.code;
    const inp = keySetters.getCompoundKey(modifiers);
    if (typeof inp !== 'undefined') {
      if (inp !== '') {
        if (mudc_id !== undefined) {
          socketsService.mudSendData(mudc_id, inp);
        }
        // Todo[myst]: THis got called with 4 parameters but only 3 are defined?
        // localEcho(other, inpmessage, other.ansiService, other.mudlines);
        localEcho(other, inp, other.ansiService); // TODO abschaltbar
      }
      event.returnValue = false;
      event.preventDefault();
      return;
    } else {
      console.log('keydown-2', modifiers, event.code);
    }
  }
}

export function onKeyUp(
  event: KeyboardEvent,
  v: any,
  inpHistory: string[],
  inpPointer: number,
  inpmessage: string | undefined,
  mudlines: IAnsiData[],
  ioMud: IoMud | undefined,
  socketsService: SocketsService,
) {
  let a2h: IAnsiData;
  if (v.inpType != 'text') return;
  switch (event.key) {
    case 'ArrowUp':
      if (inpHistory.length < inpPointer) {
        return; // at the end.....
      }
      if (inpPointer < 0) {
        if (inpmessage == '') {
          if (inpHistory.length > 0) {
            inpPointer = 0;
            inpmessage = inpHistory[0];
            return;
          } else {
            return;
          }
        } else {
          if (inpHistory.length > 0 && inpmessage == inpHistory[0]) {
            return;
          }

          if (inpmessage !== undefined) {
            inpHistory.unshift(inpmessage);
          }

          if (inpHistory.length > 1) {
            inpPointer = 1;
            inpmessage = inpHistory[1];
            return;
          } else {
            inpPointer = 0;
            return;
          }
        }
      } else {
        inpPointer++;
        if (inpHistory.length < inpPointer) {
          return; // at the end...
        }
        inpmessage = inpHistory[inpPointer];
      }
      return;
    case 'ArrowDown':
      if (inpPointer < 0) {
        return; // at the beginning
      }
      inpPointer--;
      if (inpPointer < 0) {
        inpmessage = '';
        return; // at the beginning
      }
      inpmessage = inpHistory[inpPointer];
      return;
    case 'ArrowLeft':
      return;
    case 'ArrowRight':
    case 'Shift':
    case 'Ctrl':
    case 'Alt':
    case 'AltGraph':
    case 'Meta':
      return; // no change to the pointer...
    case 'Enter':
      inpPointer = -1;
      a2h = Object.assign({}, mudlines[mudlines.length - 1]);
      a2h.text = '\r\n';
      mudlines.push(a2h);
      return;
    case 'Tab':
      if (ioMud !== undefined) {
        socketsService.sendGMCP(ioMud.MudId, 'Input', 'Complete', inpmessage);
      }
      return;
    default:
      inpPointer = -1;
      return;
  }
}
