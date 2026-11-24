import { Assets, Texture } from 'pixi.js';

/** Mapping from server SymbolId (0..12) to sprite URL (served from ../assets). */
const SYMBOL_URLS: Record<number, string> = {
  0: '/sprites/symbols/symbol_00_wild.svg',
  1: '/sprites/symbols/symbol_01_h1.svg',
  2: '/sprites/symbols/symbol_02_h2.svg',
  3: '/sprites/symbols/symbol_03_m1.svg',
  4: '/sprites/symbols/symbol_04_m2.svg',
  5: '/sprites/symbols/symbol_05_m3.svg',
  6: '/sprites/symbols/symbol_06_l1.svg',
  7: '/sprites/symbols/symbol_07_l2.svg',
  8: '/sprites/symbols/symbol_08_l3.svg',
  9: '/sprites/symbols/symbol_09_l4.svg',
  10: '/sprites/symbols/symbol_10_l5.svg',
  11: '/sprites/symbols/symbol_11_l6.svg',
  12: '/sprites/symbols/symbol_12_scatter.svg',
};

const MACHINE_URLS = {
  bg: '/sprites/machine/bg_cyber_stage.svg',
  reelFrame: '/sprites/machine/reel_frame_5x3.svg',
  reelDivider: '/sprites/machine/reel_divider_laser.svg',
  paylinesBadge: '/sprites/machine/badge_10_paylines.svg',
  winCellFrame: '/sprites/machine/win_cell_frame.svg',
} as const;

const UI_URLS = {
  btnSpin: '/sprites/ui/btn_spin.svg',
  btnBuyBonus: '/sprites/ui/btn_buy_bonus.svg',
  btnMinus: '/sprites/ui/btn_minus.svg',
  btnPlus: '/sprites/ui/btn_plus.svg',
  btnMaxBet: '/sprites/ui/btn_max_bet.svg',
  btnInfo: '/sprites/ui/btn_info.svg',
  panelMeter: '/sprites/ui/panel_display_meter.svg',
  panelWin: '/sprites/ui/panel_win_display.svg',
  panelBottomDock: '/sprites/ui/panel_bottom_dock.svg',
  iconCoin: '/sprites/ui/icon_cyber_coin.svg',
  iconGem: '/sprites/ui/icon_quantum_gem.svg',
} as const;

export interface GameAssets {
  symbols: Record<number, Texture>;
  machine: Record<keyof typeof MACHINE_URLS, Texture>;
  ui: Record<keyof typeof UI_URLS, Texture>;
}

export async function loadAssets(): Promise<GameAssets> {
  const allUrls = [
    ...Object.values(SYMBOL_URLS),
    ...Object.values(MACHINE_URLS),
    ...Object.values(UI_URLS),
  ];

  const loaded = await Assets.load<Texture>(allUrls);

  const symbols: Record<number, Texture> = {};
  for (const [id, url] of Object.entries(SYMBOL_URLS)) {
    symbols[Number(id)] = loaded[url];
  }

  const machine = {} as Record<keyof typeof MACHINE_URLS, Texture>;
  for (const [key, url] of Object.entries(MACHINE_URLS) as [keyof typeof MACHINE_URLS, string][]) {
    machine[key] = loaded[url];
  }

  const ui = {} as Record<keyof typeof UI_URLS, Texture>;
  for (const [key, url] of Object.entries(UI_URLS) as [keyof typeof UI_URLS, string][]) {
    ui[key] = loaded[url];
  }

  return { symbols, machine, ui };
}
