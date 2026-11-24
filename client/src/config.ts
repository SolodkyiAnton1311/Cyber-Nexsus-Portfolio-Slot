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
