import { FormatData } from '../types/format-data';
import { applyAnsiAttributes } from './apply-ansi-attributes';

/**
 * Processes ANSI escape codes and applies the corresponding attributes.
 *
 * This function processes ANSI escape codes and applies the corresponding
 * attributes to the ANSI data. It returns a partial IAnsiData object or null
 * if the escape code is unsupported.
 *
 **/
export function processAnsiCodes(
  escape: string,
  optionInvert: boolean = false,
): Partial<FormatData> | null {
  switch (escape[escape.length - 1]) {
    case 'J':
    case 'H':
      // Unsupported ANSI codes for this context
      break;
    case 'A':
    case 'B':
    case 'C':
    case 'D':
    case 'K':
    case 's':
    case 'u':
    case 'r':
      // Reset code, no changes to newData needed here
      break;
    case 'm':
      const codes = escape.substring(0, escape.length - 1).split(';');

      return applyAnsiAttributes(codes, optionInvert);
  }

  return null;
}
