import { gameState } from './state';

declare global {
  const SERVER_URL: string;
  interface Window {
    sendDelta: (delta: Uint8Array) => void;
    sendInitialStateVector: (initialStateVector: Uint8Array) => void;
  }
}

window.sendDelta = async (deltaBytes: Uint8Array) => {
  gameState.sendDelta(deltaBytes);
};

window.sendInitialStateVector = async (initialStateVector: Uint8Array) => {
  gameState.sendInitialStateVector(initialStateVector);
};
