// Note names, chord symbols, voicing and scale helpers.

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'Ab4' -> 68, 'C#5' -> 73. Numbers pass through. */
export function n(name) {
  if (typeof name === 'number') return name;
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return (Number(m[3]) + 1) * 12 + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

export const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

const QUALITY = {
  '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11], sus4: [0, 5, 7], add9: [0, 4, 7, 14], m9: [0, 3, 7, 10, 14],
};

/** 'Dbmaj7' -> { root: pitch class, ivals, rootPc } */
export function chord(sym) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(sym);
  const root = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  const ivals = QUALITY[m[3]];
  if (!ivals) throw new Error(`unknown chord quality ${sym}`);
  return { sym, root, ivals, pcs: ivals.map((i) => (root + i) % 12) };
}

/** Close voicing: every chord tone placed in [low, low+12). */
export function voice(sym, low) {
  const lo = n(low);
  return chord(sym).pcs.map((pc) => lo + ((pc - lo) % 12 + 12) % 12).sort((a, b) => a - b);
}

/** Root pitch at or above `low`. */
export function rootAt(sym, low) {
  const lo = n(low);
  return lo + ((chord(sym).root - lo) % 12 + 12) % 12;
}

// A-flat major scale (the song's key)
export const SCALE = [8, 10, 0, 1, 3, 5, 7];

/** Diatonic step within SCALE (used for vocal harmonies). */
export function diatonic(p, steps) {
  let pc = ((p % 12) + 12) % 12;
  let idx = SCALE.indexOf(pc);
  if (idx < 0) return p + (steps > 0 ? 3 : -3);
  let out = p;
  const dir = Math.sign(steps);
  for (let s = 0; s < Math.abs(steps); s++) {
    const next = SCALE[(idx + dir + 7) % 7];
    out += dir > 0 ? ((next - SCALE[idx] + 12) % 12) : -((SCALE[idx] - next + 12) % 12);
    idx = (idx + dir + 7) % 7;
  }
  return out;
}
