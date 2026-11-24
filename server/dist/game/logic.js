import { randomInt } from 'node:crypto';
import { COLUMNS, FREE_GAMES_AWARDS, PAYLINES, PAYTABLE, REGULAR_SYMBOLS, REEL_STRIPS, ROWS, SLOT_CONFIG, STOPS_PER_REEL, WAGER_CONFIG, } from './value.js';
import { CheatMode, SymbolId, SymbolTier, } from './interface.js';
function getTier(symbol) {
    if (symbol === SymbolId.H1 || symbol === SymbolId.H2)
        return SymbolTier.High;
    if (symbol === SymbolId.M1 || symbol === SymbolId.M2 || symbol === SymbolId.M3)
        return SymbolTier.Medium;
    return SymbolTier.Low;
}
const TIER_RANK = {
    [SymbolTier.Low]: 1,
    [SymbolTier.Medium]: 2,
    [SymbolTier.High]: 3,
};
export function evaluateLineSymbols(symbols, paylineId, lineBet) {
    if (symbols.length !== COLUMNS || symbols[0] === SymbolId.Scatter)
        return null;
    const candidates = symbols[0] === SymbolId.Wild
        ? REGULAR_SYMBOLS
        : [symbols[0]];
    let best = null;
    for (const symbol of candidates) {
        let count = 0;
        for (const visible of symbols) {
            if (visible !== symbol && visible !== SymbolId.Wild)
                break;
            count += 1;
        }
        if (count < 3)
            continue;
        const tier = getTier(symbol);
        const multiplier = PAYTABLE[symbol][count - 3];
        const candidate = {
            payline: paylineId,
            symbol,
            tier,
            count: count,
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
export function countScatters(board) {
    return board.reduce((total, row) => total + row.filter((symbol) => symbol === SymbolId.Scatter).length, 0);
}
export function freeGamesAward(scatterCount) {
    if (scatterCount >= 5)
        return FREE_GAMES_AWARDS[5];
    if (scatterCount === 4)
        return FREE_GAMES_AWARDS[4];
    if (scatterCount === 3)
        return FREE_GAMES_AWARDS[3];
    return 0;
}
export function evaluateBoard(board, lineBet, isFreeGame = false) {
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
        freeGamesAwarded: freeGamesAward(scatterCount),
    };
}
/** Exact return for a single line, including Scatter-triggered Free Games with retriggers. */
export function calculateTheoreticalRtp() {
    const symbolCounts = REEL_STRIPS.map((reel) => {
        const counts = new Map();
        for (const symbol of reel)
            counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
        return counts;
    });
    let weightedLineMultiplier = 0;
    const sequence = [];
    const visit = (reelIndex, weight) => {
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
    let singleSpinExpectedFg = 0;
    for (let scatterCount = 3; scatterCount <= 5; scatterCount += 1) {
        const combinations = [1, 5, 10, 10, 5, 1][scatterCount];
        const probability = combinations * scatterProbability ** scatterCount * (1 - scatterProbability) ** (5 - scatterCount);
        singleSpinExpectedFg += probability * freeGamesAward(scatterCount);
    }
    // With retriggers enabled, total expected Free Games per paid spin is E1 / (1 - E1)
    const expectedFreeGames = singleSpinExpectedFg / (1 - singleSpinExpectedFg);
    return {
        baseGameRtp,
        expectedFreeGames,
        totalRtp: baseGameRtp * (1 + expectedFreeGames),
    };
}
export function createBoardFromStops(stops) {
    if (stops.length !== COLUMNS || stops.some((stop) => !Number.isInteger(stop) || stop < 0 || stop >= STOPS_PER_REEL)) {
        throw new RangeError(`Expected ${COLUMNS} reel stops in the range 0..${STOPS_PER_REEL - 1}.`);
    }
    const board = Array.from({ length: ROWS }, () => Array(COLUMNS));
    for (let column = 0; column < COLUMNS; column += 1) {
        const reel = REEL_STRIPS[column];
        for (let row = 0; row < ROWS; row += 1) {
            board[row][column] = reel[(stops[column] + row) % STOPS_PER_REEL];
        }
    }
    return board;
}
export function generateStops() {
    return Array.from({ length: COLUMNS }, () => randomInt(STOPS_PER_REEL));
}
/** Generates reel stops that place Scatters on the exact target columns (and none on other columns). */
function generateScatterStops(scatterCols) {
    const scatterSet = new Set(scatterCols);
    return REEL_STRIPS.map((reel, col) => {
        const validStops = [];
        for (let stop = 0; stop < STOPS_PER_REEL; stop += 1) {
            let hasScatter = false;
            for (let row = 0; row < ROWS; row += 1) {
                if (reel[(stop + row) % STOPS_PER_REEL] === SymbolId.Scatter) {
                    hasScatter = true;
                    break;
                }
            }
            if (scatterSet.has(col) ? hasScatter : !hasScatter) {
                validStops.push(stop);
            }
        }
        return validStops[randomInt(validStops.length)];
    });
}
/** Generates reel stops that place `target` on the middle row (payline #1) of every reel. */
function generateLineWinStops(target) {
    const middleRow = 1;
    return REEL_STRIPS.map((reel) => {
        const validStops = [];
        for (let stop = 0; stop < STOPS_PER_REEL; stop += 1) {
            if (reel[(stop + middleRow) % STOPS_PER_REEL] === target) {
                validStops.push(stop);
            }
        }
        return validStops[randomInt(validStops.length)];
    });
}
/**
 * Generates reel stops that place exactly 3 Scatters on reels 1, 3, and 5 (cols 0, 2, 4)
 * in random visible rows, with no Scatters on reels 2 and 4 (cols 1, 3).
 */
export function generateBonusBuyStops() {
    return generateScatterStops([0, 2, 4]);
}
export function generateCheatStops(cheat) {
    switch (cheat) {
        case CheatMode.H1Win:
            return generateLineWinStops(SymbolId.H1);
        case CheatMode.H2Win:
            return generateLineWinStops(SymbolId.H2);
        case CheatMode.WildWin:
            return generateLineWinStops(SymbolId.Wild);
        case CheatMode.Scatter3:
            return generateScatterStops([0, 2, 4]);
        case CheatMode.Scatter4:
            return generateScatterStops([0, 1, 2, 3]);
        case CheatMode.Scatter5:
            return generateScatterStops([0, 1, 2, 3, 4]);
    }
}
function resolveSpin(bet, isFreeGame, forcedStops, wagerMultiplier = 1) {
    if (!Number.isInteger(bet) || bet < SLOT_CONFIG.minBet || bet > SLOT_CONFIG.maxBet) {
        throw new RangeError(`bet must be an integer between ${SLOT_CONFIG.minBet} and ${SLOT_CONFIG.maxBet}.`);
    }
    const stops = forcedStops ?? generateStops();
    const board = createBoardFromStops(stops);
    const evaluation = evaluateBoard(board, bet, isFreeGame);
    const totalBet = isFreeGame ? 0 : evaluation.totalBet * wagerMultiplier;
    const freeGameResults = [];
    if (!isFreeGame) {
        const MAX_FREE_GAMES = 500;
        let remaining = evaluation.freeGamesAwarded;
        while (remaining > 0 && freeGameResults.length < MAX_FREE_GAMES) {
            remaining -= 1;
            const fgRound = resolveSpin(bet, true);
            freeGameResults.push(fgRound);
            if (fgRound.freeGamesAwarded > 0) {
                remaining += fgRound.freeGamesAwarded;
            }
        }
    }
    const baseGamePayout = evaluation.payout;
    const payout = baseGamePayout + freeGameResults.reduce((total, freeGame) => total + freeGame.payout, 0);
    return {
        bet,
        lineBet: bet,
        ...evaluation,
        totalBet,
        stops,
        board,
        baseGamePayout,
        freeGameResults,
        payout,
        net: payout - totalBet,
        isFreeGame,
    };
}
/** Synchronous paid spin (used by the simulator). */
export function spinSync(bet) {
    return resolveSpin(bet, false);
}
/** Runs only when explicitly invoked by the API request handler. */
export async function runSpin(bet) {
    return spinSync(bet);
}
/** Executes a Buy Bonus spin landing 3 Scatters on reels 1, 3, and 5. */
export async function runBonusBuy(bet) {
    return resolveSpin(bet, false, generateBonusBuyStops(), SLOT_CONFIG.bonusBuyMultiplier);
}
/** Executes a developer cheat spin with forced reel stops for the selected preset. */
export async function runCheatSpin(bet, cheat) {
    return resolveSpin(bet, false, generateCheatStops(cheat));
}
//# sourceMappingURL=logic.js.map