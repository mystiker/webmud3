// Todo[myst] unused function - was defined in telnet-client but not used, discuss
export function txtToBuffer(text: string): Buffer {
  const result = [];
  let i = 0;
  text = encodeURI(text);
  while (i < text.length) {
    const c = text.charCodeAt(i++);
    if (c === 37) {
      // if it is a % sign, encode the following 2 bytes as a hex value
      result.push(parseInt(text.substr(i, 2), 16));
      i += 2;
    } else {
      // otherwise, just the actual byte
      result.push(c);
    }
  }
  return Buffer.from(result);
}
