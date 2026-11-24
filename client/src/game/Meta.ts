import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { GameAssets } from '../assets';
import { HUD_LAYOUT } from '../config';

export class Meta extends Container {
  public readonly btnInfo: Sprite;
  public readonly btnMinus: Sprite;
  public readonly btnPlus: Sprite;
  public readonly btnMaxBet: Sprite;
  public readonly btnSpin: Sprite;

  private readonly balanceText: Text;
  private readonly betText: Text;
  private readonly winText: Text;

  constructor(assets: GameAssets) {
    super();

    // --- Top bar ---
    const balancePanel = new Sprite(assets.ui.panelMeter);
    balancePanel.anchor.set(0.5);
    balancePanel.width = HUD_LAYOUT.balancePanelWidth;
    balancePanel.height = HUD_LAYOUT.balancePanelHeight;
    balancePanel.position.set(HUD_LAYOUT.balancePanelX, HUD_LAYOUT.topY);
    this.addChild(balancePanel);

    const coinIcon = new Sprite(assets.ui.iconCoin);
    coinIcon.anchor.set(0.5);
    coinIcon.width = HUD_LAYOUT.coinSize;
    coinIcon.height = HUD_LAYOUT.coinSize;
    coinIcon.position.set(HUD_LAYOUT.balancePanelX + HUD_LAYOUT.coinOffsetX, HUD_LAYOUT.topY);
    this.addChild(coinIcon);

    this.balanceText = new Text({
      text: '100,000',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 28,
        fontWeight: '800',
        fill: '#ffffff',
      },
    });
    this.balanceText.anchor.set(0.5);
    this.balanceText.position.set(HUD_LAYOUT.balancePanelX + 18, HUD_LAYOUT.topY);
    this.addChild(this.balanceText);

    this.btnInfo = this.createButton(
      assets.ui.btnInfo,
      HUD_LAYOUT.infoBtnX,
      HUD_LAYOUT.topY,
      HUD_LAYOUT.infoBtnSize,
      HUD_LAYOUT.infoBtnSize,
    );

    // --- Bottom console dock ---
    const dock = new Sprite(assets.ui.panelBottomDock);
    dock.anchor.set(0.5);
    dock.width = HUD_LAYOUT.dockWidth;
    dock.height = HUD_LAYOUT.dockHeight;
    dock.position.set(HUD_LAYOUT.dockX, HUD_LAYOUT.dockY);
    this.addChild(dock);

    this.btnMinus = this.createButton(
      assets.ui.btnMinus,
      HUD_LAYOUT.btnMinusX,
      HUD_LAYOUT.dockY,
      HUD_LAYOUT.btnSmallSize,
      HUD_LAYOUT.btnSmallSize,
    );

    const betBox = new Graphics()
      .roundRect(
        HUD_LAYOUT.betBoxX - HUD_LAYOUT.betBoxWidth / 2,
        HUD_LAYOUT.dockY - HUD_LAYOUT.betBoxHeight / 2,
        HUD_LAYOUT.betBoxWidth,
        HUD_LAYOUT.betBoxHeight,
        10,
      )
      .fill({ color: 0x060f21 })
      .stroke({ color: 0x00f0ff, alpha: 0.45, width: 1.5 });
    this.addChild(betBox);

    this.betText = new Text({
      text: '10',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 24,
        fontWeight: '800',
        fill: '#00f0ff',
      },
    });
    this.betText.anchor.set(0.5);
    this.betText.position.set(HUD_LAYOUT.betBoxX, HUD_LAYOUT.dockY);
    this.addChild(this.betText);

    this.btnPlus = this.createButton(
      assets.ui.btnPlus,
      HUD_LAYOUT.btnPlusX,
      HUD_LAYOUT.dockY,
      HUD_LAYOUT.btnSmallSize,
      HUD_LAYOUT.btnSmallSize,
    );

    this.btnMaxBet = this.createButton(
      assets.ui.btnMaxBet,
      HUD_LAYOUT.btnMaxBetX,
      HUD_LAYOUT.dockY,
      HUD_LAYOUT.btnMaxBetWidth,
      HUD_LAYOUT.btnMaxBetHeight,
    );

    const winPanel = new Sprite(assets.ui.panelWin);
    winPanel.anchor.set(0.5);
    winPanel.width = HUD_LAYOUT.winPanelWidth;
    winPanel.height = HUD_LAYOUT.winPanelHeight;
    winPanel.position.set(HUD_LAYOUT.winPanelX, HUD_LAYOUT.dockY);
    this.addChild(winPanel);

    const winLabel = new Text({
      text: 'LAST WIN',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 11,
        fontWeight: '700',
        fill: '#7ee8ff',
        letterSpacing: 3,
      },
    });
    winLabel.anchor.set(0.5);
    winLabel.position.set(HUD_LAYOUT.winPanelX, HUD_LAYOUT.dockY - 17);
    this.addChild(winLabel);

    this.winText = new Text({
      text: '0',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 26,
        fontWeight: '900',
        fill: '#00ff88',
      },
    });
    this.winText.anchor.set(0.5);
    this.winText.position.set(HUD_LAYOUT.winPanelX, HUD_LAYOUT.dockY + 10);
    this.addChild(this.winText);

    this.btnSpin = this.createButton(
      assets.ui.btnSpin,
      HUD_LAYOUT.btnSpinX,
      HUD_LAYOUT.dockY,
      HUD_LAYOUT.btnSpinWidth,
      HUD_LAYOUT.btnSpinHeight,
    );
  }

  public setBalance(value: number): void {
    this.balanceText.text = value.toLocaleString('en-US');
  }

  public setBet(totalBet: number): void {
    this.betText.text = totalBet.toLocaleString('en-US');
  }

  public setWin(value: number): void {
    this.winText.text = value.toLocaleString('en-US');
  }

  private createButton(
    texture: GameAssets['ui'][keyof GameAssets['ui']],
    x: number,
    y: number,
    width: number,
    height: number,
  ): Sprite {
    const btn = new Sprite(texture);
    btn.anchor.set(0.5);
    btn.width = width;
    btn.height = height;
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    this.addChild(btn);
    return btn;
  }
}
