export const GLYPHS = ['X', '_', 'T', '*', '.', 'P', 'G', 'g'] as const;
export const DISPLAY_GLYPHS = ['+', ' ', '♣', ' ', '.', '@', 'G', 'g'] as const;

type Glyph = (typeof GLYPHS)[number];
type DisplayGlyph = (typeof DISPLAY_GLYPHS)[number];

type HSL = {
  hue: number;
  saturation: number;
  luminosity: number;
  alpha: number;
};
export const Glyphs: Record<
  Glyph,
  { displayGlyph: DisplayGlyph; cellBackground: HSL; cellColor: HSL }
> = {
  X: {
    displayGlyph: '+',
    cellColor: {
      hue: 251,
      saturation: 20,
      luminosity: 67,
      alpha: 80,
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 85,
      alpha: 100,
    },
  },
  _: {
    displayGlyph: ' ',
    cellColor: {
      hue: 211,
      saturation: 76,
      luminosity: 67,
      alpha: 0,
    },
    cellBackground: {
      hue: 211,
      saturation: 76,
      luminosity: 67,
      alpha: 100,
    },
  },
  T: {
    displayGlyph: '♣',
    cellColor: {
      hue: 0,
      saturation: 0,
      luminosity: 0,
      alpha: 100,
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 38,
      alpha: 100,
    },
  },
  '*': {
    displayGlyph: ' ',
    cellColor: {
      hue: 0,
      saturation: 0,
      luminosity: 59,
      alpha: 100,
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 59,
      alpha: 100,
    },
  },
  '.': {
    displayGlyph: '.',
    cellColor: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 0,
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100,
    },
  },
  P: {
    displayGlyph: '@',
    cellColor: {
      hue: 44,
      saturation: 96,
      luminosity: 45,
      alpha: 100,
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100,
    },
  },
  G: {
    displayGlyph: 'G',
    cellColor: {
      hue: 166,
      saturation: 45,
      luminosity: 49,
      alpha: 80,
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100,
    },
  },
  g: {
    displayGlyph: 'g',
    cellColor: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100,
    },
    cellBackground: {
      hue: 0,
      saturation: 0,
      luminosity: 55,
      alpha: 100,
    },
  },
} as const;

export const HIDDEN_GLYPHS = ['.'];
export const PLAYER_GLYPH = 'P';
export const MONSTER_GLYPH = 'G';
export const DEFEATED_MONSTER_GLYPH = 'g';
export const TARGET_GLYPH = 'X';
export const FlashlightGlyphs = {
  Off: '✧',
  On: '✦',
};

/**
 * Adjusted for required frequency
 */
export const VALID_RANDOM_GLYPHS = [
  '.',
  '.',
  '.',
  '.',
  '.',
  '.',
  '.',
  '.',
  '.',
  '.',
  '.',
  '.',
  '.',
  'T',
  'T',
  'T',
  'T',
  'T',
  'T',
  '_',
];
export const GRID_CELL_WIDTH = 40;
export const DEFAULT_CAMERA_WIDTH = 12;

export const Trauma = {
  TraumaL: 'traumaL',
  TraumaR: 'traumaR',
  TraumaU: 'traumaU',
  TraumaD: 'traumaD',
  None: 'None',
} as const;

export const Pan = {
  Drama: 'zoomRotate',
  None: 'None',
} as const;

export const TRAUMAS = [
  Trauma.TraumaL,
  Trauma.TraumaR,
  Trauma.TraumaU,
  Trauma.TraumaD,
] as const;

export const PlayerMove = {
  PlayerMoveL: 'moveL',
  PlayerMoveR: 'moveR',
  PlayerMoveU: 'moveU',
  PlayerMoveD: 'moveD',
  None: 'None',
} as const;

export const MOVE_INPUTS = [
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'w',
  'a',
  's',
  'd',
];

export const KEY_DELTA: Record<string, readonly [number, number]> = {
  ArrowUp: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowRight: [1, 0],
  w: [0, -1],
  a: [-1, 0],
  s: [0, 1],
  d: [1, 0],
} as const;

export const openingAnnouncements = [
  'You wake up from what seems like a daze',
  'Your ribs hurt if you take a deep breath',
  'The assistance system is unresponsive. You tap the headlamp (✧), nothing',
  'You tap it a few more times, it flickers to life.',
  // extra sentence as the dialog closes prematurely
  '',
];

export const surroundingsAnnouncements = [
  'The dark clouds shift overhead, you can barely see through the thick canopy',
  'You wonder how long the batteries will last..',
  // extra sentence as the dialog closes prematurely
  '',
];
