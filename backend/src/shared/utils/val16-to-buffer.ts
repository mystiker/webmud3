export function val16ToBuffer(result: number[], val: number): number[] {
  result.push((val & 0xff00) >> 8);

  result.push(val & 0xff);

  return result;
}
