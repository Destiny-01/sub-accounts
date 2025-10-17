export interface Guess {
  turnIndex: number;
  digits: string[];
  result?: {
    breached: number;
    injured: number;
  };
  timestamp: number;
  txHash?: string;
  pending?: boolean;
}

export interface RoomState {
  roomId: string;
  playerAddress: string;
  opponentAddress: string;
  currentTurn: string;
  wager: string;
  guesses: Guess[];
  playerVault: string[];
  gameStatus: "waiting" | "active" | "completed";
  winner?: string;
}

export interface ResultPosted {
  roomId: string;
  turnIndex: number;
  targetPlayer: string;
  signedPlainResult: {
    breached: number;
    injured: number;
  };
  resultCipher: string;
  signature: string;
}

// Room phase enum
export enum RoomPhase {
  WAITING_FOR_JOIN = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}
