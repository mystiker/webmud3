import { Ansi256Colors } from '../models/ansi256-colors';
import { FormatData } from '../types/format-data';
import { convertRgbToHex } from './colors/convert-rgb-to-hex';
import { invColor } from './colors/inv-color';
import { formatToHex } from './converter/format-to-hex';

const defaultData: FormatData = {
  bold: false,
  faint: false,
  italic: false,
  underline: false,
  blink: false,
  reverse: false,
  concealed: false,
  crossedout: false,
  fgcolor: '#ffffff',
  bgcolor: '#000000',
};

/**
 * Applies ANSI escape codes to format data.
 *
 * This function updates the format data attributes based on the provided ANSI escape codes.
 * The format gets overridden by the last applied code - order matters.
 * For example applying '1;0;2' will result in faint text only since 0 overrrides bold set by 1.
 *
 * @param {string[]} codes - The array of ANSI escape codes to apply.
 * @returns {FormatData} - The updated format data object.
 *
 * @example
 * const codes = ['1', '31', '42'];
 * const formattedData = applyAnsiAttributes(codes);
 * console.log(formattedData);
 */
export function applyAnsiAttributes(
  codes: string[],
  optionInvert: boolean = false,
): Partial<FormatData> {
  let formattedData: Partial<FormatData> = {};

  for (let index = 0; index < codes.length; index++) {
    let setcolor256fg = '';
    let setcolor256bg = '';

    const code = codes[index];

    // Apply text attributes
    switch (code) {
      case '0':
        formattedData = { ...defaultData };
        continue;
      case '1':
        formattedData.bold = true;
        break;
      case '2':
        formattedData.faint = true;
        break;
      case '3':
        formattedData.italic = true;
        break;
      case '4':
        formattedData.underline = true;
        break;
      case '5':
      case '6':
        formattedData.blink = true;
        break;
      case '7':
        formattedData.reverse = true;
        break;
      case '8':
        formattedData.concealed = true;
        break;
      case '9':
        formattedData.crossedout = true;
        break;
      case '21':
        formattedData.bold = false;
        break;
      case '22':
        formattedData.bold = formattedData.faint = false;
        break;
      case '23':
        formattedData.italic = false;
        break;
      case '24':
        formattedData.underline = false;
        break;
      case '25':
        formattedData.blink = false;
        break;
      case '27':
        formattedData.reverse = false;
        break;
      case '28':
        formattedData.concealed = false;
        break;
      case '29':
        formattedData.crossedout = false;
        break;
      // Apply 256-color foreground colors
      case '30':
        setcolor256fg = '00';
        break;
      case '31':
        setcolor256fg = '01';
        break;
      case '32':
        setcolor256fg = '02';
        break;
      case '33':
        setcolor256fg = '03';
        break;
      case '34':
        setcolor256fg = '04';
        break;
      case '35':
        setcolor256fg = '05';
        break;
      case '36':
        setcolor256fg = '06';
        break;
      case '37':
        setcolor256fg = '07';
        break;
      case '38':
        if (codes.length > index + 2 && codes[index + 1] === '5') {
          setcolor256fg = formatToHex(Number.parseInt(codes[index + 2]));
          index += 2;
        } else if (codes.length > index + 4 && codes[index + 1] === '2') {
          formattedData.fgcolor = convertRgbToHex(
            codes.slice(index + 2, index + 5) as [string, string, string],
          );
          index += 4;
        } else {
          console.error(
            'applyAnsiAttributes unknown fgcolor-ESC:',
            'ESC[' + codes.join(';'),
          );
        }
        break;
      case '39':
        formattedData.fgcolor = 'white';
        break;
      // Apply 256-color background colors
      case '40':
        setcolor256bg = '00';
        break;
      case '41':
        setcolor256bg = '01';
        break;
      case '42':
        setcolor256bg = '02';
        break;
      case '43':
        setcolor256bg = '03';
        break;
      case '44':
        setcolor256bg = '04';
        break;
      case '45':
        setcolor256bg = '05';
        break;
      case '46':
        setcolor256bg = '06';
        break;
      case '47':
        setcolor256bg = '07';
        break;
      case '48':
        if (codes.length > index + 2 && codes[index + 1] === '5') {
          setcolor256bg = formatToHex(Number.parseInt(codes[index + 2]));
          index += 2;
        } else if (codes.length > index + 4 && codes[index + 1] === '2') {
          formattedData.bgcolor = convertRgbToHex(
            codes.slice(index + 2, index + 5) as [string, string, string],
          );
          index += 4;
        } else {
          console.error(
            'applyAnsiAttributes unknown bgcolor-ESC:',
            'ESC[' + codes.join(';'),
          );
        }
        break;
      case '49':
        formattedData.bgcolor = 'black';
        break;
      // Apply high-intensity foreground colors
      case '90':
        setcolor256fg = '08';
        break;
      case '91':
        setcolor256fg = '09';
        break;
      case '92':
        setcolor256fg = '10';
        break;
      case '93':
        setcolor256fg = '11';
        break;
      case '94':
        setcolor256fg = '12';
        break;
      case '95':
        setcolor256fg = '13';
        break;
      case '96':
        setcolor256fg = '14';
        break;
      case '97':
        setcolor256fg = '15';
        break;
      // Apply high-intensity background colors
      case '100':
        setcolor256bg = '08';
        break;
      case '101':
        setcolor256bg = '09';
        break;
      case '102':
        setcolor256bg = '10';
        break;
      case '103':
        setcolor256bg = '11';
        break;
      case '104':
        setcolor256bg = '12';
        break;
      case '105':
        setcolor256bg = '13';
        break;
      case '106':
        setcolor256bg = '14';
        break;
      case '107':
        setcolor256bg = '15';
        break;
      default:
        console.error(
          'applyAnsiAttributes unknown attribute/color-ESC:',
          'ESC[' + codes.join(';'),
        );
        break;
    }

    // Apply the 256-color foreground value
    if (setcolor256fg !== '') {
      formattedData.fgcolor = formattedData.faint
        ? Ansi256Colors.faint[setcolor256fg as keyof typeof Ansi256Colors.faint]
        : Ansi256Colors.normal[
            setcolor256fg as keyof typeof Ansi256Colors.normal
          ];
    }

    // Apply the 256-color background value
    if (setcolor256bg !== '') {
      formattedData.bgcolor = formattedData.faint
        ? Ansi256Colors.faint[setcolor256bg as keyof typeof Ansi256Colors.faint]
        : Ansi256Colors.normal[
            setcolor256bg as keyof typeof Ansi256Colors.normal
          ];
    }

    // Invert the foreground color if it matches the background color
    if (
      formattedData.fgcolor === formattedData.bgcolor &&
      formattedData.fgcolor
    ) {
      formattedData.fgcolor = invColor(formattedData.fgcolor);
    }

    // Apply the invert option if set
    if (optionInvert && formattedData.fgcolor && formattedData.bgcolor) {
      formattedData.fgcolor = invColor(formattedData.fgcolor);
      formattedData.bgcolor = invColor(formattedData.bgcolor);
    }
  }

  return formattedData;
}
