import { AnsiData } from '../ansi-data';
import { AnsiService } from '../ansi.service';
import { wordWrap } from './word-wrap';

export function localEcho(
  other: any,
  inp: string,
  ansiService: AnsiService,
  mudlines: AnsiData[],
) {
  other.ansiCurrent.ansi = '';
  other.ansiCurrent.mudEcho = wordWrap(inp, 75);
  const ts = new Date();
  other.ansiCurrent.timeString =
    (ts.getDate() < 10 ? '0' : '') +
    ts.getDate() +
    '.' +
    (ts.getMonth() + 1 < 10 ? '0' : '') +
    (ts.getMonth() + 1) +
    '.' +
    ts.getFullYear() +
    ' ' +
    (ts.getHours() < 10 ? '0' : '') +
    ts.getHours() +
    ':' +
    (ts.getMinutes() < 10 ? '0' : '') +
    ts.getMinutes() +
    ':' +
    (ts.getSeconds() < 10 ? '0' : '') +
    ts.getSeconds();
  const a2harr = ansiService.processAnsi(other.ansiCurrent);
  for (let ix = 0; ix < a2harr.length; ix++) {
    if (a2harr[ix].text != '' || typeof a2harr[ix].mudEcho !== 'undefined') {
      mudlines = mudlines.concat(a2harr[ix]);
    }
  }
  other.ansiCurrent = a2harr[a2harr.length - 1];
}
