import { Container, Graphics, Sprite } from 'pixi.js';
import type { GameAssets } from '../assets';
import { FRAME_BOUNDS } from '../config';
import type { LineWin, SlotConfigResponse } from '../types/api';
import { Reel } from './Reel';
import { WinOverlay } from './WinOverlay';

export class SlotMachine extends Container {
  private readonly reelsLayer = new Container();
  private readonly reels: Reel[] = [];
  private readonly winOverlay: WinOverlay;
  private readonly config: SlotConfigResponse;

  private readonly columns: number;
  private readonly rows: number;
  private readonly colWidth: number;
  private readonly colStep: number;
  private readonly rowHeight: number;

  constructor(assets: GameAssets, config: SlotConfigResponse) {
    super();

    this.config = config;
    this.columns = config.columns;
    this.rows = config.rows;
    this.colWidth =
      (FRAME_BOUNDS.windowWidth - (this.columns - 1) * FRAME_BOUNDS.colGap) / this.columns;
    this.colStep = this.colWidth + FRAME_BOUNDS.colGap;
    this.rowHeight = FRAME_BOUNDS.windowHeight / this.rows;

    const frame = new Sprite(assets.machine.reelFrame);
    this.addChild(frame);

    const mask = new Graphics()
    .rect(
      FRAME_BOUNDS.windowX,
      FRAME_BOUNDS.windowY,
     FRAME_BOUNDS.windowWidth,
      FRAME_BOUNDS.windowHeight,
    )
    .fill(0xffffff);
    this.addChild(mask);
    this.reelsLayer.mask = mask;
    this.addChild(this.reelsLayer);

    for (let col = 0; col < this.columns; col += 1) {
      const reel = new Reel(
        config.reelStrips[col],
        assets,
        this.rows,
        this.colWidth,
        this.rowHeight,
      );
      reel.x = FRAME_BOUNDS.windowX + col * this.colStep;
      reel.y = FRAME_BOUNDS.windowY;
      this.reelsLayer.addChild(reel);
      this.reels.push(reel);
    }

    for (let i = 0; i < this.columns - 1; i += 1) {
      const divider = new Sprite(assets.machine.reelDivider);
      divider.anchor.set(0.5, 0);
      divider.x =
        FRAME_BOUNDS.windowX +
        (i + 1) * this.colWidth +
        i * FRAME_BOUNDS.colGap +
        FRAME_BOUNDS.colGap / 2;
      divider.y = FRAME_BOUNDS.dividerY;
      this.addChild(divider);
    }

    this.winOverlay = new WinOverlay(
      assets,
      config.paylines,
      this.colWidth,
      this.colStep,
      this.rowHeight,
    );
    this.addChild(this.winOverlay);

    const leftBadge = new Sprite(assets.machine.paylinesBadge);
    leftBadge.anchor.set(0.5);
    leftBadge.position.set(FRAME_BOUNDS.badgeOffsetX, FRAME_BOUNDS.height / 2);
    this.addChild(leftBadge);

    const rightBadge = new Sprite(assets.machine.paylinesBadge);
    rightBadge.anchor.set(0.5);
    rightBadge.position.set(
      FRAME_BOUNDS.width - FRAME_BOUNDS.badgeOffsetX,
      FRAME_BOUNDS.height / 2,
    );
    this.addChild(rightBadge);

    this.pivot.set(FRAME_BOUNDS.width / 2, FRAME_BOUNDS.height / 2);
  }

  public setStops(stops: readonly number[]): void {
    for (let col = 0; col < this.reels.length; col += 1) {
      this.reels[col].setStop(stops[col]);
    }
  }

  public spinToStops(stops: readonly number[]): Promise<void> {
    const animations = this.reels.map((reel, col) => {
      const spinDurationSec = 0.6 + col * 0.22;
      return reel.spinTo(stops[col], spinDurationSec);
    });
    return Promise.all(animations).then(() => undefined);
  }

  public slamStop(): void {
    for (const reel of this.reels) {
      reel.slamStop();
    }
  }

  public showWins(
    wins: readonly LineWin[],
    board?: readonly (readonly number[])[],
    highlightScatters = false,
  ): void {
    this.winOverlay.showWins(wins);

    if (!board) return;

    const wildId = this.config.symbolInfo.find((s) => s.code === 'WW')?.id ?? 0;
    const h1Id = this.config.symbolInfo.find((s) => s.code === 'H1')?.id ?? 1;
    const h2Id = this.config.symbolInfo.find((s) => s.code === 'H2')?.id ?? 2;
    const scId = this.config.symbolInfo.find((s) => s.code === 'SC')?.id ?? 12;

    // Animate Wild, H1 (Rocket) & H2 (Blaster) symbols that participated in winning paylines
    for (const win of wins) {
      const payline = this.config.paylines.find((p) => p.id === win.payline);
      if (!payline) continue;
      for (let col = 0; col < win.count; col += 1) {
        const row = payline.rows[col];
        const symId = board[row][col];
        if (symId === wildId) {
          this.reels[col].animateRow(row, 'wild');
        } else if (symId === h1Id) {
          this.reels[col].animateRow(row, 'h1');
        } else if (symId === h2Id) {
          this.reels[col].animateRow(row, 'h2');
        }
      }
    }

    // Animate Scatter (Portal) symbols when 3+ Scatters triggered Free Games / Retrigger
    if (highlightScatters) {
      for (let row = 0; row < this.rows; row += 1) {
        for (let col = 0; col < this.columns; col += 1) {
          if (board[row][col] === scId) {
            this.reels[col].animateRow(row, 'scatter');
          }
        }
      }
    }
  }

  public clearWins(): void {
    this.winOverlay.clearWins();
    for (const reel of this.reels) {
      reel.clearRowAnimations();
    }
  }

  public getWinShowcaseMs(): number {
    return this.winOverlay.getFullShowcaseMs();
  }

  public update(deltaSeconds: number): void {
    for (const reel of this.reels) {
      reel.update(deltaSeconds);
    }
    this.winOverlay.update(deltaSeconds);
  }
}
