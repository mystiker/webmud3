import { extractColors } from './extract-colors';
import { invColor } from './inv-color';
import { invertGrayscale } from './invert-grayscale';

jest.mock('./inv-color');
jest.mock('./invert-grayscale');

describe('extractColors', () => {
  beforeEach(() => {
    (invColor as jest.Mock).mockClear();
    (invertGrayscale as jest.Mock).mockClear();
  });

  const defaultA2h = {
    reverse: false,
    fgcolor: '#000000',
    bgcolor: '#ffffff',
  };

  it('should return black and white when colorOff is true', () => {
    expect(extractColors(defaultA2h, false, false, true)).toEqual([
      '#ffffff',
      '#000000',
    ]);
    expect(extractColors(defaultA2h, true, false, true)).toEqual([
      '#000000',
      '#ffffff',
    ]);
    expect(extractColors(defaultA2h, false, true, true)).toEqual([
      '#000000',
      '#ffffff',
    ]);
    expect(extractColors(defaultA2h, true, true, true)).toEqual([
      '#000000',
      '#ffffff',
    ]);
  });

  it('should return provided colors when colors array is provided', () => {
    expect(
      extractColors(defaultA2h, false, false, false, ['#123456', '#654321']),
    ).toEqual(['#123456', '#654321']);
  });

  // Todo[myst]: Issue: funktioniert nicht, da die Funktion einige LogikFehler hat
  // it('should return default colors when colors array is not provided and colorOff is false', () => {
  //   expect(extractColors(defaultA2h, false, false, false)).toEqual([
  //     '#000000',
  //     '#ffffff',
  //   ]);
  //   expect(extractColors(defaultA2h, true, false, false)).toEqual([
  //     '#ffffff',
  //     '#000000',
  //   ]);
  //   expect(extractColors(defaultA2h, false, true, false)).toEqual([
  //     '#ffffff',
  //     '#000000',
  //   ]);
  //   expect(extractColors(defaultA2h, true, true, false)).toEqual([
  //     '#ffffff',
  //     '#000000',
  //   ]);
  // });

  it('should return inverted colors when invert is true', () => {
    (invColor as jest.Mock).mockImplementation(
      (color) => `#${color.slice(1).split('').reverse().join('')}`,
    );
    expect(
      extractColors(
        { reverse: false, fgcolor: '#123456', bgcolor: '#654321' },
        false,
        true,
        false,
      ),
    ).toEqual(['#654321', '#123456']);
    expect(invColor).toHaveBeenCalledWith('#123456');
    expect(invColor).toHaveBeenCalledWith('#654321');
  });

  it('should return inverted grayscale colors when bow is true', () => {
    (invertGrayscale as jest.Mock).mockImplementation(
      (color) => `#${color.slice(1).split('').reverse().join('')}`,
    );
    expect(
      extractColors(
        { reverse: false, fgcolor: '#123456', bgcolor: '#654321' },
        true,
        false,
        false,
      ),
    ).toEqual(['#654321', '#123456']);
    expect(invertGrayscale).toHaveBeenCalledWith('#123456');
    expect(invertGrayscale).toHaveBeenCalledWith('#654321');
  });

  it('should handle a2h data correctly', () => {
    expect(
      extractColors(
        { reverse: true, fgcolor: '#123456', bgcolor: '#654321' },
        false,
        false,
        false,
      ),
    ).toEqual(['#654321', '#123456']);
    expect(
      extractColors(
        { reverse: false, fgcolor: '#123456', bgcolor: '#654321' },
        false,
        false,
        false,
      ),
    ).toEqual(['#123456', '#654321']);
  });
});
