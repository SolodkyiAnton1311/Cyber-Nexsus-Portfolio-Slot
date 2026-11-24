import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBoardFromStops, runSpin } from '../dist/game/logic.js';
import {
  calculateTheoreticalRtp,
  countScatters,
  evaluateBoard,
  evaluateLineSymbols,
  freeGamesAward,
} from '../dist/game/logic.js';
import {
  PAYLINES,
  PAYTABLE,
  PAYTABLE_COMBINATION_COUNTS,
  REEL_STRIPS,
  SLOT_CONFIG,
  SYMBOLS,
  WAGER_CONFIG,
} from '../dist/game/value.js';
import { SymbolId, SymbolTier } from '../dist/game/interface.js';

const EXPECTED_COUNTS = {
  [SymbolId.L1]: 11, [SymbolId.L2]: 11, [SymbolId.L3]: 11,
  [SymbolId.L4]: 11, [SymbolId.L5]: 11, [SymbolId.L6]: 11,
  [SymbolId.M1]: 7, [SymbolId.M2]: 7, [SymbolId.M3]: 7,
  [SymbolId.H1]: 4, [SymbolId.H2]: 4,
  [SymbolId.Wild]: 2,
  [SymbolId.Scatter]: 3,
};

test('config describes the approved 5×3 game and ten paylines', () => {
  assert.equal(SLOT_CONFIG.rows, 3);
  assert.equal(SLOT_CONFIG.columns, 5);
  assert.equal(SLOT_CONFIG.stopsPerReel, 100);
  assert.equal(SLOT_CONFIG.symbols.length, 13);
  assert.deepEqual(SLOT_CONFIG.symbols, SYMBOLS);
  assert.deepEqual(SYMBOLS, [
    SymbolId.Wild, SymbolId.H1, SymbolId.H2, SymbolId.M1, SymbolId.M2, SymbolId.M3,
    SymbolId.L1, SymbolId.L2, SymbolId.L3, SymbolId.L4, SymbolId.L5, SymbolId.L6,
    SymbolId.Scatter,
  ]);
  assert.equal(SymbolId.Wild, 0);
  assert.equal(SymbolId.H1, 1);
  assert.equal(SymbolId.H2, 2);
  assert.equal(SymbolId.Scatter, 12);
  assert.deepEqual(PAYTABLE_COMBINATION_COUNTS, [3, 4, 5]);
  assert.deepEqual(PAYTABLE[SymbolId.H1], [150, 600, 2500]);
  assert.deepEqual(PAYTABLE[SymbolId.M1], [75, 300, 1000]);
  assert.deepEqual(PAYTABLE[SymbolId.L1], [30, 120, 500]);
  assert.deepEqual(WAGER_CONFIG, {
    minLineBet: 1,
    maxLineBet: 10_000,
    activePaylines: 10,
    totalBetMultiplier: 10,
  });
  assert.deepEqual(PAYLINES.map(({ rows }) => rows), [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2],
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [0, 1, 2, 2, 1],
    [2, 1, 0, 0, 1], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1],
    [0, 1, 0, 1, 0],
  ]);
});

test('each ordered reel has the approved weights and separated Scatter stops', () => {
  assert.equal(REEL_STRIPS.length, 5);
  for (const reel of REEL_STRIPS) {
    assert.equal(reel.length, 100);
    const counts = Object.fromEntries(SYMBOLS.map((symbol) => [symbol, reel.filter((item) => item === symbol).length]));
    assert.deepEqual(counts, EXPECTED_COUNTS);

    assert.ok(reel.every((symbol) => Number.isInteger(symbol)));
    const scatterStops = reel.flatMap((symbol, index) => symbol === SymbolId.Scatter ? [index] : []);
    assert.equal(scatterStops.length, 3);
    const cyclicGaps = scatterStops.map((stop, index) =>
      (scatterStops[(index + 1) % scatterStops.length] - stop + 100) % 100,
    );
    assert.ok(cyclicGaps.every((gap) => gap >= 32));
  }
});

test('three visible symbols wrap at the end of a reel', () => {
  const board = createBoardFromStops([99, 0, 0, 0, 0]);
  assert.equal(board.length, 3);
  assert.ok(board.every((row) => row.length === 5));
  assert.equal(board[0][0], REEL_STRIPS[0][99]);
  assert.equal(board[1][0], REEL_STRIPS[0][0]);
  assert.equal(board[2][0], REEL_STRIPS[0][1]);
});

test('pays the L-tier award for three left-to-right matches with a Wild substitute', () => {
  const win = evaluateLineSymbols([SymbolId.L1, SymbolId.Wild, SymbolId.L1, SymbolId.M1, SymbolId.H1], 1, 25);
  assert.deepEqual(win, {
    payline: 1,
    symbol: SymbolId.L1,
    tier: SymbolTier.Low,
    count: 3,
    multiplier: PAYTABLE[SymbolId.L1][0],
    payout: 25 * PAYTABLE[SymbolId.L1][0],
  });
});

test('a Wild-led line chooses its best valid symbol and five Wilds pay as High', () => {
  const lowFive = evaluateLineSymbols([SymbolId.Wild, SymbolId.L1, SymbolId.L1, SymbolId.L1, SymbolId.L1], 4, 2);
  assert.equal(lowFive?.symbol, SymbolId.L1);
  assert.equal(lowFive?.multiplier, PAYTABLE[SymbolId.L1][2]);

  const allWild = evaluateLineSymbols([SymbolId.Wild, SymbolId.Wild, SymbolId.Wild, SymbolId.Wild, SymbolId.Wild], 4, 2);
  assert.equal(allWild?.tier, SymbolTier.High);
  assert.equal(allWild?.count, 5);
  assert.equal(allWild?.multiplier, PAYTABLE[SymbolId.H1][2]);
});

test('Scatter awards are 5, 10, or 15 free games and count anywhere', () => {
  assert.equal(freeGamesAward(2), 0);
  assert.equal(freeGamesAward(3), 5);
  assert.equal(freeGamesAward(4), 10);
  assert.equal(freeGamesAward(5), 15);

  const board = Array.from({ length: 3 }, () => Array(5).fill(SymbolId.L1));
  board[0][0] = SymbolId.Scatter;
  board[1][2] = SymbolId.Scatter;
  board[2][4] = SymbolId.Scatter;
  assert.equal(countScatters(board), 3);
  assert.equal(evaluateBoard(board, 10).freeGamesAwarded, 5);
});

test('a paid spin resolves awarded free games without wagers and supports retriggers', async () => {
  let result;
  for (let attempt = 0; attempt < 200_000; attempt += 1) {
    result = await runSpin(10);
    if (result.freeGamesAwarded > 0) break;
  }
  assert.ok(result.freeGamesAwarded > 0, 'expected a free-games trigger');
  assert.equal(result.stops.length, 5);

  const retriggered = result.freeGameResults.reduce((sum, fg) => sum + fg.freeGamesAwarded, 0);
  assert.ok(result.scatterCount >= 3);
  assert.equal(result.freeGameResults.length, result.freeGamesAwarded + retriggered);
  assert.equal(result.totalBet, 100);
  assert.equal(result.payout, result.baseGamePayout + result.freeGameResults.reduce((sum, freeGame) => sum + freeGame.payout, 0));
  assert.equal(result.net, result.payout - 100);
  assert.ok(result.freeGameResults.every((freeGame) => freeGame.totalBet === 0));

  // Verify 3 Scatters during a Free Game award +5 additional Free Games
  const retriggerBoard = Array.from({ length: 3 }, () => Array(5).fill(SymbolId.L1));
  retriggerBoard[0][0] = SymbolId.Scatter;
  retriggerBoard[1][2] = SymbolId.Scatter;
  retriggerBoard[2][4] = SymbolId.Scatter;
  const freeRound = evaluateBoard(retriggerBoard, 10, true);
  assert.equal(freeRound.totalBet, 0);
  assert.equal(freeRound.net, freeRound.payout);
  assert.equal(freeRound.freeGamesAwarded, 5);
});

test('the approved reel weights produce approximately 96.10% total RTP with retriggers', () => {
  const rtp = calculateTheoreticalRtp();
  const singleSpinFg = 0.0332580735;
  const expectedFgWithRetriggers = singleSpinFg / (1 - singleSpinFg);
  assert.ok(Math.abs(rtp.baseGameRtp - 0.9290766280) < 1e-9, `base RTP ${rtp.baseGameRtp}`);
  assert.ok(Math.abs(rtp.expectedFreeGames - expectedFgWithRetriggers) < 1e-9, `expected free games ${rtp.expectedFreeGames}`);
  assert.ok(Math.abs(rtp.totalRtp - 0.9290766280 * (1 + expectedFgWithRetriggers)) < 1e-9, `total RTP ${rtp.totalRtp}`);
});
