import { FormatData } from './format-data';

// Todo[myst]: The object from this thing is used und reasigned everywhere. Make props readonly and see what breaks
export interface IAnsiData extends FormatData {
  // ansi: string;
  // mudEcho?: string;
  // optionInvert: boolean;
  // fontheight: number;
  // fontwidth: number;
  // ansiPos: number;
  // lastEscape?: string;
  // timeString: string;
  text: string;
}
