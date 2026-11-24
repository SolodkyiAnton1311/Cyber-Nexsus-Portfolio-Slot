import { Application, Container, Graphics, Sprite, Text } from 'pixi.js';
import { fetchConfig, requestBuyBonus, requestCheatSpin, requestSpin } from './api/slotApi';
import { loadAssets } from './assets';
import { BET_STEPS, FRAME_BOUNDS, INITIAL_BALANCE, STAGE_HEIGHT, STAGE_WIDTH } from './config';
import { BuyBonusOverlay } from './game/BuyBonusOverlay';
import { CheatPanel } from './game/CheatPanel';
import { FreeGamesOverlay } from './game/FreeGamesOverlay';
import { Meta } from './game/Meta';
import { PaytableOverlay } from './game/PaytableOverlay';
import { SlotMachine } from './game/SlotMachine';
import { verifyRoundWins, verifySpinWins, WinMismatchError } from './game/winEvaluator';
import type { CheatMode } from './types/api';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function loadFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  try {
    await Promise.all([
      document.fonts.load('600 16px "Orbitron"'),
      document.fonts.load('700 24px "Orbitron"'),
      document.fonts.load('800 28px "Orbitron"'),
      document.fonts.load('900 32px "Orbitron"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Continue gracefully if Google Fonts is unreachable
  }
}

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

  const [assets, config] = await Promise.all([
    loadAssets(),
    fetchConfig(),
    loadFonts(),
  ]);
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

  const meta = new Meta(assets);
  world.addChild(meta);

  const paytable = new PaytableOverlay(assets, config);
  world.addChild(paytable);

  const freeGamesOverlay = new FreeGamesOverlay();
  world.addChild(freeGamesOverlay);

  const buyBonusOverlay = new BuyBonusOverlay(config.freeGamesAwards[3]);
  world.addChild(buyBonusOverlay);

  const cheatPanel = new CheatPanel((mode) => {
    if (isSpinning || autoSpin) return;
    void runSpinCycle({ cheat: mode });
  });
  world.addChild(cheatPanel);

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'KeyD') {
      e.preventDefault();
      cheatPanel.toggle();
    } else if (e.code === 'Escape' && buyBonusOverlay.opened) {
      buyBonusOverlay.hide();
    }
  });

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    machine.update(dt);
    meta.update(dt);
    paytable.update(dt);
    freeGamesOverlay.update(dt);
    buyBonusOverlay.update(dt);
    cheatPanel.update(dt);
  });

  // Error banner shown if client-side win verification disagrees with the server
  const errorBanner = new Container();
  errorBanner.visible = false;
  const errorBg = new Graphics()
    .roundRect(STAGE_WIDTH / 2 - 460, 120, 920, 84, 14)
    .fill({ color: 0x3b0712, alpha: 0.96 })
    .stroke({ color: 0xff2a54, width: 3 });
  const errorText = new Text({
    text: '',
    style: {
      fontFamily: 'Orbitron',
      fontSize: 16,
      fontWeight: '800',
      fill: '#ff8da3',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 880,
    },
  });
  errorText.anchor.set(0.5);
  errorText.position.set(STAGE_WIDTH / 2, 162);
  errorBanner.addChild(errorBg, errorText);
  world.addChild(errorBanner);

  // ----- META -----
  let balance = INITIAL_BALANCE;
  let betIndex = 0;
  let isSpinning = false;
  let canSlamStop = false;
  let autoSpin = false;
  let autoTimer: number | null = null;
  let holdTimer: number | null = null;
  let holdTriggered = false;

  const HOLD_AUTO_MS = 550;
  const getLineBet = (): number => BET_STEPS[betIndex];
  const getTotalBet = (): number => getLineBet() * config.wager.totalBetMultiplier;
  const getBonusBuyCost = (): number => getTotalBet() * config.bonusBuyMultiplier;

  const refreshBetDisplay = (): void => {
    meta.setBet(getTotalBet());
    meta.setBuyBonusCost(getBonusBuyCost());
    paytable.setBet(getLineBet(), getTotalBet());
  };

  const stopAutoSpin = (): void => {
    autoSpin = false;
    if (autoTimer !== null) {
      window.clearTimeout(autoTimer);
      autoTimer = null;
    }
    meta.setAutoSpin(false);
    if (!isSpinning) {
      meta.setControlsEnabled(true);
    }
  };

  meta.setBalance(balance);
  refreshBetDisplay();
  meta.setWin(0);

  meta.btnInfo.on('pointertap', () => {
    paytable.toggle();
  });

  meta.btnPlus.on('pointertap', () => {
    if (betIndex < BET_STEPS.length - 1) {
      betIndex += 1;
      refreshBetDisplay();
    }
  });

  meta.btnMinus.on('pointertap', () => {
    if (betIndex > 0) {
      betIndex -= 1;
      refreshBetDisplay();
    }
  });

  meta.btnMaxBet.on('pointertap', () => {
    betIndex = BET_STEPS.length - 1;
    refreshBetDisplay();
  });

  const runSpinCycle = async (opts: { isBonusBuy?: boolean; cheat?: CheatMode } = {}): Promise<void> => {
    const { isBonusBuy = false, cheat } = opts;
    const cost = isBonusBuy ? getBonusBuyCost() : getTotalBet();
    if (isSpinning) return;
    if (balance < cost) {
      stopAutoSpin();
      return;
    }

    isSpinning = true;
    canSlamStop = false;
    errorBanner.visible = false;
    machine.clearWins();
    meta.setControlsEnabled(false);

    balance -= cost;
    meta.setBalance(balance);
    meta.setWin(0);

    try {
      const result = cheat
        ? await requestCheatSpin(getLineBet(), cheat)
        : isBonusBuy
          ? await requestBuyBonus(getLineBet())
          : await requestSpin(getLineBet());

      // Allow clicking SPIN while reels spin (slam-stop in manual, or stop-auto in auto mode)
      canSlamStop = true;
      meta.setSpinButtonEnabled(true);
      await machine.spinToStops(result.stops);
      canSlamStop = false;
      if (!autoSpin) meta.setSpinButtonEnabled(false);

      // Brief beat after the last reel finishes settling before showing wins
      await delay(180);

      // Independently compute wins on the client and verify against server response
      const verifiedWins = verifySpinWins(config, result);
      machine.showWins(verifiedWins, result.board, result.scatterCount >= 3);

      // Credit base game payout first
      let cumulativeWin = result.baseGamePayout;
      balance += result.baseGamePayout;
      meta.setBalance(balance);
      meta.setWin(cumulativeWin);

      // Execute awarded Free Games one by one (no wager deducted; supports retriggers)
      if (result.freeGameResults.length > 0) {
        await delay(verifiedWins.length > 0 ? 1100 : 500);
        await freeGamesOverlay.showIntro(result.freeGamesAwarded, result.scatterCount);

        let bonusWin = 0;
        let displayedTotalFg = result.freeGamesAwarded;

        for (let i = 0; i < result.freeGameResults.length; i += 1) {
          const fg = result.freeGameResults[i];
          freeGamesOverlay.setCounter(i + 1, displayedTotalFg, bonusWin);
          machine.clearWins();

          // Allow Slam Stop during each Free Game spin as well
          canSlamStop = true;
          meta.setSpinButtonEnabled(true);
          await machine.spinToStops(fg.stops);
          canSlamStop = false;
          if (!autoSpin) meta.setSpinButtonEnabled(false);

          await delay(180);

          const fgWins = verifyRoundWins(
            config,
            fg,
            result.lineBet,
            fg.payout,
            `Free Game #${i + 1}`,
          );
          machine.showWins(fgWins, fg.board, fg.scatterCount >= 3);

          bonusWin += fg.payout;
          cumulativeWin += fg.payout;
          balance += fg.payout;
          meta.setBalance(balance);
          meta.setWin(cumulativeWin);
          freeGamesOverlay.setCounter(i + 1, displayedTotalFg, bonusWin);

          if (fg.freeGamesAwarded > 0) {
            await delay(fgWins.length > 0 ? 900 : 400);
            displayedTotalFg += fg.freeGamesAwarded;
            freeGamesOverlay.setCounter(i + 1, displayedTotalFg, bonusWin);
            await freeGamesOverlay.showRetrigger(fg.freeGamesAwarded, fg.scatterCount);
          }

          const fgPauseMs = machine.getWinShowcaseMs() || 650;
          await delay(fgPauseMs);
        }

        if (cumulativeWin !== result.payout) {
          throw new WinMismatchError(
            `Total payout mismatch after Free Games: client=${cumulativeWin}, server=${result.payout}`,
          );
        }

        freeGamesOverlay.hideCounter();
        await freeGamesOverlay.showSummary(result.freeGameResults.length, bonusWin);
      }

      console.log('Spin result (verified):', result);
    } catch (err) {
      freeGamesOverlay.hideCounter();
      stopAutoSpin();
      if (err instanceof WinMismatchError) {
        errorText.text = `SYNC ERROR: ${err.message}`;
        errorBanner.visible = true;
        console.error(err);
      } else {
        // Refund bet if the server request failed
        balance += cost;
        meta.setBalance(balance);
        console.error('Spin failed:', err);
      }
    } finally {
      isSpinning = false;
      canSlamStop = false;
      if (autoSpin && balance >= getTotalBet()) {
        // Keep bet buttons locked, SPIN stays active to stop Auto-Spin
        meta.setControlsEnabled(false);
        meta.setSpinButtonEnabled(true);
        // Wait for the full win presentation (all lines + each line one by one) before next spin
        const showcaseMs = machine.getWinShowcaseMs();
        const pauseMs = showcaseMs > 0 ? showcaseMs : 450;
        autoTimer = window.setTimeout(() => {
          autoTimer = null;
          if (autoSpin) void runSpinCycle();
        }, pauseMs);
      } else {
        stopAutoSpin();
        meta.setControlsEnabled(true);
      }
    }
  };

  meta.btnBuyBonus.on('pointertap', () => {
    if (isSpinning || autoSpin) return;
    buyBonusOverlay.show(getBonusBuyCost(), balance, () => {
      if (isSpinning || autoSpin) return;
      meta.triggerBuyBonusFlash();
      void runSpinCycle({ isBonusBuy: true });
    });
  });

  // Hold SPIN (>= 550ms) to enable Auto-Spin; short tap to Spin / Slam-Stop / Stop Auto-Spin
  const clearHoldTimer = (): void => {
    if (holdTimer !== null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
  };

  meta.btnSpin.on('pointerdown', () => {
    holdTriggered = false;
    if (autoSpin) return;

    clearHoldTimer();
    holdTimer = window.setTimeout(() => {
      holdTimer = null;
      if (balance < getTotalBet()) return;
      holdTriggered = true;
      autoSpin = true;
      meta.setAutoSpin(true);
      meta.triggerSpinFlash(0xff2cdf);
      if (!isSpinning) {
        void runSpinCycle();
      }
    }, HOLD_AUTO_MS);
  });

  meta.btnSpin.on('pointerupoutside', () => {
    clearHoldTimer();
    holdTriggered = false;
  });

  meta.btnSpin.on('pointerup', () => {
    clearHoldTimer();

    // Release right after hold activated Auto-Spin — do not cancel it
    if (holdTriggered) {
      holdTriggered = false;
      return;
    }

    // Short click while Auto-Spin is active -> stop Auto-Spin
    if (autoSpin) {
      stopAutoSpin();
      return;
    }

    // Short click while manual spin is running -> Slam Stop
    if (isSpinning) {
      if (canSlamStop) {
        canSlamStop = false;
        meta.setSpinButtonEnabled(false);
        machine.slamStop();
      }
      return;
    }

    // Normal single spin
    meta.triggerSpinFlash(0x00ff88);
    void runSpinCycle();
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start slot client:', err);
});
