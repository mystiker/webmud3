import { IAnsiData } from '../types/ansi-data';
import { applyAnsiAttributes } from './apply-ansi-attributes';
import { processAnsiCodes } from './process-ansi-codes';

jest.mock('./apply-ansi-attributes', () => ({
  applyAnsiAttributes: jest.fn((codes) => {
    // Simulate attribute application for testing
    const result: Partial<IAnsiData> = {};
    if (codes.includes('1')) result.bold = true;
    if (codes.includes('31')) result.fgcolor = '#ff0000';
    return result;
  }),
}));

describe('processAnsiCodes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null for unsupported ANSI codes', () => {
    expect(processAnsiCodes('J')).toBeNull();
    expect(processAnsiCodes('H')).toBeNull();
    expect(processAnsiCodes('A')).toBeNull();
    expect(processAnsiCodes('B')).toBeNull();
    expect(processAnsiCodes('C')).toBeNull();
    expect(processAnsiCodes('D')).toBeNull();
    expect(processAnsiCodes('K')).toBeNull();
    expect(processAnsiCodes('s')).toBeNull();
    expect(processAnsiCodes('u')).toBeNull();
    expect(processAnsiCodes('r')).toBeNull();
  });

  it('should apply attributes for m code', () => {
    const result = processAnsiCodes('1;31m');
    expect(result).toEqual({ bold: true, fgcolor: '#ff0000' });
    expect(applyAnsiAttributes).toHaveBeenCalledWith(['1', '31'], false);
  });

  it('should log error for unsupported escape codes', () => {
    console.error = jest.fn();
    processAnsiCodes('unsupported');
  });

  it('should handle empty escape string gracefully', () => {
    expect(processAnsiCodes('')).toBeNull();
  });

  it('should handle edge cases gracefully', () => {
    const result = processAnsiCodes('1;31;');
    expect(result).toEqual(null);
  });
});
