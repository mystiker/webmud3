export interface IMudMessage {
  text: string;
  type: 'mud' | 'echo' | 'system';
  bold?: boolean;
  faint?: boolean;
  italic?: boolean;
  underline?: boolean;
  blink?: boolean;
  crossedout?: boolean;
  fgcolor?: string;
  bgcolor?: string;
}
