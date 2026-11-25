import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { GameAssets } from '../assets';
import { sound } from '../audio/SoundManager';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../config';
import type { Payline, SlotConfigResponse, SymbolInfo } from '../types/api';

const PANEL_W = 1280;
const PANEL_H = 760;

const PAYLINE_COLORS = [
  0x00f0ff, 0xff2cdf, 0xffd000, 0x00ff88, 0xff6b35,
  0x9b5de5, 0x00bbf9, 0xf15bb5, 0xfee440, 0x4cc9f0,
];

type PaytableTab = 'symbols' | 'paylines';

interface PayoutRowEntry {
  text: Text;
  count: 3 | 4 | 5;
  multiplier: number;
  maxWidth: number;
}

interface TabButton {
  container: Container;
  bg: Graphics;
  label: Text;
  width: number;
  height: number;
}

export class PaytableOverlay extends Container {
  private readonly panel: Container;
  private readonly backdrop: Graphics;
  private readonly closeBtn: Container;
  private readonly footerText: Text;
  private readonly activePaylines: number;
  private readonly payoutRows: PayoutRowEntry[] = [];

  private readonly symbolsView: Container;
  private readonly paylinesView: Container;
  private readonly tabSymbols: TabButton;
  private readonly tabPaylines: TabButton;
  private activeTab: PaytableTab = 'symbols';

  private isOpen = false;
  private openProgress = 0;
  private closeHovered = false;
  private closePressed = false;
  private closeScale = 1;

  constructor(assets: GameAssets, config: SlotConfigResponse) {
    super();

    this.visible = false;
    this.activePaylines = config.wager.activePaylines;

    this.backdrop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      .fill({ color: 0x020612, alpha: 0.82 });
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointertap', () => {
      sound.playClick();
      this.hide();
    });
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

    // Header title (left-aligned)
    const title = new Text({
      text: 'PAYTABLE & RULES',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 26,
        fontWeight: '900',
        fill: '#00f0ff',
        letterSpacing: 3,
      },
    });
    title.anchor.set(0, 0.5);
    title.position.set(44, 46);
    panel.addChild(title);

    // Tab switcher: SYMBOLS | PAYLINES
    this.tabSymbols = this.createTab('SYMBOLS', PANEL_W / 2 - 40, 46, 176, 40, () => {
      if (this.activeTab !== 'symbols') {
        sound.playClick();
        this.setActiveTab('symbols');
      }
    });
    this.tabPaylines = this.createTab(
      `PAYLINES (${config.paylines.length})`,
      PANEL_W / 2 + 154,
      46,
      196,
      40,
      () => {
        if (this.activeTab !== 'paylines') {
          sound.playClick();
          this.setActiveTab('paylines');
        }
      },
    );
    panel.addChild(this.tabSymbols.container, this.tabPaylines.container);

    // Close button (X)
    const closeBtn = new Container();
    closeBtn.position.set(PANEL_W - 44, 46);
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
    closeBtn.on('pointertap', () => {
      sound.playClick();
      this.hide();
    });

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

    // --- Tab 1: Symbols View ---
    this.symbolsView = new Container();
    panel.addChild(this.symbolsView);

    const specials = config.symbolInfo.filter((s) => s.tier === null);
    const specialCardW = 580;
    const specialCardH = 128;
    const specialGap = 32;
    const specialStartX = (PANEL_W - (specialCardW * 2 + specialGap)) / 2;

    specials.forEach((sym, i) => {
      const card = this.createSpecialCard(sym, assets, config, specialCardW, specialCardH);
      card.position.set(specialStartX + i * (specialCardW + specialGap), 92);
      this.symbolsView.addChild(card);
    });

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
      this.symbolsView.addChild(card);
    });

    // --- Tab 2: Paylines View ---
    this.paylinesView = new Container();
    this.paylinesView.visible = false;
    panel.addChild(this.paylinesView);
    this.buildPaylinesView(config);

    this.setActiveTab('symbols');

    this.footerText = new Text({
      text: `${config.wager.activePaylines} FIXED PAYLINES  •  PAYS LEFT TO RIGHT  •  PAYOUTS FOR BET ${config.wager.totalBetMultiplier}`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 13,
        fontWeight: '700',
        fill: '#7ea6cc',
        letterSpacing: 2,
      },
    });
    this.footerText.anchor.set(0.5);
    this.footerText.position.set(PANEL_W / 2, PANEL_H - 30);
    panel.addChild(this.footerText);
  }

  public setBet(lineBet: number, totalBet: number): void {
    for (const entry of this.payoutRows) {
      const payout = entry.multiplier * lineBet;
      entry.text.text = `${entry.count}x  ${payout.toLocaleString('en-US')}`;
      entry.text.scale.set(1);
      if (entry.text.width > entry.maxWidth) {
        entry.text.scale.set(entry.maxWidth / entry.text.width);
      }
    }
    this.footerText.text = `${this.activePaylines} FIXED PAYLINES  •  PAYS LEFT TO RIGHT  •  PAYOUTS FOR BET ${totalBet.toLocaleString('en-US')}`;
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

  private createTab(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    onTap: () => void,
  ): TabButton {
    const container = new Container();
    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const bg = new Graphics();
    const label = new Text({
      text,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 14,
        fontWeight: '800',
        fill: '#ffffff',
        letterSpacing: 1.5,
        padding: 4,
      },
    });
    label.anchor.set(0.5);
    container.addChild(bg, label);
    container.on('pointertap', onTap);

    return { container, bg, label, width, height };
  }

  private setActiveTab(tab: PaytableTab): void {
    this.activeTab = tab;
    this.symbolsView.visible = tab === 'symbols';
    this.paylinesView.visible = tab === 'paylines';

    this.styleTab(this.tabSymbols, tab === 'symbols');
    this.styleTab(this.tabPaylines, tab === 'paylines');
  }

  private styleTab(tab: TabButton, active: boolean): void {
    tab.bg.clear();
    tab.bg
      .roundRect(-tab.width / 2, -tab.height / 2, tab.width, tab.height, 10)
      .fill({ color: active ? 0x0b2d4a : 0x0c162b })
      .stroke({ color: active ? 0x00f0ff : 0x2c4b75, width: active ? 2.5 : 1.5 });
    tab.label.style.fill = active ? '#00f0ff' : '#7ea6cc';
  }

  private buildPaylinesView(config: SlotConfigResponse): void {
    const cols = 5;
    const cardW = 224;
    const cardH = 196;
    const gapX = 18;
    const gapY = 20;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (PANEL_W - totalW) / 2;
    const startY = 104;

    config.paylines.forEach((payline, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const color = PAYLINE_COLORS[idx % PAYLINE_COLORS.length];
      const card = this.createPaylineCard(payline, config.columns, config.rows, color, cardW, cardH);
      card.position.set(startX + col * (cardW + gapX), startY + row * (cardH + gapY));
      this.paylinesView.addChild(card);
    });

    // Rules summary card below the 10 payline grids
    const rulesW = totalW;
    const rulesH = 152;
    const rulesY = startY + 2 * (cardH + gapY) + 12;
    const rulesBox = new Graphics()
      .roundRect(startX, rulesY, rulesW, rulesH, 16)
      .fill({ color: 0x0b172e })
      .stroke({ color: 0x00f0ff, width: 1.8, alpha: 0.75 });
    this.paylinesView.addChild(rulesBox);

    const rulesHeading = new Text({
      text: 'PAYLINE & BONUS RULES',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 15,
        fontWeight: '900',
        fill: '#ffd000',
        letterSpacing: 2,
      },
    });
    rulesHeading.position.set(startX + 26, rulesY + 18);
    this.paylinesView.addChild(rulesHeading);

    const fg = config.freeGamesAwards;
    const rulesBody = new Text({
      text: [
        `• All ${config.wager.activePaylines} paylines are permanently active. Wins pay left to right starting from Reel 1.`,
        '• Only the highest win is paid per payline. Simultaneous wins on different paylines are added together.',
        `• 3, 4, or 5 Scatters anywhere award ${fg[3]}, ${fg[4]}, or ${fg[5]} Free Games (retriggers add extra Free Games).`,
      ].join('\n'),
      style: {
        fontFamily: 'Orbitron',
        fontSize: 13,
        fontWeight: '600',
        fill: '#cce6ff',
        lineHeight: 28,
      },
    });
    rulesBody.position.set(startX + 26, rulesY + 50);
    this.paylinesView.addChild(rulesBody);
  }

  private createPaylineCard(
    payline: Payline,
    reelCols: number,
    reelRows: number,
    color: number,
    width: number,
    height: number,
  ): Container {
    const card = new Container();

    const box = new Graphics()
      .roundRect(0, 0, width, height, 14)
      .fill({ color: 0x0b172e })
      .stroke({ color, width: 1.8, alpha: 0.85 });
    card.addChild(box);

    const label = new Text({
      text: `LINE ${payline.id + 1}`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 15,
        fontWeight: '900',
        fill: `#${color.toString(16).padStart(6, '0')}`,
        letterSpacing: 2,
      },
    });
    label.anchor.set(0.5);
    label.position.set(width / 2, 26);
    card.addChild(label);

    // 5x3 mini-grid
    const cellSize = 30;
    const cellGap = 7;
    const gridW = reelCols * cellSize + (reelCols - 1) * cellGap;
    const gridH = reelRows * cellSize + (reelRows - 1) * cellGap;
    const originX = (width - gridW) / 2;
    const originY = 54 + (height - 66 - gridH) / 2;

    const gridGfx = new Graphics();
    const centers: Array<{ x: number; y: number }> = [];

    for (let r = 0; r < reelRows; r += 1) {
      for (let c = 0; c < reelCols; c += 1) {
        const cx = originX + c * (cellSize + cellGap);
        const cy = originY + r * (cellSize + cellGap);
        const isActive = payline.rows[c] === r;

        gridGfx
          .roundRect(cx, cy, cellSize, cellSize, 6)
          .fill({ color: isActive ? color : 0x071124, alpha: isActive ? 0.34 : 0.95 })
          .stroke({
            color: isActive ? color : 0x25406b,
            width: isActive ? 2.2 : 1.2,
          });
      }
    }

    for (let c = 0; c < reelCols; c += 1) {
      const r = payline.rows[c];
      centers.push({
        x: originX + c * (cellSize + cellGap) + cellSize / 2,
        y: originY + r * (cellSize + cellGap) + cellSize / 2,
      });
    }

    // Glowing connecting line through active cells
    const lineGfx = new Graphics();
    lineGfx.moveTo(centers[0].x, centers[0].y);
    for (let i = 1; i < centers.length; i += 1) {
      lineGfx.lineTo(centers[i].x, centers[i].y);
    }
    lineGfx.stroke({ color, width: 3.5, cap: 'round', join: 'round' });

    for (const pt of centers) {
      lineGfx.circle(pt.x, pt.y, 4.5).fill({ color: 0xffffff });
    }

    card.addChild(gridGfx, lineGfx);
    return card;
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
    const textX = 116;
    const maxWidth = width - textX - 14;
    counts.forEach((count, row) => {
      const multiplier = multipliers[count - 3];
      const line = new Text({
        text: `${count}x  ${multiplier.toLocaleString('en-US')}`,
        style: {
          fontFamily: 'Orbitron',
          fontSize: 16,
          fontWeight: '800',
          fill: row === 0 ? '#ffd000' : '#00f0ff',
        },
      });
      line.position.set(textX, 44 + row * 28);
      card.addChild(line);
      this.payoutRows.push({ text: line, count, multiplier, maxWidth });
    });

    return card;
  }
}
