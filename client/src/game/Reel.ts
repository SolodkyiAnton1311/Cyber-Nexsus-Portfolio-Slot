import { Container, Sprite } from 'pixi.js';
import type { GameAssets } from '../assets';

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

type ReelState = 'IDLE' | 'SPINNING' | 'LANDING' | 'SETTLE';
export type SymbolWinAnim = 'wild' | 'scatter' | 'h1' | 'h2';

const SPIN_SPEED = 26; // symbols per second (constant real-slot speed)
const RAMP_UP_SEC = 0.1;
const SETTLE_SEC = 0.11;
const SETTLE_BOUNCE = 0.14; // subtle mechanical click (~27px)

export class Reel extends Container {
  private readonly strip: number[];
  private readonly assets: GameAssets;
  private readonly rows: number;
  private readonly colWidth: number;
  private readonly rowHeight: number;
  private readonly sprites: Sprite[] = [];
  private readonly symbolSize: number;
  private baseScaleX = 1;
  private baseScaleY = 1;
  private readonly rowAnims = new Map<number, SymbolWinAnim>();
  private winAnimTime = 0;

  /**
   * Symbol IDs currently in the reel slots:
   * index 0 = top buffer, 1..rows = visible rows, rows + 1 = bottom buffer.
   */
  private readonly visibleIds: number[] = [];
  private stripCursor = 0;

  /** Vertical progress within one symbol step: 0..1 */
  private offset = 0;
  private state: ReelState = 'IDLE';
  private elapsed = 0;
  private spinDuration = 0;
  private targetStop = 0;
  private landingQueue: number[] = [];
  private settleElapsed = 0;
  private fastStop = false;
  private onComplete: (() => void) | null = null;

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
    this.rows = rows;
    this.colWidth = colWidth;
    this.rowHeight = rowHeight;
    this.symbolSize = Math.min(colWidth, rowHeight) * 0.88;

    for (let i = 0; i < rows + 2; i += 1) {
      const sprite = new Sprite(this.assets.symbols[this.strip[0]]);
      sprite.anchor.set(0.5);
      sprite.width = this.symbolSize;
      sprite.height = this.symbolSize;
      sprite.x = colWidth / 2;

      this.addChild(sprite);
      this.sprites.push(sprite);
      this.visibleIds.push(this.strip[0]);
    }
    this.baseScaleX = this.sprites[0].scale.x;
    this.baseScaleY = this.sprites[0].scale.y;

    this.setStop(0);
  }

  public setStop(stopIndex: number): void {
    this.clearRowAnimations();
    this.state = 'IDLE';
    this.offset = 0;
    this.landingQueue = [];
    this.onComplete = null;

    const len = this.strip.length;
    this.stripCursor = mod(stopIndex - 1, len);
    for (let i = 0; i < this.rows + 2; i += 1) {
      const slot = i - 1; // -1 (top buffer), 0..rows-1 (visible), rows (bottom buffer)
      this.visibleIds[i] = this.strip[mod(stopIndex + slot, len)];
    }
    this.render();
  }

  /** Spins at constant speed for `spinDurationSec`, then lands cleanly on `targetStop`. */
  public spinTo(targetStop: number, spinDurationSec: number): Promise<void> {
    this.clearRowAnimations();
    this.targetStop = targetStop;
    this.spinDuration = spinDurationSec;
    this.elapsed = 0;
    this.settleElapsed = 0;
    this.fastStop = false;
    this.landingQueue = [];
    this.state = 'SPINNING';

    return new Promise((resolve) => {
      this.onComplete = resolve;
    });
  }

  /** Immediately transitions a spinning reel into its smooth landing animation. */
  public slamStop(): void {
    this.fastStop = true;
    if (this.state === 'SPINNING') {
      this.beginLanding();
    }
  }

  public animateRow(row: number, type: SymbolWinAnim): void {
    if (row < 0 || row >= this.rows) return;
    this.rowAnims.set(row, type);
    this.winAnimTime = 0;
  }

  public clearRowAnimations(): void {
    if (this.rowAnims.size === 0) return;
    this.rowAnims.clear();
    this.winAnimTime = 0;
    for (let i = 0; i < this.sprites.length; i += 1) {
      const sprite = this.sprites[i];
      sprite.scale.set(this.baseScaleX, this.baseScaleY);
      sprite.rotation = 0;
      sprite.x = this.colWidth / 2;
      sprite.tint = 0xffffff;
    }
    this.render();
  }

  public update(deltaSeconds: number): void {
    // Clamp delta in case the browser tab was inactive
    const dt = Math.min(deltaSeconds, 0.05);

    if (this.state === 'IDLE') {
      if (this.rowAnims.size > 0) {
        this.updateRowAnimations(dt);
      }
      return;
    }

    if (this.state === 'SPINNING') {
      this.elapsed += dt;
      const ramp = Math.min(this.elapsed / RAMP_UP_SEC, 1);
      const speed = SPIN_SPEED * (0.35 + 0.65 * ramp);
      this.advance(speed * dt);

      if (this.elapsed >= this.spinDuration) {
        this.beginLanding();
      }
      this.render();
      return;
    }

    if (this.state === 'LANDING') {
      // Slightly decelerate across the final symbols for a crisp mechanical stop
      const remaining = this.landingQueue.length + (1 - this.offset);
      const baseSpeed = this.fastStop ? SPIN_SPEED * 1.45 : SPIN_SPEED;
      const speed = Math.max(12, baseSpeed * Math.min(1, remaining / 2.2));
      this.offset += speed * dt;

      while (this.offset >= 1 && this.landingQueue.length > 0) {
        this.offset -= 1;
        this.shiftDown(this.landingQueue.shift()!);
      }

      if (this.landingQueue.length === 0) {
        this.offset = 0;
        this.settleElapsed = 0;
        this.state = 'SETTLE';
      }
      this.render();
      return;
    }

    if (this.state === 'SETTLE') {
      this.settleElapsed += dt;
      const t = Math.min(this.settleElapsed / SETTLE_SEC, 1);
      // Tiny downward dip and smooth return to 0 (no backward spinning)
      this.offset = Math.sin(t * Math.PI) * SETTLE_BOUNCE;
      this.render();

      if (t >= 1) {
        this.offset = 0;
        this.state = 'IDLE';
        this.render();
        const done = this.onComplete;
        this.onComplete = null;
        done?.();
      }
    }
  }

  private beginLanding(): void {
    const len = this.strip.length;
    // Queue symbols from bottom visible row up to top buffer so after all shifts:
    // visibleIds[1..rows] === strip[targetStop .. targetStop + rows - 1]
    this.landingQueue = [];
    for (let slot = this.rows - 1; slot >= -1; slot -= 1) {
      this.landingQueue.push(this.strip[mod(this.targetStop + slot, len)]);
    }
    this.state = 'LANDING';
  }

  private advance(steps: number): void {
    this.offset += steps;
    const len = this.strip.length;
    while (this.offset >= 1) {
      this.offset -= 1;
      this.stripCursor = mod(this.stripCursor - 1, len);
      this.shiftDown(this.strip[this.stripCursor]);
    }
  }

  private shiftDown(newTopSymbolId: number): void {
    for (let i = this.visibleIds.length - 1; i > 0; i -= 1) {
      this.visibleIds[i] = this.visibleIds[i - 1];
    }
    this.visibleIds[0] = newTopSymbolId;
  }

  private updateRowAnimations(dt: number): void {
    this.winAnimTime += dt;
    const t = this.winAnimTime;

    for (const [row, type] of this.rowAnims) {
      const sprite = this.sprites[row + 1]; // +1 skips top buffer
      const baseX = this.colWidth / 2;
      const baseY = (row + 0.5) * this.rowHeight;

      if (type === 'wild') {
        // Quantum reactor energy surge: strong heartbeat pulse + micro-vibration + gold/cyan shimmer
        const surge = Math.pow(Math.abs(Math.sin(t * 4.5)), 2);
        const scale = 1.03 + surge * 0.12;
        sprite.scale.set(this.baseScaleX * scale, this.baseScaleY * scale);
        sprite.rotation = Math.sin(t * 9) * 0.05;
        sprite.x = baseX + Math.sin(t * 42) * 1.5 * surge;
        sprite.y = baseY + Math.cos(t * 38) * 1.5 * surge;
        sprite.tint = surge > 0.6 ? 0xfff2a6 : surge > 0.25 ? 0xb5faff : 0xffffff;
      } else if (type === 'scatter') {
        // Portal pulse + gentle vortex wobble
        const pulse = 1.04 + Math.sin(t * 7) * 0.09;
        sprite.scale.set(this.baseScaleX * pulse, this.baseScaleY * pulse);
        sprite.rotation = Math.sin(t * 5.5) * 0.14;
        sprite.x = baseX;
        sprite.y = baseY;
        sprite.tint = Math.sin(t * 10) > 0 ? 0xffffff : 0xffc4ff;
      } else if (type === 'h1') {
        // Rocket thruster launch hop (up & slightly right)
        const hop = Math.abs(Math.sin(t * 5.5));
        const scale = 1.0 + hop * 0.09;
        sprite.scale.set(this.baseScaleX * scale, this.baseScaleY * scale);
        sprite.rotation = hop * 0.06;
        sprite.x = baseX + hop * 4;
        sprite.y = baseY - hop * 11;
        sprite.tint = 0xffffff;
      } else if (type === 'h2') {
        // Blaster recoil kick every 0.65s
        const cycle = (t % 0.65) / 0.65;
        const kick = cycle < 0.25 ? Math.sin((cycle / 0.25) * Math.PI) : 0;
        const scale = 1.0 + kick * 0.11;
        sprite.scale.set(this.baseScaleX * scale, this.baseScaleY * scale);
        sprite.rotation = -kick * 0.16;
        sprite.x = baseX - kick * 7;
        sprite.y = baseY - kick * 3;
        sprite.tint = kick > 0.5 ? 0xd4f8ff : 0xffffff;
      }
    }
  }

  private render(): void {
    for (let i = 0; i < this.sprites.length; i += 1) {
      const slot = i - 1; // -1 (top buffer), 0..rows-1 (visible), rows (bottom buffer)
      const sprite = this.sprites[i];
      sprite.texture = this.assets.symbols[this.visibleIds[i]];
      sprite.y = (slot + this.offset + 0.5) * this.rowHeight;
    }
  }
}
