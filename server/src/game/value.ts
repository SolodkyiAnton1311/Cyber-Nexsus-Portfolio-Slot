export const ROWS = 3;
export const COLUMNS = 5;
export const STOPS_PER_REEL = 100;
export const MIN_BET = 1;
export const MAX_BET = 10_000;

import {
  SymbolId,
  SymbolTier,
  SYMBOL_CODES,
  SYMBOL_NAMES,
  SYMBOL_TIER_NAMES,
  type Payline,
  type RegularSymbol,
  type SymbolInfo,
} from './interface.js';

export const REGULAR_SYMBOLS: readonly RegularSymbol[] = [
  SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6,
  SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2,
];

export const SYMBOLS: readonly SymbolId[] = [
  SymbolId.Wild, SymbolId.H1, SymbolId.H2, SymbolId.M1, SymbolId.M2, SymbolId.M3,
  SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6,
  SymbolId.Scatter,
];

function tierOf(symbol: SymbolId): SymbolTier | null {
  if (symbol === SymbolId.H1 || symbol === SymbolId.H2) return SymbolTier.High;
  if (symbol === SymbolId.M1 || symbol === SymbolId.M2 || symbol === SymbolId.M3) return SymbolTier.Medium;
  if (symbol === SymbolId.Wild || symbol === SymbolId.Scatter) return null;
  return SymbolTier.Low;
}

/** Symbol metadata (id, code, name, tier) for the client. */
export const SYMBOL_INFO: readonly SymbolInfo[] = SYMBOLS.map((id) => {
  const tier = tierOf(id);
  return {
    id,
    code: SYMBOL_CODES[id],
    name: SYMBOL_NAMES[id],
    tier,
    tierName: tier === null ? null : SYMBOL_TIER_NAMES[tier],
  };
});

export const PAYLINES: readonly Payline[] = [
  { id: 1, rows: [1, 1, 1, 1, 1] },
  { id: 2, rows: [0, 0, 0, 0, 0] },
  { id: 3, rows: [2, 2, 2, 2, 2] },
  { id: 4, rows: [0, 0, 1, 2, 2] },
  { id: 5, rows: [2, 2, 1, 0, 0] },
  { id: 6, rows: [0, 1, 2, 2, 1] },
  { id: 7, rows: [2, 1, 0, 0, 1] },
  { id: 8, rows: [1, 0, 0, 0, 1] },
  { id: 9, rows: [1, 2, 2, 2, 1] },
  { id: 10, rows: [0, 1, 0, 1, 0] },
];

export const PAYTABLE_COMBINATION_COUNTS = [3, 4, 5] as const;

/** Rows are symbol IDs; columns are 3-, 4- and 5-symbol combinations. */
export const PAYTABLE: readonly (readonly [number, number, number])[] = [
  [0, 0, 0], // Wild is a substitute; it has no direct line award.
  [184, 612, 2447], // H1
  [184, 612, 2447], // H2
  [80, 275, 1040], // M1
  [80, 275, 1040], // M2
  [80, 275, 1040], // M3
  [31, 110, 427], // L1
  [31, 110, 427], // L2
  [31, 110, 427], // L3
  [31, 110, 427], // L4
  [31, 110, 427], // L5
  [31, 110, 427], // L6
  [0, 0, 0], // Scatter has no payline award.
];

export const WAGER_CONFIG = {
  minLineBet: MIN_BET,
  maxLineBet: MAX_BET,
  activePaylines: PAYLINES.length,
  totalBetMultiplier: PAYLINES.length,
} as const;

export const FREE_GAMES_AWARDS = {
  3: 5,
  4: 10,
  5: 15,
} as const;

const REEL_1: readonly SymbolId[] = [
  SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.Scatter, SymbolId.L6, SymbolId.M1, SymbolId.M2, SymbolId.M3,
  SymbolId.H1, SymbolId.H2, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.Wild, SymbolId.M1,
  SymbolId.M2, SymbolId.M3, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2,
  SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.Scatter, SymbolId.H2,
  SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L1,
  SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.H1, SymbolId.H2, SymbolId.L1, SymbolId.L2, SymbolId.L3,
  SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4,
  SymbolId.L5, SymbolId.Scatter, SymbolId.L6, SymbolId.Wild, SymbolId.M1, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5,
  SymbolId.L6, SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5,
  SymbolId.L6, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6
];

const REEL_2: readonly SymbolId[] = [
  SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1,
  SymbolId.Scatter, SymbolId.H2, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.Wild, SymbolId.M1,
  SymbolId.M2, SymbolId.M3, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3,
  SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L2,
  SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.Scatter, SymbolId.L6, SymbolId.L1, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L2,
  SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.H1, SymbolId.H2, SymbolId.L2, SymbolId.L3, SymbolId.L4,
  SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5,
  SymbolId.L6, SymbolId.L1, SymbolId.Wild, SymbolId.M1, SymbolId.L2, SymbolId.L3, SymbolId.Scatter, SymbolId.L4, SymbolId.L5, SymbolId.L6,
  SymbolId.L1, SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6,
  SymbolId.L1, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1
];

const REEL_3: readonly SymbolId[] = [
  SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1,
  SymbolId.H2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.Scatter, SymbolId.L1, SymbolId.L2, SymbolId.Wild, SymbolId.M1,
  SymbolId.M2, SymbolId.M3, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4,
  SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L3,
  SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.Scatter, SymbolId.L3,
  SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.H1, SymbolId.H2, SymbolId.L3, SymbolId.L4, SymbolId.L5,
  SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6,
  SymbolId.L1, SymbolId.L2, SymbolId.Wild, SymbolId.M1, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2,
  SymbolId.M2, SymbolId.Scatter, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1,
  SymbolId.L2, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2
];

const REEL_4: readonly SymbolId[] = [
  SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1,
  SymbolId.H2, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.Wild, SymbolId.M1, SymbolId.M2,
  SymbolId.Scatter, SymbolId.M3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5,
  SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L4,
  SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L4, SymbolId.L5,
  SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.Scatter, SymbolId.L3, SymbolId.H1, SymbolId.H2, SymbolId.L4, SymbolId.L5, SymbolId.L6,
  SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1,
  SymbolId.L2, SymbolId.L3, SymbolId.Wild, SymbolId.M1, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3,
  SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L4, SymbolId.L5, SymbolId.Scatter, SymbolId.L6, SymbolId.L1, SymbolId.L2,
  SymbolId.L3, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L4, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3
];

const REEL_5: readonly SymbolId[] = [
  SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1,
  SymbolId.H2, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.Wild, SymbolId.M1, SymbolId.M2,
  SymbolId.M3, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.Scatter, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6,
  SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L5,
  SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L5, SymbolId.L6,
  SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.H1, SymbolId.H2, SymbolId.L5, SymbolId.L6, SymbolId.Scatter, SymbolId.L1,
  SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.M1, SymbolId.M2, SymbolId.M3, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2,
  SymbolId.L3, SymbolId.L4, SymbolId.Wild, SymbolId.M1, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4,
  SymbolId.M2, SymbolId.M3, SymbolId.H1, SymbolId.H2, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4,
  SymbolId.M1, SymbolId.Scatter, SymbolId.M2, SymbolId.M3, SymbolId.L5, SymbolId.L6, SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4
];

export const REEL_STRIPS: readonly (readonly SymbolId[])[] = [REEL_1, REEL_2, REEL_3, REEL_4, REEL_5];

export const SLOT_CONFIG = {
  rows: ROWS,
  columns: COLUMNS,
  stopsPerReel: STOPS_PER_REEL,
  minBet: MIN_BET,
  maxBet: MAX_BET,
  symbols: SYMBOLS,
  symbolInfo: SYMBOL_INFO,
  paylines: PAYLINES,
  payoutMultipliers: PAYTABLE,
  payoutCombinationCounts: PAYTABLE_COMBINATION_COUNTS,
  freeGamesAwards: FREE_GAMES_AWARDS,
  wager: WAGER_CONFIG,
  lineBet: true,
} as const;

