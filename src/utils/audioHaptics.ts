// Audio Synthesizer and Haptic Engine using Web Audio API and Navigator Vibrate
class AudioHapticsEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- HAPTIC FEEDBACK (navigator.vibrate) ---
  public vibrateLight() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  }

  public vibrateSuccess() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([30, 20, 50]);
      } catch {}
    }
  }

  public vibrateWarning() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60, 30, 60]);
      } catch {}
    }
  }

  public vibrateExplosion() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([120, 40, 80]);
      } catch {}
    }
  }

  // --- WEB AUDIO API SYNTHESIZERS ---

  public playClick() {
    this.vibrateLight();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  public playTileReveal(gemIndex: number = 0) {
    this.vibrateLight();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Ascending musical scale for multiple gems
      const scale = [440, 493.88, 554.37, 587.33, 659.25, 739.99, 830.61, 880, 987.77, 1108.73, 1174.66, 1318.51];
      const baseFreq = scale[gemIndex % scale.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  }

  public playCashoutSound(multiplier: number = 2) {
    this.vibrateSuccess();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Rich Arpeggio chords
      const freqs = [523.25, 659.25, 783.99, 1046.50, multiplier > 5 ? 1318.51 : 1046.50];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.06);

        const startTime = ctx.currentTime + idx * 0.06;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {}
  }

  public playExplosionSound() {
    this.vibrateExplosion();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Low sub-bass drop + white noise
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } catch {}
  }

  // Aliases for game callers
  public playExplosion() {
    this.playExplosionSound();
  }

  public playNearMiss() {
    this.vibrateWarning();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }

  public playSocialProof() {
    this.vibrateLight();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const freqs = [880, 1174.66];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    } catch {}
  }

  public playGemClick(step: number = 0) {
    this.playTileReveal(step);
  }

  public playMultiplierAscent(multiplier: number = 1.0) {
    this.playRocketAscent(multiplier);
  }

  public playWheelTick(tickPitch: number = 600) {
    this.vibrateLight();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(tickPitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  public playRocketAscent(multiplier: number = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Dynamic pitch ascending synth
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      
      const pitch = Math.min(1800, 180 + Math.pow(multiplier, 1.4) * 45);
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
  }

  public playBigWinFanfare() {
    this.vibrateSuccess();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const melody = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 1046.50, d: 0.35 },
      ];

      let t = ctx.currentTime;
      melody.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + note.d + 0.02);
        t += note.d * 0.9;
      });
    } catch {}
  }

  public playSlotCascade() {
    this.vibrateLight();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {}
  }

  public playSlotBomb() {
    this.vibrateSuccess();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }
}

export const sound = new AudioHapticsEngine();
