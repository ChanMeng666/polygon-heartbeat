<div align="center">

# Polygon Heartbeat · ポリゴン・ハートビート

**An original Japanese technopop song in the style of Perfume and Yasutaka Nakata. Every note, lyric and mix move is written as code, then rendered with real-instrument samplers and a Japanese singing synthesizer.**

`128 BPM` · `A♭ major / F minor` · `3:06` · `-9 LUFS master`

</div>

## 🎧 Listen

<!--
  VIDEO PLACEHOLDER
  1. Open this README in GitHub's web editor (pencil icon).
  2. Drag out/polygon-heartbeat.mp4 (8.9 MB, under the 10 MB limit) onto this spot.
  3. GitHub inserts a https://github.com/user-attachments/assets/... link. Keep it on its own line
     so it renders as an inline player, then delete this comment block.
-->
> 🎬 **Lyric video coming here.** Until then, download [`out/polygon-heartbeat.mp3`](out/polygon-heartbeat.mp3).

The video shows the live waveform and the section the song is in, with Japanese lyrics and English translations timed from the score.

## What this is

Polygon Heartbeat is a complete pop song (intro, verses, pre-choruses, choruses, interlude and outro) produced without a DAW:

- **Composition as data.** [`src/song.js`](src/song.js) holds the chords, the melodies with one kana per note, the drum patterns and every instrument part.
- **Real-instrument samples.** A grand piano, a Rhodes, a glockenspiel, claps, snare, hi-hats, shaker, tambourine, cymbal swells and mark-tree chimes are played back from multi-sampled libraries by FluidSynth and sfizz.
- **Real singing.** Three VOICEVOX singers stand in for the trio. They trade lines in the verses and sing in unison in the choruses. Their pitch is hard-quantised frame by frame to get the signature auto-tune step.
- **Hand-written synths.** Supersaw, pluck, bass, the square-wave "pikopiko" lead, the vocoder and the sidechain pump are DSP code in Node.js, with no plugins.
- **Mixed and mastered with ffmpeg.** Stems are gain-staged, EQ'd, sent to a convolution reverb and a dotted-8th delay, then glued by a bus compressor and an oversampled limiter.

## Sound design: the Perfume / Nakata checklist

| Trait | Implementation |
|---|---|
| Four-on-the-floor electro-house at 128 BPM | Sampled 909 kick plus a sine sub-kick |
| Pumping sidechain | Kick-keyed volume shaping on bass, supersaw, strings, Rhodes and pluck |
| Hard-tuned trio vocals | 3 VOICEVOX voices with f0 snapped to exact note pitch, bright EQ, compression, de-essing |
| Robot vocoder chants | 24-band channel vocoder (VOICEVOX modulator, supersaw-chord carrier) |
| J-pop harmony | Chorus on IV–V–iii–vi (王道進行, "royal road" progression), resolving through ii–V–I |
| Sparkle | Real glockenspiel counter-line, orchestra hits, suspended-cymbal crescendos, mark tree |
| Piano colour | Salamander grand drives the pre-chorus and plays the hook in the interlude break |

The full breakdown, with form, chords per bar, the hook and the lyrics, is in [docs/composition.md](docs/composition.md).

## Toolchain

```
src/song.js ── note events ──┬─ FluidSynth 2.6.1 + GeneralUser GS (SF2)   909 kit · strings · orchestra hit
                             ├─ sfizz_render 1.2.3 + SFZ libraries        Salamander Grand · jRhodes3d · VCSL
                             ├─ VOICEVOX engine 0.25.2 (local sing API)   3 singers + harmony + vocoder voice
                             └─ Node.js DSP                                supersaw · pluck · bass · lead · FX
                  stems ──> ffmpeg mix & master ──> WAV / FLAC / MP3 ──> lyric video (MP4)
```

## Build it yourself

**Requirements:** Node.js 20+, ffmpeg on `PATH`, and the tools and libraries below. Paths default to `D:/tools/audio`. You can override any of them with environment variables (see [`src/config.js`](src/config.js)).

| Tool / library | Source |
|---|---|
| FluidSynth 2.6.1 | [FluidSynth/fluidsynth](https://github.com/FluidSynth/fluidsynth) |
| sfizz 1.2.3 (`sfizz_render`) | [sfztools/sfizz](https://github.com/sfztools/sfizz) |
| VOICEVOX engine 0.25.2 | [VOICEVOX/voicevox_engine](https://github.com/VOICEVOX/voicevox_engine) |
| GeneralUser GS | [mrbumpy409/GeneralUser-GS](https://github.com/mrbumpy409/GeneralUser-GS) |
| Salamander Grand Piano (SFZ) | [sfzinstruments/SalamanderGrandPiano](https://github.com/sfzinstruments/SalamanderGrandPiano) |
| jRhodes3d (SFZ) | [sfzinstruments/jlearman.jRhodes3d](https://github.com/sfzinstruments/jlearman.jRhodes3d) |
| VCSL (Versilian Community Sample Library) | [sgossner/VCSL](https://github.com/sgossner/VCSL) |

```bash
# start the singing engine (the first request takes ~15 s to warm up)
D:/tools/audio/voicevox/windows-cpu/run.exe --host 127.0.0.1 --port 50021

npm run build            # stems -> vocals -> mix
node src/build.js mix    # or run one stage: stems | vocals | mix
npm run video            # lyric video for the README (stays under 10 MB)
```

Synth randomness is seeded, so builds are reproducible. A full build takes about 6 minutes on a laptop CPU.

## Repository layout

```
src/song.js                  composition: sections, chords, melodies + lyrics, every part
src/theory.js                note names, chord symbols, voicings, diatonic harmony
src/instruments/synths.js    supersaw, pluck, bass, lead, sub-kick, risers, impacts, sidechain
src/instruments/samplers.js  FluidSynth / sfizz rendering + generated VCSL .sfz maps
src/vocals/render.js         VOICEVOX singing with hard-tuned f0 + channel vocoder
src/mix.js                   ffmpeg mixdown and mastering
src/video.js                 lyric video
docs/composition.md          arrangement, harmony and lyrics
out/                         polygon-heartbeat.mp3 / .mid, waveform & spectrogram, loudness report
```

`out/polygon-heartbeat.mid` contains every part as a separate MIDI track, ready to import into any DAW.

## Credits and licences

- **Voices:** VOICEVOX:春日部つむぎ, VOICEVOX:冥鳴ひまり, VOICEVOX:四国めたん, VOICEVOX:九州そら and VOICEVOX:波音リツ. The singing-style model is VOICEVOX:波音リツ. Each character's terms of use apply to the rendered audio and video.
- **GeneralUser GS** by S. Christian Collins, under the GeneralUser GS licence.
- **Salamander Grand Piano** by Alexander Holm, CC BY 3.0.
- **jRhodes3d** by Jeff Learman, CC BY 4.0.
- **VCSL** by Versilian Studios, CC0.
- **Code** is MIT licensed (see [LICENSE](LICENSE)).

This is a stylistic homage. The melodies, lyrics and arrangement are original, and the project uses no recordings or samples from Perfume or any other artist. It is not affiliated with Perfume, Amuse or Yasutaka Nakata.
