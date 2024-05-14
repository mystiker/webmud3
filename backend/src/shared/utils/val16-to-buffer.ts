/**
 * Appends the 16-bit representation of a number to an existing array of numbers.
 * Each number is split into two 8-bit values.
 * @param {number[]} result - The array to which the 16-bit values will be appended.
 * @param {number} val - The value to be converted into 16-bit and added to the array.
 * @returns {number[]} The updated array with the new 16-bit values appended.
 */
export function val16ToBuffer(result: number[], val: number): number[] {
  // Push the high byte of the value into the result array.
  result.push((val & 0xff00) >> 8);

  // Push the low byte of the value into the result array.
  result.push(val & 0xff);

  // Return the modified array containing the new bytes.
  return result;
}
