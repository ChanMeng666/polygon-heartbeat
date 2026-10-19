// Mixdown + mastering with ffmpeg. Each stem is gain-staged from its measured "active" RMS,
// EQ'd/panned, sent to a convolution reverb (Node-generated IR) and a dotted-8th delay,
// then summed, bus-compressed, limited and loudness-matched.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { OUT, STEMS, WORK, TOOLS, SR } from './config.js';
import { readWav, writeWav } from './lib/wav.js';
import { SPB, TITLE } from './song.js';
import { seedRandom } from './lib/dsp.js';

// target active RMS (dBFS), pan (-1..1), reverb send, delay send, extra filters
const MIX = {
  gs_kick: { db: -14, eq: 'highpass=f=30,equalizer=f=4000:t=q:w=1:g=2' },
  kick_sub: { db: -19.5, eq: 'lowpass=f=120' },
  gs_clap: { db: -19, rev: 0.25, eq: 'highpass=f=200' },
  vcsl_snareclap: { db: -20, rev: 0.3, eq: 'highpass=f=150,equalizer=f=5000:t=q:w=1:g=2' },
  gs_hats: { db: -25, pan: 0.15, eq: 'highpass=f=6000' },
  vcsl_hats: { db: -25, pan: -0.2, eq: 'highpass=f=3000,treble=g=3:f=9000' },
  gs_crash: { db: -24, rev: 0.2, eq: 'highpass=f=400' },
  vcsl_fx: { db: -22, rev: 0.4, eq: 'highpass=f=300' },
  bass: { db: -17.5, eq: 'equalizer=f=60:t=q:w=1:g=2,lowpass=f=4000' },
  supersaw: { db: -18, rev: 0.2, eq: 'highpass=f=180,equalizer=f=450:t=q:w=1.2:g=-3,treble=g=2:f=8000' },
  strings: { db: -24, rev: 0.35, eq: 'highpass=f=250' },
  pluck: { db: -22, rev: 0.25, dly: 0.2, eq: 'highpass=f=300' },
  rhodes: { db: -21, rev: 0.25, pan: -0.15, eq: 'highpass=f=120' },
  piano: { db: -20, rev: 0.3, pan: 0.1, eq: 'highpass=f=60,equalizer=f=3000:t=q:w=1:g=1.5' },
  glock: { db: -23, rev: 0.4, dly: 0.25, pan: 0.25, eq: 'highpass=f=800' },
  lead: { db: -21, rev: 0.2, dly: 0.35, eq: 'highpass=f=250' },
  orchhit: { db: -21, rev: 0.4, eq: 'highpass=f=120' },
  riser: { db: -27, rev: 0.3 },
  impact: { db: -21, rev: 0.4 },
  vocoder: { db: -18, rev: 0.25, dly: 0.25, eq: 'highpass=f=150' },
  vox_A: { db: -14.5, rev: 0.22, dly: 0.12, voc: true },
  vox_B: { db: -16.5, rev: 0.22, dly: 0.12, pan: -0.2, voc: true },
  vox_C: { db: -16.5, rev: 0.22, dly: 0.12, pan: 0.2, voc: true },
  vox_H: { db: -21, rev: 0.3, dly: 0.15, pan: 0.35, voc: true },
};

// Perfume-ish vocal chain: tight low cut, presence + air, firm compression, de-ess.
const VOCAL_CHAIN = 'highpass=f=140,equalizer=f=320:t=q:w=1:g=-3,equalizer=f=3200:t=q:w=1:g=3,' +
  'treble=g=4:f=9000,acompressor=threshold=-22dB:ratio=4:attack=4:release=70:makeup=3,deesser=i=0.4';

const ff = (args) => execFileSync(TOOLS.ffmpeg, ['-hide_banner', '-y', '-v', 'error', ...args], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });

/** 90th-percentile RMS of 400 ms windows that are above -60 dBFS. */
function activeRms(file) {
  const { channels } = readWav(file);
  const win = Math.round(0.4 * SR), vals = [];
  for (let s = 0; s + win <= channels[0].length; s += win) {
    let e = 0;
    for (const c of channels) for (let i = s; i < s + win; i++) e += c[i] * c[i];
    const db = 10 * Math.log10(e / (win * channels.length) + 1e-20);
    if (db > -60) vals.push(db);
  }
  vals.sort((a, b) => a - b);
  return vals.length ? vals[Math.floor(vals.length * 0.9)] : -100;
}

/** Stereo plate-ish IR: pre-delay, sparse early reflections, damped exponential tail. */
function makeIR(file, rt60 = 1.9) {
  seedRandom(7);
  const n = Math.round((rt60 + 0.3) * SR), pre = Math.round(0.018 * SR);
  const chans = [new Float32Array(n), new Float32Array(n)];
  for (const [ci, c] of chans.entries()) {
    let lp = 0;
    for (let i = pre; i < n; i++) {
      const t = (i - pre) / SR;
      const damp = Math.min(0.97, 0.25 + t * 0.5); // darker as it decays
      lp = lp * damp + (Math.random() * 2 - 1) * (1 - damp);
      c[i] = lp * Math.exp(-6.9 * t / rt60) * (1 + damp);
    }
    for (let k = 0; k < 8; k++) c[pre + Math.round(SR * (0.004 + Math.random() * 0.04))] += (ci ? -1 : 1) * 0.4 * Math.random();
  }
  writeWav(file, chans, SR);
}

// ebur128 reports on stderr
const lufsOf = (file) => spawnSync(TOOLS.ffmpeg, ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;

export async function mix() {
  const names = Object.keys(MIX).filter((n) => fs.existsSync(path.join(STEMS, `${n}.wav`)));
  const ir = path.join(WORK, 'reverb_ir.wav');
  makeIR(ir);

  const inputs = [], chains = [], dry = [], revSend = [], dlySend = [];
  for (const [i, name] of names.entries()) {
    const m = MIX[name];
    const file = path.join(STEMS, `${name}.wav`);
    const gain = m.db - activeRms(file);
    inputs.push('-i', file);
    const f = [m.voc ? VOCAL_CHAIN : null, m.eq, `volume=${gain.toFixed(2)}dB`, m.pan ? `stereotools=balance_out=${m.pan}` : null].filter(Boolean).join(',');
    const outs = ['d'], labels = [`[${name}_d]`];
    if (m.rev) { outs.push('r'); labels.push(`[${name}_r]`); }
    if (m.dly) { outs.push('y'); labels.push(`[${name}_y]`); }
    chains.push(`[${i}:a]${f},asplit=${outs.length}${labels.join('')}`);
    dry.push(`[${name}_d]`);
    if (m.rev) { chains.push(`[${name}_r]volume=${m.rev}[${name}_rs]`); revSend.push(`[${name}_rs]`); }
    if (m.dly) { chains.push(`[${name}_y]volume=${m.dly}[${name}_ys]`); dlySend.push(`[${name}_ys]`); }
    console.log(`  ${name.padEnd(16)} gain ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB`);
  }
  const irIdx = names.length;
  inputs.push('-i', ir);
  const dotted8 = (SPB * 0.75 * 1000).toFixed(1);
  chains.push(
    `${revSend.join('')}amix=inputs=${revSend.length}:normalize=0,highpass=f=250[revin]`,
    `[revin][${irIdx}:a]afir=dry=0:wet=1[revout]`,
    `${dlySend.join('')}amix=inputs=${dlySend.length}:normalize=0,highpass=f=400,lowpass=f=6000,` +
      `aecho=in_gain=1:out_gain=1:delays=${dotted8}|${(dotted8 * 2).toFixed(1)}:decays=0.38|0.16,volume=0.7[dlyout]`,
    `${dry.join('')}[revout][dlyout]amix=inputs=${dry.length + 2}:normalize=0[sum]`,
    // master bus: glue compression, gentle smile EQ
    `[sum]highpass=f=28,acompressor=threshold=-16dB:ratio=2:attack=25:release=180:makeup=1,` +
      `equalizer=f=55:t=q:w=1:g=1,equalizer=f=350:t=q:w=1:g=-1,treble=g=1.5:f=11000[pre]`,
  );
  const graph = path.join(WORK, 'mix.filtergraph');
  fs.writeFileSync(graph, chains.join(';\n'));
  const premaster = path.join(WORK, 'premaster.wav');
  ff([...inputs, '-filter_complex_script', graph, '-map', '[pre]', '-c:a', 'pcm_f32le', premaster]);

  // loudness: measure, gain toward the target, brickwall limit, verify
  const TARGET = -9;
  const integrated = (file) => Number(/I:\s+(-?[\d.]+) LUFS/.exec(lufsOf(file).split('Summary:').at(-1))[1]);
  let pre = integrated(premaster), g = TARGET - pre;
  const base = path.join(OUT, 'polygon-heartbeat');
  const master = `${base}.wav`;
  for (let pass = 0; pass < 3; pass++) {
    ff(['-i', premaster, '-af', `volume=${g.toFixed(2)}dB,aresample=176400,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=44100`,
      '-c:a', 'pcm_s24le', master]);
    const got = integrated(master);
    console.log(`  master pass ${pass + 1}: gain ${g.toFixed(2)} dB -> ${got.toFixed(2)} LUFS`);
    if (Math.abs(got - TARGET) < 0.3) break;
    g += TARGET - got;
  }
  const tags = ['-metadata', `title=${TITLE}`, '-metadata', 'artist=polygon-heartbeat project', '-metadata', 'genre=Technopop / Electropop'];
  ff(['-i', master, ...tags, '-c:a', 'flac', `${base}.flac`]);
  ff(['-i', master, ...tags, '-c:a', 'libmp3lame', '-b:a', '320k', `${base}.mp3`]);
  // visual check: waveform + spectrogram
  ff(['-i', master, '-filter_complex', 'showwavespic=s=1800x300:split_channels=1:colors=0x5ad1ff|0xff6ec7', '-frames:v', '1', path.join(OUT, 'waveform.png')]);
  ff(['-i', master, '-lavfi', 'showspectrumpic=s=1800x600:legend=1:scale=log:fscale=log', path.join(OUT, 'spectrogram.png')]);
  fs.writeFileSync(path.join(OUT, 'loudness.txt'), lufsOf(master).split('Summary:').at(-1).split('[out#')[0].trim() + '\n');
  console.log(fs.readFileSync(path.join(OUT, 'loudness.txt'), 'utf8'));
}
