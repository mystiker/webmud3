import { FormatData } from '../types/format-data';

export const DefaultFormatData: FormatData = {
  fgcolor: '#ffffff',
  bgcolor: '#000000',
  bold: false,
  faint: false,
  blink: false,
  italic: false,
  underline: false,
  reverse: false,
  concealed: false,
  crossedout: false,
} as const;
