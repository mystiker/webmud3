import { DefaultFormattingData } from '../models/default-formatting-data';
import { IAnsiData } from '../types/ansi-data';
import { processAnsiData } from './process-ansi-data';

describe('processAnsiData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should work', () => {
    // zlpc return VT_FG_RED VT_BOLD "Hi" VT_NORM "\n"
    const input = '\x1b[31m\x1b[1mHi\x1b[0m\n';

    const result = processAnsiData(input);

    const expected: Partial<IAnsiData>[] = [
      {
        text: 'Hi',
        fgcolor: '#cd0000',
        bold: true,
      },
      // Command 0 resets everthing to default
      {
        ...DefaultFormattingData,
        text: '\n',
      },
    ];

    expect(result).toEqual(expected);
  });

  it('should work with multiple lines', () => {
    const input = '\u001b[37m\u001b[31m\u001b[1mHi\u001b[0m\u001b[0m\r\n';

    const result = processAnsiData(input);

    const expected: Partial<IAnsiData>[] = [
      {
        text: 'Hi',
        fgcolor: '#cd0000',
        bold: true,
      },
      // Command 0 resets everthing to default
      {
        ...DefaultFormattingData,
        text: '\r\n',
      },
    ];

    expect(result).toEqual(expected);
  });

  it('should work with simple strings', () => {
    const input = 'Der verwirrte Felag sagt: hallo?\r\n';

    const result = processAnsiData(input);

    const expected: Partial<IAnsiData>[] = [
      {
        text: 'Der verwirrte Felag sagt: hallo?\r\n',
      },
    ];

    expect(result).toEqual(expected);
  });
});
