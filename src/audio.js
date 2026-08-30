import { MORSE } from './morse.js';

// Plays Morse code and feedback sounds through the default output device
// using the Web Audio API. Timing follows the PARIS standard: one dit lasts
// 1.2 / WPM seconds; a dah is 3 dits; gaps are 1 (intra-character),
// 3 (inter-character), and 7 (word) dits.
export class MorsePlayer {
  constructor({ frequency = 600, volume = 0.5 } = {}) {
    this.frequency = frequency;
    this.volume = volume;
    this.ctx = null;
    this._generation = 0;
    this._active = new Set();
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Cancels any scheduled playback. Pending playMorse() promises resolve false.
  stop() {
    this._generation++;
    for (const node of this._active) {
      try {
        node.stop();
      } catch {
        // node may already have stopped
      }
    }
    this._active.clear();
  }

  get playing() {
    return this._active.size > 0;
  }

  _tone(ctx, start, duration) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = this.frequency;
    // Short ramps avoid clicks at key-down/key-up.
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(this.volume, start + 0.004);
    gain.gain.setValueAtTime(this.volume, Math.max(start + 0.004, start + duration - 0.004));
    gain.gain.linearRampToValueAtTime(0, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
    this._active.add(osc);
    osc.onended = () => this._active.delete(osc);
  }

  // Plays a string of characters. Unknown characters are skipped.
  // Resolves true when playback finished, false if stop() interrupted it.
  playMorse(text, wpm) {
    const ctx = this._ensureCtx();
    const generation = this._generation;
    const unit = 1.2 / wpm;
    let t = ctx.currentTime + 0.08;

    for (const raw of String(text).toUpperCase()) {
      if (raw === ' ') {
        t += 4 * unit; // 3 units already added after the previous character
        continue;
      }
      const code = MORSE[raw];
      if (!code) continue;
      for (const symbol of code) {
        const duration = symbol === '.' ? unit : 3 * unit;
        this._tone(ctx, t, duration);
        t += duration + unit;
      }
      t += 2 * unit; // total inter-character gap of 3 units
    }

    const remaining = Math.max(0, t - ctx.currentTime) * 1000;
    return new Promise((resolve) => {
      setTimeout(() => resolve(generation === this._generation), remaining);
    });
  }

  // A short two-partial "ding" for correct answers.
  bell() {
    const ctx = this._ensureCtx();
    const t = ctx.currentTime;
    const partials = [
      [1318.5, 0.4],
      [1975.5, 0.2],
    ];
    for (const [freq, level] of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(level, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    }
  }
}
