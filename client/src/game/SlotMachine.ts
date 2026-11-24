import { Container, Sprite } from 'pixi.js';
import type { GameAssets } from '../assets';
import { FRAME_BOUNDS } from '../config';
import type { SlotConfigResponse } from '../types/api';

export class SlotMachine extends Container {
  public readonly reelsLayer = new Container();

  private readonly columns: number;
  private readonly rows: number;
  private readonly colWidth: number;
  private readonly colStep: number;
  private readonly rowHeight: number;

  constructor(assets: GameAssets, config: SlotConfigResponse) {
    super();

    this.columns = config.columns;
    this.rows = config.rows;
    this.colWidth =
      (FRAME_BOUNDS.windowWidth - (this.columns - 1) * FRAME_BOUNDS.colGap) / this.columns;
    this.colStep = this.colWidth + FRAME_BOUNDS.colGap;
    this.rowHeight = FRAME_BOUNDS.windowHeight / this.rows;

    const frame = new Sprite(assets.machine.reelFrame);
    this.addChild(frame);

    this.addChild(this.reelsLayer);

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
}
