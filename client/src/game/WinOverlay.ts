import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { GameAssets } from '../assets';
import { FRAME_BOUNDS } from '../config';
import type { LineWin, Payline } from '../types/api';

/** Distinct neon colors for each of the 10 paylines. */
const PAYLINE_COLORS = [
  0x00ff88, // 1: Emerald
  0x00f0ff, // 2: Cyan
  0xffd000, // 3: Gold
  0xff2cdf, // 4: Magenta
  0xff5e3a, // 5: Neon Orange
  0x7c5cff, // 6: Electric Violet
  0x38ffda, // 7: Mint
  0xff2a54, // 8: Crimson
  0xaaff00, // 9: Lime
  0x4da6ff, // 10: Sky Blue
] as const;

const ALL_WINS_DURATION_SEC = 1.5;
const SINGLE_WIN_DURATION_SEC = 1.25;

export class WinOverlay extends Container {
  private readonly assets: GameAssets;
  private readonly paylinesById: Map<number, Payline>;
  private readonly colWidth: number;
  private readonly colStep: number;
  private readonly rowHeight: number;

  private readonly framesLayer = new Container();
  private readonly linesLayer = new Container();
  private readonly labelsLayer = new Container();

  private wins: readonly LineWin[] = [];
  private phase: 'IDLE' | 'ALL' | 'CYCLE' = 'IDLE';
  private phaseTimer = 0;
  private cycleIndex = 0;
  private pulseTime = 0;

  constructor(
    assets: GameAssets,
    paylines: readonly Payline[],
    colWidth: number,
    colStep: number,
    rowHeight: number,
  ) {
    super();

    this.assets = assets;
    this.paylinesById = new Map(paylines.map((p) => [p.id, p]));
    this.colWidth = colWidth;
    this.colStep = colStep;
    this.rowHeight = rowHeight;

    this.addChild(this.framesLayer, this.linesLayer, this.labelsLayer);
  }

  public showWins(wins: readonly LineWin[]): void {
    this.clearWins();
    if (wins.length === 0) return;

    this.wins = wins;
    this.phase = 'ALL';
    this.phaseTimer = 0;
    this.cycleIndex = 0;
    this.pulseTime = 0;

    this.renderWins(this.wins, this.wins.length === 1);
  }

  public clearWins(): void {
    this.wins = [];
    this.phase = 'IDLE';
    this.phaseTimer = 0;
    this.cycleIndex = 0;
    this.framesLayer.removeChildren();
    this.linesLayer.removeChildren();
    this.labelsLayer.removeChildren();
    this.alpha = 1;
  }

  public getFullShowcaseMs(): number {
    if (this.wins.length === 0) return 0;
    if (this.wins.length === 1) return ALL_WINS_DURATION_SEC * 1000;
    return (ALL_WINS_DURATION_SEC + this.wins.length * SINGLE_WIN_DURATION_SEC) * 1000;
  }

  public update(deltaSeconds: number): void {
    if (this.phase === 'IDLE') return;

    const dt = Math.min(deltaSeconds, 0.05);
    this.pulseTime += dt * 4.5;
    this.alpha = 0.86 + Math.sin(this.pulseTime) * 0.14;

    if (this.wins.length <= 1) return;

    this.phaseTimer += dt;

    if (this.phase === 'ALL' && this.phaseTimer >= ALL_WINS_DURATION_SEC) {
      this.phase = 'CYCLE';
      this.phaseTimer = 0;
      this.cycleIndex = 0;
      this.renderWins([this.wins[this.cycleIndex]], true);
      return;
    }

    if (this.phase === 'CYCLE' && this.phaseTimer >= SINGLE_WIN_DURATION_SEC) {
      this.phaseTimer = 0;
      this.cycleIndex = (this.cycleIndex + 1) % this.wins.length;
      this.renderWins([this.wins[this.cycleIndex]], true);
    }
  }

  private renderWins(subset: readonly LineWin[], showPayoutPill: boolean): void {
    this.framesLayer.removeChildren();
    this.linesLayer.removeChildren();
    this.labelsLayer.removeChildren();

    const highlightedCells = new Set<string>();
    const frameSize = Math.min(this.colWidth, this.rowHeight) * 0.94;
    const laneSpacing = subset.length > 1 ? Math.min(10, 28 / subset.length) : 0;

    subset.forEach((win, lineIdx) => {
      const payline = this.paylinesById.get(win.payline);
      if (!payline) return;

      const color = PAYLINE_COLORS[(win.payline - 1) % PAYLINE_COLORS.length];
      const offsetY = (lineIdx - (subset.length - 1) / 2) * laneSpacing;

      for (let col = 0; col < win.count; col += 1) {
        const row = payline.rows[col];
        const cellKey = `${col}:${row}`;
        if (highlightedCells.has(cellKey)) continue;
        highlightedCells.add(cellKey);

        const cellFrame = new Sprite(this.assets.machine.winCellFrame);
        cellFrame.anchor.set(0.5);
        cellFrame.width = frameSize;
        cellFrame.height = frameSize;
        cellFrame.position.set(this.cellCenterX(col), this.cellCenterY(row));
        this.framesLayer.addChild(cellFrame);
      }

      const line = new Graphics();
      const points = payline.rows.map((row, col) => ({
        x: this.cellCenterX(col),
        y: this.cellCenterY(row) + offsetY,
      }));

      if (win.count < points.length) {
        line.moveTo(points[win.count - 1].x, points[win.count - 1].y);
        for (let col = win.count; col < points.length; col += 1) {
          line.lineTo(points[col].x, points[col].y);
        }
        line.stroke({ color, width: 3.5, alpha: 0.25, cap: 'round', join: 'round' });
      }

      line.moveTo(points[0].x, points[0].y);
      for (let col = 1; col < win.count; col += 1) {
        line.lineTo(points[col].x, points[col].y);
      }
      line.stroke({ color, width: 12, alpha: 0.32, cap: 'round', join: 'round' });

      // Main neon beam
      line.moveTo(points[0].x, points[0].y);
      for (let col = 1; col < win.count; col += 1) {
        line.lineTo(points[col].x, points[col].y);
      }
      line.stroke({ color, width: 5, alpha: 0.95, cap: 'round', join: 'round' });

      line.moveTo(points[0].x, points[0].y);
      for (let col = 1; col < win.count; col += 1) {
        line.lineTo(points[col].x, points[col].y);
      }
      line.stroke({ color: 0xffffff, width: 1.8, alpha: 0.9, cap: 'round', join: 'round' });

      for (let col = 0; col < win.count; col += 1) {
        line
          .circle(points[col].x, points[col].y, 6)
          .fill({ color: 0xffffff })
          .stroke({ color, width: 2.5 });
      }

      this.linesLayer.addChild(line);

      if (showPayoutPill) {
        const midCol = Math.floor((win.count - 1) / 2);
        const anchorPt = points[midCol];
        const pill = this.createPayoutPill(win.payline, win.payout, color);
        pill.position.set(anchorPt.x, anchorPt.y);
        this.labelsLayer.addChild(pill);
      }
    });
  }

  private createPayoutPill(paylineId: number, payout: number, color: number): Container {
    const pill = new Container();

    const label = new Text({
      text: `LINE ${paylineId}  +${payout.toLocaleString('en-US')}`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 18,
        fontWeight: '900',
        fill: '#ffffff',
      },
    });
    label.anchor.set(0.5);

    const padX = 18;
    const w = label.width + padX * 2;
    const h = 38;

    const bg = new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 10)
      .fill({ color: 0x050c1a, alpha: 0.94 })
      .stroke({ color, width: 2.5 });

    pill.addChild(bg, label);
    return pill;
  }

  private cellCenterX(col: number): number {
    return FRAME_BOUNDS.windowX + col * this.colStep + this.colWidth / 2;
  }

  private cellCenterY(row: number): number {
    return FRAME_BOUNDS.windowY + (row + 0.5) * this.rowHeight;
  }
}
