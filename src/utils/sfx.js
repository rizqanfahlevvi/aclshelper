/* ============================================================
   ACLS Helper — Sound Effects (Web Audio API synthesis)
   No external audio files — bundle stays small.
   Master toggle: sfx.setEnabled(bool)
   ============================================================ */

let _ctx = null;
let _enabled = true;

const ctx = () => {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
};

const beep = ({ freq = 800, duration = 0.1, type = 'sine', gain = 0.2, attack = 0.005, release = 0.05, when = 0 } = {}) => {
  if (!_enabled) return;
  try {
    const c = ctx();
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.setValueAtTime(gain, t0 + duration - release);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0 + duration + 0.02);
  } catch (_) {}
};

const sweep = ({ from = 400, to = 1200, duration = 1.5, type = 'sine', gain = 0.15 } = {}) => {
  if (!_enabled) return;
  try {
    const c = ctx();
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(to, t0 + duration);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.05);
    g.gain.setValueAtTime(gain, t0 + duration - 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0 + duration + 0.02);
  } catch (_) {}
};

const noise = ({ duration = 0.08, gain = 0.3, filter = 800 } = {}) => {
  if (!_enabled) return;
  try {
    const c = ctx();
    const t0 = c.currentTime;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filter;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t0); src.stop(t0 + duration);
  } catch (_) {}
};

export const sfx = {
  setEnabled: (v) => { _enabled = !!v; },
  isEnabled: () => _enabled,

  /* ── Shock sequence ──────────────────────────────────── */
  shockCharge: () => {
    // Rising whine 400→1600 Hz, 1.8s — mirip defib charging
    sweep({ from: 400, to: 1600, duration: 1.8, type: 'sawtooth', gain: 0.10 });
  },
  shockDeliver: () => {
    // Thump rendah + noise burst — shock dilepas
    noise({ duration: 0.12, gain: 0.35, filter: 400 });
    beep({ freq: 80, duration: 0.15, type: 'square', gain: 0.30 });
  },

  /* ── Drug administration ─────────────────────────────── */
  epi: () => {
    // Two-tone naik — konfirmasi Epi
    beep({ freq: 600, duration: 0.1, gain: 0.18 });
    beep({ freq: 900, duration: 0.15, gain: 0.18, when: 0.11 });
  },
  amio: () => {
    // Three-tone turun — bedakan dari Epi
    beep({ freq: 900, duration: 0.1, gain: 0.16 });
    beep({ freq: 750, duration: 0.1, gain: 0.16, when: 0.11 });
    beep({ freq: 600, duration: 0.15, gain: 0.16, when: 0.22 });
  },

  /* ── Pulse check countdown ───────────────────────────── */
  pulseTick: () => {
    beep({ freq: 1000, duration: 0.04, gain: 0.14, type: 'square' });
  },
  pulseTickUrgent: () => {
    beep({ freq: 1400, duration: 0.06, gain: 0.20, type: 'square' });
  },
  pulseEnd: () => {
    beep({ freq: 800, duration: 0.4, gain: 0.22 });
  },

  /* ── Cycle & timing alerts ───────────────────────────── */
  cycleEnd: () => {
    // Triple chime naik — 2 menit selesai
    beep({ freq: 880, duration: 0.14, gain: 0.20 });
    beep({ freq: 1100, duration: 0.14, gain: 0.20, when: 0.17 });
    beep({ freq: 1320, duration: 0.24, gain: 0.24, when: 0.34 });
  },
  epiDue: () => {
    // Triple warning beep — Epi jatuh tempo
    beep({ freq: 1200, duration: 0.09, gain: 0.26, type: 'square' });
    beep({ freq: 1200, duration: 0.09, gain: 0.26, type: 'square', when: 0.18 });
    beep({ freq: 1200, duration: 0.14, gain: 0.28, type: 'square', when: 0.36 });
  },

  /* ── Outcome ─────────────────────────────────────────── */
  rosc: () => {
    // Arpeggio mayor naik — C5→E5→G5→C6
    beep({ freq: 523, duration: 0.18, gain: 0.18 });
    beep({ freq: 659, duration: 0.18, gain: 0.18, when: 0.12 });
    beep({ freq: 784, duration: 0.18, gain: 0.18, when: 0.24 });
    beep({ freq: 1047, duration: 0.40, gain: 0.22, when: 0.36 });
  },

  /* ── Monitor ─────────────────────────────────────────── */
  monitorOn: () => {
    // Chirp halus — monitor connected
    sweep({ from: 600, to: 1400, duration: 0.22, gain: 0.13 });
  },
};
