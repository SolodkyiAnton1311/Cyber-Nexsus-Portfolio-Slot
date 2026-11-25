const MUTE_STORAGE_KEY = 'cyber_nexus_muted';
const MASTER_VOLUME = 0.65;

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private spinLoopTimer: number | null = null;

  constructor() {
    try {
      this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
      this.muted = false;
    }
  }

  /** Must be called synchronously inside a user gesture (pointerdown/keydown) to satisfy browser autoplay policy. */
  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : MASTER_VOLUME;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // Ignore storage errors in private browsing
    }
    if (muted) {
      this.stopSpinLoop();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.02);
    }
  }

  public toggleMute(): boolean {
    this.unlock();
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playClick();
    }
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    this.unlock();
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    opts: {
      type?: OscillatorType;
      volume?: number;
      delay?: number;
      endFreq?: number;
      attack?: number;
    } = {},
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const {
      type = 'sine',
      volume = 0.25,
      delay = 0,
      endFreq,
      attack = 0.008,
    } = opts;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoiseBurst(
    duration: number,
    opts: { volume?: number; delay?: number; filterFreq?: number; q?: number } = {},
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const { volume = 0.14, delay = 0, filterFreq = 1200, q = 1.5 } = opts;
    const now = ctx.currentTime + delay;
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(q, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start(now);
    src.stop(now + duration + 0.02);
  }

  /** Crisp UI click for HUD buttons */
  public playClick(): void {
    this.playTone(920, 0.055, { type: 'triangle', volume: 0.16, endFreq: 540, attack: 0.003 });
    this.playTone(1840, 0.03, { type: 'sine', volume: 0.08, endFreq: 1200, attack: 0.002 });
  }

  /** Ascending pitch chirp for increasing bet (+) */
  public playBetUp(stepIndex = 0): void {
    const base = 540 + stepIndex * 32;
    this.playTone(base, 0.075, { type: 'triangle', volume: 0.19, endFreq: base * 1.45, attack: 0.003 });
    this.playTone(base * 1.5, 0.055, { type: 'sine', volume: 0.1, delay: 0.02, endFreq: base * 2, attack: 0.003 });
  }

  /** Descending pitch chirp for decreasing bet (-) */
  public playBetDown(stepIndex = 0): void {
    const base = 680 + stepIndex * 28;
    this.playTone(base, 0.08, { type: 'triangle', volume: 0.18, endFreq: base * 0.62, attack: 0.003 });
    this.playTone(base * 0.75, 0.06, { type: 'sine', volume: 0.09, delay: 0.02, endFreq: base * 0.45, attack: 0.003 });
  }

  /** Punchy power-up chord for MAX BET */
  public playMaxBet(): void {
    this.playTone(587.33, 0.09, { type: 'triangle', volume: 0.18, endFreq: 880, attack: 0.003 });
    this.playTone(880, 0.14, { type: 'triangle', volume: 0.2, delay: 0.045, endFreq: 1174.66, attack: 0.004 });
    this.playTone(1760, 0.1, { type: 'sine', volume: 0.09, delay: 0.06, attack: 0.004 });
  }

  /** Cyber-turbine spin launch + subtle mechanical reel ticks while spinning */
  public playSpinStart(): void {
    this.playTone(190, 0.24, { type: 'sawtooth', volume: 0.16, endFreq: 520, attack: 0.01 });
    this.playTone(380, 0.2, { type: 'triangle', volume: 0.2, endFreq: 780, attack: 0.01 });
    this.playNoiseBurst(0.18, { volume: 0.12, filterFreq: 1800, q: 1.2 });
    this.startSpinLoop();
  }

  public startSpinLoop(): void {
    this.stopSpinLoop();
    if (this.muted) return;
    let tick = 0;
    this.spinLoopTimer = window.setInterval(() => {
      if (this.muted) {
        this.stopSpinLoop();
        return;
      }
      const freq = tick % 2 === 0 ? 520 : 620;
      tick += 1;
      this.playTone(freq, 0.032, { type: 'triangle', volume: 0.075, endFreq: 260, attack: 0.002 });
    }, 85);
  }

  public stopSpinLoop(): void {
    if (this.spinLoopTimer !== null) {
      window.clearInterval(this.spinLoopTimer);
      this.spinLoopTimer = null;
    }
  }

  /** Mechanical reel landing thud + crisp metallic tick */
  public playReelStop(colIndex: number): void {
    const pitchOffset = colIndex * 18;
    this.playTone(135 + pitchOffset * 0.5, 0.11, {
      type: 'triangle',
      volume: 0.34,
      endFreq: 54,
      attack: 0.003,
    });
    this.playNoiseBurst(0.055, { volume: 0.16, filterFreq: 1500 + colIndex * 180, q: 2.0 });
  }

  /** Tight pneumatic slam stop */
  public playSlamStop(): void {
    this.playTone(150, 0.11, { type: 'square', volume: 0.14, endFreq: 48, attack: 0.002 });
    this.playNoiseBurst(0.07, { volume: 0.16, filterFreq: 900, q: 1.4 });
  }

  /** Rising sci-fi portal chime when a Scatter lands on a reel */
  public playScatterLand(scatterCountSoFar: number): void {
    const scale = [523.25, 659.25, 783.99, 987.77, 1046.5];
    const base = scale[Math.min(Math.max(0, scatterCountSoFar - 1), scale.length - 1)];
    this.playTone(base, 0.36, { type: 'triangle', volume: 0.28, attack: 0.008 });
    this.playTone(base * 1.5, 0.42, { type: 'sine', volume: 0.2, delay: 0.04, attack: 0.01 });
    this.playTone(base * 2, 0.46, { type: 'sine', volume: 0.14, delay: 0.08, attack: 0.015 });
  }

  /** Cosmic portal warp burst when 3+ Scatters trigger */
  public playScatterTrigger(): void {
    this.playTone(180, 0.55, { type: 'sawtooth', volume: 0.16, endFreq: 880, attack: 0.03 });
    this.playTone(360, 0.58, { type: 'triangle', volume: 0.2, delay: 0.05, endFreq: 1320, attack: 0.02 });
    this.playNoiseBurst(0.45, { volume: 0.14, delay: 0.02, filterFreq: 1400, q: 1.8 });
    const shimmer = [783.99, 1046.5, 1318.5, 1567.98];
    shimmer.forEach((freq, i) => {
      this.playTone(freq, 0.45, { type: 'sine', volume: 0.15, delay: 0.12 + i * 0.055 });
    });
  }

  /** H1 (Rocket) win: thruster ignition roar + ascending launch sweep */
  public playH1RocketWin(): void {
    this.playNoiseBurst(0.5, { volume: 0.22, filterFreq: 680, q: 0.9 });
    this.playNoiseBurst(0.38, { volume: 0.16, delay: 0.12, filterFreq: 1650, q: 1.3 });
    this.playTone(110, 0.48, { type: 'sawtooth', volume: 0.15, endFreq: 520, attack: 0.04 });
    this.playTone(220, 0.42, { type: 'triangle', volume: 0.18, delay: 0.06, endFreq: 880, attack: 0.03 });
  }

  /** H2 (Blaster) win: double sci-fi laser pew-pew */
  public playH2BlasterWin(): void {
    // Shot 1
    this.playTone(1680, 0.15, { type: 'sawtooth', volume: 0.18, endFreq: 210, attack: 0.003 });
    this.playTone(2400, 0.11, { type: 'sine', volume: 0.12, endFreq: 380, attack: 0.002 });
    // Shot 2
    this.playTone(1920, 0.17, { type: 'sawtooth', volume: 0.2, delay: 0.14, endFreq: 240, attack: 0.003 });
    this.playTone(2750, 0.13, { type: 'sine', volume: 0.14, delay: 0.14, endFreq: 420, attack: 0.002 });
  }

  /** Wild (WW) win: high-voltage plasma surge + golden crystal shimmer */
  public playWildWin(): void {
    // Electric crackle burst
    this.playNoiseBurst(0.16, { volume: 0.16, filterFreq: 3200, q: 2.4 });
    // Deep sub-plasma pulse
    this.playTone(146.83, 0.42, { type: 'sawtooth', volume: 0.14, endFreq: 293.66, attack: 0.01 });
    // Shimmering crystalline arpeggio
    const notes = [587.33, 880.0, 1174.66, 1760.0];
    notes.forEach((freq, i) => {
      const d = i * 0.045;
      this.playTone(freq, 0.34, { type: 'triangle', volume: 0.2, delay: d, endFreq: freq * 1.03 });
      this.playTone(freq * 2, 0.26, { type: 'sine', volume: 0.11, delay: d + 0.015 });
    });
  }

  /** Payline win chime scaled by win-to-bet ratio */
  public playWin(winToBetRatio: number): void {
    if (winToBetRatio >= 5) {
      // Big Win futuristic synth fanfare
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      notes.forEach((freq, i) => {
        const d = i * 0.065;
        this.playTone(freq, 0.38, { type: 'triangle', volume: 0.22, delay: d });
        this.playTone(freq * 0.5, 0.34, { type: 'sawtooth', volume: 0.09, delay: d });
      });
      this.playTone(130.81, 0.55, { type: 'sine', volume: 0.24, delay: 0.02, endFreq: 110 });
      return;
    }

    // Standard win bright cyber arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.22, { type: 'triangle', volume: 0.18, delay: i * 0.055 });
    });
  }

  /** Dramatic confirmation chord for Buy Bonus */
  public playBonusBuy(): void {
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25];
    chord.forEach((freq, i) => {
      this.playTone(freq, 0.42, { type: 'sawtooth', volume: 0.1, delay: i * 0.04 });
      this.playTone(freq * 2, 0.45, { type: 'sine', volume: 0.12, delay: i * 0.04 });
    });
  }

  /** Epic Free Games trigger fanfare */
  public playFreeGamesIntro(): void {
    const arpeggio = [392.0, 523.25, 659.25, 783.99, 1046.5, 1318.5];
    arpeggio.forEach((freq, i) => {
      const d = i * 0.07;
      this.playTone(freq, 0.55, { type: 'triangle', volume: 0.22, delay: d });
      this.playTone(freq * 0.5, 0.5, { type: 'sawtooth', volume: 0.08, delay: d });
    });
  }

  /** Energetic Retrigger power-up */
  public playRetrigger(): void {
    const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.36, { type: 'triangle', volume: 0.22, delay: i * 0.06 });
    });
  }

  /** Free Games end popup (celebration or gentle Better Luck cadence) */
  public playBonusSummary(hasWin: boolean): void {
    if (hasWin) {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => {
        this.playTone(freq, 0.6, { type: 'triangle', volume: 0.22, delay: i * 0.08 });
        this.playTone(freq * 0.5, 0.55, { type: 'sine', volume: 0.14, delay: i * 0.08 });
      });
    } else {
      // Tasteful soft descending 3-note cadence for Better Luck
      const notes = [440, 392, 329.63];
      notes.forEach((freq, i) => {
        this.playTone(freq, 0.34, { type: 'sine', volume: 0.16, delay: i * 0.14 });
      });
    }
  }
}

export const sound = new SoundManager();
