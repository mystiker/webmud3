import { IAnsiData, processAnsiData } from '@mudlet3/frontend/features/ansi';

export function mudProcessData(data: string): Partial<IAnsiData>[] {
  // if (typeof outp !== 'undefined') {
  //   const idx = outp?.indexOf(ESCAPE_SEQUENCES.CLEAR_SCREEN);

  //   if (idx !== undefined && idx >= 0) {
  //     data.messages = [];
  //     data.mudlines = [];
  //   }
  //   data.ansiCurrent.ansi = outp;
  //   data.ansiCurrent.mudEcho = undefined;
  //   data.messages.push({ text: outp });
  // } else {
  //   data.ansiCurrent.ansi = '';
  //   data.ansiCurrent.mudEcho = iecho;
  //   data.messages.push({ text: iecho });
  // }

  // const ts = new Date();
  // data.ansiCurrent.timeString =
  //   (ts.getDate() < 10 ? '0' : '') +
  //   ts.getDate() +
  //   '.' +
  //   (ts.getMonth() + 1 < 10 ? '0' : '') +
  //   (ts.getMonth() + 1) +
  //   '.' +
  //   ts.getFullYear() +
  //   ' ' +
  //   (ts.getHours() < 10 ? '0' : '') +
  //   ts.getHours() +
  //   ':' +
  //   (ts.getMinutes() < 10 ? '0' : '') +
  //   ts.getMinutes() +
  //   ':' +
  //   (ts.getSeconds() < 10 ? '0' : '') +
  //   ts.getSeconds();

  return processAnsiData(data);

  // Todo: Hier wurden die Mudlines zusammengebaselt

  // for (let ix = 0; ix < a2harr.length; ix++) {
  //   if (a2harr[ix].text != '' || typeof a2harr[ix].mudEcho !== 'undefined') {
  //     data.mudlines = data.mudlines.concat(a2harr[ix]);
  //   }
  // }

  // data.ansiCurrent = a2harr[a2harr.length - 1];
}
