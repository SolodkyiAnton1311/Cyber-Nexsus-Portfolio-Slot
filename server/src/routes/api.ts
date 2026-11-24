import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { runBonusBuy, runCheatSpin, runSpin } from '../game/logic.js';
import { CheatMode, ErrorCode } from '../game/interface.js';
import { REEL_STRIPS, SLOT_CONFIG } from '../game/value.js';

const spinRequestSchema = z.object({
  bet: z.number().int().min(SLOT_CONFIG.minBet).max(SLOT_CONFIG.maxBet),
}).strict();

const cheatSpinRequestSchema = z.object({
  bet: z.number().int().min(SLOT_CONFIG.minBet).max(SLOT_CONFIG.maxBet),
  cheat: z.nativeEnum(CheatMode),
}).strict();

export function createApiRouter() {
  const router = Router();

  router.get('/config', (_request, response) => {
    response.json({
      game: 'demo-slot',
      rows: SLOT_CONFIG.rows,
      columns: SLOT_CONFIG.columns,
      stopsPerReel: SLOT_CONFIG.stopsPerReel,
      symbols: SLOT_CONFIG.symbols,
      symbolInfo: SLOT_CONFIG.symbolInfo,
      minBet: SLOT_CONFIG.minBet,
      maxBet: SLOT_CONFIG.maxBet,
      lineBet: SLOT_CONFIG.lineBet,
      totalBetFormula: `bet × ${SLOT_CONFIG.paylines.length} paylines`,
      paylines: SLOT_CONFIG.paylines,
      reelStrips: REEL_STRIPS,
      payoutMultipliers: SLOT_CONFIG.payoutMultipliers,
      payoutCombinationCounts: SLOT_CONFIG.payoutCombinationCounts,
      wager: SLOT_CONFIG.wager,
      wildRule: 'WW substitutes for L, M and H symbols, but not SC.',
      scatterRule: 'SC counts anywhere in the 15 visible cells.',
      freeGamesAwards: SLOT_CONFIG.freeGamesAwards,
      bonusBuyMultiplier: SLOT_CONFIG.bonusBuyMultiplier,
      payoutRule: 'One best left-to-right win is paid per payline.',
    });
  });

  router.post(
    '/spin',
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
      limit: Number(process.env.RATE_LIMIT_MAX) || 60,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: ErrorCode.RateLimited, message: 'Too many spin requests. Try again shortly.' } },
    }),
    async (request, response) => {
      const parsed = spinRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return response.status(400).json({
          error: {
            code: ErrorCode.InvalidSpinRequest,
            message: `bet must be an integer between ${SLOT_CONFIG.minBet} and ${SLOT_CONFIG.maxBet}.`,
            details: parsed.error.issues.map(({ path, message }) => ({ path, message })),
          },
        });
      }

      const result = await runSpin(parsed.data.bet);
      return response.json({ roundId: randomUUID(), ...result });
    },
  );

  router.post(
    '/buy-bonus',
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
      limit: Number(process.env.RATE_LIMIT_MAX) || 60,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: ErrorCode.RateLimited, message: 'Too many spin requests. Try again shortly.' } },
    }),
    async (request, response) => {
      const parsed = spinRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return response.status(400).json({
          error: {
            code: ErrorCode.InvalidSpinRequest,
            message: `bet must be an integer between ${SLOT_CONFIG.minBet} and ${SLOT_CONFIG.maxBet}.`,
            details: parsed.error.issues.map(({ path, message }) => ({ path, message })),
          },
        });
      }

      const result = await runBonusBuy(parsed.data.bet);
      return response.json({ roundId: randomUUID(), ...result });
    },
  );

  router.post('/cheat-spin', async (request, response) => {
    const parsed = cheatSpinRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        error: {
          code: ErrorCode.InvalidSpinRequest,
          message: 'Invalid cheat spin request.',
          details: parsed.error.issues.map(({ path, message }) => ({ path, message })),
        },
      });
    }

    const result = await runCheatSpin(parsed.data.bet, parsed.data.cheat);
    return response.json({ roundId: randomUUID(), ...result });
  });

  return router;
}
