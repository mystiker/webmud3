import { IAnsiData } from '@mudlet3/frontend/features/ansi';
import { handleAnsiCodes } from './handle-ansi-codes';

export function processAnsi(data: IAnsiData): IAnsiData[] {
  const result: IAnsiData[] = [];
  let newData = { ...data, text: '' };

  if (typeof newData.mudEcho !== 'undefined' && newData.ansi === '') {
    result.push({ ...newData });
    result.push({ ...newData, mudEcho: undefined });
    return result;
  }

  if (typeof newData.lastEscape !== 'undefined') {
    console.info(
      'AnsiService:processAnsi esc-pad',
      newData.lastEscape,
      newData.ansi.substr(0, 30),
    );
    newData.ansi = newData.lastEscape + newData.ansi;
    newData.lastEscape = undefined;
  }

  console.debug('AnsiService:processAnsi', newData);
  while (newData.ansiPos < newData.ansi.length) {
    const code: number = newData.ansi.charCodeAt(newData.ansiPos);
    newData.ansiPos += 1;
    let display = true;

    if (code < 33 || code > 126) {
      switch (code) {
        case 0:
          display = false;
          break;
        case 10:
        case 13:
          break;
        case 27:
          display = false;
          if (newData.text !== '') {
            result.push({ ...newData });
            newData.text = '';
          }
          newData = handleAnsiCodes({ ...data });
          break;
        default:
          break;
      }
    }
    if (display) {
      newData.text += String.fromCharCode(code);
    }
  }

  newData.ansi = '';
  newData.ansiPos = 0;
  result.push({ ...newData });
  return result;
}
