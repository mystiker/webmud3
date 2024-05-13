export function val16ToBuffer(result: unknown[], val: number): unknown[] {
  result.push((val & 0xff00) >> 8);
  result.push(val & 0xff);
  return result;
}
