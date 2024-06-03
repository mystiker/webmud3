import { invColor } from './inv-color';
import { invertGrayscale } from './invert-grayscale';

// Todo[myst]: Funktion refactoren bzw. Überladungen bereitstellen - einige Funktionspfade sind sinnlos (siehe auskommentierte tests)

/**
 * Extracts and potentially inverts foreground and background colors based on various conditions.
 *
 * @param a2h - The ANSI data object containing foreground and background colors.
 * @param {boolean} bow - A flag indicating whether to invert grayscale colors.
 * @param {boolean} invert - A flag indicating whether to invert the colors.
 * @param {boolean} colorOff - A flag indicating whether to turn off color adjustments.
 * @param {[string, string]} colors - An optional tuple like array containing two color strings.
 * @returns {[string, string]} - An tuple like array containing the foreground and background colors.
 * @throws {Error} - If the input colors or a2h are invalid.
 *
 * @example
 * extractColors(a2h, ['#123456', '#654321'], false, true, false); // returns ['#edcba9', '#9abced']
 */
export function extractColors(
  a2h: { reverse: boolean; bgcolor: string; fgcolor: string },
  bow: boolean,
  invert: boolean,
  colorOff: boolean,
  colors?: [string, string],
): [string, string] {
  // Default colors based on colorOff, bow, and invert flags
  if (colorOff) {
    return bow || invert ? ['#000000', '#ffffff'] : ['#ffffff', '#000000'];
  }

  // Determine foreground and background colors
  const lfg: string =
    colors !== undefined && colors.length === 2
      ? colors[0]
      : a2h.reverse
        ? a2h.bgcolor
        : a2h.fgcolor;

  const lbg: string =
    colors !== undefined && colors.length === 2
      ? colors[1]
      : a2h.reverse
        ? a2h.fgcolor
        : a2h.bgcolor;

  // Apply inversion if needed
  const fgColor = invert ? invColor(lfg) : lfg;
  const bgColor = invert ? invColor(lbg) : lbg;

  // Return the result based on the bow flag
  return bow
    ? [invertGrayscale(fgColor), invertGrayscale(bgColor)]
    : [fgColor, bgColor];
}
