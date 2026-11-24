/**
 * Single place for all server names and contracts:
 * enums, symbol names, error codes and interfaces/data types.
 */

// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------

export enum SymbolId {
  Wild = 0,
  H1 = 1,
  H2 = 2,
  M1 = 3,
  M2 = 4,
  M3 = 5,
  L1 = 6,
  L2 = 7,
  L3 = 8,
  L4 = 9,
  L5 = 10,
  L6 = 11,
  Scatter = 12,
}

export enum SymbolTier {
  Low = 0,
  Medium = 1,
  High = 2,
}

/** Short symbol codes (as used in the math / PDF). */
export const SYMBOL_CODES: Readonly<Record<SymbolId, string>> = {
  [SymbolId.Wild]: 'WW',
  [SymbolId.H1]: 'H1',
  [SymbolId.H2]: 'H2',
  [SymbolId.M1]: 'M1',
  [SymbolId.M2]: 'M2',
  [SymbolId.M3]: 'M3',
  [SymbolId.L1]: 'L1',
  [SymbolId.L2]: 'L2',
  [SymbolId.L3]: 'L3',
  [SymbolId.L4]: 'L4',
  [SymbolId.L5]: 'L5',
  [SymbolId.L6]: 'L6',
  [SymbolId.Scatter]: 'SC',
};

/** Human-readable symbol names (high-tech theme). */
export const SYMBOL_NAMES: Readonly<Record<SymbolId, string>> = {
  [SymbolId.Wild]: 'Quantum AI Core',
  [SymbolId.H1]: 'Hyper Rocket',
  [SymbolId.H2]: 'Plasma Blaster',
  [SymbolId.M1]: 'Cyber Jetpack',
  [SymbolId.M2]: 'Energy Battery',
  [SymbolId.M3]: 'AI Microchip',
  [SymbolId.L1]: 'Glyph A',
  [SymbolId.L2]: 'Glyph K',
  [SymbolId.L3]: 'Glyph Q',
  [SymbolId.L4]: 'Glyph J',
  [SymbolId.L5]: 'Glyph 10',
  [SymbolId.L6]: 'Glyph 9',
  [SymbolId.Scatter]: 'Singularity Portal',
};

export const SYMBOL_TIER_NAMES: Readonly<Record<SymbolTier, string>> = {
  [SymbolTier.Low]: 'low',
  [SymbolTier.Medium]: 'medium',
  [SymbolTier.High]: 'high',
};

/** Symbol description for /api/config. */
export interface SymbolInfo {
  id: SymbolId;
  code: string;
  name: string;
  tier: SymbolTier | null;
  tierName: string | null;
}

export type RegularSymbol =
  | SymbolId.L1 | SymbolId.L2 | SymbolId.L3 | SymbolId.L4 | SymbolId.L5 | SymbolId.L6
  | SymbolId.M1 | SymbolId.M2 | SymbolId.M3
  | SymbolId.H1 | SymbolId.H2;

// ---------------------------------------------------------------------------
// API errors
// ---------------------------------------------------------------------------

export enum ErrorCode {
  RateLimited = 'RATE_LIMITED',
  InvalidSpinRequest = 'INVALID_SPIN_REQUEST',
  NotFound = 'NOT_FOUND',
  OriginNotAllowed = 'ORIGIN_NOT_ALLOWED',
  InvalidJson = 'INVALID_JSON',
  BodyTooLarge = 'BODY_TOO_LARGE',
  InternalError = 'INTERNAL_ERROR',
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Game structures
// ---------------------------------------------------------------------------

export type Board = SymbolId[][];

export interface Payline {
  id: number;
  rows: readonly number[];
}

export interface LineWin {
  payline: number;
  symbol: RegularSymbol;
  tier: SymbolTier;
  count: 3 | 4 | 5;
  multiplier: number;
  payout: number;
}

export interface BoardEvaluation {
  wins: LineWin[];
  payout: number;
  totalBet: number;
  net: number;
  scatterCount: number;
  freeGamesAwarded: number;
}

export interface SpinRoundResult extends BoardEvaluation {
  /** Reel stops: 5 elements, one per reel. */
  stops: number[];
  board: Board;
  isFreeGame: boolean;
}

export interface SpinResult extends SpinRoundResult {
  bet: number;
  lineBet: number;
  baseGamePayout: number;
  freeGameResults: SpinRoundResult[];
}

export interface SpinRequest {
  bet: number;
}
