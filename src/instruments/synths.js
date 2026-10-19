// In-house synth voices (Nakata-style technopop palette): supersaw, pluck, bass,
// square "pikopiko" lead, sub-kick, noise risers, impacts, sidechain ducking.
import { SR } from '../config.js';
import { Saw, Pulse, SVF, adsr, automation, white } from '../lib/dsp.js';
import { hz } from '../theory.js';
import { stereo } from '../lib/wav.js';

const velGain = (v) => (v / 127) ** 1.5;

/** Seven detuned saws per note, bus-filtered with cutoff automation, wide stereo. */
export function supersaw(notes, len, spb, cutoffPts) {
  const [L, R] = stereo(len);
  const cents = [0, -9, 9, -21, 21, -34, 34];
  const pans = [0.5, 0.2, 0.8, 0.05, 0.95, 0.3, 0.7];
  const gains = [0.32, 0.24, 0.24, 0.2, 0.2, 0.16, 0.16];
  for (const nt of notes) {
    const t0 = Math.round(nt.t * spb * SR), dur = nt.d * spb;
    const short = nt.d < 1;
    const [a, d, s, r] = short ? [0.004, 0.12, 0.55, 0.07] : [0.012, 0.4, 0.82, 0.35];
    const total = Math.ceil((dur + r) * SR);
    const oscs = cents.map((c) => new Saw(hz(nt.p) * 2 ** (c / 1200)));
    const vg = velGain(nt.v) * 0.18;
    for (let i = 0; i < total && t0 + i < len; i++) {
      const e = adsr(i / SR, dur, a, d, s, r) * vg;
      if (e === 0 && i / SR > dur) break;
      let l = 0, rr = 0;
      for (let k = 0; k < 7; k++) {
        const v = oscs[k].next() * gains[k];
        l += v * Math.cos(pans[k] * Math.PI / 2); rr += v * Math.sin(pans[k] * Math.PI / 2);
      }
      L[t0 + i] += l * e; R[t0 + i] += rr * e;
    }
  }
  const fl = new SVF(8000, 0.9), fr = new SVF(8000, 0.9);
  for (let i = 0; i < len; i++) {
    if ((i & 31) === 0) {
      const c = automation(cutoffPts, i / SR / spb, 9000);
      fl.set(c); fr.set(c);
    }
    L[i] = fl.process(L[i]); R[i] = fr.process(R[i]);
  }
  return [L, R];
}

/** Bright pluck with a fast filter envelope; alternating slight pan for sparkle. */
export function pluck(notes, len, spb, cutoffPts) {
  const [L, R] = stereo(len);
  notes.forEach((nt, idx) => {
    const t0 = Math.round(nt.t * spb * SR), dur = nt.d * spb;
    const f = hz(nt.p);
    const o1 = new Saw(f * 2 ** (6 / 1200)), o2 = new Saw(f * 2 ** (-6 / 1200)), o3 = new Pulse(f, 0.3);
    const flt = new SVF(2000, 1.6);
    const base = automation(cutoffPts, nt.t, 4000);
    const vg = velGain(nt.v) * 0.3;
    const pan = idx % 2 ? 0.35 : 0.65;
    const total = Math.ceil((dur + 0.3) * SR);
    for (let i = 0; i < total && t0 + i < len; i++) {
      const t = i / SR;
      if ((i & 15) === 0) flt.set(base * 0.5 + base * 1.6 * Math.exp(-t / 0.07) + 150);
      const amp = Math.exp(-t / 0.22) * (t > dur ? Math.exp(-(t - dur) / 0.04) : 1) * Math.min(1, t / 0.002);
      const v = flt.process((o1.next() + o2.next()) * 0.5 + o3.next() * 0.35) * amp * vg;
      L[t0 + i] += v * Math.cos(pan * Math.PI / 2); R[t0 + i] += v * Math.sin(pan * Math.PI / 2);
    }
  });
  return [L, R];
}

/** Mono synth bass: saw + square + sine sub through an enveloped low-pass, gently saturated. */
export function bass(notes, len, spb) {
  const M = new Float32Array(len);
  for (const nt of notes) {
    const t0 = Math.round(nt.t * spb * SR), dur = nt.d * spb;
    const f = hz(nt.p);
    const saw = new Saw(f), sq = new Pulse(f, 0.5, 0.25);
    let ph = 0;
    const flt = new SVF(800, 1.1);
    const vg = velGain(nt.v) * 0.55;
    const total = Math.ceil((dur + 0.03) * SR);
    for (let i = 0; i < total && t0 + i < len; i++) {
      const t = i / SR;
      if ((i & 15) === 0) flt.set(220 + 1700 * Math.exp(-t / 0.05));
      ph += f / SR;
      const sub = Math.sin(2 * Math.PI * ph);
      const env = adsr(t, dur, 0.002, 0.12, 0.75, 0.025);
      const v = flt.process(saw.next() * 0.6 + sq.next() * 0.35) + sub * 0.55;
      M[t0 + i] += Math.tanh(1.4 * v) * env * vg;
    }
  }
  return [M, M.slice()];
}

/** Square-wave lead with a tiny pitch blip on the attack (chiptune-ish "piko"). */
export function lead(notes, len, spb) {
  const [L, R] = stereo(len);
  for (const nt of notes) {
    const t0 = Math.round(nt.t * spb * SR), dur = nt.d * spb;
    const f = hz(nt.p);
    const o = new Pulse(f, 0.5), o2 = new Pulse(f * 2 ** (8 / 1200), 0.25);
    const flt = new SVF(6000, 0.8);
    const vg = velGain(nt.v) * 0.22;
    const total = Math.ceil((dur + 0.1) * SR);
    for (let i = 0; i < total && t0 + i < len; i++) {
      const t = i / SR;
      const blip = t < 0.012 ? 2 ** (1 - t / 0.012) : 1;
      o.dt = f * blip / SR; o2.dt = f * 1.0046 * blip / SR;
      const env = adsr(t, dur, 0.002, 0.1, 0.55, 0.08);
      const v = flt.process(o.next() * 0.6 + o2.next() * 0.4) * env * vg;
      L[t0 + i] += v; R[t0 + i] += v;
    }
  }
  return [L, R];
}

/** Sine sub-kick under the sampled 909 kick. */
export function subKick(beats, len, spb) {
  const M = new Float32Array(len);
  for (const b of beats) {
    const t0 = Math.round(b * spb * SR);
    let ph = 0;
    for (let i = 0; i < 0.45 * SR && t0 + i < len; i++) {
      const t = i / SR;
      ph += (46 + 130 * Math.exp(-t / 0.028)) / SR;
      M[t0 + i] += Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.3) * Math.min(1, t / 0.001) * 0.8;
    }
  }
  return [M, M.slice()];
}

/** White-noise risers (band-pass sweeping up, swelling) plus a short tail. */
export function risers(list, len, spb) {
  const [L, R] = stereo(len);
  for (const [start, beats] of list) {
    const t0 = Math.round(start * spb * SR), n = Math.round(beats * spb * SR);
    const fl = new SVF(300, 2.5), fr = new SVF(300, 2.5);
    for (let i = 0; i < n + 0.3 * SR && t0 + i < len; i++) {
      const x = Math.min(1, i / n);
      if ((i & 31) === 0) { const c = 250 * (36) ** x; fl.set(c); fr.set(c * 1.05); }
      const amp = i < n ? x ** 2.2 : Math.exp(-(i - n) / SR / 0.08);
      fl.process(white()); fr.process(white());
      L[t0 + i] += fl.bp * amp * 0.5; R[t0 + i] += fr.bp * amp * 0.5;
    }
  }
  return [L, R];
}

/** Downbeat impacts: falling sine boom + filtered noise burst. */
export function impacts(list, len, spb) {
  const [L, R] = stereo(len);
  for (const b of list) {
    const t0 = Math.round(b * spb * SR);
    let ph = 0;
    const fl = new SVF(1800, 0.7), fr = new SVF(1800, 0.7);
    for (let i = 0; i < 2 * SR && t0 + i < len; i++) {
      const t = i / SR;
      ph += (38 + 40 * Math.exp(-t / 0.08)) / SR;
      const boom = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.7) * 0.6;
      const nz = Math.exp(-t / 0.35) * 0.35;
      L[t0 + i] += boom + fl.process(white()) * nz; R[t0 + i] += boom + fr.process(white()) * nz;
    }
  }
  return [L, R];
}

/** Volume-shaper sidechain: dips at each kick and recovers over `release` beats. */
export function duckCurve(len, kicks, spb, depth, release = 0.45) {
  const g = new Float32Array(len).fill(1);
  const rel = release * spb * SR, pre = 0.004 * SR;
  for (const k of kicks) {
    const t0 = Math.round(k * spb * SR);
    for (let i = -pre; i < rel; i++) {
      const j = t0 + i; if (j < 0 || j >= len) continue;
      // ramp down over `pre` samples, then recover quadratically
      const dip = i < 0 ? depth * (1 + i / pre) : depth * (1 - i / rel) ** 2;
      g[j] = Math.min(g[j], 1 - dip);
    }
  }
  return g;
}
