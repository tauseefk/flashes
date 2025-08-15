import Stream from 'rextream';
import { Flashlight, MoveOutcome, Vec2 } from '../engine/flashlight';
import {
  P2PMessageType,
  PeerConnectionManager,
  ServerMessageType,
} from './PeerConnectionManager';
import {
  AnnouncementsEnum,
  advanceAnnouncements,
  announcementFactory,
  getAnnouncement,
  initializeAnnouncements,
} from './announcements';
import {
  DEFAULT_CAMERA_WIDTH,
  FlashlightGlyphs,
  GRID_CELL_WIDTH,
  KEY_DELTA,
  Pan,
  PlayerMove,
  Trauma,
  openingAnnouncements,
  surroundingsAnnouncements,
} from './constants';
import { getCellDelta } from './getCellDelta';
import { RAINFALL, WEATHER, initializeMaps } from './maps';
import { Renderer } from './render';
import { StorageKeysEnum, getStorage } from './storage';
import {
  distinctFromPrevious,
  idxToGridPosition,
  keyIsF,
  keyIsMoveInput,
  takeContinuousN,
} from './utils';

initializeAnnouncements();
initializeMaps();

export interface GameMap {
  level: number[];
  width: number;
  cellWidth: number;
  viewWidth: number;
}

export class GameState {
  private connectionManager: PeerConnectionManager;

  role: 'Player' | 'Spectator' = 'Spectator';
  private map: GameMap | undefined;
  private flashlight: Flashlight | undefined;
  private renderer = new Renderer();

  private gameState = {
    isGameOver: false,
  };
  monsterState = {
    poise: 120,
  };
  cameraState = {
    shake: Trauma.None as (typeof Trauma)[keyof typeof Trauma],
    move: Pan.None as (typeof Pan)[keyof typeof Pan],
  };
  playerState = {
    poise: 100,
    move: PlayerMove.None as (typeof PlayerMove)[keyof typeof PlayerMove],
    trauma: Trauma.None as (typeof Trauma)[keyof typeof Trauma],
    isFlashlightOn:
      getStorage(StorageKeysEnum.ANNOUNCEMENT) === AnnouncementsEnum.None,
    hop: false,
  };
  uiState = {
    isInitialized: false,
    showUI: true,
    roleTab: document.getElementById('role-tab') as HTMLElement,
    playableContainer: document.getElementById(
      'playable-container',
    ) as HTMLElement,
    playButtonContainer: document.getElementById(
      'play-button-container',
    ) as HTMLElement,
    playButtonEl: document.getElementById('play-button') as HTMLElement,
    buttonsContainer: document.getElementById(
      'buttons-container',
    ) as HTMLElement,
    restartContainer: document.getElementById(
      'restart-container',
    ) as HTMLElement,
    flashlightButtonEl: document.getElementById('flashlight') as HTMLElement,
    particleContainer: document.getElementById('particles') as HTMLElement,
    gameContainer: document.getElementById('game-container') as HTMLElement,
    gridContainer: document.getElementById('grid-container') as HTMLElement,
    overlayContainer: document.getElementById(
      'overlay-container',
    ) as HTMLElement,
    maskContainer: document.getElementById('mask-container') as HTMLElement,
    dPad: document.getElementById('d-pad') as HTMLElement,
    announcementTarget: document.getElementById('announcement') as HTMLElement,
  };
  weather = WEATHER[0];
  rain = RAINFALL[0];
  private pendingInitialStateVector: Uint8Array | null = null;

  private constructor(connectionManager: PeerConnectionManager) {
    this.connectionManager = connectionManager;
  }

  static async init(): Promise<GameState> {
    const connectionManager = new PeerConnectionManager();
    await connectionManager.connect();

    const instance = new GameState(connectionManager);
    instance.setupEventHandlers();

    Stream.eagerFromReadableStream(
      instance.connectionManager.serverStream,
    ).subscribe({
      next: async ({ value }) => {
        instance.updateConnectionStatusUI();
        switch (value.type) {
          case ServerMessageType.ClientAcknowledged: {
            instance.role = value.role;
            instance.map = value.map;
            break;
          }
          case ServerMessageType.PeerJoined: {
            // Peer connection established, currently handled directly via global state
            instance.connectionManager.closeServerConnection();
            break;
          }
          default:
            console.warn('Unexpected message type');
        }
      },
      complete: () => {
        // p2p handshake finished
        // disconnect from signaling server
      },
    });

    Stream.eagerFromReadableStream(
      instance.connectionManager.peerStream,
    ).subscribe({
      next: async ({ value }) => {
        instance.updateConnectionStatusUI();
        switch (value.type) {
          case P2PMessageType.InitialStateVector: {
            // player will not accept initial state vector
            if (instance.role === 'Player') break;

            // store pending state vector for spectator
            instance.pendingInitialStateVector = value.data;
            break;
          }
          case P2PMessageType.Delta: {
            instance.flashlight?.apply_delta_js(new Uint8Array(value.data));
            instance.tick();
            break;
          }
          default:
            console.warn('Unexpected message type');
        }
      },
      complete: () => {
        // end game
      },
    });

    return instance;
  }

  async sendDelta(delta: Uint8Array) {
    this.connectionManager.sendToPeer({
      type: P2PMessageType.Delta,
      data: delta,
    });
  }

  async sendInitialStateVector(state: Uint8Array) {
    if (this.role === 'Spectator') return;

    this.connectionManager.sendToPeer({
      type: P2PMessageType.InitialStateVector,
      data: state,
    });
  }

  async startGame() {
    if (!this.map) {
      return;
    }

    const { level, width, viewWidth, cellWidth } = this.map;
    this.flashlight = Flashlight.new_from_js(
      new Uint8Array(level),
      width,
      cellWidth,
      viewWidth,
    );

    // Apply pending initial state vector if it arrived before engine was ready
    if (this.pendingInitialStateVector && this.role === 'Spectator') {
      this.flashlight.apply_initial_state_vector_js(
        new Uint8Array(this.pendingInitialStateVector),
      );
      this.pendingInitialStateVector = null;
    }

    this.initRain();

    this.initializeUI();
    await this.tick();
  }

  private updateConnectionStatusUI() {
    switch (this.connectionManager.peerConnectionStatus) {
      case 'Waiting':
        this.uiState.playButtonEl.textContent = 'wait for P2...';
        break;

      case 'Connected':
        this.uiState.playButtonEl.textContent = 'Play';
        this.uiState.playButtonEl.classList.remove('pointer-none');
        break;
      case 'Disconnected':
        this.uiState.playButtonEl.textContent = 'Disconnected';
        break;
    }
  }
  private setupEventHandlers() {
    const $playButtonInput = Stream.fromEvent(
      'click',
      this.uiState.playButtonEl,
    );
    $playButtonInput.subscribe({
      next: () => {
        this.startGame();

        this.uiState.playButtonContainer.classList.add('opacity-0');
      },
      complete: () => {},
    });

    const $keyUpInput = Stream.fromEvent('keyup', document.body);
    const $keyDownInput = Stream.fromEvent('keydown', document.body);
    const $dPadInput = Stream.fromEvent('click', this.uiState.dPad);
    const $cellClick = Stream.fromEvent('click', this.uiState.gridContainer);
    const $flashlightButtonClick = Stream.fromEvent(
      'click',
      this.uiState.flashlightButtonEl,
    );
    const $tenSecInterval = Stream.fromInterval(10000);

    const $moveKeyInput = $keyDownInput.filter((e): e is KeyboardEvent =>
      keyIsMoveInput(e as KeyboardEvent),
    ) as Stream<KeyboardEvent>;
    const $fKeyInput = $keyUpInput.filter((e) =>
      keyIsF(e as KeyboardEvent),
    ) as Stream<KeyboardEvent>;

    $moveKeyInput
      .filter(() => {
        return this.role !== 'Spectator';
      })
      .map((e) => {
        e.preventDefault();

        const delta = KEY_DELTA[e.key];

        if (!delta) throw new Error('Failed to find move delta');
        return { delta };
      })
      .subscribe({
        next: this.moveWithDelta,
        complete: () => {},
      });

    $dPadInput
      .filter(() => {
        return this.role !== 'Spectator';
      })
      .map((e) => {
        e.preventDefault();
        const ariaLabel = (e.target as HTMLElement).getAttribute('aria-label');
        if (!ariaLabel) throw new Error('No aria label found');

        const delta = KEY_DELTA[ariaLabel];
        return { delta };
      })
      .subscribe({
        next: this.moveWithDelta,
        complete: () => {},
      });

    $cellClick
      .filter(() => {
        return this.role !== 'Spectator';
      })
      .filter((e) => {
        const target = e.target as HTMLElement;
        return target.classList.contains('cell');
      })
      .map((e) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const cellIdx = target.dataset.idx;
        if (!cellIdx) throw new Error('Failed to find cell idx');

        return { cellIdx: Number.parseInt(cellIdx) };
      })
      .subscribe({
        next: this.selectCell,
        complete: () => {},
      });

    const {
      getNextSentence: getNextOpeningSentence,
      getStreamingSentence: getStreamingOpeningSentence,
    } = announcementFactory(openingAnnouncements);
    const {
      getNextSentence: getNextSurroundingsSentence,
      getStreamingSentence: getStreamingSurroundingsSentence,
    } = announcementFactory(surroundingsAnnouncements);

    const $notFKeyInput = Stream.fromEvent('keyup', document.body).filter(
      (e) => !keyIsF(e as KeyboardEvent),
    );
    const $anyClick = Stream.fromEvent('click', document.body);
    const openingDialogUnsub = $notFKeyInput
      .withLatestFrom($anyClick)
      .filter(
        () =>
          getAnnouncement() === AnnouncementsEnum.Opening &&
          !this.playerState.isFlashlightOn,
      )
      .switchMap(() => {
        const { isDone } = getNextOpeningSentence();

        return Stream.fromInterval(60).map(() => {
          const { content, isSentenceComplete } = getStreamingOpeningSentence();
          return {
            content,
            isDone: isDone && isSentenceComplete,
          };
        });
      })
      .filter(({ content }) => distinctFromPrevious()(content))
      .subscribe({
        next: ({ isDone, content }) => {
          this.uiState.announcementTarget.classList.add(
            'opacity-transition-fast',
          );
          this.uiState.announcementTarget.classList.remove(
            'opacity-0',
            'opacity-transition-faster',
          );
          this.uiState.announcementTarget.textContent = content;

          if (isDone) {
            this.uiState.announcementTarget.classList.add(
              'opacity-0',
              'opacity-transition-faster',
            );
            openingDialogUnsub();
            advanceAnnouncements();
          }
        },
        complete: () => {},
      });

    const $notFKey = Stream.fromEvent('keyup', document.body).filter(
      (e) => !keyIsF(e as KeyboardEvent),
    );
    const $anyClick2 = Stream.fromEvent('click', document.body);
    const surroundingsDialogUnsub = $notFKey
      .withLatestFrom($anyClick2)
      .filter(
        () =>
          getAnnouncement() === AnnouncementsEnum.Surroundings &&
          this.playerState.isFlashlightOn,
      )
      .switchMap(() => {
        const { isDone } = getNextSurroundingsSentence();

        return Stream.fromInterval(60).map(() => {
          const { content, isSentenceComplete } =
            getStreamingSurroundingsSentence();
          return {
            content,
            isDone: isDone && isSentenceComplete,
          };
        });
      })
      .filter(({ content }) => distinctFromPrevious()(content))
      .subscribe({
        next: ({ isDone, content }) => {
          this.uiState.announcementTarget.classList.add(
            'opacity-transition-fast',
          );
          this.uiState.announcementTarget.classList.remove(
            'opacity-0',
            'opacity-transition-faster',
          );
          this.uiState.announcementTarget.textContent = content;

          if (isDone) {
            this.uiState.announcementTarget.classList.add('opacity-0');
            surroundingsDialogUnsub();
            advanceAnnouncements();
          }
        },
        complete: () => {},
      });

    const flashlightTriggerUnsub = $flashlightButtonClick
      .withLatestFrom($fKeyInput)
      .filter(takeContinuousN(3))
      .filter(() => !this.playerState.isFlashlightOn)
      .map(([e1, e2]) => {
        e1?.preventDefault();
        e2?.preventDefault();

        return { value: this.playerState.isFlashlightOn };
      })
      .subscribe({
        next: async ({ value }) => {
          await this.toggleFlashlight({ value });

          flashlightTriggerUnsub();
          openingDialogUnsub();
        },
        complete: () => {},
      });

    // make rain
    $tenSecInterval.subscribe({
      next: (tick) => {
        if (tick % 4) {
          this.uiState.overlayContainer.classList.add(
            'fadeIn',
            'opacity-transition',
          );
        } else {
          this.uiState.overlayContainer.classList.remove('fadeIn');
        }
      },
      complete: () => {},
    });
  }

  private initializeUI() {
    if (!this.map) {
      return;
    }

    if (this.uiState.isInitialized) {
      return;
    }

    if (this.role === 'Spectator') {
      this.uiState.buttonsContainer.classList.add('opacity-0');
      this.uiState.roleTab.classList.remove('opacity-0');
    }

    this.uiState.playableContainer.style.width = `${GRID_CELL_WIDTH * (this.map.viewWidth || DEFAULT_CAMERA_WIDTH)}`;
    this.uiState.gridContainer.style.width = `${GRID_CELL_WIDTH * (this.map.viewWidth || DEFAULT_CAMERA_WIDTH)}`;
    this.uiState.gridContainer.style.gridTemplateColumns = `repeat(${this.map.width}, minmax(0, 1fr))`;
    this.uiState.overlayContainer.style.gridTemplateColumns = `repeat(${this.rain.width}, minmax(0, 1fr))`;
    this.uiState.maskContainer.style.gridTemplateColumns = `repeat(${this.map.width}, minmax(0, 1fr))`;

    const rain = this.rain.content.split('');
    const rainGlyphs = rain.map((glyph) => {
      return glyph === '*' ? '.' : ' ';
    });

    for (const rainGlyph of rainGlyphs) {
      const cell = document.createElement('div');
      cell.textContent = rainGlyph;
      cell.classList.add('invert', 'cell', 'pointer-none');
      this.uiState.overlayContainer.appendChild(cell);
    }

    this.initRain();
    // prevent double initialization
    this.uiState.isInitialized = true;
  }

  get engine() {
    if (!this.flashlight) {
      throw new Error('Game not initialized');
    }

    return this.flashlight;
  }

  get mapWidth() {
    if (!this.map) {
      throw new Error('Game not initialized');
    }

    return this.map.width;
  }

  // HACK: extract a UI renderer
  setGameOver() {
    if (this.gameState.isGameOver) {
      this.uiState.gameContainer.classList.add(this.cameraState.move);
      this.uiState.buttonsContainer.classList.add('fadeOut');
      this.uiState.restartContainer.classList.add('fadeIn-full');
      this.uiState.restartContainer.classList.remove('pointer-none');
    }
  }

  initRain = () => {
    const overlayContainerRect =
      this.uiState.overlayContainer.getBoundingClientRect();

    const rainDrops = Array.from(
      this.uiState.overlayContainer.children,
    ) as HTMLElement[];

    const offsets: { x: number; y: number; maxX: number; maxY: number }[] = [];

    for (const rainDrop of rainDrops) {
      const rect = rainDrop.getBoundingClientRect();
      // negative
      const relativeTop = -(
        rect.top -
        overlayContainerRect.top +
        rect.height / 2
      );
      // positive
      const relativeLeft =
        overlayContainerRect.left +
        overlayContainerRect.width -
        rect.left -
        rect.width / 2 -
        // border offset
        2;
      offsets.push({
        x: relativeLeft,
        y: relativeTop,
        maxX: relativeLeft,
        maxY: relativeTop,
      });
      (rainDrop as HTMLElement).style.transform =
        `translate(${relativeLeft}px, ${relativeTop}px)`;
    }

    const moveRaindrops = () => {
      rainDrops.forEach((rainDrop, idx) => {
        // biome-ignore lint/style/noNonNullAssertion: the arrays are of equal length
        const { x, y, maxX, maxY } = offsets[idx]!;
        const multiplier = overlayContainerRect.width < 400 ? 1 : 2;
        const updatedX = x > 0 ? x - multiplier : maxX;
        const updatedY = y < 0 ? y + multiplier : maxY;
        offsets[idx] = { x: updatedX, y: updatedY, maxX, maxY };
        rainDrop.style.transform = `translate(${updatedX}px, ${updatedY}px)`;
      });
      requestAnimationFrame(moveRaindrops);
    };

    moveRaindrops();
  };

  /**
   * Selects the cell.
   * @param {object} { cellIdx: number }
   */
  private selectCell = async ({ cellIdx }: { cellIdx: number }) => {
    if (!cellIdx || !this.map) return;

    const delta = getCellDelta(
      cellIdx,
      this.engine.map_metadata.player_cell_idx,
      this.map.width,
    );

    await this.moveWithDelta({ delta });
  };

  private moveWithDelta = async ({
    delta,
  }: {
    delta: readonly [number, number];
  }) => {
    if (!delta) return;

    const { x, y } = idxToGridPosition(
      this.engine.map_metadata.player_cell_idx,
      this.engine.width,
    );
    const gridPosition = { x: x + delta[0], y: y + delta[1] };
    const cell = Vec2.new_with_data(gridPosition.x, gridPosition.y);

    const outcome: MoveOutcome = this.engine.do_move_player(cell);

    const playerMove =
      delta[0] < 0
        ? PlayerMove.PlayerMoveL
        : delta[0] > 0
          ? PlayerMove.PlayerMoveR
          : delta[1] < 0
            ? PlayerMove.PlayerMoveU
            : PlayerMove.PlayerMoveD;

    switch (outcome) {
      case MoveOutcome.Rejected: {
        this.playerState.trauma =
          delta[0] < 0
            ? Trauma.TraumaL
            : delta[0] > 0
              ? Trauma.TraumaR
              : delta[1] < 0
                ? Trauma.TraumaU
                : Trauma.TraumaD;
        this.playerState.hop = false;
        this.playerState.move = PlayerMove.None;

        this.cameraState.shake = this.playerState.trauma;
        break;
      }
      case MoveOutcome.Advance:
        this.cameraState.shake = Trauma.None;
        this.playerState.trauma = Trauma.None;
        this.playerState.hop = true;
        this.playerState.move = playerMove;
        break;
      case MoveOutcome.NoOp:
        this.cameraState.shake = Trauma.None;
        this.playerState.trauma = Trauma.None;
        this.playerState.hop = false;
        break;
      case MoveOutcome.End:
        this.cameraState.shake = Trauma.None;
        this.cameraState.move = Pan.Drama;
        this.playerState.trauma = Trauma.None;
        this.playerState.hop = false;
        this.uiState.showUI = false;
        this.gameState.isGameOver = true;
        break;
    }

    this.engine.do_move_enemy();
    await this.tick();
  };

  private async tick() {
    if (!this.map) {
      return;
    }

    this.engine.compute_visibility();
    const mapState = this.engine.get_clipped_map_state();
    this.renderer.updateRendererState({
      gameMap: {
        level: mapState,
        width: this.map.width,
        cellWidth: this.map?.cellWidth,
        viewWidth: this.map?.viewWidth,
      },
      visibilityState: Array.from(this.engine.visibility_state),
      particleState: [null, null],
      playerCellIdx: this.engine.map_metadata.player_cell_idx,
      playerAnimationState: {
        ...this.playerState,
        isDead: this.engine.player_poise <= 0,
      },
    });
    await this.renderer.render();
  }

  private async toggleFlashlight({ value }: { value: boolean }) {
    this.playerState.isFlashlightOn = !value;
    this.uiState.flashlightButtonEl.textContent = value
      ? FlashlightGlyphs.Off
      : FlashlightGlyphs.On;

    this.uiState.flashlightButtonEl.classList.add('pointer-none');

    await this.tick();
  }
}

export const gameState = await GameState.init();
