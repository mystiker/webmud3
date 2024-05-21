/**
 * Encodes a UTF-16 string to a Base64-encoded binary string representation.
 *
 * This function takes a UTF-16 string and encodes it to a Base64-encoded binary string.
 *
 * @param {string} str - The UTF-16 string to encode.
 * @returns {string} - The Base64-encoded binary string.
 *
 * @example
 * encodeBinaryBase64('Hello world'); // returns 'SGVsbG8gd29ybGQ='
 */
export function encodeBinaryBase64(str: string): string {
  let binary = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    binary += String.fromCharCode(code & 0xff, code >> 8);
  }
  return btoa(binary);
}
