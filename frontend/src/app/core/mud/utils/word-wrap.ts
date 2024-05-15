export function wordWrap(str: string, cols: number): string {
  let formatedString = '',
    fstr = '',
    wordsArray = [];
  wordsArray = str.split(' ');
  fstr = wordsArray[0];
  for (let i = 1; i < wordsArray.length; i++) {
    if (wordsArray[i].length > cols) {
      formatedString += fstr + '\r\n';
      fstr = wordsArray[i];
    } else {
      if (fstr.length + wordsArray[i].length > cols) {
        formatedString += fstr + '\r\n';
        fstr = wordsArray[i];
      } else {
        fstr += ' ' + wordsArray[i];
      }
    }
  }
  formatedString += fstr + '\r\n';
  return formatedString;
}
