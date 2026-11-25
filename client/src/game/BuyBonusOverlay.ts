import { Container, Graphics, Text } from 'pixi.js';
import { sound } from '../audio/SoundManager';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../config';

interface ModalButton {
  container: Container;
  hovered: boolean;
  pressed: boolean;
  scale: number;
}

export class BuyBonusOverlay extends Container {
  private readonly backdrop: Graphics;
  private readonly card: Container;
  private readonly costText: Text;
  private readonly infoText: Text;
  private readonly warningText: Text;
  private readonly confirmBtn: ModalButton;
  private readonly cancelBtn: ModalButton;

  private isOpen = false;
  private openProgress = 0;
  private canAfford = true;
  private onConfirmCallback: (() => void) | null = null;

  constructor(freeGamesFor3: number) {
    super();

    this.visible = false;

    this.backdrop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      .fill({ color: 0x020612, alpha: 0.82 });
    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointertap', () => {
      sound.playClick();
      this.hide();
    });
    this.addChild(this.backdrop);

    this.card = new Container();
    this.card.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2);
    this.card.eventMode = 'static';
    this.addChild(this.card);

    const cardBg = new Graphics()
      .roundRect(-310, -185, 620, 370, 22)
      .fill({ color: 0x050312, alpha: 0.99 })
      .stroke({ color: 0xffd000, width: 3.5 });

    const innerFrame = new Graphics()
      .roundRect(-296, -171, 592, 342, 16)
      .fill({ color: 0x0b0d24, alpha: 0.94 })
      .stroke({ color: 0x00f0ff, width: 1.8, alpha: 0.7 });

    const title = new Text({
      text: 'BUY BONUS',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 34,
        fontWeight: '900',
        fill: '#ffd966',
        stroke: { color: '#3b1c00', width: 5 },
        dropShadow: { color: '#ffb700', blur: 14, distance: 0, alpha: 0.85 },
        letterSpacing: 3,
        padding: 10,
      },
    });
    title.anchor.set(0.5);
    title.position.set(0, -122);

    this.infoText = new Text({
      text: `GUARANTEED 3 SCATTERS  •  ${freeGamesFor3} FREE GAMES`,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 14,
        fontWeight: '700',
        fill: '#cce6ff',
        letterSpacing: 1.5,
        padding: 6,
      },
    });
    this.infoText.anchor.set(0.5);
    this.infoText.position.set(0, -76);

    const costBox = new Graphics()
      .roundRect(-210, -44, 420, 96, 14)
      .fill({ color: 0x061022, alpha: 0.96 })
      .stroke({ color: 0xff2cdf, width: 2.2 });

    const costLabel = new Text({
      text: 'BONUS COST',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 12,
        fontWeight: '700',
        fill: '#ff8ef0',
        letterSpacing: 2.5,
        padding: 4,
      },
    });
    costLabel.anchor.set(0.5);
    costLabel.position.set(0, -22);

    this.costText = new Text({
      text: '50',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 38,
        fontWeight: '900',
        fill: '#ffffff',
        stroke: { color: '#2b0030', width: 4 },
        dropShadow: { color: '#ff2cdf', blur: 14, distance: 0, alpha: 0.85 },
        padding: 10,
      },
    });
    this.costText.anchor.set(0.5);
    this.costText.position.set(0, 18);

    this.warningText = new Text({
      text: 'INSUFFICIENT BALANCE',
      style: {
        fontFamily: 'Orbitron',
        fontSize: 13,
        fontWeight: '800',
        fill: '#ff4d6d',
        letterSpacing: 2,
        padding: 4,
      },
    });
    this.warningText.anchor.set(0.5);
    this.warningText.position.set(0, 72);
    this.warningText.visible = false;

    this.cancelBtn = this.createButton('CANCEL', -126, 122, 210, 56, 0x101c33, 0x5c7fa3, '#cce6ff', () => {
      sound.playClick();
      this.hide();
    });

    this.confirmBtn = this.createButton('BUY NOW', 126, 122, 210, 56, 0x0b3622, 0x00ff88, '#ffffff', () => {
      if (!this.canAfford) return;
      const cb = this.onConfirmCallback;
      this.hide();
      cb?.();
    });

    this.card.addChild(
      cardBg,
      innerFrame,
      title,
      this.infoText,
      costBox,
      costLabel,
      this.costText,
      this.warningText,
      this.cancelBtn.container,
      this.confirmBtn.container,
    );
  }

  public show(cost: number, balance: number, onConfirm: () => void): void {
    this.canAfford = balance >= cost;
    this.onConfirmCallback = onConfirm;

    this.costText.text = cost.toLocaleString('en-US');
    this.costText.scale.set(1);
    if (this.costText.width > 380) {
      this.costText.scale.set(380 / this.costText.width);
    }

    this.warningText.visible = !this.canAfford;
    this.confirmBtn.container.alpha = this.canAfford ? 1 : 0.35;
    this.confirmBtn.container.eventMode = this.canAfford ? 'static' : 'none';
    this.confirmBtn.container.cursor = this.canAfford ? 'pointer' : 'default';

    this.isOpen = true;
    this.visible = true;
  }

  public hide(): void {
    this.isOpen = false;
    this.onConfirmCallback = null;
    this.resetButtonState(this.cancelBtn);
    this.resetButtonState(this.confirmBtn);
  }

  public get opened(): boolean {
    return this.isOpen;
  }

  public update(deltaSeconds: number): void {
    if (!this.visible) return;
    const dt = Math.min(deltaSeconds, 0.05);

    const speed = this.isOpen ? 7 : 8;
    this.openProgress = this.isOpen
      ? Math.min(this.openProgress + dt * speed, 1)
      : Math.max(this.openProgress - dt * speed, 0);

    const ease = 1 - Math.pow(1 - this.openProgress, 3);
    this.backdrop.alpha = ease;
    this.card.alpha = ease;
    this.card.scale.set(0.86 + ease * 0.14);

    if (!this.isOpen && this.openProgress <= 0) {
      this.visible = false;
      return;
    }

    this.animateButton(this.cancelBtn, dt);
    this.animateButton(this.confirmBtn, dt);
  }

  private createButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number,
    strokeColor: number,
    textColor: string,
    onTap: () => void,
  ): ModalButton {
    const container = new Container();
    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const bg = new Graphics()
      .roundRect(-width / 2, -height / 2, width, height, 12)
      .fill({ color: fillColor })
      .stroke({ color: strokeColor, width: 2.5 });

    const text = new Text({
      text: label,
      style: {
        fontFamily: 'Orbitron',
        fontSize: 18,
        fontWeight: '900',
        fill: textColor,
        letterSpacing: 2,
        padding: 6,
      },
    });
    text.anchor.set(0.5);
    container.addChild(bg, text);

    const state: ModalButton = { container, hovered: false, pressed: false, scale: 1 };

    container.on('pointerover', () => {
      state.hovered = true;
    });
    container.on('pointerout', () => {
      state.hovered = false;
      state.pressed = false;
    });
    container.on('pointerdown', () => {
      state.pressed = true;
    });
    container.on('pointerup', () => {
      state.pressed = false;
    });
    container.on('pointerupoutside', () => {
      state.pressed = false;
    });
    container.on('pointertap', onTap);

    return state;
  }

  private resetButtonState(btn: ModalButton): void {
    btn.hovered = false;
    btn.pressed = false;
    btn.scale = 1;
    btn.container.scale.set(1);
  }

  private animateButton(btn: ModalButton, dt: number): void {
    const target = btn.pressed ? 0.93 : btn.hovered ? 1.06 : 1;
    const lerp = 1 - Math.exp(-18 * dt);
    btn.scale += (target - btn.scale) * lerp;
    btn.container.scale.set(btn.scale);
  }
}
