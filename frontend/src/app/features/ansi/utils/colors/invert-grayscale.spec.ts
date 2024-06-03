import { invColor } from './inv-color';
import { invertGrayscale } from './invert-grayscale';

jest.mock('./inv-color');

describe('invertGrayscale', () => {
  beforeEach(() => {
    (invColor as jest.Mock).mockClear();
  });

  it('should invert black to white', () => {
    (invColor as jest.Mock).mockImplementation(() => '#ffffff');
    expect(invertGrayscale('#000000')).toBe('#ffffff');
    expect(invColor).toHaveBeenCalledWith('#000000');
  });

  it('should invert white to black', () => {
    (invColor as jest.Mock).mockImplementation(() => '#000000');
    expect(invertGrayscale('#ffffff')).toBe('#000000');
    expect(invColor).toHaveBeenCalledWith('#ffffff');
  });

  it('should return the original color if it is not grayscale', () => {
    expect(invertGrayscale('#123456')).toBe('#123456');
    expect(invColor).not.toHaveBeenCalled();
  });

  it('should invert #333333 to #cccccc', () => {
    (invColor as jest.Mock).mockImplementation(() => '#cccccc');
    expect(invertGrayscale('#333333')).toBe('#cccccc');
    expect(invColor).toHaveBeenCalledWith('#333333');
  });

  it('should throw an error for invalid hex codes', () => {
    expect(() => invertGrayscale('#zzzzzz')).toThrow(
      'Invalid hexadecimal color string',
    );
  });

  it('should throw an error for short hex codes', () => {
    expect(() => invertGrayscale('#abc')).toThrow(
      'Invalid hexadecimal color string',
    );
  });

  it('should throw an error for input without #', () => {
    expect(() => invertGrayscale('123456')).toThrow(
      'Invalid hexadecimal color string',
    );
  });

  it('should throw an error for empty input', () => {
    expect(() => invertGrayscale('')).toThrow(
      'Invalid hexadecimal color string',
    );
  });
});
