import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { GameAssets } from '../assets';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../config';
import type { SlotConfigResponse, SymbolInfo } from '../types/api';

const PANEL_W = 1280;
const PANEL_H = 760;

export class PaytableOverlay extends Container {
  private readonly panel: Container;
  private readonly backdrop: Graphics;
  private readonly closeBtn: Container;
  private isOpen = false;
  private openProgress = 0;
  private closeHovered = false;
  private closePressed = false;
  private closeScale = 1;

  constructor(assets: GameAssets, config: SlotConfigResponse) {
    super();

    this.visible = false;

    this.backdrop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      .fill({ color: 0x020612, alpha: 0.82 });
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointertap', () => this.hide());
    this.addChild(this.backdrop);

    const panel = new Container();
    panel.pivot.set(PANEL_W / 2, PANEL_H / 2);
    panel.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2);
    panel.eventMode = 'static';
    this.addChild(panel);
    this.panel = panel;

    // Panel background & neon frame
    const bg = new Graphics()
      .roundRect(0, 0, PANEL_W, PANEL_H, 22)
      .fill({ color: 0x071124, alpha: 0.97 })
      .stroke({ color: 0x00f0ff, width: 3 });
    panel.addChild(bg);

    // Header
    const title = new Text({
      text: 'PAYTABLE & RULES',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 30,
        fontWeight: '900',
        fill: '#00f0ff',
        letterSpacing: 4,
      },
    });
    title.anchor.set(0.5);
    title.position.set(PANEL_W / 2, 46);
    panel.addChild(title);

    // Close button (X)
    const closeBtn = new Container();
    closeBtn.position.set(PANEL_W - 44, 44);
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerover', () => {
      this.closeHovered = true;
    });
    closeBtn.on('pointerout', () => {
      this.closeHovered = false;
      this.closePressed = false;
    });
    closeBtn.on('pointerdown', () => {
      this.closePressed = true;
    });
    closeBtn.on('pointerup', () => {
      this.closePressed = false;
    });
    closeBtn.on('pointerupoutside', () => {
      this.closePressed = false;
    });
    closeBtn.on('pointertap', () => this.hide());

    const closeBg = new Graphics()
      .roundRect(-22, -22, 44, 44, 10)
      .fill({ color: 0x0d1b36 })
      .stroke({ color: 0x00f0ff, width: 2 });
    const closeLabel = new Text({
      text: 'X',
      style: { fontFamily: 'Orbitron', fontSize: 22, fontWeight: '900', fill: '#00f0ff', padding: 4 },
    });
    closeLabel.anchor.set(0.5);
    closeBtn.addChild(closeBg, closeLabel);
    panel.addChild(closeBtn);
    this.closeBtn = closeBtn;

    //  Special Symbols (Wild & Scatter) 
    const specials = config.symbolInfo.filter((s) => s.tier === null);
    const specialCardW = 580;
    const specialCardH = 128;
    const specialGap = 32;
    const specialStartX = (PANEL_W - (specialCardW * 2 + specialGap)) / 2;

    specials.forEach((sym, i) => {
      const card = this.createSpecialCard(sym, assets, config, specialCardW, specialCardH);
      card.position.set(specialStartX + i * (specialCardW + specialGap), 92);
      panel.addChild(card);
    });

    // Regular Symbols (H1..H2 M1..M3 L1..L6)
    const regulars = config.symbolInfo.filter((s) => s.tier !== null);
    const cols = 4;
    const cardW = 284;
    const cardH = 136;
    const gapX = 20;
    const gapY = 18;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (PANEL_W - gridW) / 2;
    const startY = 246;

    regulars.forEach((sym, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const multipliers = config.payoutMultipliers[sym.id];
      const card = this.createRegularCard(sym, multipliers, assets, cardW, cardH);
      card.position.set(startX + col * (cardW + gapX), startY + row * (cardH + gapY));
      panel.addChild(card);
    });

    const footer = new Text({
      text: `${config.wager.activePaylines} FIXED PAYLINES  •  PAYS LEFT TO RIGHT  •  MULTIPLIERS APPLY TO LINE BET`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 13,
        fontWeight: '700',
        fill: '#7ea6cc',
        letterSpacing: 2,
      },
    });
    footer.anchor.set(0.5);
    footer.position.set(PANEL_W / 2, PANEL_H - 30);
    panel.addChild(footer);
  }

  public show(): void {
    this.isOpen = true;
    this.visible = true;
  }

  public hide(): void {
    this.isOpen = false;
    this.closeHovered = false;
    this.closePressed = false;
  }

  public toggle(): void {
    if (this.isOpen) this.hide();
    else this.show();
  }

  public update(deltaSeconds: number): void {
    if (!this.visible) return;
    const dt = Math.min(deltaSeconds, 0.05);

    // Smooth open / close fade + zoom animation
    const speed = this.isOpen ? 6.5 : 7.5;
    this.openProgress = this.isOpen
      ? Math.min(this.openProgress + dt * speed, 1)
      : Math.max(this.openProgress - dt * speed, 0);

    const ease = 1 - Math.pow(1 - this.openProgress, 3);
    this.backdrop.alpha = ease;
    this.panel.alpha = ease;
    this.panel.scale.set(0.88 + ease * 0.12);

    if (!this.isOpen && this.openProgress <= 0) {
      this.visible = false;
      this.closeScale = 1;
      this.closeBtn.scale.set(1);
      return;
    }

    const target = this.closePressed ? 0.9 : this.closeHovered ? 1.1 : 1;
    const lerp = 1 - Math.exp(-18 * dt);
    this.closeScale += (target - this.closeScale) * lerp;
    this.closeBtn.scale.set(this.closeScale);
  }

  private createSpecialCard(
    sym: SymbolInfo,
    assets: GameAssets,
    config: SlotConfigResponse,
    width: number,
    height: number,
  ): Container {
    const card = new Container();
    const isWild = sym.code === 'WW';
    const borderColor = isWild ? 0xffd000 : 0xff2cdf;

    const box = new Graphics()
      .roundRect(0, 0, width, height, 14)
      .fill({ color: 0x0c1a33 })
      .stroke({ color: borderColor, width: 2 });
    card.addChild(box);

    const icon = new Sprite(assets.symbols[sym.id]);
    icon.anchor.set(0.5);
    icon.width = 96;
    icon.height = 96;
    icon.position.set(66, height / 2);
    card.addChild(icon);

    const heading = new Text({
      text: `${sym.code} // ${sym.name}`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 18,
        fontWeight: '800',
        fill: isWild ? '#ffd000' : '#ff66ea',
      },
    });
    heading.position.set(130, 26);
    card.addChild(heading);

    const fg = config.freeGamesAwards;
    const descText = isWild
      ? 'Substitutes for all regular symbols (H, M, L).\nDoes not substitute for Scatter.'
      : `Counts anywhere on the reels:\n3x = ${fg[3]} Free Games  •  4x = ${fg[4]} FG  •  5x = ${fg[5]} FG`;

    const desc = new Text({
      text: descText,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 13,
        fontWeight: '600',
        fill: '#cce6ff',
        lineHeight: 22,
      },
    });
    desc.position.set(130, 60);
    card.addChild(desc);

    return card;
  }

  private createRegularCard(
    sym: SymbolInfo,
    multipliers: [number, number, number],
    assets: GameAssets,
    width: number,
    height: number,
  ): Container {
    const card = new Container();

    const tierColor =
      sym.tier === 2 ? 0xffb700 : sym.tier === 1 ? 0x00ff88 : 0x3b72a8;

    const box = new Graphics()
      .roundRect(0, 0, width, height, 14)
      .fill({ color: 0x0b172e })
      .stroke({ color: tierColor, width: 1.8 });
    card.addChild(box);

    const icon = new Sprite(assets.symbols[sym.id]);
    icon.anchor.set(0.5);
    icon.width = 92;
    icon.height = 92;
    icon.position.set(58, height / 2);
    card.addChild(icon);

    const title = new Text({
      text: `${sym.code} · ${sym.name}`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 12,
        fontWeight: '800',
        fill: '#ffffff',
      },
    });
    title.position.set(116, 16);
    card.addChild(title);

    const counts = [5, 4, 3] as const;
    counts.forEach((count, row) => {
      const value = multipliers[count - 3];
      const line = new Text({
        text: `${count}x   ${value.toLocaleString('en-US')}`,
        style: {
          fontFamily: 'Orbitron',
          fontSize: 16,
          fontWeight: '800',
          fill: row === 0 ? '#ffd000' : '#00f0ff',
        },
      });
      line.position.set(116, 44 + row * 28);
      card.addChild(line);
    });

    return card;
  }
}
