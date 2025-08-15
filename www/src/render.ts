import Stream from 'rextream';

import {
  DEFEATED_MONSTER_GLYPH,
  GLYPHS,
  GRID_CELL_WIDTH,
  Glyphs,
  HIDDEN_GLYPHS,
  KEY_DELTA,
  MONSTER_GLYPH,
  PLAYER_GLYPH,
  Pan,
  PlayerMove,
  TRAUMAS,
  Trauma,
} from './constants';
import { getCellDelta } from './getCellDelta';
import { WEATHER } from './maps';
import type { GameMap } from './state';
import {
  type TranslatedGrid,
  compose,
  translateX1,
  translateY1,
} from './utils';

const getFog = (mapState: number[], width: number): TranslatedGrid =>
  compose(
    translateX1,
    translateY1,
  )({ grid1DArray: mapState, width }) as TranslatedGrid;

const legalMoves = Object.values(KEY_DELTA);

let fogState: number[] = [];

type Particle = number | null;

type PlayerAnimationState = {
  isDead: boolean;
  move: (typeof PlayerMove)[keyof typeof PlayerMove];
  trauma: (typeof Trauma)[keyof typeof Trauma];
  hop: boolean;
};
type CameraAnimationState = {
  shake: (typeof Trauma)[keyof typeof Trauma];
  move: (typeof Pan)[keyof typeof Pan];
};

export class Renderer {
  rafTimer: number | undefined;

  mapBuffer: number[] | undefined;
  mapWidth: number | undefined;
  viewWidth: number | undefined;
  playerCellIdx: number | undefined;
  visibilityState: number[] | undefined;
  cameraAnimationState: CameraAnimationState = {
    shake: Trauma.None,
    move: Pan.None,
  };
  playerAnimationState: PlayerAnimationState = {
    isDead: false,
    move: PlayerMove.None,
    trauma: Trauma.None,
    hop: false,
  };
  weatherState: number[] | undefined;
  particleState: [Particle, Particle] = [null, null];

  gridContainer = document.getElementById('grid-container') as HTMLElement;
  maskContainer = document.getElementById('mask-container') as HTMLElement;
  gameContainer = document.getElementById('game-container') as HTMLElement;
  particleContainer = document.getElementById('particles') as HTMLElement;
  overlayContainer = document.getElementById(
    'overlay-container',
  ) as HTMLElement;

  init() {
    if (this.rafTimer) {
      cancelIdleCallback(this.rafTimer);
      this.rafTimer = undefined;
    }
    this.render();
  }

  updateRendererState({
    gameMap,
    visibilityState,
    playerCellIdx,
    particleState,
    playerAnimationState,
  }: {
    gameMap: GameMap;
    visibilityState: number[];
    playerCellIdx: number;
    particleState: [Particle, Particle];
    playerAnimationState: PlayerAnimationState;
  }) {
    this.mapBuffer = gameMap.level;
    this.mapWidth = gameMap.width;
    this.viewWidth = gameMap.viewWidth;
    this.playerCellIdx = playerCellIdx;
    this.visibilityState = visibilityState;
    this.particleState = [...particleState];
    this.playerAnimationState = { ...playerAnimationState };
  }

  // compute visibility before calling render
  async render() {
    if (
      !this.mapBuffer ||
      !this.visibilityState ||
      !this.mapWidth ||
      !this.viewWidth ||
      !this.playerCellIdx
    ) {
      throw new Error('Renderer not initialized properly');
    }

    const visibility = Array.from(this.visibilityState).map(
      (squareDistance) => 1 / (2 + squareDistance),
    );

    const weatherData = WEATHER[0];
    fogState =
      fogState.length > 0
        ? [...fogState]
        : [
            ...weatherData.content
              .split('')
              .map((x) => GLYPHS.findIndex((g) => g === x)),
          ];
    fogState = [...getFog(fogState, this.mapWidth).grid1DArray];

    this.maskContainer.innerHTML = '';

    // apply visibility mask to rain
    this.mapBuffer.forEach((_, cellIdx) => {
      const cell = document.createElement('div');
      cell.classList.add('pointer-none', 'cell', 'bg-black');

      // @ts-expect-error arrays are of the same length
      const cellVisibility: number = visibility[cellIdx];
      cell.style.opacity = `${1 - Math.min(1, Math.floor(cellVisibility / 0.01)) - 0.05}`;

      this.maskContainer.appendChild(cell);
    });

    this.gridContainer.innerHTML = '';
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.viewWidth}, minmax(0px, 1fr))`;
    this.overlayContainer.style.gridTemplateColumns = `repeat(${this.viewWidth}, minmax(0px, 1fr))`;
    this.maskContainer.style.gridTemplateColumns = `repeat(${this.viewWidth}, minmax(0px, 1fr))`;

    const fragment = document.createDocumentFragment();

    const {
      renderParticleGlyph: renderPlayerDamageGlyph,
      setParticleRenderAnchor: setPlayerDamageAnchor,
    } = this.getParticleRenderer();
    const {
      renderParticleGlyph: renderMonsterDamageGlyph,
      setParticleRenderAnchor: setMonsterDamageAnchor,
    } = this.getParticleRenderer();

    this.mapBuffer.forEach((glyphIdx, cellIdx) => {
      const cellDelta = getCellDelta(
        cellIdx,
        this.playerCellIdx || 0,
        this.mapWidth || 16,
      );
      const currentGlyph = GLYPHS[glyphIdx];

      if (!currentGlyph) return;

      const { displayGlyph, cellBackground, cellColor } = Glyphs[currentGlyph];

      const cell = document.createElement('div');
      const cellVisibility = visibility[cellIdx];
      const cellFog = fogState[cellIdx];

      if (!cellVisibility || !cellFog) return;

      cell.textContent = displayGlyph;
      cell.style.backgroundColor = `\
        hsla(\
        ${cellBackground.hue},\
        ${cellBackground.saturation}%,\
        ${Math.max(4, (cellVisibility + cellFog / 200) * 100)}%,\
        ${cellBackground.alpha}%)`;
      cell.style.color = `\
          hsla(\
          ${cellColor.hue},\
          ${cellColor.saturation}%,\
          ${cellColor.luminosity}%,\
          ${cellColor.alpha}%)`;

      cell.classList.add('pointer-none', 'cell', 'base', 'relative');

      if (
        currentGlyph === DEFEATED_MONSTER_GLYPH ||
        currentGlyph === MONSTER_GLYPH
      ) {
        setMonsterDamageAnchor(cell);
      }

      if (currentGlyph === PLAYER_GLYPH) {
        // biome-ignore lint/correctness/noConstantCondition: temporary
        cell.style.color = true
          ? `\
          hsla(\
          ${cellColor.hue},\
          ${cellColor.saturation}%,\
          ${cellColor.luminosity}%,\
          ${cellColor.alpha}%)`
          : 'HSL(0, 0%, 63%)';

        const charSpan = document.createElement('span');
        cell.textContent = '';
        charSpan.textContent = displayGlyph;
        charSpan.classList.add('glyph');
        if (this.playerAnimationState.trauma !== Trauma.None) {
          charSpan.classList.add(this.playerAnimationState.trauma);
        }

        if (this.playerAnimationState.move !== Trauma.None) {
          charSpan.classList.add(this.playerAnimationState.move);
        }

        if (this.playerAnimationState.hop) {
          charSpan.classList.add('hop');
        }
        cell.appendChild(charSpan);
        setPlayerDamageAnchor(cell);
      }

      if (
        cellDelta &&
        legalMoves.some(
          (legalDelta) =>
            legalDelta[0] === cellDelta[0] && legalDelta[1] === cellDelta[1],
        )
      ) {
        cell.classList.remove('pointer-none');
      }

      if (HIDDEN_GLYPHS.includes(displayGlyph)) {
        cell.classList.add('text-transparent');
      }

      cell.dataset.idx = `${cellIdx}`;
      fragment.appendChild(cell);
    });

    this.gridContainer.appendChild(fragment);

    if (this.particleState[0])
      renderPlayerDamageGlyph(`${this.particleState[0]}`);
    if (this.particleState[1])
      renderMonsterDamageGlyph(`${this.particleState[1]}`);

    if (this.cameraAnimationState.shake !== Trauma.None) {
      this.gameContainer.classList.add(this.cameraAnimationState.shake);
      Stream.fromTimer(100).subscribe({
        next: () => {
          this.gameContainer.classList.remove(...TRAUMAS);
        },
        complete: () => {},
      });
    }
  }

  private getParticleRenderer = () => {
    let particleSource: HTMLDivElement;

    const particleEl = document.createElement('span');
    particleEl.classList.add('absolute', 'color-warning', 'hidden');

    this.particleContainer.appendChild(particleEl);

    return {
      renderParticleGlyph: (textContent: string) => {
        const particleClientRect = particleSource.getBoundingClientRect();
        const leftOffset =
          particleClientRect.height === GRID_CELL_WIDTH
            ? particleClientRect.height / 4
            : 0;

        particleEl.textContent = textContent;

        particleEl.style.left = `${particleClientRect.left + leftOffset}px`;
        particleEl.style.top = `${particleClientRect.top - particleClientRect.height / 2}px`;

        particleEl.classList.add('floatFade');
        particleEl.classList.remove('hidden');
        Stream.fromTimer(200).subscribe({
          next: () => {
            particleEl.classList.remove('floatFade');
            particleEl.classList.add('hidden');
          },
          complete: () => {},
        });
      },
      setParticleRenderAnchor: (cell: HTMLDivElement) => {
        particleSource = cell;
      },
    };
  };
}
