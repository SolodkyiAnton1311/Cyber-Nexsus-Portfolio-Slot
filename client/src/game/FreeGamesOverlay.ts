import { Container, Graphics, Text } from 'pixi.js';
import { HUD_LAYOUT, STAGE_HEIGHT, STAGE_WIDTH } from '../config';

function easeOutBack(t: number): number {
  const c1 = 1.7;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

type ModalAnimState = 'HIDDEN' | 'OPENING' | 'OPEN' | 'CLOSING';

export class FreeGamesOverlay extends Container {
  private readonly counterBar: Container;
  private readonly counterText: Text;
  private counterVisible = false;
  private counterY = -40;

  private readonly modalLayer: Container;
  private readonly backdrop: Graphics;
  private readonly burstRing: Graphics;
  private readonly modalCard: Container;
  private readonly modalTitle: Text;
  private readonly modalBody: Text;
  private readonly modalSub: Text;

  private modalState: ModalAnimState = 'HIDDEN';
  private modalProgress = 0;
  private pulseTime = 0;
  private modalResolve: (() => void) | null = null;
  private modalTimer: number | null = null;

  constructor() {
    super();

    // --- 1. Top-center Free Games counter bar (slides smoothly down from top) ---
    this.counterBar = new Container();
    this.counterBar.visible = false;
    this.counterBar.position.set(STAGE_WIDTH / 2 - 120, this.counterY);

    const barBg = new Graphics()
      .roundRect(-270, -28, 540, 56, 14)
      .fill({ color: 0x16072b, alpha: 0.94 })
      .stroke({ color: 0xff2cdf, width: 2.5 });
    this.counterText = new Text({
      text: '',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 19,
        fontWeight: '900',
        fill: '#ffffff',
        stroke: { color: '#3a0038', width: 3 },
        dropShadow: { color: '#ff2cdf', blur: 10, distance: 0, alpha: 0.85 },
        letterSpacing: 1.5,
        padding: 8,
      },
    });
    this.counterText.anchor.set(0.5);
    this.counterBar.addChild(barBg, this.counterText);
    this.addChild(this.counterBar);

    // --- 2. Center Intro / Outro Modal Banner ---
    this.modalLayer = new Container();
    this.modalLayer.visible = false;
    this.addChild(this.modalLayer);

    this.backdrop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      .fill({ color: 0x030614, alpha: 0.78 });
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'pointer';
    this.backdrop.on('pointertap', () => this.beginClose());
    this.modalLayer.addChild(this.backdrop);

    this.burstRing = new Graphics();
    this.burstRing.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2);
    this.modalLayer.addChild(this.burstRing);

    this.modalCard = new Container();
    this.modalCard.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2);
    this.modalLayer.addChild(this.modalCard);

    const cardBg = new Graphics()
      .roundRect(-370, -155, 740, 310, 22)
      .fill({ color: 0x050312, alpha: 0.99 })
      .stroke({ color: 0xff2cdf, width: 4.5 });
    const innerGlow = new Graphics()
      .roundRect(-354, -139, 708, 278, 16)
      .fill({ color: 0x0b0824, alpha: 0.92 })
      .stroke({ color: 0x00f0ff, width: 2, alpha: 0.8 });

    this.modalTitle = new Text({
      text: '',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 38,
        fontWeight: '900',
        fill: '#ffd966',
        stroke: { color: '#3b0036', width: 5 },
        dropShadow: { color: '#ff2cdf', blur: 16, distance: 0, alpha: 0.95 },
        letterSpacing: 3,
        padding: 12,
      },
    });
    this.modalTitle.anchor.set(0.5);
    this.modalTitle.position.set(0, -76);

    this.modalBody = new Text({
      text: '',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 52,
        fontWeight: '900',
        fill: '#ffffff',
        stroke: { color: '#004d26', width: 6 },
        dropShadow: { color: '#00ff88', blur: 20, distance: 0, alpha: 0.95 },
        letterSpacing: 2,
        padding: 14,
      },
    });
    this.modalBody.anchor.set(0.5);
    this.modalBody.position.set(0, 8);

    this.modalSub = new Text({
      text: '',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 17,
        fontWeight: '800',
        fill: '#e6f7ff',
        stroke: { color: '#041226', width: 3 },
        dropShadow: { color: '#00f0ff', blur: 10, distance: 0, alpha: 0.75 },
        letterSpacing: 1.8,
        padding: 8,
      },
    });
    this.modalSub.anchor.set(0.5);
    this.modalSub.position.set(0, 88);

    this.modalCard.addChild(cardBg, innerGlow, this.modalTitle, this.modalBody, this.modalSub);
  }

  public showIntro(freeGamesAwarded: number, scatterCount: number): Promise<void> {
    return this.openModal(
      'FREE GAMES!',
      `${freeGamesAwarded} FREE SPINS`,
      `${scatterCount} SCATTERS TRIGGERED  •  CLICK TO START`,
      2400,
    );
  }

  public showRetrigger(addedSpins: number, scatterCount: number): Promise<void> {
    return this.openModal(
      'RETRIGGER!',
      `+${addedSpins} FREE SPINS`,
      `${scatterCount} SCATTERS LANDED  •  EXTRA SPINS ADDED`,
      2000,
    );
  }

  public showSummary(freeGamesPlayed: number, totalBonusWin: number): Promise<void> {
    if (totalBonusWin <= 0) {
      return this.openModal(
        'FREE GAMES COMPLETE',
        'BETTER LUCK',
        `${freeGamesPlayed} FREE SPINS PLAYED  •  CLICK TO CONTINUE`,
        2600,
      );
    }

    return this.openModal(
      'FREE GAMES COMPLETE',
      `+${totalBonusWin.toLocaleString('en-US')}`,
      `TOTAL WIN FROM ${freeGamesPlayed} FREE SPINS  •  CLICK TO CONTINUE`,
      2800,
    );
  }

  public setCounter(current: number, total: number, bonusWin: number): void {
    if (!this.counterVisible) {
      this.counterVisible = true;
      this.counterBar.visible = true;
    }
    this.counterText.text = `FREE SPINS: ${current} / ${total}   •   BONUS: ${bonusWin.toLocaleString('en-US')}`;
  }

  public hideCounter(): void {
    this.counterVisible = false;
  }

  public update(deltaSeconds: number): void {
    const dt = Math.min(deltaSeconds, 0.05);
    this.pulseTime += dt;

    // 1. Smooth slide-in / slide-out for the top Free Spins counter bar
    const targetCounterY = this.counterVisible ? HUD_LAYOUT.topY : -44;
    const counterLerp = 1 - Math.exp(-14 * dt);
    this.counterY += (targetCounterY - this.counterY) * counterLerp;
    this.counterBar.y = this.counterY;
    if (this.counterVisible) {
      this.counterBar.alpha = 0.9 + Math.sin(this.pulseTime * 4) * 0.1;
    } else if (this.counterY < -40) {
      this.counterBar.visible = false;
    }

    // 2. Modal pop-in, idle pulse, and smooth fade-out
    if (this.modalState === 'OPENING') {
      this.modalProgress = Math.min(this.modalProgress + dt / 0.38, 1);
      const t = this.modalProgress;
      const scale = 0.55 + easeOutBack(t) * 0.45;
      this.modalCard.scale.set(scale);
      this.modalCard.alpha = Math.min(t * 2, 1);
      this.backdrop.alpha = Math.min(t * 1.6, 1);

      // Expanding neon burst ring behind the modal
      const ringEase = 1 - Math.pow(1 - t, 3);
      const pad = ringEase * 90;
      const w = 720 + pad * 2;
      const h = 290 + pad * 2;
      this.burstRing.clear();
      if (1 - t > 0.02) {
        this.burstRing
          .roundRect(-w / 2, -h / 2, w, h, 28)
          .stroke({ color: 0xff2cdf, width: 6 * (1 - t) + 1.5, alpha: (1 - t) * 0.85 });
      }

      if (t >= 1) {
        this.modalState = 'OPEN';
        this.modalCard.scale.set(1);
        this.modalCard.alpha = 1;
        this.backdrop.alpha = 1;
        this.burstRing.clear();
      }
    } else if (this.modalState === 'OPEN') {
      // Gentle breathing float while open
      const breathe = 1 + Math.sin(this.pulseTime * 4) * 0.018;
      this.modalCard.scale.set(breathe);
      this.modalBody.scale.set(1 + Math.sin(this.pulseTime * 6) * 0.03);
    } else if (this.modalState === 'CLOSING') {
      this.modalProgress = Math.min(this.modalProgress + dt / 0.22, 1);
      const t = this.modalProgress;
      const ease = t * t;
      this.modalCard.scale.set(1 - ease * 0.18);
      this.modalCard.alpha = 1 - ease;
      this.backdrop.alpha = 1 - ease;

      if (t >= 1) {
        this.finishClose();
      }
    }
  }

  private openModal(
    title: string,
    body: string,
    sub: string,
    autoCloseMs: number,
  ): Promise<void> {
    this.finishClose();

    this.modalTitle.text = title;
    this.modalBody.text = body;
    this.modalSub.text = sub;
    this.modalBody.scale.set(1);

    this.modalState = 'OPENING';
    this.modalProgress = 0;
    this.modalCard.scale.set(0.55);
    this.modalCard.alpha = 0;
    this.backdrop.alpha = 0;
    this.burstRing.clear();
    this.modalLayer.visible = true;

    return new Promise((resolve) => {
      this.modalResolve = resolve;
      this.modalTimer = window.setTimeout(() => {
        this.beginClose();
      }, autoCloseMs);
    });
  }

  private beginClose(): void {
    if (this.modalState === 'HIDDEN' || this.modalState === 'CLOSING') return;
    if (this.modalTimer !== null) {
      window.clearTimeout(this.modalTimer);
      this.modalTimer = null;
    }
    this.modalState = 'CLOSING';
    this.modalProgress = 0;
    this.burstRing.clear();
  }

  private finishClose(): void {
    if (this.modalTimer !== null) {
      window.clearTimeout(this.modalTimer);
      this.modalTimer = null;
    }
    this.modalState = 'HIDDEN';
    this.modalLayer.visible = false;
    this.burstRing.clear();
    const resolve = this.modalResolve;
    this.modalResolve = null;
    resolve?.();
  }
}
