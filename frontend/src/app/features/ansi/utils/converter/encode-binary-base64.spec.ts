import { encodeBinaryBase64 } from './encode-binary-base64';

describe('encodeBinaryBase64', () => {
  it('should encode a UTF-16 string to a Base64-encoded binary string', () => {
    expect(encodeBinaryBase64('hello world')).toBe(
      'aABlAGwAbABvACAAdwBvAHIAbABkAA==',
    );
    expect(encodeBinaryBase64('Some other string')).toBe(
      'UwBvAG0AZQAgAG8AdABoAGUAcgAgAHMAdAByAGkAbgBnAA==',
    );
  });

  it('should handle empty strings', () => {
    expect(encodeBinaryBase64('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(encodeBinaryBase64('☀️🌈')).toBe('ACYP/jzYCN8=');
  });
});
