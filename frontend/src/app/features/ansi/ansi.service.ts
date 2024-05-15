import { Injectable } from '@angular/core';
import { AnsiData } from './ansi-data';
import { Ansi256Colors } from './models/ansi256-colors';

import { ESCAPE_SEQUENCES } from './models/escape-sequences';
import { blackToWhite } from './utils/colors/black-to-white';
import { extractColors } from './utils/colors/extract-color';
import { invColor } from './utils/colors/inv-color';
import { rgbToHex } from './utils/colors/rgb-to-hex';
import { toHex2 } from './utils/colors/to-hex2';
import { fromBinaryBase64 } from './utils/from-binary-base64';
import { toBinaryBase64 } from './utils/to-binary-base64';

@Injectable({
  providedIn: 'root',
})
export class AnsiService {
  public ESC_CLRSCR = ESCAPE_SEQUENCES.CLEAR_SCREEN;
  public ESC_m_FG256 = ESCAPE_SEQUENCES.FG256;
  public ESC_m_BG256 = ESCAPE_SEQUENCES.BG256;
  public ESC_m_FG_RGB = ESCAPE_SEQUENCES.FG_RGB;
  public ESC_m_BG_RGB = ESCAPE_SEQUENCES.BG_RGB;
  public ESC_VALID = ESCAPE_SEQUENCES.VALID;
  public ESC_ENDCHAR = ESCAPE_SEQUENCES.ENDCHAR;

  public toBinaryBase64(u: string): string {
    return toBinaryBase64(u);
  }

  public fromBinaryBase64(encoded: string): string {
    return fromBinaryBase64(encoded);
  }

  public invColor(s: string): string {
    return invColor(s);
  }

  public blackToWhite(s: string): string {
    return blackToWhite(s);
  }

  public extractColors(
    a2h: AnsiData,
    colors: string[],
    bow: boolean,
    invert: boolean,
    colorOff: boolean,
  ): string[] {
    return extractColors(a2h, colors, bow, invert, colorOff);
  }

  public ansiCode(data: AnsiData): AnsiData {
    // Refaktorisierte Logik zur Verarbeitung von ANSI-Codes
    return this.handleAnsiCodes(data);
  }

  public processAnsi(data: AnsiData): AnsiData[] {
    const result: AnsiData[] = [];
    data = { ...data, text: '' };

    if (typeof data.mudEcho !== 'undefined' && data.ansi === '') {
      result.push({ ...data });
      result.push({ ...data, mudEcho: undefined });
      return result;
    }

    if (typeof data.lastEscape !== 'undefined') {
      console.info(
        'AnsiService:processAnsi esc-pad',
        data.lastEscape,
        data.ansi.substr(0, 30),
      );
      data.ansi = data.lastEscape + data.ansi;
      data.lastEscape = undefined;
    }

    console.debug('AnsiService:processAnsi', data);
    while (data.ansiPos < data.ansi.length) {
      const code: number = data.ansi.charCodeAt(data.ansiPos);
      data.ansiPos += 1;
      let display = true;

      if (code < 33 || code > 126) {
        switch (code) {
          case 0:
            display = false;
            break;
          case 10:
          case 13:
            break;
          case 27:
            display = false;
            if (data.text !== '') {
              result.push({ ...data });
              data.text = '';
            }
            data = this.ansiCode(data);
            break;
          default:
            break;
        }
      }
      if (display) {
        data.text += String.fromCharCode(code);
      }
    }

    data.ansi = '';
    data.ansiPos = 0;
    result.push({ ...data });
    return result;
  }

  private handleAnsiCodes(data: AnsiData): AnsiData {
    // Refaktorierte Methode zum Umgang mit ANSI-Codes
    data = { ...data };
    if (data.ansiPos >= data.ansi.length - 1) {
      data.lastEscape = String.fromCharCode(27);
      return data;
    }
    let char = data.ansi[data.ansiPos];
    let escape = '';
    let stop = false;
    let i = 0;
    let codes: string[] = [];
    if (char === '[') {
      do {
        data.ansiPos += 1;
        char = data.ansi[data.ansiPos];
        escape += char;
        stop = this.ESC_ENDCHAR.test(char);
      } while (
        data.ansiPos < data.ansi.length - 1 &&
        this.ESC_VALID.test(char) &&
        !stop
      );
      if (!stop) {
        console.debug('AnsiService:handleAnsiCodes:', 'ESC[' + escape);
        data.lastEscape = String.fromCharCode(27) + '[' + escape;
        data.ansiPos += 1;
        return data;
      }
      data.ansiPos += 1;
    } else {
      switch (char) {
        case '7':
        case '8':
        case 'D':
          data.ansiPos += 1;
          return data;
      }
      escape += char;
      do {
        data.ansiPos += 1;
        char = data.ansi[data.ansiPos];
        escape += char;
        stop = this.ESC_ENDCHAR.test(char);
      } while (this.ESC_VALID.test(char) && !stop);
      console.error(
        'AnsiService:handleAnsiCodes missing-ESC:',
        'ESC[' + escape,
      );
      data.ansiPos += 1;
      return data;
    }
    data = this.applyAnsiCodes(data, escape, codes, i);
    return data;
  }

  private applyAnsiCodes(
    data: AnsiData,
    escape: string,
    codes: string[],
    i: number,
  ): AnsiData {
    // Methode zur Anwendung von ANSI-Codes
    switch (escape[escape.length - 1]) {
      case 'J':
      case 'H':
        break;
      case 'A':
      case 'B':
      case 'C':
      case 'D':
      case 'K':
      case 's':
      case 'u':
      default:
        console.error(
          'AnsiService:applyAnsiCodes unsupported-ESC:',
          'ESC[' + escape,
        );
        break;
      case 'r':
        break;
      case 'm':
        codes = escape.substring(0, escape.length - 1).split(';');
        for (i = 0; i < codes.length; i++) {
          data = this.setAnsiAttributes(data, codes, i);
        }
        break;
    }
    return data;
  }

  private setAnsiAttributes(
    data: AnsiData,
    codes: string[],
    i: number,
  ): AnsiData {
    let setcolor256fg = '';
    let setcolor256bg = '';
    switch (codes[i]) {
      case '0':
        data = this.resetAttributes(data);
        break;
      case '1':
        data.bold = true;
        break;
      case '2':
        data.faint = true;
        break;
      case '3':
        data.italic = true;
        break;
      case '4':
        data.underline = true;
        break;
      case '5':
      case '6':
        data.blink = true;
        break;
      case '7':
        data.reverse = true;
        break;
      case '8':
        data.concealed = true;
        break;
      case '9':
        data.crossedout = true;
        break;
      case '21':
        data.bold = false;
        break;
      case '22':
        data.bold = data.faint = false;
        break;
      case '23':
        data.italic = false;
        break;
      case '24':
        data.underline = false;
        break;
      case '25':
        data.blink = false;
        break;
      case '27':
        data.reverse = false;
        break;
      case '28':
        data.concealed = false;
        break;
      case '29':
        data.crossedout = false;
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
          data.fgcolor = rgbToHex(codes.slice(i + 2, i + 5));
          i += 4;
        } else {
          console.error(
            'AnsiService:setAnsiAttributes unknown fgcolor-ESC:',
            'ESC[' + escape,
          );
        }
        break;
      case '39':
        data.fgcolor = 'white';
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
          data.bgcolor = rgbToHex(codes.slice(i + 2, i + 5));
          i += 4;
        } else {
          console.error(
            'AnsiService:setAnsiAttributes unknown bgcolor-ESC:',
            'ESC[' + escape,
          );
        }
        break;
      case '49':
        data.bgcolor = 'black';
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
          'AnsiService:setAnsiAttributes unknown attribute/color-ESC:',
          'ESC[' + escape,
        );
        break;
    }
    if (setcolor256fg !== '') {
      data.fgcolor = data.faint
        ? Ansi256Colors.faint[setcolor256fg as keyof typeof Ansi256Colors.faint]
        : Ansi256Colors.normal[
            setcolor256fg as keyof typeof Ansi256Colors.normal
          ];
    }
    if (setcolor256bg !== '') {
      data.bgcolor = data.faint
        ? Ansi256Colors.faint[setcolor256bg as keyof typeof Ansi256Colors.faint]
        : Ansi256Colors.normal[
            setcolor256bg as keyof typeof Ansi256Colors.normal
          ];
    }
    if (data.fgcolor === data.bgcolor) {
      data.fgcolor = invColor(data.fgcolor);
    }
    if (data.optionInvert) {
      data.fgcolor = invColor(data.fgcolor);
      data.bgcolor = invColor(data.bgcolor);
    }
    return data;
  }

  private resetAttributes(data: AnsiData): AnsiData {
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
}
