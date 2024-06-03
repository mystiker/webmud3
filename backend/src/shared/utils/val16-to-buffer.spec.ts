import { val16ToBuffer } from './val16-to-buffer';

describe('val16ToBuffer', () => {
  it('should convert a number to two bytes and add to the array', () => {
    const result: number[] = [];

    const output = val16ToBuffer(result, 0x1234);

    expect(output).toEqual([0x12, 0x34]);
  });

  it('should handle zero correctly', () => {
    const result: number[] = [];

    const output = val16ToBuffer(result, 0);

    expect(output).toEqual([0, 0]);
  });

  it('should handle a single byte value correctly', () => {
    const result: number[] = [];

    const output = val16ToBuffer(result, 0x00ff);

    expect(output).toEqual([0, 255]);
  });
});
