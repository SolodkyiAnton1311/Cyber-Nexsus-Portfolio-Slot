import type { LineWin, SlotConfigResponse, SpinResponse, SpinRoundResult } from '../types/api';

export class WinMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WinMismatchError';
  }
}

export interface LocalEvaluation {
  board: number[][];
  wins: LineWin[];
  payout: number;
  scatterCount: number;
  freeGamesAwarded: number;
}

/**
 * Independently builds the visible board from reel stops and evaluates all paylines
 * and Scatters on the client using only `/api/config` rules.
 */
export function evaluateStopsLocally(
  config: SlotConfigResponse,
  stops: readonly number[],
  lineBet: number,
  isFreeGame = false,
): LocalEvaluation {
  const {
    rows,
    columns,
    stopsPerReel,
    reelStrips,
    paylines,
    payoutMultipliers,
    symbolInfo,
    freeGamesAwards,
  } = config;

  const wildId = symbolInfo.find((s) => s.code === 'WW')?.id ?? 0;
  const scatterId = symbolInfo.find((s) => s.code === 'SC')?.id ?? 12;
  const regularSymbols = symbolInfo.filter((s) => s.tier !== null);

  // 1. Reconstruct visible board from stops + reelStrips
  const board: number[][] = Array.from({ length: rows }, () => Array<number>(columns));
  let scatterCount = 0;
  for (let col = 0; col < columns; col += 1) {
    const strip = reelStrips[col];
    for (let row = 0; row < rows; row += 1) {
      const symId = strip[(stops[col] + row) % stopsPerReel];
      board[row][col] = symId;
      if (symId === scatterId) scatterCount += 1;
    }
  }

  // 2. Evaluate each payline left-to-right
  const wins: LineWin[] = [];
  for (const payline of paylines) {
    const lineSymbols = payline.rows.map((row, col) => board[row][col]);
    const first = lineSymbols[0];
    if (first === scatterId) continue;

    const candidates =
      first === wildId
        ? regularSymbols
        : regularSymbols.filter((s) => s.id === first);

    let best: LineWin | null = null;
    for (const sym of candidates) {
      let count = 0;
      for (const visible of lineSymbols) {
        if (visible !== sym.id && visible !== wildId) break;
        count += 1;
      }
      if (count < 3) continue;

      const multiplier = payoutMultipliers[sym.id][count - 3];
      const payout = lineBet * multiplier;
      const tier = sym.tier!;

      if (
        !best ||
        payout > best.payout ||
        (payout === best.payout && tier > best.tier)
      ) {
        best = {
          payline: payline.id,
          symbol: sym.id,
          tier,
          count: count as 3 | 4 | 5,
          multiplier,
          payout,
        };
      }
    }

    if (best) wins.push(best);
  }

  const payout = wins.reduce((sum, w) => sum + w.payout, 0);
  let freeGamesAwarded = 0;
  if (scatterCount >= 5) freeGamesAwarded = freeGamesAwards[5] ?? 0;
  else if (scatterCount === 4) freeGamesAwarded = freeGamesAwards[4] ?? 0;
  else if (scatterCount === 3) freeGamesAwarded = freeGamesAwards[3] ?? 0;

  return { board, wins, payout, scatterCount, freeGamesAwarded };
}

/**
 * Compares the client's independent calculation for one round (base or free game)
 * against the server's SpinRoundResult. Throws WinMismatchError on any divergence.
 */
export function verifyRoundWins(
  config: SlotConfigResponse,
  round: SpinRoundResult,
  lineBet: number,
  expectedPayout: number = round.payout,
  label = 'Round',
): LineWin[] {
  const local = evaluateStopsLocally(config, round.stops, lineBet, round.isFreeGame);

  // 1. Verify board cells match
  for (let r = 0; r < config.rows; r += 1) {
    for (let c = 0; c < config.columns; c += 1) {
      if (local.board[r][c] !== round.board[r][c]) {
        throw new WinMismatchError(
          `${label} board mismatch at [${r}][${c}]: client=${local.board[r][c]}, server=${round.board[r][c]}`,
        );
      }
    }
  }

  // 2. Verify Scatter count and Free Games award
  if (local.scatterCount !== round.scatterCount) {
    throw new WinMismatchError(
      `${label} scatter mismatch: client=${local.scatterCount}, server=${round.scatterCount}`,
    );
  }
  if (local.freeGamesAwarded !== round.freeGamesAwarded) {
    throw new WinMismatchError(
      `${label} free games mismatch: client=${local.freeGamesAwarded}, server=${round.freeGamesAwarded}`,
    );
  }

  // 3. Verify round payout matches
  if (local.payout !== expectedPayout) {
    throw new WinMismatchError(
      `${label} payout mismatch: client=${local.payout}, server=${expectedPayout}`,
    );
  }

  // 4. Verify every winning payline matches
  if (local.wins.length !== round.wins.length) {
    throw new WinMismatchError(
      `${label} win count mismatch: client=${local.wins.length}, server=${round.wins.length}`,
    );
  }

  for (let i = 0; i < local.wins.length; i += 1) {
    const cw = local.wins[i];
    const sw = round.wins[i];
    if (
      cw.payline !== sw.payline ||
      cw.symbol !== sw.symbol ||
      cw.count !== sw.count ||
      cw.multiplier !== sw.multiplier ||
      cw.payout !== sw.payout
    ) {
      throw new WinMismatchError(
        `${label} payline #${sw.payline} mismatch: client=${JSON.stringify(cw)}, server=${JSON.stringify(sw)}`,
      );
    }
  }

  return local.wins;
}

/** Verifies the base game round of a SpinResponse (including retrigger totals). */
export function verifySpinWins(
  config: SlotConfigResponse,
  serverResult: SpinResponse,
): LineWin[] {
  const retriggered = serverResult.freeGameResults.reduce(
    (sum, fg) => sum + fg.freeGamesAwarded,
    0,
  );
  const expectedTotalFg = serverResult.freeGamesAwarded + retriggered;
  if (serverResult.freeGameResults.length !== expectedTotalFg) {
    throw new WinMismatchError(
      `Free game results count mismatch: expected=${expectedTotalFg} (initial=${serverResult.freeGamesAwarded} + retriggered=${retriggered}), received=${serverResult.freeGameResults.length}`,
    );
  }
  return verifyRoundWins(
    config,
    serverResult,
    serverResult.lineBet,
    serverResult.baseGamePayout,
    'Base spin',
  );
}
