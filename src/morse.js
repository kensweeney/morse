// International Morse code table.
export const MORSE = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  0: '-----',
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
};

// Koch method training order (G4FON sequence): characters are introduced
// one at a time, always played at full speed.
export const KOCH_ORDER = [
  'K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O',
  'W', 'I', '.', 'N', 'J', 'E', 'F', '0', 'Y', 'V',
  ',', 'G', '5', '/', 'Q', '9', 'Z', 'H', '3', '8',
  'B', '?', '4', '2', '7', 'C', '1', 'D', '6', 'X',
];

export function categoryOf(ch) {
  if (/^[A-Z]$/.test(ch)) return 'letters';
  if (/^[0-9]$/.test(ch)) return 'numbers';
  return 'punctuation';
}

// Render a dot-dash pattern with readable glyphs, e.g. "-.-" -> "− · −".
export function prettyPattern(code) {
  return code.split('').map((s) => (s === '.' ? '·' : '−')).join(' ');
}
