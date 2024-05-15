import { invColor } from './inv-color';

export function blackToWhite(s: string): string {
  const iconv = (parseInt(s.substr(1), 16) << 8) / 256;
  const r = (iconv & 0xff0000) >> 16;
  const g = (iconv & 0x00ff00) >> 8;
  const b = iconv & 0x0000ff;
  return r === g && g === b ? invColor(s) : s;
}
