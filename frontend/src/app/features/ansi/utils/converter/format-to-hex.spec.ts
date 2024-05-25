import { formatToHex } from './format-to-hex';

describe('formatToHex', () => {
  it('should convert single-digit numbers to two-digit hex strings', () => {
    expect(formatToHex(0)).toBe('00');
    expect(formatToHex(1)).toBe('01');
    expect(formatToHex(15)).toBe('0f');
  });

  it('should convert double-digit numbers to hex strings', () => {
    expect(formatToHex(16)).toBe('10');
    expect(formatToHex(255)).toBe('ff');
  });

  it('should handle edge cases', () => {
    expect(formatToHex(0)).toBe('00');
    expect(formatToHex(255)).toBe('ff');
  });
});
