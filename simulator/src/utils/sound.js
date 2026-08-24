/**
 * Web Audio API Sound Synthesizer
 * Provides immediate auditory feedback for barcode scanning and parcel injections
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playBeep(frequency = 1760, duration = 0.08, type = 'sine') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be blocked by browser autoplay policy until user interaction
    }
  }

  playScanSuccess() {
    this.playBeep(1800, 0.06, 'sine');
    setTimeout(() => this.playBeep(2400, 0.08, 'sine'), 70);
  }

  playBulkSuccess() {
    this.playBeep(1200, 0.05, 'triangle');
    setTimeout(() => this.playBeep(1600, 0.05, 'triangle'), 60);
    setTimeout(() => this.playBeep(2200, 0.09, 'sine'), 120);
  }

  playStreamTick() {
    this.playBeep(1500, 0.04, 'sine');
  }

  playReset() {
    this.playBeep(800, 0.08, 'sawtooth');
    setTimeout(() => this.playBeep(500, 0.12, 'sawtooth'), 90);
  }

  playError() {
    this.playBeep(400, 0.15, 'sawtooth');
  }
}

export const sounds = new SoundEffects();
