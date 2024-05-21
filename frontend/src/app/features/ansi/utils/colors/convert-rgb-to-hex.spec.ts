import { convertRgbToHex } from './convert-rgb-to-hex';

describe('convertRgbToHex', () => {
  it('should convert RGB array to hex string', () => {
    expect(convertRgbToHex(['255', '0', '0'])).toBe('#ff0000');
    expect(convertRgbToHex(['0', '255', '0'])).toBe('#00ff00');
    expect(convertRgbToHex(['0', '0', '255'])).toBe('#0000ff');
  });

  it('should handle invalid RGB arrays', () => {
    expect(() =>
      convertRgbToHex(['255', '0'] as unknown as [string, string, string]),
    ).toThrow('Invalid RGB array');
    expect(() => convertRgbToHex(['255', '0', '256'])).toThrow(
      'Invalid RGB array',
    );
    expect(() => convertRgbToHex(['255', '0', '-1'])).toThrow(
      'Invalid RGB array',
    );
    expect(() => convertRgbToHex(['255', '0', 'abc'])).toThrow(
      'Invalid RGB array',
    );
  });

  it('should handle edge cases', () => {
    expect(convertRgbToHex(['0', '0', '0'])).toBe('#000000');
    expect(convertRgbToHex(['255', '255', '255'])).toBe('#ffffff');
  });
});
