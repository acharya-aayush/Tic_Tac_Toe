export interface Player {
  id: string;
  name: string;
  symbol: 'X' | 'O';
  score: number;
  highScore: number;
}

export type GameBoard = Array<string | null>;

export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  currentTurn: string | null;
  winner: string | null;
  winningLine: number[] | null;
  board: GameBoard;
  settings: {
    visualEffects: boolean;
  };
  lastMove: number | null;
}