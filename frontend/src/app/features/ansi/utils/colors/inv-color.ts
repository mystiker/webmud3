/**
 * Inverts the color provided as a hexadecimal string.
 *
 * This function takes a hexadecimal color string (e.g., '#ffffff' for white)
 * and returns its inverted color. The inversion is done by bitwise negating
 * the RGB values.
 *
 * @param {string} hex - The hexadecimal color string to invert. Must be in the format '#RRGGBB' or '#RGB'.
 * @returns {string} - The inverted hexadecimal color string in the format '#RRGGBB'.
 * @throws {Error} - If the input is not a valid hexadecimal color string.
 *
 * @example
 * invColor('#000000'); // returns '#ffffff'
 * invColor('#ffffff'); // returns '#000000'
 * invColor('#123456'); // returns '#edcba9'
 */
export function invColor(hex: string): string {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
    throw new Error('Invalid hexadecimal color string');
  }

  // Expand shorthand hex code to full form (e.g., #abc to #aabbcc)
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  // Convert hex to integer
  const num = parseInt(hex.slice(1), 16);

  // Invert the RGB values
  const invertedNum = 0xffffff ^ num;

  // Convert back to hex and ensure it is padded with leading zeros if necessary
  const invertedHex = invertedNum.toString(16).padStart(6, '0');

  return `#${invertedHex}`;
}
