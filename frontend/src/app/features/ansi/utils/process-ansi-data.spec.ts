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
});
