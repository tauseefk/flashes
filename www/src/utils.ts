import { MOVE_INPUTS } from './constants';

export const promisifiedRAF = () => new Promise(requestAnimationFrame);

export const getRandomColor = () =>
  `#${((Math.random() * 16777215) << 0).toString(16)}`;

export const keyIs = (key: string) => (event: KeyboardEvent) =>
  event.key === key;

// biome-ignore lint/suspicious/noExplicitAny: curry should support everything, will type this later
export const curry = (f: (...args: any[]) => any) => {
  // biome-ignore lint/suspicious/noExplicitAny: curry should support everything, will type this later
  const f1 = (...args: any[]) =>
    args.length >= f.length
      ? f(...args)
      : // biome-ignore lint/suspicious/noExplicitAny: curry should support everything, will type this later
        (...restArgs: any[]) => f1(...[...args, ...restArgs]);
  return f1;
};

export const compose = <T>(...fns: Array<(arg: T) => T>): ((arg: T) => T) =>
  fns.reduce((acc, curr) => (arg: T) => acc(curr(arg)));

export const takeContinuousN = (n: number, ms = 300) => {
  let _count = 0;
  let _resetCountTimer: number;

  return () => {
    if (++_count >= n) {
      _count = 0;
      window.clearTimeout(_resetCountTimer);
      return true;
    }

    if (_resetCountTimer) window.clearTimeout(_resetCountTimer);
    _resetCountTimer = window.setTimeout(() => {
      _count = 0;
    }, ms);
    return false;
  };
};

/**
 * Returns a function that evaluates to true once every `n` calls.
 */
export const skipN = (n: number) => {
  let counter = 0;
  return () => {
    counter = (counter + 1) % n;
    return counter === 0;
  };
};

/**
 * Returns a function that evaluates to true if the current value is different from the previous.
 */
export const distinctFromPrevious = () => {
  let previousValue: string | number | null = null;

  return (value: string | number) => {
    const isDistinct = previousValue !== value;
    previousValue = value;

    return isDistinct;
  };
};

export const noOp = () => {};

export const prettyPrintMapState = (board: string, width: number) => {
  const regex = new RegExp(`.{1,${width}}`, 'g');
  console.log(board.match(regex)?.join('\n') ?? '');
};

export const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);

export type TranslatedGrid = { grid1DArray: number[]; width: number };
/**
 * Move the entire grid1DArray by `distance` steps in the X direction.
 * negative `distance` makes each row shift so that the `distance + 1` idx becomes the idx `0`
 * the shifted elements are appended to the end of the rows.
 */
export const translateX = curry(
  (distance: number, { grid1DArray, width }: TranslatedGrid) => {
    const newArray = [];
    for (let start = 0; start < grid1DArray.length; start += width) {
      const row = grid1DArray.slice(start, start + width);
      // To handle negative distances, use a modulus that keeps index within array bounds
      const offset = ((distance % width) + width) % width;
      newArray.push(...row.slice(offset), ...row.slice(0, offset));
    }

    return { grid1DArray: newArray, width };
  },
);

/**
 * Move the entire grid1DArray by `distance` steps in the Y direction.
 * the `distance` rows are removed from the beginning of the `grid1DArray` and appended to the end of the array
 */
export const translateY = curry(
  (distance: number, { grid1DArray, width }: TranslatedGrid) => {
    const height = grid1DArray.length / width;
    const offset = ((distance % height) + height) % height;
    const rows = [];

    for (let start = 0; start < grid1DArray.length; start += width) {
      rows.push(grid1DArray.slice(start, start + width));
    }

    const newArray = rows.slice(offset).concat(rows.slice(0, offset)).flat();

    return { grid1DArray: newArray, width };
  },
);

/**
 * (number, number) => { x: number, y: number }
 *
 */
export const idxToGridPosition = (idx: number, width: number) => ({
  x: idx % width,
  y: Math.floor(idx / width),
});

export const translateX1 = translateX(1);
export const translateY1 = translateY(1);
export const translateY1N = translateY(-1);

export const keyIsMoveInput = (e: KeyboardEvent) => {
  return MOVE_INPUTS.includes(e.key);
};

export const keyIsF = keyIs('f');
