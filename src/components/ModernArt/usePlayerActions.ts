/* eslint @typescript-eslint/no-unused-vars : "warn" */
import {ModernArtEvent} from './events/types';

export interface PlayerActions {
  startGame(): void;
  step(): void;
  startAuction(idx: number | number[]): void;
  submitBid(bidAmount: number): void;
  finishAuction(): void;
  skipBid(): void;
  skipDouble(): void;
}

// translate <Player/> callbacks to game events emitted
// TODO: copy paste logic from src/components/Game.js
export const usePlayerActions = (
  dispatch: (event: ModernArtEvent) => Promise<void>,
  playerId: string
): PlayerActions => ({
  startGame() {
    dispatch({
      type: 'start_game',
      params: {
        playerId,
      },
    });
    // TODO
  },
  step() {
    dispatch({
      type: 'step',
      params: {
        playerId,
      },
    });
  },
  startAuction(idx) {
    dispatch({
      type: 'start_auction',
      params: {
        playerId,
        idx,
      },
    });
  },
  submitBid(bidAmount) {
    dispatch({
      type: 'submit_bid',
      params: {
        playerId,
        bidAmount,
      },
    });
  },
  finishAuction() {
    dispatch({
      type: 'finish_auction',
      params: {
        playerId,
      },
    });
  },
  skipBid() {
    dispatch({
      type: 'skip_bid',
      params: {
        playerId,
      },
    });
  },
  skipDouble() {
    dispatch({
      type: 'skip_double',
      params: {
        playerId,
      },
    });
  },
});
