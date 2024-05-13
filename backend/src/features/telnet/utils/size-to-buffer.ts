import { val16ToBuffer } from './val16-to-buffer.js';

//Todo[myst] dafuq?
export function sizeToBuffer(w: number, h: number): Buffer {
  let result = [];
  result = val16ToBuffer(result, w);
  result = val16ToBuffer(result, h);
  return Buffer.from(result);
}
