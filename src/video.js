// Music video for the README: neon gradient, live waveform, progress bar, section labels,
// and Japanese lyrics with English translations, timed from the score.
// Sized to stay under GitHub's 10 MB video-attachment limit.  Usage: node src/video.js
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { OUT, WORK, TOOLS } from './config.js';
import { SECTIONS, SPB, LYRICS, TITLE, BPM, KEY } from './song.js';

const EN = {
  verse1: ['Midnight on the screen', 'A sea of trembling pixels', 'Your voice slipped through the noise', 'and found its way to me',
    "Even at a distance we can't touch", 'our hearts fall into sync', 'At the speed of light', "I'm on my way to you now"],
  pre: ['Hey, can you hear it?', 'The sound inside my chest', 'Crossing the digital waves', 'the world begins to change'],
  chorus: ['Polygon heartbeat', 'Your glittering signal', 'This rhythm of ours will never stop', 'Stay connected, always, always',
    'Polygon heartbeat', 'A spectrum that glows at a touch', 'Somewhere between zero and one', "I'm searching for you"],
  verse2: ['Logging in inside a dream', 'Searching for your name', 'Inside a blue light', 'I called out to you'],
};
const LABEL = { intro: 'INTRO', verse1: 'VERSE 1', pre1: 'PRE-CHORUS', chorus1: 'CHORUS', inter: 'INTERLUDE',
  verse2: 'VERSE 2', pre2: 'PRE-CHORUS', chorus2: 'CHORUS', outro: 'OUTRO' };

const ts = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = (s % 60).toFixed(2).padStart(5, '0');
  return `${h}:${String(m).padStart(2, '0')}:${sec}`;
};
const barSec = (bar) => bar * 4 * SPB;

function buildAss(duration) {
  const ev = [];
  const line = (start, end, style, text) => ev.push(`Dialogue: 0,${ts(start)},${ts(end)},${style},,0,0,0,,${text}`);
  const sec = (n) => SECTIONS.find((s) => s.name === n);
  const lyricBlock = (secName, jp, en, firstLine = 0, count = jp.length) => {
    const s = sec(secName);
    for (let i = 0; i < count; i++) {
      const a = barSec(s.start + i * 2), b = barSec(s.start + i * 2 + 2) - 0.05;
      line(a, b, 'JP', jp[firstLine + i]); line(a, b, 'EN', en[firstLine + i]);
    }
  };
  lyricBlock('verse1', LYRICS.verse1, EN.verse1);
  lyricBlock('pre1', LYRICS.pre, EN.pre);
  lyricBlock('chorus1', LYRICS.chorus, EN.chorus);
  lyricBlock('verse2', LYRICS.verse2, EN.verse2);
  lyricBlock('pre2', LYRICS.pre, EN.pre);
  lyricBlock('chorus2', LYRICS.chorus, EN.chorus);
  lyricBlock('outro', LYRICS.chorus, EN.chorus, 0, 1);
  for (const n of ['intro', 'inter']) line(barSec(sec(n).start), barSec(sec(n).start + sec(n).bars) - 0.05, 'JP', '♪ ぽりごん · ハートビート ♪');
  for (const s of SECTIONS) line(barSec(s.start), Math.min(duration, barSec(s.start + s.bars)), 'Section', LABEL[s.name]);
  line(0, duration, 'Title', 'Polygon Heartbeat');
  line(0, duration, 'Sub', 'ポリゴン・ハートビート');
  line(0, duration, 'Info', `${BPM} BPM · ${KEY} · Technopop`);

  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Yu Gothic,58,&H00FFFFFF,&H00FFFFFF,&H00C76EFF,&H00000000,1,0,0,0,100,100,2,0,1,0,3,8,0,0,58,1
Style: Sub,Yu Gothic,30,&H00FFD15A,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,4,0,1,0,0,8,0,0,128,1
Style: Info,Yu Gothic,20,&H00D8C8E8,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,8,0,0,172,1
Style: Section,Yu Gothic,22,&H00FFD15A,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,6,0,1,0,0,7,40,0,30,1
Style: JP,Yu Gothic,46,&H00FFFFFF,&H00FFFFFF,&H00C76EFF,&H00000000,1,0,0,0,100,100,2,0,1,2,2,2,0,0,118,1
Style: EN,Yu Gothic,26,&H00F0E0FF,&H00FFFFFF,&H00000000,&H00000000,0,1,0,0,100,100,1,0,1,0,1,2,0,0,78,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${ev.join('\n')}
`;
}

const audio = path.join(OUT, 'polygon-heartbeat.wav');
const video = path.join(OUT, 'polygon-heartbeat.mp4');
fs.mkdirSync(WORK, { recursive: true });
const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]).toString());
const ass = path.join(WORK, 'lyrics.ass');
fs.writeFileSync(ass, buildAss(duration));

// libass needs ':' escaped in filter arguments; run from WORK and use relative names to keep it simple
const graph = [
  `gradients=s=1280x720:r=24:c0=0x0b0b2e:c1=0x3b0f55:c2=0x0f3a5c:nb_colors=3:speed=0.004:d=${duration.toFixed(2)}[bg]`,
  // mono waveform used as an alpha mask over solid neon pink, plus a soft glow (smooth shapes also compress far better)
  `[0:a]aformat=channel_layouts=mono,showwaves=s=1280x220:mode=cline:rate=24:scale=sqrt:colors=white:draw=full,format=gray[mask]`,
  `color=c=0xff6ec7:s=1280x220:r=24:d=${duration.toFixed(2)},format=rgba[pink]`,
  `[pink][mask]alphamerge,split[w1][w2]`,
  `[w2]gblur=sigma=10[glow]`,
  `[bg][glow]overlay=0:250:format=rgb[bg2]`,
  `[bg2][w1]overlay=0:250:format=rgb[v1]`,
  `[v1]drawbox=x=0:y=704:w=1280:h=4:color=white@0.15:t=fill,drawbox=x=0:y=704:w='1280*t/${duration.toFixed(2)}':h=4:color=0xff6ec7:t=fill,` +
    `subtitles=lyrics.ass:fontsdir='C\\:/Windows/Fonts',format=yuv420p[v]`,
].join(';');

const common = ['-hide_banner', '-y', '-v', 'error', '-i', audio, '-filter_complex', graph, '-map', '[v]',
  '-c:v', 'libx264', '-preset', 'slow', '-b:v', '230k', '-maxrate', '400k', '-bufsize', '800k', '-g', '96'];
execFileSync(TOOLS.ffmpeg, [...common, '-pass', '1', '-an', '-f', 'null', 'NUL'], { cwd: WORK, stdio: 'inherit' });
execFileSync(TOOLS.ffmpeg, [...common, '-pass', '2', '-map', '0:a', '-c:a', 'aac', '-b:a', '160k',
  '-movflags', '+faststart', '-metadata', `title=${TITLE}`, video], { cwd: WORK, stdio: 'inherit' });
const mb = fs.statSync(video).size / 1024 / 1024;
console.log(`${video}  ${mb.toFixed(2)} MB${mb > 10 ? '  (over the 10 MB GitHub limit!)' : ''}`);
