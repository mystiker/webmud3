import { toHex2 } from './to-hex2';

export function rgbToHex(rgb: string[]): string {
  return `#${rgb.map((val) => toHex2(parseInt(val))).join('')}`;
}
