import { val16ToBuffer } from './val16-to-buffer.js';

export function sizeToBuffer(w: number, h: number): Buffer {
  let result: number[] = [];
  result = val16ToBuffer(result, w);
  result = val16ToBuffer(result, h);
  return Buffer.from(result);
}
