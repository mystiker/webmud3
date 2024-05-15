// Todo:[myst]: Fix import to interface
import { AnsiData } from '../../ansi-data';
import { blackToWhite } from './black-to-white';
import { invColor } from './inv-color';

export function extractColors(
  a2h: AnsiData,
  colors: string[],
  bow: boolean,
  invert: boolean,
  colorOff: boolean,
): string[] {
  const result = ['#000000', '#ffffff'];
  let lfg: string;
  let lbg: string;
  if (colorOff) {
    if (bow || invert) {
      result[0] = '#000000';
      result[1] = '#ffffff';
    } else {
      result[0] = '#ffffff';
      result[1] = '#000000';
    }
    return result;
  } else if (typeof colors !== 'undefined' && colors.length === 2) {
    lfg = colors[0];
    lbg = colors[1];
  } else if (typeof a2h === 'undefined') {
    if (bow || invert) {
      result[0] = '#000000';
      result[1] = '#ffffff';
    } else {
      result[0] = '#ffffff';
      result[1] = '#000000';
    }
    return result;
  } else {
    if (a2h.reverse) {
      lfg = a2h.bgcolor;
      lbg = a2h.fgcolor;
    } else {
      lfg = a2h.fgcolor;
      lbg = a2h.bgcolor;
    }
  }
  if (invert) {
    lfg = invColor(lfg);
    lbg = invColor(lbg);
  }
  if (!bow) {
    result[0] = lfg;
    result[1] = lbg;
  } else {
    result[0] = blackToWhite(lfg);
    result[1] = blackToWhite(lbg);
  }
  return result;
}
