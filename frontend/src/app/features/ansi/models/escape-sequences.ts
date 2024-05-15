export const ESCAPE_SEQUENCES = {
  CLEAR_SCREEN: 'e[He[J',
  FG256: '38;5;',
  BG256: '48;5;',
  FG_RGB: '39;2;',
  BG_RGB: '49;2;',
  VALID: /^[0-9;A-Za-z]$/,
  ENDCHAR: /^[A-Za-z]$/,
} as const;
