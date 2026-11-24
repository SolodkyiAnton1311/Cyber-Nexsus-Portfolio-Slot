import { calculateTheoreticalRtp, spinSync } from './game/logic.js';
import { SYMBOL_CODES, SymbolId, type SpinRoundResult } from './game/interface.js';
import { REGULAR_SYMBOLS, SLOT_CONFIG, WAGER_CONFIG } from './game/value.js';

/**
 * Slot simulator.
 *
 * Usage:
 *   npm run simulate                       (1,000,000 spins, line bet 1)
 *   npm run simulate -- 5000000            (spin count as a positional argument)
 *   npm run simulate -- --spins 5000000 --bet 25
 */

interface Options {
  spins: number;
  bet: number;
}

function parseNumber(raw: string, name: string): number {
  const value = Number(raw.replaceAll('_', '').replaceAll(',', ''));
  if (!Number.isInteger(value) || value <= 0) {
    console.error(`Invalid value for ${name}: "${raw}" (expected a positive integer).`);
    process.exit(1);
  }
  return value;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { spins: 1_000_000, bet: SLOT_CONFIG.minBet };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--spins' || arg === '-n') options.spins = parseNumber(argv[++i] ?? '', 'spins');
    else if (arg === '--bet' || arg === '-b') options.bet = parseNumber(argv[++i] ?? '', 'bet');
    else if (arg.startsWith('--spins=')) options.spins = parseNumber(arg.slice(8), 'spins');
    else if (arg.startsWith('--bet=')) options.bet = parseNumber(arg.slice(6), 'bet');
    else positional.push(arg);
  }
  if (positional[0]) options.spins = parseNumber(positional[0], 'spins');
  if (options.bet < SLOT_CONFIG.minBet || options.bet > SLOT_CONFIG.maxBet) {
    console.error(`bet must be in the range ${SLOT_CONFIG.minBet}..${SLOT_CONFIG.maxBet}.`);
    process.exit(1);
  }
  return options;
}

const pct = (value: number, digits = 4): string => `${(value * 100).toFixed(digits)}%`;
const fmt = (value: number): string => value.toLocaleString('en-US');

/** Win buckets by multiple of the total bet (spin payout / totalBet). */
const WIN_BUCKETS: readonly { label: string; max: number }[] = [
  { label: '0x (loss)', max: 0 },
  { label: '0x-1x', max: 1 },
  { label: '1x-2x', max: 2 },
  { label: '2x-5x', max: 5 },
  { label: '5x-10x', max: 10 },
  { label: '10x-25x', max: 25 },
  { label: '25x-100x', max: 100 },
  { label: '100x+', max: Infinity },
];

function bucketIndex(multiplier: number): number {
  if (multiplier === 0) return 0;
  for (let i = 1; i < WIN_BUCKETS.length; i += 1) {
    if (multiplier <= WIN_BUCKETS[i].max) return i;
  }
  return WIN_BUCKETS.length - 1;
}

function run({ spins, bet }: Options): void {
  const totalBetPerSpin = bet * WAGER_CONFIG.totalBetMultiplier;
  const wagered = spins * totalBetPerSpin;

  let totalPayout = 0;
  let basePayout = 0;
  let freePayout = 0;
  let hitSpins = 0; // spins with a base game win
  let anyWinSpins = 0; // spins with any payout (including Free Games)
  let triggers = 0;
  let freeGamesPlayed = 0;
  let maxPayout = 0;
  let sumSquares = 0; // for sigma in bet multiples
  const triggerByScatters = new Map<number, number>();
  const buckets = new Array<number>(WIN_BUCKETS.length).fill(0);
  const bucketPayout = new Array<number>(WIN_BUCKETS.length).fill(0);
  // symbol -> [3-of-a-kind, 4-of-a-kind, 5-of-a-kind] line counts and payout
  const lineCounts = new Map<number, [number, number, number]>();
  const linePayout = new Map<number, number>();

  const countWins = (round: SpinRoundResult): void => {
    for (const win of round.wins) {
      const counts = lineCounts.get(win.symbol) ?? [0, 0, 0];
      counts[win.count - 3] += 1;
      lineCounts.set(win.symbol, counts);
      linePayout.set(win.symbol, (linePayout.get(win.symbol) ?? 0) + win.payout);
    }
  };

  const startedAt = performance.now();
  const progressStep = Math.max(1, Math.floor(spins / 10));

  for (let i = 1; i <= spins; i += 1) {
    const result = spinSync(bet);

    totalPayout += result.payout;
    basePayout += result.baseGamePayout;
    freePayout += result.payout - result.baseGamePayout;
    if (result.baseGamePayout > 0) hitSpins += 1;
    if (result.payout > 0) anyWinSpins += 1;
    if (result.freeGamesAwarded > 0) {
      triggers += 1;
      freeGamesPlayed += result.freeGameResults.length;
      triggerByScatters.set(result.scatterCount, (triggerByScatters.get(result.scatterCount) ?? 0) + 1);
    }
    if (result.payout > maxPayout) maxPayout = result.payout;

    const multiplier = result.payout / totalBetPerSpin;
    sumSquares += multiplier * multiplier;
    const bucket = bucketIndex(multiplier);
    buckets[bucket] += 1;
    bucketPayout[bucket] += result.payout;

    countWins(result);
    for (const freeGame of result.freeGameResults) countWins(freeGame);

    if (i % progressStep === 0 && spins >= 100_000) {
      process.stderr.write(`\r  progress: ${Math.round((i / spins) * 100)}%`);
    }
  }
  if (spins >= 100_000) process.stderr.write('\r                    \r');

  const elapsedSec = (performance.now() - startedAt) / 1000;
  const rtp = totalPayout / wagered;
  const meanMultiplier = totalPayout / wagered; // average win as a multiple of the total bet
  const variance = Math.max(0, sumSquares / spins - meanMultiplier * meanMultiplier);
  const sigma = Math.sqrt(variance);
  // 95% confidence interval for RTP (normal approximation)
  const ci = (1.96 * sigma) / Math.sqrt(spins);
  const theory = calculateTheoreticalRtp();

  const line = '-'.repeat(64);
  console.log(`\n${line}`);
  console.log(' SLOT SIMULATION');
  console.log(line);
  console.log(` Spins:             ${fmt(spins)}`);
  console.log(` Line bet:          ${fmt(bet)}  (paylines: ${WAGER_CONFIG.activePaylines}, per spin: ${fmt(totalBetPerSpin)})`);
  console.log(` Total wagered:     ${fmt(wagered)}`);
  console.log(` Total paid out:    ${fmt(totalPayout)}`);
  console.log(` Time:              ${elapsedSec.toFixed(2)} s  (${fmt(Math.round(spins / Math.max(elapsedSec, 1e-9)))} spins/s)`);

  console.log(`\n RTP`);
  console.log(`   Total RTP:               ${pct(rtp)}  (+/- ${pct(ci)} at 95% confidence)`);
  console.log(`   Base game:               ${pct(basePayout / wagered)}`);
  console.log(`   Free Games:              ${pct(freePayout / wagered)}`);
  console.log(`   Theoretical RTP:         ${pct(theory.totalRtp)}  (base ${pct(theory.baseGameRtp)})`);
  console.log(`   Deviation from theory:   ${((rtp - theory.totalRtp) * 100).toFixed(4)} pp`);

  console.log(`\n FREQUENCIES`);
  console.log(`   Hit frequency (base):    ${pct(hitSpins / spins, 3)}  (1 in ${(spins / Math.max(hitSpins, 1)).toFixed(2)})`);
  console.log(`   Any payout:              ${pct(anyWinSpins / spins, 3)}`);
  console.log(`   Free Games trigger:      ${pct(triggers / spins, 4)}  (1 in ${triggers ? (spins / triggers).toFixed(1) : 'inf'})`);
  for (const count of [3, 4, 5]) {
    console.log(`     - ${count} Scatters:       ${fmt(triggerByScatters.get(count) ?? 0)}`);
  }
  console.log(`   Free Games played:       ${fmt(freeGamesPlayed)}`);

  console.log(`\n VOLATILITY`);
  console.log(`   Sigma (in bet multiples): ${sigma.toFixed(3)}`);
  console.log(`   Max win:                 ${fmt(maxPayout)}  (${(maxPayout / totalBetPerSpin).toFixed(1)}x total bet)`);

  console.log(`\n WIN DISTRIBUTION (multiple of total bet)`);
  console.log(`   ${'Range'.padEnd(16)}${'Spins'.padStart(14)}${'Share'.padStart(12)}${'RTP share'.padStart(14)}`);
  WIN_BUCKETS.forEach((bucket, index) => {
    console.log(
      `   ${bucket.label.padEnd(16)}${fmt(buckets[index]).padStart(14)}${pct(buckets[index] / spins, 3).padStart(12)}${pct(bucketPayout[index] / wagered, 3).padStart(14)}`,
    );
  });

  console.log(`\n LINE WINS BY SYMBOL (base game + Free Games)`);
  console.log(`   ${'Symbol'.padEnd(8)}${'x3'.padStart(12)}${'x4'.padStart(12)}${'x5'.padStart(12)}${'RTP share'.padStart(14)}`);
  const symbolOrder: SymbolId[] = [...REGULAR_SYMBOLS].sort((a, b) => (linePayout.get(b) ?? 0) - (linePayout.get(a) ?? 0));
  for (const symbol of symbolOrder) {
    const counts = lineCounts.get(symbol) ?? [0, 0, 0];
    console.log(
      `   ${SYMBOL_CODES[symbol].padEnd(8)}${fmt(counts[0]).padStart(12)}${fmt(counts[1]).padStart(12)}${fmt(counts[2]).padStart(12)}${pct((linePayout.get(symbol) ?? 0) / wagered, 3).padStart(14)}`,
    );
  }
  console.log(`${line}\n`);
}

run(parseArgs(process.argv.slice(2)));
