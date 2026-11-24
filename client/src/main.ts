import { Application, Container, Sprite } from 'pixi.js';
import { fetchConfig } from './api/slotApi';
import { loadAssets } from './assets';
import { FRAME_BOUNDS, STAGE_HEIGHT, STAGE_WIDTH } from './config';
import { SlotMachine } from './game/SlotMachine';

function fitCanvas(canvas: HTMLCanvasElement): void {
  const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
  canvas.style.width = `${Math.floor(STAGE_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(STAGE_HEIGHT * scale)}px`;
}

async function bootstrap(): Promise<void> {
  const app = new Application();
  await app.init({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    backgroundColor: 0x030612,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });

  const root = document.getElementById('app');
  if (!root) throw new Error('#app container not found');
  root.appendChild(app.canvas);

  fitCanvas(app.canvas);
  window.addEventListener('resize', () => fitCanvas(app.canvas));

  const [assets, config] = await Promise.all([loadAssets(), fetchConfig()]);
  console.log('Loaded slot config:', config);

  const world = new Container();
  app.stage.addChild(world);

  const bg = new Sprite(assets.machine.bg);
  bg.width = STAGE_WIDTH;
  bg.height = STAGE_HEIGHT;
  world.addChild(bg);

  const machine = new SlotMachine(assets, config);
  machine.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2 + FRAME_BOUNDS.stageOffsetY);
  machine.scale.set(FRAME_BOUNDS.stageScale);
  world.addChild(machine);
  
  // 2. 5x3 Reels container with Graphics mask (using config.reelStrips & assets.symbols)
  // 3. Bottom HUD (panelBottomDock, -, bet, +, maxBet, panelWin, btnSpin) & Top HUD (balance)
  // 4. Spin flow: call requestSpin(bet) -> animate reels to response.stops -> highlight response.wins
}

bootstrap().catch((err) => {
  console.error('Failed to start slot client:', err);
});
