// Vocals: VOICEVOX singing synthesis (3 voices like the trio + a harmony voice),
// hard pitch-quantised "auto-tune" f0, and a channel vocoder for the robot chants.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { TOOLS, WORK, SR } from '../config.js';
import * as song from '../song.js';
import { readWav } from '../lib/wav.js';
import { hz, voice, rootAt } from '../theory.js';
import { supersaw } from '../instruments/synths.js';
import { BandPass, SVF } from '../lib/dsp.js';

const FPS = 24000 / 256; // VOICEVOX frame rate
const TEACHER = 6000; // 波音リツ (sing) predicts phoneme timing / f0 / volume from the score

// Singer styles (frame_decode). Credits in README.
export const SINGERS = {
  A: { id: 3008, name: '春日部つむぎ' },
  B: { id: 3014, name: '冥鳴ひまり' },
  C: { id: 3002, name: '四国めたん' },
  H: { id: 3015, name: '九州そら（あまあま）' },
  robot: { id: 3009, name: '波音リツ' },
};

async function post(endpoint, body, binary = false) {
  const res = await fetch(`${TOOLS.voicevoxUrl}${endpoint}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${endpoint}: ${res.status} ${await res.text()}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
}

/** Split a note list into phrases separated by > 1 bar of silence. */
function phrases(notes) {
  const sorted = [...notes].sort((a, b) => a.t - b.t);
  const out = [];
  for (const nt of sorted) {
    const cur = out.at(-1);
    if (cur && nt.t - (cur.at(-1).t + cur.at(-1).d) <= 4) cur.push(nt); else out.push([nt]);
  }
  return out;
}

/** Sing one phrase; returns { start (s), samples (44.1k mono) }. */
async function singPhrase(notes, styleId, tag) {
  const spb = song.SPB;
  const start = notes[0].t * spb - 0.6;
  const frame = (beat) => Math.round((beat * spb - start) * FPS);
  const score = [];
  let cursor = 0;
  notes.forEach((nt, i) => {
    const a = frame(nt.t), b = frame(nt.t + nt.d);
    if (a > cursor) score.push({ key: null, frame_length: a - cursor, lyric: '' });
    else if (i === 0) score.push({ key: null, frame_length: 1, lyric: '' });
    score.push({ id: String(i), key: nt.p, frame_length: Math.max(1, b - Math.max(a, cursor)), lyric: nt.lyric });
    cursor = b;
  });
  score.push({ key: null, frame_length: Math.round(0.6 * FPS), lyric: '' });

  const q = await post(`/sing_frame_audio_query?speaker=${TEACHER}`, { notes: score });
  // Hard-tune: every voiced frame snaps to its note's exact pitch (with one frame of glide).
  let f = 0, prev = null;
  for (const ph of q.phonemes) {
    const nt = ph.note_id != null ? notes[Number(ph.note_id)] : null;
    for (let k = 0; k < ph.frame_length; k++, f++) {
      if (!nt || q.f0[f] <= 0) continue;
      const target = hz(nt.p);
      q.f0[f] = prev && k === 0 ? Math.sqrt(prev * target) : target;
    }
    if (nt) prev = hz(nt.p);
  }
  const wav24 = path.join(WORK, `vox_${tag}.24k.wav`), wav44 = path.join(WORK, `vox_${tag}.wav`);
  fs.writeFileSync(wav24, await post(`/frame_synthesis?speaker=${styleId}`, q, true));
  execFileSync(TOOLS.ffmpeg, ['-y', '-v', 'error', '-i', wav24, '-af', 'aresample=44100:resampler=soxr', '-c:a', 'pcm_f32le', wav44]);
  return { start, samples: readWav(wav44).channels[0] };
}

async function singAll(notes, styleId, tag, len) {
  const M = new Float32Array(len);
  const ps = phrases(notes);
  for (let i = 0; i < ps.length; i++) {
    const { start, samples } = await singPhrase(ps[i], styleId, `${tag}_${i}`);
    const o = Math.round(start * SR);
    for (let j = 0; j < samples.length && o + j < len; j++) if (o + j >= 0) M[o + j] += samples[j];
  }
  return M;
}

/** Channel vocoder: modulator envelopes (24 log bands) imposed on a stereo carrier. */
function vocode(mod, [cl, cr], len) {
  const BANDS = 24, lo = 110, hi = 9000;
  const outL = new Float32Array(len), outR = new Float32Array(len);
  const freqs = Array.from({ length: BANDS }, (_, k) => lo * (hi / lo) ** (k / (BANDS - 1)));
  const atk = Math.exp(-1 / (0.002 * SR)), rel = Math.exp(-1 / (0.03 * SR));
  for (const f of freqs) {
    const bm = new BandPass(f, 6), bl = new BandPass(f, 6), br = new BandPass(f, 6);
    const bm2 = new BandPass(f, 6), bl2 = new BandPass(f, 6), br2 = new BandPass(f, 6);
    let env = 0;
    const g = 4 * (f / 1000) ** 0.25; // gentle treble lift for intelligibility
    for (let i = 0; i < len; i++) {
      const m = Math.abs(bm2.process(bm.process(mod[i])));
      env = m > env ? atk * env + (1 - atk) * m : rel * env + (1 - rel) * m;
      if (env < 1e-6 && mod[i] === 0) { bl2.process(bl.process(cl[i])); br2.process(br.process(cr[i])); continue; }
      outL[i] += bl2.process(bl.process(cl[i])) * env * g;
      outR[i] += br2.process(br.process(cr[i])) * env * g;
    }
  }
  // let the consonants through (high-passed modulator) so the words stay readable
  const hp = new SVF(5500, 0.7);
  for (let i = 0; i < len; i++) { hp.process(mod[i]); outL[i] += hp.hp * 0.35; outR[i] += hp.hp * 0.35; }
  return [outL, outR];
}

export async function renderVocals({ len, save }) {
  const v = song.VOCALS;
  for (const who of ['A', 'B', 'C', 'H']) {
    console.log(`  singing voice ${who} (${SINGERS[who].name}), ${v[who].length} notes`);
    const m = await singAll(v[who], SINGERS[who].id, who, len);
    save(`vox_${who}`, [m, m.slice()]);
  }
  // robot chant → vocoder over the chord carrier
  console.log('  vocoder chant');
  const chant = await singAll(song.CHANT_NOTES, SINGERS.robot.id, 'robot', len);
  const bars = [...new Set(song.CHANT_NOTES.map((x) => Math.floor(x.t / 4)))];
  const carrierNotes = bars.flatMap((b) => {
    const sym = song.CHORDS[b];
    return [rootAt(sym, 'C3'), ...voice(sym, 'G3'), ...voice(sym, 'G4')].map((p) => ({ t: b * 4, d: 4, p, v: 110 }));
  });
  const carrier = supersaw(carrierNotes, len, song.SPB, [{ t: 0, v: 14000 }]);
  save('vocoder', vocode(chant, carrier, len));
}
