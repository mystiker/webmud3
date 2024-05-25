export function tableOutput(words: string[], screen: number): string {
  let width = 1;
  words.forEach((word) => {
    if (word.length > width) {
      width = word.length;
    }
  });
  width++;
  const cols = Math.max(1, Math.floor((screen + 1) / (width + 1)));
  const lines = Math.floor((words.length + cols - 1) / cols);
  width = Math.max(width + 1, Math.floor((screen + 1) / cols));
  const r: string[] = [];
  for (let line = 0; line < lines; line++) {
    let s = '';
    const colMin = Math.min(
      cols,
      Math.floor((words.length - line + lines - 1) / lines),
    );
    for (let col = 0; col < colMin; col++) {
      const word = words[line + col * lines];
      const len = width - word.length;
      s += word + ' '.repeat(len);
    }
    r.push(s);
  }
  return '\r\n' + r.join('\r\n');
}
