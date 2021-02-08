import {GameState} from './GameState';

export interface EventDef<P extends {}> {
  reducer(state: GameState, params: P): GameState;
}
