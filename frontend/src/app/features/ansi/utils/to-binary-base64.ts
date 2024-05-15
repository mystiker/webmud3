export function toBinaryBase64(u: string): string {
  const codeUnits = new Uint16Array(u.length);
  for (let i = 0; i < codeUnits.length; i++) {
    codeUnits[i] = u.charCodeAt(i);
  }
  const charCodes = new Uint8Array(codeUnits.buffer);
  let result = '';
  for (let i = 0; i < charCodes.byteLength; i++) {
    result += String.fromCharCode(charCodes[i]);
  }
  result = btoa(result);
  console.log('toBinaryBase64', result);
  return result;
}
