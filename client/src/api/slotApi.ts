import type { CheatMode, SlotConfigResponse, SpinResponse } from '../types/api';

const API_BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api`;

export async function fetchConfig(): Promise<SlotConfigResponse> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/config: ${res.status}`);
  }
  return res.json();
}

export async function requestSpin(bet: number): Promise<SpinResponse> {
  const res = await fetch(`${API_BASE}/spin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Spin request failed: ${res.status}`);
  }

  return res.json();
}

export async function requestBuyBonus(bet: number): Promise<SpinResponse> {
  const res = await fetch(`${API_BASE}/buy-bonus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Buy bonus request failed: ${res.status}`);
  }

  return res.json();
}

export async function requestCheatSpin(bet: number, cheat: CheatMode): Promise<SpinResponse> {
  const res = await fetch(`${API_BASE}/cheat-spin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet, cheat }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Cheat spin request failed: ${res.status}`);
  }

  return res.json();
}
