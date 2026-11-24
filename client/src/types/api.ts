export interface Payline {
  id: number;
  rows: number[];
}

export interface SymbolInfo {
  id: number;
  code: string;
  name: string;
  tier: number | null;
  tierName: string | null;
}

export interface WagerConfig {
  minLineBet: number;
  maxLineBet: number;
  activePaylines: number;
  totalBetMultiplier: number;
}

export interface SlotConfigResponse {
  game: string;
  rows: number;
  columns: number;
  stopsPerReel: number;
  symbols: number[];
  symbolInfo: SymbolInfo[];
  minBet: number;
  maxBet: number;
  lineBet: boolean;
  paylines: Payline[];
  reelStrips: number[][];
  payoutMultipliers: [number, number, number][];
  payoutCombinationCounts: [3, 4, 5];
  wager: WagerConfig;
  freeGamesAwards: Record<number, number>;
}

export interface LineWin {
  payline: number;
  symbol: number;
  tier: number;
  count: 3 | 4 | 5;
  multiplier: number;
  payout: number;
}

export interface SpinRoundResult {
  stops: number[];
  board: number[][];
  wins: LineWin[];
  payout: number;
  totalBet: number;
  net: number;
  scatterCount: number;
  freeGamesAwarded: number;
  isFreeGame: boolean;
}

export interface SpinResponse extends SpinRoundResult {
  roundId: string;
  bet: number;
  lineBet: number;
  baseGamePayout: number;
  freeGameResults: SpinRoundResult[];
}
