import { IAnsiData } from '../types/ansi-data';
import { setAnsiAttributes } from './set-ansi-attributes';

export function applyAnsiCodes(
  data: IAnsiData,
  escape: string,
  codes: string[],
  i: number,
): IAnsiData {
  let newData = { ...data };
  switch (escape[escape.length - 1]) {
    case 'J':
    case 'H':
      break;
    case 'A':
    case 'B':
    case 'C':
    case 'D':
    case 'K':
    case 's':
    case 'u':
    default:
      console.error('applyAnsiCodes unsupported-ESC:', 'ESC[' + escape);
      break;
    case 'r':
      break;
    case 'm':
      codes = escape.substring(0, escape.length - 1).split(';');
      for (i = 0; i < codes.length; i++) {
        newData = setAnsiAttributes(newData, codes, i);
      }
      break;
  }
  return newData;
}
