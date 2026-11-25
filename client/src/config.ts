/** Logical stage size (16:9). */
export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 900;

/** Local demo wallet & bet presets (line bet). */
export const INITIAL_BALANCE = 100_000;
export const BET_STEPS = [1, 2, 5, 10, 25, 50, 100, 500, 1000, 10_000] as const;

/** Physical dimensions of reel_frame_5x3.svg and machine placement on stage. */
export const FRAME_BOUNDS = {
  width: 1100,
  height: 680,
  windowX: 44,
  windowY: 44,
  windowWidth: 1012,
  windowHeight: 592,
  colGap: 8,
  dividerY: 40,
  badgeOffsetX: 10,
  stageScale: 0.92,
  stageOffsetY: -15,
} as const;

/** Layout coordinates for Top & Bottom HUD on the 1600x900 stage. */
export const HUD_LAYOUT = {
  topY: 54,
  buyBonusX: 115,
  buyBonusY: STAGE_HEIGHT / 2 + FRAME_BOUNDS.stageOffsetY,
  buyBonusSize: 156,
  balancePanelX: 1180,
  balancePanelWidth: 340,
  balancePanelHeight: 72,
  coinOffsetX: -136,
  coinSize: 52,
  infoBtnX: 1410,
  infoBtnSize: 64,
  soundBtnX: 1490,
  soundBtnSize: 64,

  dockX: STAGE_WIDTH / 2,
  dockY: 836,
  dockWidth: 1200,
  dockHeight: 104,
  btnMinusX: 266,
  betBoxX: 374,
  betBoxWidth: 144,
  betBoxHeight: 56,
  btnPlusX: 482,
  btnSmallSize: 56,
  btnMaxBetX: 558,
  btnMaxBetWidth: 78,
  btnMaxBetHeight: 56,
  winPanelX: 858,
  winPanelWidth: 496,
  winPanelHeight: 68,
  btnSpinX: 1238,
  btnSpinWidth: 236,
  btnSpinHeight: 82,
} as const;
