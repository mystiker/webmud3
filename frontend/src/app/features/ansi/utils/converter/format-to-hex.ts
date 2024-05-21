/**
 * Converts a number to a two-digit hexadecimal string.
 *
 * This function takes a number and converts it to a hexadecimal string. If the
 * resulting string has less than two characters, it pads the string with a
 * leading zero.
 *
 * @param {number} val - The number to convert to a two-digit hexadecimal string.
 * @returns {string} - The two-digit hexadecimal string.
 *
 * @example
 * formatToHex(5);  // returns '05'
 * formatToHex(255); // returns 'ff'
 */
export function formatToHex(val: number): string {
  const result = val.toString(16);
  return result.length < 2 ? '0' + result : result;
}
