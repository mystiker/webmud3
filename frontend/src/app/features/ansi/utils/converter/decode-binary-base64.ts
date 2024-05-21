/**
 * Decodes a Base64-encoded binary string to its original UTF-16 string representation.
 *
 * This function takes a Base64-encoded binary string and decodes it to its original
 * UTF-16 string representation.
 *
 * @param {string} encoded - The Base64-encoded binary string to decode.
 * @returns {string} - The decoded UTF-16 string.
 *
 * @example
 * decodeBinaryBase64('SGVsbG8gd29ybGQ='); // returns 'Hello world'
 */
export function decodeBinaryBase64(encoded: string): string {
  const binary = atob(encoded);
  let result = '';
  for (let i = 0; i < binary.length; i += 2) {
    const code = binary.charCodeAt(i) | (binary.charCodeAt(i + 1) << 8);
    result += String.fromCharCode(code);
  }
  return result;
}
