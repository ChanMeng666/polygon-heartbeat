// Small DSP toolkit: band-limited oscillators, TPT state-variable filter, biquads, envelopes.
import { SR } from '../config.js';

export function polyblep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}

/** Band-limited saw; phase in [0,1). */
export class Saw {
  constructor(freq, phase = Math.random()) { this.ph = phase; this.dt = freq / SR; }
  next() {
    const t = this.ph;
    this.ph += this.dt; if (this.ph >= 1) this.ph -= 1;
    return 2 * t - 1 - polyblep(t, this.dt);
  }
}

/** Band-limited pulse. */
export class Pulse {
  constructor(freq, width = 0.5, phase = 0) { this.ph = phase; this.dt = freq / SR; this.w = width; }
  next() {
    const t = this.ph, dt = this.dt;
    this.ph += dt; if (this.ph >= 1) this.ph -= 1;
    let v = t < this.w ? 1 : -1;
    v += polyblep(t, dt);
    let t2 = t - this.w; if (t2 < 0) t2 += 1;
    v -= polyblep(t2, dt);
    return v;
  }
}

/** Zavalishin TPT state-variable filter (lp/bp/hp). */
export class SVF {
  constructor(cutoff = 1000, q = 0.7) { this.ic1 = 0; this.ic2 = 0; this.set(cutoff, q); }
  set(cutoff, q = this.q) {
    this.q = q;
    const g = Math.tan(Math.PI * Math.min(cutoff, SR * 0.45) / SR);
    const k = 1 / q;
    this.a1 = 1 / (1 + g * (g + k)); this.a2 = g * this.a1; this.a3 = g * this.a2; this.k = k;
  }
  process(v0) {
    const v3 = v0 - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1; this.ic2 = 2 * v2 - this.ic2;
    this.lp = v2; this.bp = v1; this.hp = v0 - this.k * v1 - v2;
    return v2;
  }
}

/** RBJ band-pass (constant 0 dB peak). */
export class BandPass {
  constructor(f, q) {
    const w = 2 * Math.PI * f / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al;
    this.b0 = al / a0; this.b2 = -al / a0; this.a1 = -2 * Math.cos(w) / a0; this.a2 = (1 - al) / a0;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }
  process(x) {
    const y = this.b0 * x + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

/** Linear-attack / exponential-ish ADSR evaluated at time t (s) for a note of length `len` (s). */
export function adsr(t, len, a, d, s, r) {
  let lvl;
  if (t < a) lvl = t / a;
  else if (t < a + d) lvl = 1 - (1 - s) * ((t - a) / d);
  else lvl = s;
  if (t > len) {
    const rel = (t - len) / r;
    if (rel >= 1) return 0;
    const at = len < a ? len / a : len < a + d ? 1 - (1 - s) * ((len - a) / d) : s;
    return at * (1 - rel) ** 2;
  }
  return lvl;
}

/** Piecewise-linear automation lookup; points [{t, v}] sorted by t. */
export function automation(points, t, fallback) {
  if (!points?.length) return fallback;
  if (t <= points[0].t) return points[0].v;
  for (let i = 1; i < points.length; i++) {
    if (t < points[i].t) {
      const p = points[i - 1], q = points[i];
      // exponential interpolation suits frequencies
      return p.v * (q.v / p.v) ** ((t - p.t) / (q.t - p.t));
    }
  }
  return points.at(-1).v;
}

export const dbToGain = (db) => 10 ** (db / 20);
export const white = () => Math.random() * 2 - 1;

/** Deterministic PRNG so renders are reproducible. */
export function seedRandom(seed = 1) {
  let s = seed >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
