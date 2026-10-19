// Build pipeline: node src/build.js [stems] [vocals] [mix]   (no args = everything)
import fs from 'node:fs';
import path from 'node:path';
import { OUT, STEMS, WORK, SR, LIBS } from './config.js';
import * as song from './song.js';
import { writeWav, readWav, peak } from './lib/wav.js';
import { writeMidi } from './lib/midi.js';
import { seedRandom } from './lib/dsp.js';
import * as syn from './instruments/synths.js';
import { fluid, sfizz, writeVcslKit, writeVcslGlock } from './instruments/samplers.js';

const stages = process.argv.slice(2);
const want = (s) => stages.length === 0 || stages.includes(s);
for (const d of [OUT, STEMS, WORK]) fs.mkdirSync(d, { recursive: true });

const SPB = song.SPB;
const LEN = Math.ceil((song.TOTAL_BARS * 4 * SPB + 6) * SR);
const tr = song.TRACKS;

// GeneralUser GS presets [bank, program] (channel 9 = drum kit)
const GM = {
  gs_kick: { channel: 9, program: 25 }, gs_clap: { channel: 9, program: 25 },
  gs_hats: { channel: 9, program: 25 }, gs_crash: { channel: 9, program: 25 },
  strings: { channel: 0, bank: 0, program: 48 }, // Fast Strings
  orchhit: { channel: 0, bank: 0, program: 55 }, // Orchestra Hit
};

const save = (name, chans) => {
  const file = path.join(STEMS, `${name}.wav`);
  writeWav(file, chans, SR);
  console.log(`  ${name.padEnd(16)} peak ${peak(chans).toFixed(3)}`);
};

const timed = async (label, fn) => {
  const t = Date.now(); await fn(); console.log(`${label} done in ${((Date.now() - t) / 1000).toFixed(1)} s`);
};

function applyDuck(chans, depth, release) {
  const g = syn.duckCurve(LEN, song.KICKS, SPB, depth, release);
  for (const c of chans) for (let i = 0; i < LEN; i++) c[i] *= g[i];
  return chans;
}

if (want('stems')) await timed('stems', async () => {
  seedRandom(20261019);
  // full arrangement as one MIDI file, for DAW import
  writeMidi(path.join(OUT, 'polygon-heartbeat.mid'), [
    ...Object.entries(tr).map(([name, notes]) => ({ name, notes, ...(GM[name] ?? { channel: 0 }) })),
    ...Object.entries(song.VOCALS).map(([who, notes]) => ({ name: `vocal_${who}`, channel: 1, notes })),
  ], song.BPM);

  console.log('sampled instruments (FluidSynth / GeneralUser GS)');
  for (const name of Object.keys(GM)) {
    let chans = fluid(name, { ...GM[name], notes: tr[name] }, song.BPM, LEN);
    if (name === 'strings') chans = applyDuck(chans, 0.45, 0.5);
    save(name, chans);
  }

  console.log('sampled instruments (sfizz / SFZ)');
  const kit = writeVcslKit(), glock = writeVcslGlock();
  save('vcsl_snareclap', sfizz('vcsl_snareclap', kit, tr.vcsl_snareclap, song.BPM, LEN));
  save('vcsl_hats', sfizz('vcsl_hats', kit, tr.vcsl_hats, song.BPM, LEN));
  save('vcsl_fx', sfizz('vcsl_fx', kit, tr.vcsl_fx, song.BPM, LEN));
  save('glock', sfizz('glock', glock, tr.glock, song.BPM, LEN));
  save('rhodes', applyDuck(sfizz('rhodes', LIBS.rhodes, tr.rhodes, song.BPM, LEN), 0.3, 0.45));
  // sustain pedal down per chord for the piano
  const pedal = tr.piano.filter((x) => Number.isInteger(x.t / 4)).map((x) => x.t);
  const cc = [...new Set(pedal)].flatMap((t) => [{ t: Math.max(0, t - 0.01), c: 64, v: 0 }, { t: t + 0.02, c: 64, v: 127 }]);
  save('piano', sfizz('piano', LIBS.piano, tr.piano, song.BPM, LEN, cc));

  console.log('synths');
  const A = song.AUTOMATION;
  save('kick_sub', syn.subKick(song.KICKS, LEN, SPB));
  save('bass', applyDuck(syn.bass(tr.bass, LEN, SPB), 0.85, 0.42));
  save('supersaw', applyDuck(syn.supersaw(tr.supersaw, LEN, SPB, A.supersaw), 0.7, 0.5));
  save('pluck', applyDuck(syn.pluck(tr.pluck, LEN, SPB, A.pluck), 0.35, 0.4));
  save('lead', syn.lead(tr.lead, LEN, SPB));
  save('riser', syn.risers(song.RISERS, LEN, SPB));
  save('impact', syn.impacts(song.IMPACTS, LEN, SPB));
});

if (want('vocals')) await timed('vocals', async () => {
  const { renderVocals } = await import('./vocals/render.js');
  await renderVocals({ len: LEN, save, applyDuck });
});

if (want('mix')) await timed('mix', async () => {
  const { mix } = await import('./mix.js');
  await mix();
});
