import { idxToGridPosition } from './utils';

export const getCellDelta = (
  cellAIdx: number,
  cellBIdx: number,
  mapWidth: number,
): readonly [number, number] => {
  if (cellAIdx < 0) throw new Error('Invalid cellIdx');

  const { x, y } = idxToGridPosition(cellBIdx, mapWidth);

  const destinationPosition = idxToGridPosition(cellAIdx, mapWidth);

  return [destinationPosition.x - x, destinationPosition.y - y];
};
