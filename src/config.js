// Tool + sample-library locations. Override any path with an env var of the same name.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const env = (k, d) => process.env[k] ?? d;

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = path.join(ROOT, 'out');
export const STEMS = path.join(OUT, 'stems');
export const WORK = path.join(OUT, 'work');

const AUDIO = env('AUDIO_TOOLS', 'D:/tools/audio');

export const TOOLS = {
  fluidsynth: env('FLUIDSYNTH', `${AUDIO}/fluidsynth/fluidsynth-v2.6.1-win10-x64-cpp11/bin/fluidsynth.exe`),
  sfizz: env('SFIZZ_RENDER', `${AUDIO}/sfizz/bin/Release/sfizz_render.exe`),
  ffmpeg: env('FFMPEG', 'ffmpeg'),
  voicevoxRun: env('VOICEVOX_RUN', `${AUDIO}/voicevox/windows-cpu/run.exe`),
  voicevoxUrl: env('VOICEVOX_URL', 'http://127.0.0.1:50021'),
};

export const LIBS = {
  generalUser: env('GENERALUSER_SF2', `${AUDIO}/samples/GeneralUser-GS.sf2`),
  vcsl: env('VCSL_DIR', `${AUDIO}/samples/VCSL`),
  rhodes: env('RHODES_SFZ', `${AUDIO}/samples/jRhodes3d/jRhodes3d-st.sfz`),
  piano: env('PIANO_SFZ', `${AUDIO}/samples/SalamanderGrandPiano/Salamander Grand Piano V3.sfz`),
};

export const SR = 44100;
