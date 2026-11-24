import { randomInt } from 'node:crypto';

import {
  COLUMNS,
  FREE_GAMES_AWARDS,
  PAYLINES,
  PAYTABLE,
  REGULAR_SYMBOLS,
  REEL_STRIPS,
  ROWS,
  SLOT_CONFIG,
  STOPS_PER_REEL,
  WAGER_CONFIG,
} from './value.js';
import {
  SymbolId,
  SymbolTier,
  type Board,
  type BoardEvaluation,
  type LineWin,
  type RegularSymbol,
  type SpinResult,
  type SpinRoundResult,
} from './interface.js';

export type { BoardEvaluation, SpinResult, SpinRoundResult };

function getTier(symbol: RegularSymbol): SymbolTier {
  if (symbol === SymbolId.H1 || symbol === SymbolId.H2) return SymbolTier.High;
  if (symbol === SymbolId.M1 || symbol === SymbolId.M2 || symbol === SymbolId.M3) return SymbolTier.Medium;
  return SymbolTier.Low;
}

const TIER_RANK: Record<SymbolTier, number> = {
  [SymbolTier.Low]: 1,
  [SymbolTier.Medium]: 2,
  [SymbolTier.High]: 3,
};

export function evaluateLineSymbols(symbols: readonly SymbolId[], paylineId: number, lineBet: number): LineWin | null {
  if (symbols.length !== COLUMNS || symbols[0] === SymbolId.Scatter) return null;

  const candidates: readonly RegularSymbol[] = symbols[0] === SymbolId.Wild
    ? REGULAR_SYMBOLS
    : [symbols[0] as RegularSymbol];

  let best: LineWin | null = null;
  for (const symbol of candidates) {
    let count = 0;
    for (const visible of symbols) {
      if (visible !== symbol && visible !== SymbolId.Wild) break;
      count += 1;
    }

    if (count < 3) continue;
    const tier = getTier(symbol);
    const multiplier = PAYTABLE[symbol][count - 3];
    const candidate: LineWin = {
      payline: paylineId,
      symbol,
      tier,
      count: count as 3 | 4 | 5,
      multiplier,
      payout: lineBet * multiplier,
    };
    if (!best || candidate.payout > best.payout ||
      (candidate.payout === best.payout && TIER_RANK[candidate.tier] > TIER_RANK[best.tier])) {
      best = candidate;
    }
  }
  return best;
}

export function countScatters(board: readonly (readonly SymbolId[])[]): number {
  return board.reduce((total, row) => total + row.filter((symbol) => symbol === SymbolId.Scatter).length, 0);
}

export function freeGamesAward(scatterCount: number): number {
  if (scatterCount >= 5) return FREE_GAMES_AWARDS[5];
  if (scatterCount === 4) return FREE_GAMES_AWARDS[4];
  if (scatterCount === 3) return FREE_GAMES_AWARDS[3];
  return 0;
}

export function evaluateBoard(board: readonly (readonly SymbolId[])[], lineBet: number, isFreeGame = false): BoardEvaluation {
  const wins = PAYLINES.flatMap((payline) => {
    const sequence = payline.rows.map((row, column) => board[row][column]);
    const win = evaluateLineSymbols(sequence, payline.id, lineBet);
    return win ? [win] : [];
  });
  const payout = wins.reduce((total, win) => total + win.payout, 0);
  const totalBet = isFreeGame ? 0 : lineBet * WAGER_CONFIG.totalBetMultiplier;
  const scatterCount = countScatters(board);

  return {
    wins,
    payout,
    totalBet,
    net: payout - totalBet,
    scatterCount,
    freeGamesAwarded: isFreeGame ? 0 : freeGamesAward(scatterCount),
  };
}

/** Exact return for a single line, including the Scatter-triggered free-game expectation. */
export function calculateTheoreticalRtp(): { baseGameRtp: number; expectedFreeGames: number; totalRtp: number } {
  const symbolCounts = REEL_STRIPS.map((reel) => {
    const counts = new Map<SymbolId, number>();
    for (const symbol of reel) counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
    return counts;
  });

  let weightedLineMultiplier = 0;
  const sequence: SymbolId[] = [];
  const visit = (reelIndex: number, weight: number): void => {
    if (reelIndex === COLUMNS) {
      weightedLineMultiplier += (evaluateLineSymbols(sequence, 0, 1)?.multiplier ?? 0) * weight;
      return;
    }
    for (const [symbol, count] of symbolCounts[reelIndex]) {
      sequence.push(symbol);
      visit(reelIndex + 1, weight * count);
      sequence.pop();
    }
  };
  visit(0, 1);

  const baseGameRtp = weightedLineMultiplier / STOPS_PER_REEL ** COLUMNS;
  const scatterProbability = 0.09;
  let expectedFreeGames = 0;
  for (let scatterCount = 3; scatterCount <= 5; scatterCount += 1) {
    const combinations = [1, 5, 10, 10, 5, 1][scatterCount];
    const probability = combinations * scatterProbability ** scatterCount * (1 - scatterProbability) ** (5 - scatterCount);
    expectedFreeGames += probability * freeGamesAward(scatterCount);
  }

  return {
    baseGameRtp,
    expectedFreeGames,
    totalRtp: baseGameRtp * (1 + expectedFreeGames),
  };
}

export function createBoardFromStops(stops: readonly number[]): Board {
  if (stops.length !== COLUMNS || stops.some((stop) => !Number.isInteger(stop) || stop < 0 || stop >= STOPS_PER_REEL)) {
    throw new RangeError(`Expected ${COLUMNS} reel stops in the range 0..${STOPS_PER_REEL - 1}.`);
  }

  const board = Array.from({ length: ROWS }, () => Array<SymbolId>(COLUMNS));
  for (let column = 0; column < COLUMNS; column += 1) {
    const reel = REEL_STRIPS[column];
    for (let row = 0; row < ROWS; row += 1) {
      board[row][column] = reel[(stops[column] + row) % STOPS_PER_REEL];
    }
  }
  return board;
}

export function generateStops(): number[] {
  return Array.from({ length: COLUMNS }, () => randomInt(STOPS_PER_REEL));
}

function resolveSpin(bet: number, isFreeGame: boolean): SpinResult {
  if (!Number.isInteger(bet) || bet < SLOT_CONFIG.minBet || bet > SLOT_CONFIG.maxBet) {
    throw new RangeError(`bet must be an integer between ${SLOT_CONFIG.minBet} and ${SLOT_CONFIG.maxBet}.`);
  }

  const stops = generateStops();
  const board = createBoardFromStops(stops);
  const evaluation = evaluateBoard(board, bet, isFreeGame);
  const freeGameResults: SpinRoundResult[] = isFreeGame
    ? []
    : Array.from(
      { length: evaluation.freeGamesAwarded },
      () => resolveSpin(bet, true),
    );
  const baseGamePayout = evaluation.payout;
  const payout = baseGamePayout + freeGameResults.reduce((total, freeGame) => total + freeGame.payout, 0);

  return {
    bet,
    lineBet: bet,
    ...evaluation,
    stops,
    board,
    baseGamePayout,
    freeGameResults,
    payout,
    net: payout - evaluation.totalBet,
    isFreeGame,
  };
}

/** Synchronous paid spin (used by the simulator). */
export function spinSync(bet: number): SpinResult {
  return resolveSpin(bet, false);
}

/** Runs only when explicitly invoked by the API request handler. */
export async function runSpin(bet: number): Promise<SpinResult> {
  return spinSync(bet);
}
