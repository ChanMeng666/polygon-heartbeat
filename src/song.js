// "Polygon Heartbeat" — the composition. Everything here is data: sections, chords,
// melodies (with Japanese lyrics), and every instrument part as note events.
// Time unit: beats (quarter notes). 1 bar = 4 beats. One "16th" = 0.25 beat.
import { n, voice, rootAt, diatonic } from './theory.js';

export const TITLE = 'Polygon Heartbeat (ポリゴン・ハートビート)';
export const BPM = 128;
export const KEY = 'A♭ major / F minor';
export const SPB = 60 / BPM; // seconds per beat

const INTRO = ['Fm', 'Db', 'Eb', 'Cm', 'Fm', 'Db', 'Eb', 'Cm'];
const VERSE = ['Fm', 'Db', 'Eb', 'Cm', 'Fm', 'Db', 'Bbm7', 'C7'];
const PRE = ['Dbmaj7', 'Eb', 'Cm7', 'Fm7', 'Bbm7', 'Cm7', 'Dbmaj7', 'Eb'];
// IV–V–iii–vi "royal road" (王道進行) into ii–V–I
const CHORUS = ['Db', 'Eb', 'Cm', 'Fm', 'Bbm7', 'Eb', 'Ab', 'Ab'];

export const SECTIONS = [
  { name: 'intro', bars: 8, chords: INTRO },
  { name: 'verse1', bars: 16, chords: [...VERSE, ...VERSE] },
  { name: 'pre1', bars: 8, chords: PRE },
  { name: 'chorus1', bars: 16, chords: [...CHORUS, ...CHORUS.slice(0, 7), 'C7'] },
  { name: 'inter', bars: 8, chords: INTRO },
  { name: 'verse2', bars: 8, chords: VERSE },
  { name: 'pre2', bars: 8, chords: PRE },
  { name: 'chorus2', bars: 16, chords: [...CHORUS, ...CHORUS] },
  { name: 'outro', bars: 8, chords: ['Db', 'Eb', 'Fm', 'Fm', 'Db', 'Eb', 'Ab', 'Ab'] },
];
let acc = 0;
for (const s of SECTIONS) { s.start = acc; acc += s.bars; }
export const TOTAL_BARS = acc;
export const CHORDS = SECTIONS.flatMap((s) => s.chords);
const sec = (name) => SECTIONS.find((s) => s.name === name);
const kind = (s) => s.name.replace(/\d$/, '');

// ---------------------------------------------------------------- melodies
// "lyric:Note:len16" tokens; "_:len16" is a rest. '|' is a visual bar line.
function mel(bar, str, extra = {}) {
  let t = bar * 4;
  const out = [];
  for (const tok of str.split(/\s+/).filter((x) => x && x !== '|')) {
    const parts = tok.split(':');
    const len = Number(parts.at(-1)) * 0.25;
    if (parts[0] !== '_') out.push({ t, d: len, p: n(parts[1]), lyric: parts[0], v: 100, ...extra });
    t += len;
  }
  if ((t - bar * 4) % 4) throw new Error(`melody does not fill whole bars: ${str}`);
  return out;
}

const C = {
  1: '_:2 ぽ:F4:2 り:Ab4:2 ご:Ab4:2 ん:Bb4:2 の:Ab4:2 は:C5:4 | と:Bb4:2 び:Eb5:6 と:Db5:2 _:6',
  2: '_:2 き:Eb4:2 ら:G4:2 め:Ab4:2 く:Bb4:2 き:C5:2 み:Bb4:2 の:Ab4:2 | し:Ab4:2 ぐ:G4:2 な:F4:2 る:Ab4:6 _:4',
  3: '_:2 と:F4:2 ま:Ab4:2 ら:Bb4:2 な:Db5:2 い:C5:2 ぼ:Bb4:2 く:Ab4:2 | ら:Bb4:2 の:C5:2 り:Db5:2 ず:C5:2 む:Bb4:4 _:4',
  4: 'ず:C5:2 _:1 と:C5:3 ず:Eb5:2 _:1 と:Eb5:3 つ:Db5:2 な:C5:2 | い:Bb4:2 で:Ab4:2 い:Bb4:2 て:Ab4:6 _:4',
  6: '_:2 ふ:Eb4:2 れ:G4:2 た:Ab4:2 ら:Bb4:2 ひ:C5:2 か:Db5:2 る:C5:2 | す:Bb4:2 ぺ:Ab4:2 く:G4:2 と:Ab4:2 る:C5:4 _:4',
  7: '_:2 ぜ:F4:2 ろ:Ab4:2 と:Bb4:2 い:Db5:2 ち:C5:2 の:Bb4:2 _:2 | あ:Bb4:2 い:C5:2 だ:Db5:2 で:Eb5:6 _:4',
  8: 'き:Eb5:2 み:Db5:2 お:C5:4 さ:Bb4:2 が:C5:2 し:Db5:2 て:C5:2 | る:C5:8 _:8',
};
C[5] = C[1];

const V = [
  '_:4 ま:C4:2 よ:Eb4:2 な:F4:2 か:F4:2 の:Eb4:2 す:F4:2 | く:Ab4:2 り:Ab4:4 ん:F4:4 _:6',
  '_:4 ゆ:Eb4:2 れ:F4:2 る:G4:2 ぴ:Bb4:2 く:Ab4:2 せ:G4:2 | る:F4:2 の:Eb4:2 う:G4:4 み:Eb4:4 _:4',
  '_:4 き:C4:2 み:Eb4:2 の:F4:2 こ:F4:2 え:Ab4:2 が:F4:2 | の:Ab4:2 い:Bb4:2 ず:Ab4:2 お:F4:6 _:4',
  '_:4 す:F4:2 り:F4:2 ぬ:Ab4:2 け:Bb4:2 て:C5:4 | と:Bb4:2 ど:Bb4:2 い:C5:2 た:G4:6 _:4',
  '_:4 さ:C4:2 わ:Eb4:2 れ:F4:2 な:F4:2 い:Eb4:2 きょ:F4:2 | り:Ab4:2 で:Ab4:4 も:F4:4 _:6',
  '_:4 こ:Eb4:2 こ:F4:2 ろ:G4:2 わ:Bb4:2 し:Ab4:2 ん:G4:2 | く:F4:2 ろ:Eb4:2 す:G4:4 る:Eb4:4 _:4',
  '_:4 ひ:C4:2 か:Eb4:2 り:F4:2 の:F4:2 は:Ab4:2 や:F4:2 | さ:Ab4:4 で:F4:8 _:4',
  '_:2 い:F4:2 ま:F4:2 き:Ab4:2 み:Bb4:2 に:C5:2 あ:Db5:2 い:C5:2 | に:Bb4:2 い:C5:2 く:G4:8 _:4',
];
const W = [
  '_:4 ゆ:C4:2 め:Eb4:2 の:F4:2 な:F4:2 か:Eb4:2 で:F4:2 | ろ:Ab4:2 ぐ:Ab4:2 い:F4:4 ん:F4:2 _:6',
  '_:4 き:Eb4:2 み:F4:2 の:G4:2 な:Bb4:2 ま:Ab4:2 え:G4:2 | さ:F4:2 が:Eb4:2 す:G4:8 _:4',
  '_:4 あ:C4:2 お:Eb4:2 い:F4:2 ひ:F4:2 か:Ab4:2 り:F4:2 | の:Ab4:2 な:Bb4:2 か:Ab4:8 _:4',
  '_:4 ぼ:F4:2 く:F4:2 わ:Ab4:2 き:Bb4:2 み:C5:2 お:Bb4:2 | よ:Bb4:2 ん:C5:2 だ:G4:8 _:4',
];
const P = [
  '_:4 ね:Ab4:4 え:F4:4 _:4 | き:Eb4:2 こ:F4:2 え:G4:2 る:Bb4:6 _:4',
  '_:4 こ:G4:2 の:Ab4:2 む:Bb4:2 ね:C5:4 の:Bb4:2 | お:Ab4:4 と:C5:8 _:4',
  '_:2 で:Db5:2 じ:C5:2 た:Bb4:2 る:Ab4:2 の:F4:2 な:Ab4:2 み:Bb4:2 | お:C5:2 こ:Bb4:2 え:C5:2 て:Eb5:6 _:4',
  '_:2 せ:C5:2 か:Db5:2 い:C5:2 が:Bb4:2 か:Ab4:2 わ:Bb4:4 | る:Bb4:8 _:8',
];

// Lyrics sheet (romaji-free, as sung)
export const LYRICS = {
  verse1: ['真夜中のスクリーン', '揺れるピクセルの海', '君の声がノイズを', 'すり抜けて届いた',
    '触れない距離でも', '心はシンクロする', '光の速さで', '今 君に会いにいく'],
  pre: ['ねえ 聞こえる?', 'この胸の音', 'デジタルの波を越えて', '世界が変わる'],
  chorus: ['ポリゴンのハートビート', 'きらめく君のシグナル', '止まらない僕らのリズム', 'ずっと ずっと つないでいて',
    'ポリゴンのハートビート', '触れたら光るスペクトル', 'ゼロと イチの あいだで', '君を探してる'],
  verse2: ['夢の中でログイン', '君の名前探す', '青い光の中', '僕は君を呼んだ'],
};

// Three voices, like the trio: A = lead, B and C double / take turns.
const vocal = { A: [], B: [], C: [], H: [] };
const sing = (who, bar, line) => { for (const w of who) vocal[w].push(...mel(bar, line)); };

{
  const v1 = sec('verse1').start, v2 = sec('verse2').start;
  const turns = ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'];
  V.forEach((l, i) => sing([turns[i]], v1 + i * 2, l));
  ['C', 'A', 'B', 'ABC'].forEach((w, i) => sing([...w], v2 + i * 2, W[i]));
  for (const p of ['pre1', 'pre2']) {
    const s = sec(p).start;
    ['B', 'C', 'ABC', 'ABC'].forEach((w, i) => sing([...w], s + i * 2, P[i]));
  }
  for (const c of ['chorus1', 'chorus2']) {
    const s = sec(c).start;
    for (let i = 1; i <= 8; i++) sing(['A', 'B', 'C'], s + (i - 1) * 2, C[i]);
    // diatonic third above on the hook answers (lines 4 and 8)
    for (const i of [4, 8]) vocal.H.push(...mel(s + (i - 1) * 2, C[i]).map((x) => ({ ...x, p: diatonic(x.p, 2) })));
  }
  sing(['A', 'B', 'C'], sec('outro').start, C[1]);
}
export const VOCALS = vocal;

// Vocoder modulator: a monotone chant sung by voice A, re-pitched by the chord carrier.
const CHANT = {
  hook: '_:2 ぽ:C5:2 り:C5:2 ご:C5:2 ん:C5:2 の:C5:2 は:C5:4 | と:C5:2 び:C5:6 と:C5:2 _:6',
  stutter: 'ぽ:C5:1 _:1 り:C5:1 _:1 ぽ:C5:1 _:1 り:C5:1 _:1 ご:C5:2 ん:C5:6 | は:C5:4 と:C5:2 び:C5:4 と:C5:2 _:4',
};
export const CHANT_NOTES = [
  ...[0, 2, 4, 6].flatMap((b) => mel(sec('intro').start + b, CHANT.hook)),
  ...[0, 2, 4, 6].flatMap((b) => mel(sec('inter').start + b, CHANT.stutter)),
  ...mel(sec('outro').start + 4, CHANT.hook),
  ...mel(sec('outro').start + 6, CHANT.hook),
];

// ---------------------------------------------------------------- helpers
const tracks = {};
const T = (name) => (tracks[name] ??= []);
const add = (name, t, d, p, v = 100) => T(name).push({ t, d, p, v });
const eachBar = (secName, fn) => {
  const s = sec(secName);
  for (let i = 0; i < s.bars; i++) fn(s.start + i, i, s.chords[i], s);
};
const kicks = [];

// GM-ish drum notes shared by the GS 808/909 kit and our VCSL kit
export const DR = { kick: 36, snare: 38, clap: 39, chh: 42, ohh: 46, crash: 49, shaker: 70, tamb: 54, swell2: 60, swell4: 61, chimes: 84, cymhit: 50 };

// ---------------------------------------------------------------- drums
function drumBar(bar, i, s, k) {
  const t0 = bar * 4;
  const hit = (track, step, note, v, d = 0.2) => add(track, t0 + step * 0.25, d, note, v);
  const four = () => { for (let b = 0; b < 4; b++) { hit('gs_kick', b * 4, DR.kick, 118); kicks.push(t0 + b); } };
  const backbeat = (vel = 110) => { for (const b of [4, 12]) { hit('gs_clap', b, DR.clap, vel); hit('vcsl_snareclap', b, DR.clap, vel - 5); } };
  const hats16 = (vel = 70) => { for (let x = 0; x < 16; x++) hit('vcsl_hats', x, DR.chh, x % 4 === 2 ? vel + 25 : x % 2 ? vel - 15 : vel); };
  const fill = (from = 12) => { for (let x = from; x < 16; x++) hit('vcsl_snareclap', x, DR.snare, 70 + (x - from) * 12); };

  if (k === 'intro') {
    if (i >= 4) { four(); for (let b = 0; b < 4; b++) hit('gs_hats', b * 4 + 2, DR.chh, 90); }
    if (i >= 6) backbeat(95);
    if (i === 7) fill(8);
  }
  if (k === 'verse') {
    four(); backbeat(); hats16(55);
    for (let b = 0; b < 4; b++) { hit('gs_hats', b * 4 + 2, DR.ohh, 60, 0.4); hit('vcsl_hats', b * 4 + 2, DR.shaker, 85); }
    if (i === 0) hit('gs_crash', 0, DR.crash, 110, 2);
    if (i % 8 === 7) fill();
  }
  if (k === 'pre') {
    if (i < 6) four(); else if (i === 6) for (let b = 0; b < 4; b++) { hit('gs_kick', b * 4, DR.kick, 112); hit('gs_kick', b * 4 + 2, DR.kick, 100); kicks.push(t0 + b, t0 + b + 0.5); }
    if (i < 4) { backbeat(100); hats16(50); }
    // snare build: 8ths -> 16ths -> 32nds
    if (i >= 4) {
      const step = i < 6 ? 2 : i === 6 ? 1 : 0.5;
      for (let x = 0; x < 16; x += step) {
        const prog = ((i - 4) * 16 + x) / 64;
        hit('vcsl_snareclap', x, DR.snare, 45 + prog * 80, 0.1);
        if (i === 7) hit('gs_clap', x, DR.clap, 30 + prog * 70, 0.1);
      }
    }
    if (i === 0) hit('gs_crash', 0, DR.crash, 100, 2);
  }
  if (k === 'chorus') {
    four(); backbeat(118); hats16(60);
    for (const b of [4, 12]) { hit('vcsl_snareclap', b, DR.snare, 105); hit('vcsl_hats', b, DR.tamb, 95); }
    for (let b = 0; b < 4; b++) hit('gs_hats', b * 4 + 2, DR.ohh, 100, 0.5);
    if (i === 0 || i === 8) { hit('gs_crash', 0, DR.crash, 120, 3); hit('vcsl_fx', 0, DR.cymhit, 110, 3); }
    if (i === 15 && s.name === 'chorus1') fill(8);
  }
  if (k === 'inter') {
    if (i < 4) { hit('gs_clap', 8, DR.clap, 100); hit('vcsl_snareclap', 8, DR.clap, 95); hats16(45); }
    else { four(); backbeat(105); hats16(55); for (let b = 0; b < 4; b++) hit('gs_hats', b * 4 + 2, DR.ohh, 80, 0.4); }
    if (i === 0) hit('vcsl_fx', 0, DR.chimes, 100, 4);
    if (i === 7) fill(8);
  }
  if (k === 'outro') {
    if (i < 4) { four(); backbeat(110); hats16(55); for (let b = 0; b < 4; b++) hit('gs_hats', b * 4 + 2, DR.ohh, 90, 0.5); }
    else if (i < 6) { four(); hats16(40); }
    if (i === 0) hit('gs_crash', 0, DR.crash, 115, 3);
    if (i === 6) hit('vcsl_fx', 0, DR.chimes, 90, 4);
    if (i === 7) { hit('gs_kick', 0, DR.kick, 120); kicks.push(t0); hit('gs_crash', 0, DR.crash, 120, 4); hit('vcsl_fx', 0, DR.cymhit, 120, 4); }
  }
}
for (const s of SECTIONS) eachBar(s.name, (bar, i, _c, ss) => drumBar(bar, i, ss, kind(ss)));

// Cymbal crescendos (real bowed/rolled suspended cymbal) that land on the downbeats of
// verse 1, both choruses and the outro. The crescendo peaks sit 3.4 s / 10.1 s into the
// "cresc_2s" / "cresc_4s" samples (measured with ffmpeg astats), so we start them that early.
const swellInto = (bar, note, peak) => add('vcsl_fx', bar * 4 - peak / SPB, peak / SPB, note, 105);
swellInto(sec('verse1').start, DR.swell2, 3.4);
swellInto(sec('chorus1').start, DR.swell4, 10.1);
swellInto(sec('chorus2').start, DR.swell4, 10.1);
swellInto(sec('verse2').start, DR.swell2, 3.4);
swellInto(sec('outro').start, DR.swell2, 3.4);
export const KICKS = [...new Set(kicks)].sort((a, b) => a - b);

// ---------------------------------------------------------------- bass (synth)
function bassBar(bar, i, sym, k) {
  const t0 = bar * 4, R = rootAt(sym, 'E1');
  const b = (step, p, d, v = 100) => add('bass', t0 + step * 0.25, d, p, v);
  const rolling = () => { for (let q = 0; q < 4; q++) { b(q * 4 + 1, R, 0.2, 90); b(q * 4 + 2, R + 12, 0.2, 105); b(q * 4 + 3, R, 0.2, 85); } };
  const offbeat = () => { for (let q = 0; q < 4; q++) { b(q * 4 + 2, R, 0.42, 110); if (q % 2) b(q * 4 + 3, R + 12, 0.15, 80); } };
  if (k === 'intro' && i >= 4) offbeat();
  if (k === 'verse') rolling();
  if (k === 'pre') {
    if (i < 6) for (let x = 0; x < 16; x += 2) b(x, R, 0.4, x % 4 ? 95 : 110);
    else if (i === 6) for (let x = 0; x < 16; x++) b(x, R + (x % 4 === 2 ? 12 : 0), 0.2, 80 + x * 2);
    else b(0, R, 0.5, 110);
  }
  if (k === 'chorus') offbeat();
  if (k === 'inter') { if (i < 4) b(0, R, 3.8, 95); else rolling(); }
  if (k === 'outro') { if (i < 4) offbeat(); else if (i < 7) b(0, R, 3.8, 90); else b(0, R, 6, 115); }
}
for (const s of SECTIONS) eachBar(s.name, (bar, i, c, ss) => bassBar(bar, i, c, kind(ss)));

// ---------------------------------------------------------------- harmony parts
const wide = (sym) => { const v = voice(sym, 'G3'); return [rootAt(sym, 'C3'), ...v, v.at(-1) + 12, v[0] + 12]; };
const autom = {}; // per-track filter automation: [{t, cutoff}]
const cut = (name, t, hz) => (autom[name] ??= []).push({ t, v: hz });

for (const s of SECTIONS) {
  const k = kind(s);
  eachBar(s.name, (bar, i, sym) => {
    const t0 = bar * 4;
    // supersaw
    if (k === 'pre') {
      for (let x = 0; x < 8; x++) for (const p of voice(sym, 'F3').concat(voice(sym, 'F4'))) add('supersaw', t0 + x * 0.5, 0.32, p, 85 + x * 2);
    }
    if (k === 'chorus' || (k === 'outro' && i < 7)) for (const p of wide(sym)) add('supersaw', t0, 3.9, p, k === 'outro' ? 95 : 110);
    if (k === 'outro' && i === 7) for (const p of wide(sym)) add('supersaw', t0, 6, p, 110);
    if (k === 'inter' && i >= 4) for (let x = 0; x < 16; x++) if ('x.xxx.x.xx.x.xxx'[x] === 'x') for (const p of voice(sym, 'C4')) add('supersaw', t0 + x * 0.25, 0.18, p, 80);

    // 16th arpeggio pluck
    const arpOn = k === 'verse' || k === 'chorus' || k === 'intro' || k === 'inter' || (k === 'outro' && i < 6) || (k === 'pre' && i < 6);
    if (arpOn) {
      const v = voice(sym, 'F4'), tones = [...v, ...v.map((x) => x + 12)];
      const order = [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 5, 3, 4, 2, 1];
      order.forEach((ix, x) => add('pluck', t0 + x * 0.25, 0.2, tones[ix % tones.length], x % 4 === 0 ? 110 : 85));
    }

    // jRhodes3d (sfizz): syncopated 3-3-2 stabs in verses, pads in pre / inter
    if (k === 'verse') for (const x of [0, 3, 6, 10, 12]) for (const p of voice(sym, 'E3')) add('rhodes', t0 + x * 0.25, 0.5, p, x === 0 ? 92 : 78);
    if (k === 'pre' || (k === 'inter' && i < 4)) for (const p of voice(sym, 'E3')) add('rhodes', t0, 3.8, p, 80);

    // Salamander grand piano (sfizz): pushing quarters in pre, sustained chords at the end
    if (k === 'pre') {
      add('piano', t0, 2, rootAt(sym, 'C2'), 90);
      for (let q = 0; q < 4; q++) for (const p of voice(sym, 'C4')) add('piano', t0 + q, 0.9, p, q === 0 ? 92 : 76);
    }
    if (k === 'inter') { add('piano', t0, 3.9, rootAt(sym, 'C2'), 85); for (const p of voice(sym, 'G3')) add('piano', t0, 1.9, p, 70); for (const p of voice(sym, 'G3')) add('piano', t0 + 2, 1.9, p, 66); }
    if (k === 'outro' && i >= 4) {
      add('piano', t0, i === 7 ? 8 : 3.9, rootAt(sym, 'C2'), 90);
      for (const p of voice(sym, 'C4')) add('piano', t0, i === 7 ? 8 : 3.9, p, 82);
    }

    // GS strings
    if (k === 'pre' || k === 'chorus' || (k === 'outro' && i < 7)) {
      const vel = k === 'pre' ? 60 + i * 6 : 95;
      for (const p of voice(sym, 'A3').concat([voice(sym, 'A4').at(-1)])) add('strings', t0, 3.95, p, vel);
    }
    if (k === 'intro' && i >= 4) for (const p of voice(sym, 'A3')) add('strings', t0, 3.95, p, 70);
    if (k === 'outro' && i === 7) for (const p of voice(sym, 'A3')) add('strings', t0, 7, p, 100);

    // glockenspiel (VCSL via sfizz): chorus counterline on the offbeats
    if (k === 'chorus') {
      const v = voice(sym, 'C6');
      [null, v[1], null, v[2], null, v[0] + 12, null, v[2]].forEach((p, x) => p && add('glock', t0 + x * 0.5, 0.5, p, x === 1 ? 100 : 82));
    }
    if (k === 'outro' && i >= 4) voice(sym, 'C6').forEach((p, x) => add('glock', t0 + x * 1.0, 1, p, 80));
  });
}

// filter automation for the synths (Hz)
cut('supersaw', sec('pre1').start * 4, 500); cut('supersaw', (sec('pre1').start + 8) * 4, 7000);
cut('supersaw', sec('chorus1').start * 4, 9000);
cut('supersaw', sec('inter').start * 4, 3000);
cut('supersaw', sec('pre2').start * 4, 500); cut('supersaw', (sec('pre2').start + 8) * 4, 7000);
cut('supersaw', sec('chorus2').start * 4, 9000);
cut('supersaw', (sec('outro').start + 4) * 4, 9000); cut('supersaw', (sec('outro').start + 7) * 4, 1200);
cut('pluck', 0, 900); cut('pluck', 8 * 4, 4500);

// Orchestra hits (GS 055): chorus downbeats + the final chord
for (const c of ['chorus1', 'chorus2']) for (const b of [0, 8]) {
  const s = sec(c), sym = s.chords[b];
  for (const p of [rootAt(sym, 'C3'), ...voice(sym, 'C4'), rootAt(sym, 'C5')]) add('orchhit', (s.start + b) * 4, 1, p, 120);
}
for (const p of [n('Ab2'), ...voice('Ab', 'C4'), n('Ab5')]) add('orchhit', (TOTAL_BARS - 1) * 4, 2, p, 120);

// "pikopiko" square lead hook (4 bars over Fm–Db–Eb–Cm), doubled on glock in the intro
const RIFF = [
  'C5 . C5 Eb5 . F5 . C5 . Ab5 . G5 F5 . Eb5 .',
  'Db5 . Db5 F5 . Ab5 . F5 . C6 . Bb5 Ab5 . F5 .',
  'Eb5 . Eb5 G5 . Bb5 . G5 . Eb6 . Db6 C6 . Bb5 .',
  'C5 . C5 Eb5 . G5 . C6 . Bb5 . G5 Eb5 . G5 .',
];
const riff = (track, bar, transpose = 0, vel = 100) => RIFF.forEach((line, b) => line.split(' ').forEach((tok, x) => {
  if (tok !== '.') add(track, (bar + b) * 4 + x * 0.25, 0.2, n(tok) + transpose, vel);
}));
riff('glock', sec('intro').start, 12, 95);
riff('lead', sec('intro').start + 4);
riff('lead', sec('inter').start); riff('lead', sec('inter').start + 4);
riff('glock', sec('inter').start + 4, 12, 80);

// Piano plays the chorus hook as an instrumental break in the interlude
for (const nn of [...mel(sec('inter').start, C[1]), ...mel(sec('inter').start + 2, C[2])]) add('piano', nn.t, nn.d, nn.p + 12, 88);

// Noise risers / impacts (synth FX): [startBeat, lengthBeats]
export const RISERS = [
  [(sec('verse1').start - 4) * 4, 16], [(sec('chorus1').start - 4) * 4, 16],
  [(sec('verse2').start - 2) * 4, 8], [(sec('chorus2').start - 4) * 4, 16], [(sec('outro').start - 2) * 4, 8],
];
export const IMPACTS = [sec('verse1').start, sec('chorus1').start, sec('inter').start, sec('chorus2').start, sec('outro').start, TOTAL_BARS - 1].map((b) => b * 4);

export const TRACKS = tracks;
export const AUTOMATION = autom;
