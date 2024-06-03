import { invColor } from './inv-color';

/**
 * Converts a grayscale color (where R, G, and B are equal) to its inverse.
 *
 * This function checks if the provided hexadecimal color string is a grayscale
 * color (i.e., R, G, and B values are the same). If it is, it returns the
 * inverse color. Otherwise, it returns the original color.
 *
 * @param {string} hex - The hexadecimal color string to check and potentially invert. Must be in the format '#RRGGBB'.
 * @returns {string} - The original hexadecimal color string or its inverse if it is a grayscale color.
 * @throws {Error} - If the input is not a valid hexadecimal color string.
 *
 * @example
 * invertGrayscale('#000000'); // returns '#ffffff'
 * invertGrayscale('#ffffff'); // returns '#000000'
 * invertGrayscale('#123456'); // returns '#123456'
 * invertGrayscale('#333333'); // returns '#cccccc'
 */
export function invertGrayscale(hex: string): string {
  if (!/^#([0-9a-f]{6})$/i.test(hex)) {
    throw new Error('Invalid hexadecimal color string');
  }

  // Convert hex to integer
  const num = parseInt(hex.slice(1), 16);

  // Extract RGB components
  const r = (num & 0xff0000) >> 16;
  const g = (num & 0x00ff00) >> 8;
  const b = num & 0x0000ff;

  // Check if the color is grayscale (R, G, and B values are equal)
  return r === g && g === b ? invColor(hex) : hex;
}
