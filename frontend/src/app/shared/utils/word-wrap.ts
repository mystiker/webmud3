/**
 * Wraps a string to a given number of columns.
 *
 * @param {string} str - The string to be wrapped.
 * @param {number} cols - The maximum number of columns per line.
 * @returns {string} - The wrapped string.
 */
export function wordWrap(str: string, cols: number): string {
  let formattedString = '';
  let currentLine = '';

  // Split the input string into words
  const wordsArray = str.split(' ');

  // Iterate over each word
  for (let i = 0; i < wordsArray.length; i++) {
    const word = wordsArray[i];

    // If the word itself is longer than the column limit
    if (word.length > cols) {
      // If the current line is not empty, add it to the formatted string
      if (currentLine.length > 0) {
        formattedString += currentLine + '\r\n';
        currentLine = '';
      }
      // Add the long word to the formatted string directly
      formattedString += word + '\r\n';
    } else {
      // If adding the word exceeds the column limit
      if (
        currentLine.length + word.length + (currentLine.length > 0 ? 1 : 0) >
        cols
      ) {
        formattedString += currentLine + '\r\n';
        currentLine = word;
      } else {
        // Add the word to the current line
        currentLine += (currentLine.length > 0 ? ' ' : '') + word;
      }
    }
  }

  // Add any remaining text in the current line to the formatted string
  if (currentLine.length > 0) {
    formattedString += currentLine;
  }

  // Remove any trailing newline characters
  if (formattedString.endsWith('\r\n')) {
    formattedString = formattedString.slice(0, -2);
  }

  return formattedString;
}
