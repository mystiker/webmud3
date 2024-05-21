import { processAnsiCodes } from './process-ansi-codes';
import { processAnsiSequences } from './process-ansi-sequences';

// Mocking the dependencies
jest.mock('./process-ansi-codes');

describe('processAnsiSequences', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct result for a single bracketed sequence', () => {
    const sequence = '[32m';

    (processAnsiCodes as jest.Mock).mockReturnValue({ fgcolor: 'green' });

    const result = processAnsiSequences(sequence);

    expect(result).toMatchObject({
      fgcolor: 'green',
    });
    expect(processAnsiCodes).toHaveBeenCalledWith('32m');
  });

  it('should return the correct result for multiple bracketed sequences', () => {
    (processAnsiCodes as jest.Mock).mockReturnValue({
      fgcolor: 'green',
      bold: true,
      underline: true,
    });

    const part1 = processAnsiSequences('[32m');

    expect(processAnsiCodes).toHaveBeenCalledWith('32m');

    const part2 = processAnsiSequences('[1mWithText');

    expect(processAnsiCodes).toHaveBeenCalledWith('1m');

    const part3 = processAnsiSequences('[24m');

    expect(processAnsiCodes).toHaveBeenCalledWith('24m');

    const result = {
      ...part1,
      ...part2,
      ...part3,
    };

    expect(result).toMatchObject({
      fgcolor: 'green',
      bold: true,
      underline: true,
      text: 'WithText',
    });

    expect(processAnsiCodes).toHaveBeenCalledWith('1m');
  });

  it('should handle simple unformatted text', () => {
    const sequence = 'Simple Text';

    const result = processAnsiSequences(sequence);

    expect(result).toMatchObject({
      text: 'Simple Text',
    });
  });

  it('should handle complex, formatted text', () => {
    const sequence = '[23mSimple Text';

    const result = processAnsiSequences(sequence);

    expect(result).toMatchObject({
      text: 'Simple Text',
      fgcolor: 'green',
    });
  });

  it('should return null for unsupported sequences', () => {
    const sequence = '7';

    const result = processAnsiSequences(sequence);

    expect(result).toBeNull();
  });
});
