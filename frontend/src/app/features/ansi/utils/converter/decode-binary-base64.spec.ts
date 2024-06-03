import { decodeBinaryBase64 } from './decode-binary-base64';

describe('decodeBinaryBase64', () => {
  it('should decode a Base64-encoded binary string to its original UTF-16 string', () => {
    expect(decodeBinaryBase64('aABlAGwAbABvACAAdwBvAHIAbABkAA==')).toBe(
      'hello world',
    );
    expect(
      decodeBinaryBase64('UwBvAG0AZQAgAG8AdABoAGUAcgAgAHMAdAByAGkAbgBnAA=='),
    ).toBe('Some other string');
  });

  it('should handle empty strings', () => {
    expect(decodeBinaryBase64('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(decodeBinaryBase64('ACYP/jzYCN8=')).toBe('☀️🌈');
  });
});
