import { val16ToBuffer } from './val16-to-buffer.js';

/**
 * Converts two numeric width and height values into a Buffer encoding their values in 16-bit.
 * @param {number} w - The width value to encode.
 * @param {number} h - The height value to encode.
 * @returns {Buffer} A Buffer object containing the 16-bit encoded width and height.
 */
export function sizeToBuffer(w: number, h: number): Buffer {
  // Initialize an array to hold the encoded values.
  let result: number[] = [];

  // Encode the width and append it to the result array.
  result = val16ToBuffer(result, w);

  // Encode the height and append it to the result array.
  result = val16ToBuffer(result, h);

  // Convert the array of numbers into a Buffer and return it.
  return Buffer.from(result);
}
