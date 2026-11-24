import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { GameAssets } from '../assets';
import { HUD_LAYOUT } from '../config';

interface ButtonAnimState {
  sprite: Sprite;
  baseScaleX: number;
  baseScaleY: number;
  hovered: boolean;
  pressed: boolean;
  scaleMult: number;
}

export class Meta extends Container {
  public readonly btnBuyBonus: Container;
  public readonly btnInfo: Sprite;
  public readonly btnMinus: Sprite;
  public readonly btnPlus: Sprite;
  public readonly btnMaxBet: Sprite;
  public readonly btnSpin: Sprite;

  private readonly balanceText: Text;
  private readonly betText: Text;
  private readonly winText: Text;
  private readonly buyBonusCostText: Text;
  private readonly autoBadge: Container;
  private readonly animatedButtons: ButtonAnimState[] = [];

  // Buy Bonus button animation state
  private readonly buyBonusFlashRing: Graphics;
  private buyBonusHovered = false;
  private buyBonusPressed = false;
  private buyBonusScale = 1;
  private buyBonusFlashProgress = 1;

  // SPIN button animation state
  private readonly spinBaseScaleX: number;
  private readonly spinBaseScaleY: number;
  private readonly holdBar: Graphics;
  private readonly flashRing: Graphics;
  private spinHovered = false;
  private spinPressed = false;
  private spinAutoActive = false;
  private spinScaleMult = 1;
  private holdElapsed = 0;
  private readonly holdDurationSec = 0.55;
  private animTime = 0;
  private flashProgress = 1;
  private flashColor = 0x00ff88;

  constructor(assets: GameAssets) {
    super();

    // --- Left side: Square BUY BONUS button ---
    this.buyBonusFlashRing = new Graphics();
    this.buyBonusFlashRing.position.set(HUD_LAYOUT.buyBonusX, HUD_LAYOUT.buyBonusY);
    this.addChild(this.buyBonusFlashRing);

    this.btnBuyBonus = new Container();
    this.btnBuyBonus.position.set(HUD_LAYOUT.buyBonusX, HUD_LAYOUT.buyBonusY);
    this.btnBuyBonus.eventMode = 'static';
    this.btnBuyBonus.cursor = 'pointer';

    const buyBonusSprite = new Sprite(assets.ui.btnBuyBonus);
    buyBonusSprite.anchor.set(0.5);
    buyBonusSprite.width = HUD_LAYOUT.buyBonusSize;
    buyBonusSprite.height = HUD_LAYOUT.buyBonusSize;
    this.btnBuyBonus.addChild(buyBonusSprite);

    this.buyBonusCostText = new Text({
      text: '50',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 18,
        fontWeight: '900',
        fill: '#ffd000',
        padding: 4,
      },
    });
    this.buyBonusCostText.anchor.set(0.5);
    this.buyBonusCostText.position.set(0, 32);
    this.btnBuyBonus.addChild(this.buyBonusCostText);
    this.addChild(this.btnBuyBonus);

    this.btnBuyBonus.on('pointerover', () => {
      this.buyBonusHovered = true;
    });
    this.btnBuyBonus.on('pointerout', () => {
      this.buyBonusHovered = false;
      this.buyBonusPressed = false;
    });
    this.btnBuyBonus.on('pointerdown', () => {
      this.buyBonusPressed = true;
    });
    this.btnBuyBonus.on('pointerup', () => {
      this.buyBonusPressed = false;
    });
    this.btnBuyBonus.on('pointerupoutside', () => {
      this.buyBonusPressed = false;
    });

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
        padding: 8,
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
        padding: 8,
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
        padding: 8,
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
      false,
    );
    this.spinBaseScaleX = this.btnSpin.scale.x;
    this.spinBaseScaleY = this.btnSpin.scale.y;

    // Expanding neon flash ring around SPIN on click / auto-spin activation
    this.flashRing = new Graphics();
    this.flashRing.position.set(HUD_LAYOUT.btnSpinX, HUD_LAYOUT.dockY);
    this.addChild(this.flashRing);

    // Neon hold-to-auto charge bar along the bottom edge of SPIN
    this.holdBar = new Graphics();
    this.holdBar.position.set(HUD_LAYOUT.btnSpinX, HUD_LAYOUT.dockY + HUD_LAYOUT.btnSpinHeight / 2 - 6);
    this.addChild(this.holdBar);

    // Track hover & press states for smooth tactile animations
    this.btnSpin.on('pointerover', () => {
      this.spinHovered = true;
    });
    this.btnSpin.on('pointerout', () => {
      this.spinHovered = false;
    });
    this.btnSpin.on('pointerdown', () => {
      this.spinPressed = true;
      this.holdElapsed = 0;
    });
    const releaseSpin = (): void => {
      this.spinPressed = false;
      this.holdElapsed = 0;
      this.holdBar.clear();
    };
    this.btnSpin.on('pointerup', releaseSpin);
    this.btnSpin.on('pointerupoutside', releaseSpin);

    // Floating indicator badge shown above SPIN when Auto-Spin is active
    this.autoBadge = new Container();
    this.autoBadge.visible = false;
    this.autoBadge.position.set(HUD_LAYOUT.btnSpinX, HUD_LAYOUT.dockY - 56);

    const badgeBg = new Graphics()
      .roundRect(-108, -15, 216, 30, 8)
      .fill({ color: 0x1a062b, alpha: 0.95 })
      .stroke({ color: 0xff2cdf, width: 2 });
    const badgeText = new Text({
      text: 'AUTO ON • CLICK STOP',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 11,
        fontWeight: '900',
        fill: '#ff85ee',
        letterSpacing: 1.2,
        padding: 4,
      },
    });
    badgeText.anchor.set(0.5);
    this.autoBadge.addChild(badgeBg, badgeText);
    this.addChild(this.autoBadge);
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

  public setBuyBonusCost(cost: number): void {
    this.buyBonusCostText.text = cost.toLocaleString('en-US');
  }

  public setControlsEnabled(enabled: boolean): void {
    const mode = enabled ? 'static' : 'none';
    const alpha = enabled ? 1 : 0.5;
    for (const btn of [
      this.btnBuyBonus,
      this.btnMinus,
      this.btnPlus,
      this.btnMaxBet,
      this.btnSpin,
    ]) {
      btn.eventMode = mode;
      btn.alpha = alpha;
    }
    if (!enabled) {
      this.buyBonusHovered = false;
      this.buyBonusPressed = false;
      for (const state of this.animatedButtons) {
        if (state.sprite !== this.btnInfo) {
          state.hovered = false;
          state.pressed = false;
        }
      }
    }
  }

  public setSpinButtonEnabled(enabled: boolean): void {
    this.btnSpin.eventMode = enabled ? 'static' : 'none';
    this.btnSpin.alpha = enabled ? 1 : 0.5;
    if (!enabled) {
      this.spinPressed = false;
      this.spinHovered = false;
      this.holdElapsed = 0;
      this.holdBar.clear();
    }
  }

  public setAutoSpin(active: boolean): void {
    this.spinAutoActive = active;
    this.autoBadge.visible = active;
    this.btnSpin.tint = active ? 0xffa6f5 : 0xffffff;
    if (active) {
      this.holdElapsed = 0;
      this.holdBar.clear();
    }
  }

  public triggerSpinFlash(color = 0x00ff88): void {
    this.flashColor = color;
    this.flashProgress = 0;
  }

  public triggerBuyBonusFlash(): void {
    this.buyBonusFlashProgress = 0;
  }

  public update(deltaSeconds: number): void {
    const dt = Math.min(deltaSeconds, 0.05);
    this.animTime += dt;

    // 1. Compute target scale multiplier for SPIN button
    let targetMult = 1;
    if (this.btnSpin.eventMode === 'static') {
      if (this.spinPressed) {
        targetMult = 0.93;
      } else if (this.spinAutoActive) {
        // Gentle rhythmic breathing in Auto-Spin mode
        targetMult = 1.0 + Math.sin(this.animTime * 5) * 0.028;
      } else if (this.spinHovered) {
        targetMult = 1.045;
      }
    }

    // Smooth exponential ease toward target scale
    const lerp = 1 - Math.exp(-18 * dt);
    this.spinScaleMult += (targetMult - this.spinScaleMult) * lerp;

    // Subtle charge shake when holding for Auto-Spin (> 35% charged)
    let shakeX = 0;
    let shakeY = 0;
    if (this.spinPressed && !this.spinAutoActive && this.btnSpin.eventMode === 'static') {
      this.holdElapsed = Math.min(this.holdElapsed + dt, this.holdDurationSec);
      const ratio = this.holdElapsed / this.holdDurationSec;

      if (ratio > 0.15) {
        const barMaxW = HUD_LAYOUT.btnSpinWidth - 48;
        const barW = barMaxW * ratio;
        this.holdBar.clear();
        this.holdBar
          .roundRect(-barMaxW / 2, -3, barMaxW, 6, 3)
          .fill({ color: 0x050c1a, alpha: 0.85 });
        this.holdBar
          .roundRect(-barMaxW / 2, -3, barW, 6, 3)
          .fill({ color: ratio > 0.75 ? 0xff2cdf : 0x00f0ff });
      }

      if (ratio > 0.35) {
        const intensity = (ratio - 0.35) * 3.5;
        shakeX = Math.sin(this.animTime * 65) * intensity;
        shakeY = Math.cos(this.animTime * 55) * intensity * 0.6;
      }
    }

    this.btnSpin.scale.set(
      this.spinBaseScaleX * this.spinScaleMult,
      this.spinBaseScaleY * this.spinScaleMult,
    );
    this.btnSpin.position.set(HUD_LAYOUT.btnSpinX + shakeX, HUD_LAYOUT.dockY + shakeY);

    // 2. Pulse the AUTO ON badge gently
    if (this.spinAutoActive) {
      this.autoBadge.alpha = 0.85 + Math.sin(this.animTime * 5) * 0.15;
    }

    // 3. Expanding flash ring effect on click / activation
    if (this.flashProgress < 1) {
      this.flashProgress = Math.min(this.flashProgress + dt * 3.4, 1);
      const ease = 1 - Math.pow(1 - this.flashProgress, 3);
      const pad = ease * 26;
      const w = HUD_LAYOUT.btnSpinWidth + pad * 2;
      const h = HUD_LAYOUT.btnSpinHeight + pad * 2;
      const alpha = (1 - this.flashProgress) * 0.85;

      this.flashRing.clear();
      if (alpha > 0.01) {
        this.flashRing
          .roundRect(-w / 2, -h / 2, w, h, 16)
          .stroke({ color: this.flashColor, width: 4 * (1 - this.flashProgress) + 1.5, alpha });
      }
    }

    // 4. Smooth hover & press animations for all other buttons (info, -, +, MAX BET)
    for (const state of this.animatedButtons) {
      const enabled = state.sprite.eventMode === 'static';
      let btnTarget = 1;
      if (enabled) {
        if (state.pressed) btnTarget = 0.91;
        else if (state.hovered) btnTarget = 1.07;
      }
      state.scaleMult += (btnTarget - state.scaleMult) * lerp;
      state.sprite.scale.set(
        state.baseScaleX * state.scaleMult,
        state.baseScaleY * state.scaleMult,
      );
      state.sprite.tint = enabled && state.pressed ? 0xb8f6ff : 0xffffff;
    }

    // 5. Square BUY BONUS button animation (idle breathing + hover + press + flash ring)
    const buyEnabled = this.btnBuyBonus.eventMode === 'static';
    let buyTarget = 1;
    if (buyEnabled) {
      if (this.buyBonusPressed) buyTarget = 0.91;
      else if (this.buyBonusHovered) buyTarget = 1.08;
      else buyTarget = 1.0 + Math.sin(this.animTime * 3.2) * 0.02;
    }
    this.buyBonusScale += (buyTarget - this.buyBonusScale) * lerp;
    this.btnBuyBonus.scale.set(this.buyBonusScale);

    if (this.buyBonusFlashProgress < 1) {
      this.buyBonusFlashProgress = Math.min(this.buyBonusFlashProgress + dt * 3.0, 1);
      const ease = 1 - Math.pow(1 - this.buyBonusFlashProgress, 3);
      const size = HUD_LAYOUT.buyBonusSize + ease * 42;
      const alpha = (1 - this.buyBonusFlashProgress) * 0.9;
      this.buyBonusFlashRing.clear();
      if (alpha > 0.01) {
        this.buyBonusFlashRing
          .roundRect(-size / 2, -size / 2, size, size, 18)
          .stroke({ color: 0xff2cdf, width: 5 * (1 - this.buyBonusFlashProgress) + 1.5, alpha });
      }
    }
  }

  private createButton(
    texture: GameAssets['ui'][keyof GameAssets['ui']],
    x: number,
    y: number,
    width: number,
    height: number,
    withDefaultAnim = true,
  ): Sprite {
    const btn = new Sprite(texture);
    btn.anchor.set(0.5);
    btn.width = width;
    btn.height = height;
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    this.addChild(btn);

    if (withDefaultAnim) {
      const state: ButtonAnimState = {
        sprite: btn,
        baseScaleX: btn.scale.x,
        baseScaleY: btn.scale.y,
        hovered: false,
        pressed: false,
        scaleMult: 1,
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
      this.animatedButtons.push(state);
    }

    return btn;
  }
}
