export function invColor(s: string): string {
  let iconv = (parseInt(s.substr(1), 16) << 8) / 256;
  iconv = (iconv ^ 0x00ffffff) & 0x00ffffff;
  return (
    '#' + '000000'.slice(0, 6 - iconv.toString(16).length) + iconv.toString(16)
  );
}
