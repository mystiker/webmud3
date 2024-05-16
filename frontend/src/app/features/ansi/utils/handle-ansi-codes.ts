import { ESCAPE_SEQUENCES } from '../models/escape-sequences';
import { IAnsiData } from '../types/ansi-data';
import { applyAnsiCodes } from './apply-ansi-codes';

export function handleAnsiCodes(data: IAnsiData): IAnsiData {
  let newData = { ...data };
  if (newData.ansiPos >= newData.ansi.length - 1) {
    newData.lastEscape = String.fromCharCode(27);
    return newData;
  }
  let char = newData.ansi[newData.ansiPos];
  let escape = '';
  let stop = false;
  let i = 0;
  let codes: string[] = [];

  if (char === '[') {
    do {
      newData.ansiPos += 1;
      char = newData.ansi[newData.ansiPos];
      escape += char;
      stop = ESCAPE_SEQUENCES.ENDCHAR.test(char);
    } while (
      newData.ansiPos < newData.ansi.length - 1 &&
      ESCAPE_SEQUENCES.VALID.test(char) &&
      !stop
    );
    if (!stop) {
      console.debug('handleAnsiCodes:', 'ESC[' + escape);
      newData.lastEscape = String.fromCharCode(27) + '[' + escape;
      newData.ansiPos += 1;
      return newData;
    }
    newData.ansiPos += 1;
  } else {
    switch (char) {
      case '7':
      case '8':
      case 'D':
        newData.ansiPos += 1;
        return newData;
    }
    escape += char;
    do {
      newData.ansiPos += 1;
      char = newData.ansi[newData.ansiPos];
      escape += char;
      stop = ESCAPE_SEQUENCES.ENDCHAR.test(char);
    } while (ESCAPE_SEQUENCES.VALID.test(char) && !stop);
    console.error('handleAnsiCodes missing-ESC:', 'ESC[' + escape);
    newData.ansiPos += 1;
    return newData;
  }
  return applyAnsiCodes(newData, escape, codes, i);
}
