import { Container, Sprite } from 'pixi.js';
import type { GameAssets } from '../assets';

export class Reel extends Container {
  private readonly strip: number[];
  private readonly assets: GameAssets;
  private readonly sprites: Sprite[] = [];
  private readonly symbolSize: number;

  constructor(
    strip: number[],
    assets: GameAssets,
    rows: number,
    colWidth: number,
    rowHeight: number,
  ) {
    super();

    this.strip = strip;
    this.assets = assets;
    this.symbolSize = Math.min(colWidth, rowHeight) * 0.88;

    for (let row = 0; row < rows; row += 1) {
      const symbolId = this.strip[row % this.strip.length];
      const sprite = new Sprite(this.assets.symbols[symbolId]);
      sprite.anchor.set(0.5);
      sprite.width = this.symbolSize;
      sprite.height = this.symbolSize;
      sprite.x = colWidth / 2;
      sprite.y = (row + 0.5) * rowHeight;

      this.addChild(sprite);
      this.sprites.push(sprite);
    }
  }

  public setStop(stopIndex: number): void {
    const len = this.strip.length;
    for (let row = 0; row < this.sprites.length; row += 1) {
      const index = (((stopIndex + row) % len) + len) % len;
      const symbolId = this.strip[index];
      const sprite = this.sprites[row];
      sprite.texture = this.assets.symbols[symbolId];
    }
  }
}
