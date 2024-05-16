import { Ansi256Colors } from '../models/ansi256-colors';
import { IAnsiData } from './../types/ansi-data';
import { invColor } from './colors/inv-color';
import { rgbToHex } from './colors/rgb-to-hex';
import { toHex2 } from './colors/to-hex2';

export function setAnsiAttributes(
  data: IAnsiData,
  codes: string[],
  i: number,
): IAnsiData {
  let newData = { ...data };
  let setcolor256fg = '';
  let setcolor256bg = '';
  switch (codes[i]) {
    case '0':
      newData = resetAttributes(newData);
      break;
    case '1':
      newData.bold = true;
      break;
    case '2':
      newData.faint = true;
      break;
    case '3':
      newData.italic = true;
      break;
    case '4':
      newData.underline = true;
      break;
    case '5':
    case '6':
      newData.blink = true;
      break;
    case '7':
      newData.reverse = true;
      break;
    case '8':
      newData.concealed = true;
      break;
    case '9':
      newData.crossedout = true;
      break;
    case '21':
      newData.bold = false;
      break;
    case '22':
      newData.bold = newData.faint = false;
      break;
    case '23':
      newData.italic = false;
      break;
    case '24':
      newData.underline = false;
      break;
    case '25':
      newData.blink = false;
      break;
    case '27':
      newData.reverse = false;
      break;
    case '28':
      newData.concealed = false;
      break;
    case '29':
      newData.crossedout = false;
      break;
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
      if (codes.length > i + 2 && codes[i + 1] === '5') {
        setcolor256fg = toHex2(Number.parseInt(codes[i + 2]));
        i += 2;
      } else if (codes.length > i + 4 && codes[i + 1] === '2') {
        newData.fgcolor = rgbToHex(codes.slice(i + 2, i + 5));
        i += 4;
      } else {
        console.error(
          'setAnsiAttributes unknown fgcolor-ESC:',
          'ESC[' + escape,
        );
      }
      break;
    case '39':
      newData.fgcolor = 'white';
      break;
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
      if (codes.length > i + 2 && codes[i + 1] === '5') {
        setcolor256bg = toHex2(Number.parseInt(codes[i + 2]));
        i += 2;
      } else if (codes.length > i + 4 && codes[i + 1] === '2') {
        newData.bgcolor = rgbToHex(codes.slice(i + 2, i + 5));
        i += 4;
      } else {
        console.error(
          'setAnsiAttributes unknown bgcolor-ESC:',
          'ESC[' + escape,
        );
      }
      break;
    case '49':
      newData.bgcolor = 'black';
      break;
    case '90':
      setcolor256fg = '00';
      break;
    case '91':
      setcolor256fg = '01';
      break;
    case '92':
      setcolor256fg = '02';
      break;
    case '93':
      setcolor256fg = '03';
      break;
    case '94':
      setcolor256fg = '04';
      break;
    case '95':
      setcolor256fg = '05';
      break;
    case '96':
      setcolor256fg = '06';
      break;
    case '97':
      setcolor256fg = '07';
      break;
    case '100':
      setcolor256bg = '00';
      break;
    case '101':
      setcolor256bg = '01';
      break;
    case '102':
      setcolor256bg = '02';
      break;
    case '103':
      setcolor256bg = '03';
      break;
    case '104':
      setcolor256bg = '04';
      break;
    case '105':
      setcolor256bg = '05';
      break;
    case '106':
      setcolor256bg = '06';
      break;
    case '107':
      setcolor256bg = '07';
      break;
    default:
      console.error(
        'setAnsiAttributes unknown attribute/color-ESC:',
        'ESC[' + escape,
      );
      break;
  }

  if (setcolor256fg !== '') {
    newData.fgcolor = newData.faint
      ? Ansi256Colors.faint[setcolor256fg as keyof typeof Ansi256Colors.faint]
      : Ansi256Colors.normal[
          setcolor256fg as keyof typeof Ansi256Colors.normal
        ];
  }
  if (setcolor256bg !== '') {
    newData.bgcolor = newData.faint
      ? Ansi256Colors.faint[setcolor256bg as keyof typeof Ansi256Colors.faint]
      : Ansi256Colors.normal[
          setcolor256bg as keyof typeof Ansi256Colors.normal
        ];
  }
  if (newData.fgcolor === newData.bgcolor) {
    newData.fgcolor = invColor(newData.fgcolor);
  }
  if (newData.optionInvert) {
    newData.fgcolor = invColor(newData.fgcolor);
    newData.bgcolor = invColor(newData.bgcolor);
  }
  return newData;
}

function resetAttributes(data: IAnsiData): IAnsiData {
  return {
    ...data,
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
}
