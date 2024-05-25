import { formatToHex } from '../converter/format-to-hex';

/**
 * Converts an array of RGB values to a hexadecimal color string.
 *
 * This function takes an array of three RGB values (as strings) and converts them
 * to a single hexadecimal color string.
 *
 * @param {[string, string, string]} rgb - An array of three strings representing RGB values.
 * @returns {string} - The hexadecimal color string.
 *
 * @throws {Error} - If the input array does not contain exactly three values or if the values are not valid numbers.
 *
 * @example
 * convertRgbToHex(['255', '0', '0']); // returns '#ff0000'
 * convertRgbToHex(['0', '255', '0']); // returns '#00ff00'
 */
export function convertRgbToHex(rgb: [string, string, string]): string {
  if (
    rgb.length !== 3 ||
    !rgb.every(
      (val) =>
        !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 255,
    )
  ) {
    throw new Error('Invalid RGB array');
  }

  const hexString = rgb.map((val) => formatToHex(parseInt(val))).join('');

  return `#${hexString}`;
}
