import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../dist/app.js';

async function withServer(run, app = createApp()) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      // Close fetch keep-alive connections as well, including on Node 18.12.
      server.closeAllConnections?.();
    });
  }
}

test('GET /healthz responds with status ok', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});

test('GET /api/config publishes the approved dimensions, reels and rules', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/config`);
    const config = await response.json();
    assert.equal(response.status, 200);
    assert.equal(config.rows, 3);
    assert.equal(config.columns, 5);
    assert.equal(config.paylines.length, 10);
    assert.equal(config.symbols.length, 13);
    assert.deepEqual(config.symbols, Array.from({ length: 13 }, (_, id) => id));
    assert.ok(config.symbols.every(Number.isInteger));
    assert.equal(config.reelStrips.length, 5);
    assert.ok(config.reelStrips.every((reel) => reel.length === 100 && reel.every(Number.isInteger)));
    assert.deepEqual(config.freeGamesAwards, { 3: 5, 4: 10, 5: 15 });
    assert.deepEqual(config.payoutCombinationCounts, [3, 4, 5]);
    assert.deepEqual(config.payoutMultipliers[1], [184, 612, 2447]);
    assert.deepEqual(config.payoutMultipliers[3], [80, 275, 1040]);
    assert.deepEqual(config.payoutMultipliers[6], [31, 110, 427]);
    assert.deepEqual(config.wager, {
      minLineBet: 1,
      maxLineBet: 10_000,
      activePaylines: 10,
      totalBetMultiplier: 10,
    });
  });
});

test('spin runs only for a valid API request with a bet', async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/config`);

    const invalid = await fetch(`${baseUrl}/api/spin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bet: 0 }),
    });
    assert.equal(invalid.status, 400);

    const valid = await fetch(`${baseUrl}/api/spin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bet: 25 }),
    });
    assert.equal(valid.status, 200);
    const spin = await valid.json();
    assert.equal(spin.stops.length, 5);
    assert.ok(spin.stops.every((stop) => Number.isInteger(stop) && stop >= 0 && stop < 100));
  });
});

test('POST /api/spin returns server-generated paid and bonus-round totals', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/spin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bet: 25 }),
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.bet, 25);
    assert.equal(result.lineBet, 25);
    assert.equal(result.totalBet, 250);
    assert.match(result.roundId, /^[0-9a-f-]{36}$/i);
    assert.equal(result.board.length, 3);
    assert.ok(result.board.every((row) => row.length === 5 && row.every(Number.isInteger)));
    assert.equal(result.payout, result.baseGamePayout + result.freeGameResults.reduce((sum, freeGame) => sum + freeGame.payout, 0));
    assert.equal(result.net, result.payout - result.totalBet);
    assert.equal(result.freeGameResults.length, result.freeGamesAwarded);
  });
});

test('POST /api/spin rejects invalid bets and extra client-controlled fields', async () => {
  await withServer(async (baseUrl) => {
    for (const body of [{ bet: 0 }, { bet: 1.5 }, { bet: 10_001 }, { bet: 10, board: [['forged']] }]) {
      const response = await fetch(`${baseUrl}/api/spin`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, 'INVALID_SPIN_REQUEST');
    }
  });
});

test('API returns consistent errors for malformed JSON and unknown routes', async () => {
  await withServer(async (baseUrl) => {
    const badJson = await fetch(`${baseUrl}/api/spin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad json',
    });
    assert.equal(badJson.status, 400);
    assert.equal((await badJson.json()).error.code, 'INVALID_JSON');

    const missing = await fetch(`${baseUrl}/missing`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  });
});

test('API denies an origin not on the allowlist', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/config`, { headers: { origin: 'https://not-allowed.example' } });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, 'ORIGIN_NOT_ALLOWED');
  });
});
