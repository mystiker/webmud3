import { invColor } from './inv-color';

describe('invColor', () => {
  it('should invert black to white', () => {
    expect(invColor('#000000')).toBe('#ffffff');
  });

  it('should invert white to black', () => {
    expect(invColor('#ffffff')).toBe('#000000');
  });

  it('should invert #123456 to #edcba9', () => {
    expect(invColor('#123456')).toBe('#edcba9');
  });

  it('should invert #abcdef to #543210', () => {
    expect(invColor('#abcdef')).toBe('#543210');
  });

  it('should invert #0000ff to #ffff00', () => {
    expect(invColor('#0000ff')).toBe('#ffff00');
  });

  // Additional tests for edge cases and error handling
  it('should handle short hex codes by expanding them correctly', () => {
    expect(invColor('#abc')).toBe('#554433');
  });

  it('should throw an error for invalid hex codes', () => {
    expect(() => invColor('#zzzzzz')).toThrow(
      'Invalid hexadecimal color string',
    );
  });

  it('should throw an error for input without #', () => {
    expect(() => invColor('123456')).toThrow(
      'Invalid hexadecimal color string',
    );
  });

  it('should throw an error for empty input', () => {
    expect(() => invColor('')).toThrow('Invalid hexadecimal color string');
  });
});
