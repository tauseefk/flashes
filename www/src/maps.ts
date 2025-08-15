import { DEFAULT_CAMERA_WIDTH } from './constants';
import { StorageKeysEnum, getStorage, setStorage } from './storage';

export const DEFAULT_MAP_SIZE = 16;

export const MapsEnum = {
  Intro: 'intro',
  None: 'none',
} as const;

type Map = (typeof MapsEnum)[keyof typeof MapsEnum];

type GridTexture = {
  id: number;
  content: string;
  width: number;
};

export const WEATHER: [GridTexture] = [
  {
    id: 1,
    content: `\
*.........*....*\
.........*TT*...\
.*.......*TTTT*.\
*..*......*TT*..\
.....***...**..*\
*...*TTT**.....*\
*T.*TTTT**......\
..T.*T**....**..\
.....**....*T*.*\
*T........*TTT*.\
TT....*TT*.*TT*.\
.......*TT*.....\
......T.*T*.....\
...*T*..........\
...*TTT*........\
.....**.........\
`,
    width: DEFAULT_MAP_SIZE,
  },
];

// RAINFALL needs to have already clipped dimensions
export const RAINFALL: [GridTexture] = [
  {
    id: 1,
    content: `\
.......*....\
...........*\
.*...*......\
.........*..\
...*........\
..........*.\
.*..........\
......*.....\
..*........*\
.....*......\
...*....*...\
.*....*.....\
`,
    width: DEFAULT_CAMERA_WIDTH,
  },
];

export const getMap = () => {
  return getStorage(StorageKeysEnum.MAP);
};

const setMap = (map: Map) => {
  setStorage(StorageKeysEnum.MAP, map);
};

export const initializeMaps = () => {
  const currentMap = getMap();

  if (!currentMap) {
    setMap(MapsEnum.Intro);
  }
};
