export function toHex2(val: number): string {
  const result = val.toString(16);
  return result.length < 2 ? '0' + result : result;
}
