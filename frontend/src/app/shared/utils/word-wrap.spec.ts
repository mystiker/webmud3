import { wordWrap } from './word-wrap';

describe('wordWrap', () => {
  it('should wrap a string to a given number of columns', () => {
    const input = 'The quick brown fox jumps over the lazy dog';
    const cols = 10;
    const expectedOutput =
      'The quick\r\nbrown fox\r\njumps over\r\nthe lazy\r\ndog';
    expect(wordWrap(input, cols)).toBe(expectedOutput);
  });

  it('should handle words longer than the column limit', () => {
    const input = 'A veryverylongword in the sentence';
    const cols = 10;
    const expectedOutput = 'A\r\nveryverylongword\r\nin the\r\nsentence';
    expect(wordWrap(input, cols)).toBe(expectedOutput);
  });

  it('should handle empty string', () => {
    const input = '';
    const cols = 10;
    const expectedOutput = '';
    expect(wordWrap(input, cols)).toBe(expectedOutput);
  });

  it('should handle single word shorter than the column limit', () => {
    const input = 'Word';
    const cols = 10;
    const expectedOutput = 'Word';
    expect(wordWrap(input, cols)).toBe(expectedOutput);
  });

  it('should handle single word longer than the column limit', () => {
    const input = 'Supercalifragilisticexpialidocious';
    const cols = 10;
    const expectedOutput = 'Supercalifragilisticexpialidocious';
    expect(wordWrap(input, cols)).toBe(expectedOutput);
  });
});
