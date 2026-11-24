import { Container, Graphics, Text } from 'pixi.js';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../config';
import type { CheatMode } from '../types/api';

const PANEL_W = 292;
const PANEL_H = 440;

interface CheatOption {
  mode: CheatMode;
  label: string;
  color: number;
  textColor: string;
}

const CHEAT_OPTIONS: readonly CheatOption[] = [
  { mode: 'h1_win', label: 'H1 WIN  (ROCKET)', color: 0xffb700, textColor: '#ffd966' },
  { mode: 'h2_win', label: 'H2 WIN  (BLASTER)', color: 0xff2cdf, textColor: '#ff8ef0' },
  { mode: 'wild_win', label: 'WILD WIN  (5x WW)', color: 0x00f0ff, textColor: '#7ff6ff' },
  { mode: 'scatter_3', label: 'SCATTER 3  (5 FG)', color: 0x00ff88, textColor: '#8affc4' },
  { mode: 'scatter_4', label: 'SCATTER 4  (10 FG)', color: 0x38d9ff, textColor: '#9beeff' },
  { mode: 'scatter_5', label: 'SCATTER 5  (15 FG)', color: 0xff4d6d, textColor: '#ff9eb0' },
];

interface CheatBtnState {
  container: Container;
  hovered: boolean;
  pressed: boolean;
  scale: number;
}

export class CheatPanel extends Container {
  private readonly panel: Container;
  private readonly buttons: CheatBtnState[] = [];
  private isOpen = false;
  private progress = 0;

  private readonly openX = STAGE_WIDTH - PANEL_W - 22;
  private readonly closedX = STAGE_WIDTH + 20;
  private readonly panelY = Math.floor((STAGE_HEIGHT - PANEL_H) / 2) - 10;

  constructor(onSelect: (mode: CheatMode) => void) {
    super();

    this.visible = false;

    this.panel = new Container();
    this.panel.position.set(this.closedX, this.panelY);
    this.panel.eventMode = 'static';
    this.addChild(this.panel);

    const bg = new Graphics()
      .roundRect(0, 0, PANEL_W, PANEL_H, 16)
      .fill({ color: 0x060d1f, alpha: 0.95 })
      .stroke({ color: 0x00f0ff, width: 2.5 });
    this.panel.addChild(bg);

    const title = new Text({
      text: 'DEV CHEATS',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 18,
        fontWeight: '900',
        fill: '#00f0ff',
        letterSpacing: 2,
        padding: 4,
      },
    });
    title.position.set(18, 16);
    this.panel.addChild(title);

    const hint = new Text({
      text: 'Ctrl + D',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 11,
        fontWeight: '700',
        fill: '#6f96bd',
        padding: 2,
      },
    });
    hint.position.set(18, 40);
    this.panel.addChild(hint);

    // Close button (X)
    const closeBtn = new Container();
    closeBtn.position.set(PANEL_W - 28, 28);
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointertap', () => this.hide());

    const closeBg = new Graphics()
      .roundRect(-14, -14, 28, 28, 7)
      .fill({ color: 0x10203d })
      .stroke({ color: 0x00f0ff, width: 1.5 });
    const closeTxt = new Text({
      text: 'X',
      style: { fontFamily: 'Orbitron', fontSize: 14, fontWeight: '900', fill: '#00f0ff', padding: 2 },
    });
    closeTxt.anchor.set(0.5);
    closeBtn.addChild(closeBg, closeTxt);
    this.panel.addChild(closeBtn);

    // 6 Cheat Preset Buttons
    const btnW = PANEL_W - 36;
    const btnH = 48;
    const gap = 11;
    const startY = 74;

    CHEAT_OPTIONS.forEach((opt, i) => {
      const btn = new Container();
      btn.position.set(PANEL_W / 2, startY + i * (btnH + gap) + btnH / 2);
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const btnBg = new Graphics()
        .roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 10)
        .fill({ color: 0x0c1933 })
        .stroke({ color: opt.color, width: 2 });
      const btnText = new Text({
        text: opt.label,
        style: {
          fontFamily: 'Orbitron',
          fontSize: 14,
          fontWeight: '800',
          fill: opt.textColor,
          letterSpacing: 1,
          padding: 4,
        },
      });
      btnText.anchor.set(0.5);
      btn.addChild(btnBg, btnText);
      this.panel.addChild(btn);

      const state: CheatBtnState = {
        container: btn,
        hovered: false,
        pressed: false,
        scale: 1,
      };
      btn.on('pointerover', () => {
        state.hovered = true;
      });
      btn.on('pointerout', () => {
        state.hovered = false;
        state.pressed = false;
      });
      btn.on('pointerdown', () => {
        state.pressed = true;
      });
      btn.on('pointerup', () => {
        state.pressed = false;
      });
      btn.on('pointerupoutside', () => {
        state.pressed = false;
      });
      btn.on('pointertap', () => {
        onSelect(opt.mode);
      });

      this.buttons.push(state);
    });
  }

  public show(): void {
    this.isOpen = true;
    this.visible = true;
  }

  public hide(): void {
    this.isOpen = false;
    for (const b of this.buttons) {
      b.hovered = false;
      b.pressed = false;
    }
  }

  public toggle(): void {
    if (this.isOpen) this.hide();
    else this.show();
  }

  public update(deltaSeconds: number): void {
    if (!this.visible) return;
    const dt = Math.min(deltaSeconds, 0.05);

    const speed = this.isOpen ? 7.5 : 8.5;
    this.progress = this.isOpen
      ? Math.min(this.progress + dt * speed, 1)
      : Math.max(this.progress - dt * speed, 0);

    const ease = 1 - Math.pow(1 - this.progress, 3);
    this.panel.x = this.closedX + (this.openX - this.closedX) * ease;
    this.panel.alpha = ease;

    if (!this.isOpen && this.progress <= 0) {
      this.visible = false;
      return;
    }

    const lerp = 1 - Math.exp(-18 * dt);
    for (const b of this.buttons) {
      const target = b.pressed ? 0.94 : b.hovered ? 1.04 : 1;
      b.scale += (target - b.scale) * lerp;
      b.container.scale.set(b.scale);
    }
  }
}
