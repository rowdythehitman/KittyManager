// Pixel-art cat sprites, shared by the app and the icon generator.
// Legend: K outline, B body, S stripe, W belly patch, P inner ear, E eye, N nose, . transparent
const SPRITES = {
  sit: [
    '....KK......KK......',
    '...KPBKKKKKKBPK.....',
    '...KPBBSBBSBBPK.....',
    '...KBBBSBBSBBBK.....',
    'KKKKBBBBBBBBBBKKKK..',
    '...KSBEBBBBEBSK.....',
    'KKKKBBBBNNBBBBKKKK..',
    '...KSBBBBBBBBSK.....',
    '....KKBBBBBBKK...KKK',
    '....KBBBBBBBBK..KSBK',
    '....KBBBBBBBBBK.KBBK',
    '....KBWWBBBBBBBKSBK.',
    '....KBWWWBBBBBSBBK..',
    '....KBWWWBBBBBBKK...',
    '....KBBKBBKBBBK.....',
    '....KKKKKKKKKK......',
  ],
  walkA: [
    '..............K...K.',
    '.K...........KPK.KPK',
    'KBK..........KBBBBBK',
    'KBK..........KBEBBEK',
    '.KBK.........KBBBNBK',
    '..KBKKKKKKKKKKBBBBBK',
    '..KBBBSBBSBBSBBBBKK.',
    '...KBBSBBSBBSBBBK...',
    '...KBBBBBBBBBBBBK...',
    '...KBBKKKKKKKBBBK...',
    '..KBBK.......KBBK...',
    '.KBBK.........KBBK..',
    '.KKK...........KKK..',
  ],
  walkB: [
    '..............K...K.',
    '.K...........KPK.KPK',
    'KBK..........KBBBBBK',
    'KBK..........KBEBBEK',
    '.KBK.........KBBBNBK',
    '..KBKKKKKKKKKKBBBBBK',
    '..KBBBSBBSBBSBBBBKK.',
    '...KBBSBBSBBSBBBK...',
    '...KBBBBBBBBBBBBK...',
    '...KBBKKKKKKKBBBK...',
    '....KBBK...KBBK.....',
    '....KBBK...KBBK.....',
    '....KKKK...KKKK.....',
  ],
  heart: [
    '.KK.KK.',
    'KHHKHHK',
    'KHHHHHK',
    '.KHHHK.',
    '..KHK..',
    '...K...',
  ],
};

const PALETTES = {
  chuchi: { K: '#000', B: '#a39a93', S: '#6f6862', W: '#eba99b', P: '#f0a9a0', E: '#fff', N: '#000', H: '#e8556d' },
  diego:  { K: '#000', B: '#3b3b3b', S: '#3b3b3b', W: '#3b3b3b', P: '#f2a7b5', E: '#f5a623', N: '#000', H: '#e8556d' },
};

// Draw a sprite with its top-left at (x, y); each sprite pixel is `s` canvas pixels.
function drawSprite(ctx, rows, pal, x, y, s, flip) {
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      const col = pal[row[c]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x + (flip ? w - 1 - c : c) * s, y + r * s, s, s);
    }
  }
}
