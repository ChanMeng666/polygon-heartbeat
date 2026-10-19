# Composition notes: Polygon Heartbeat (ポリゴン・ハートビート)

## What "Perfume style" means here

Perfume's sound is the work of producer Yasutaka Nakata (capsule): Japanese technopop/electropop that sits between French electro-house and J-pop songwriting. These are the traits this track borrows on purpose:

| Trait | How it shows up in this track |
|---|---|
| 4-on-the-floor at ~128 BPM | 128 BPM, kick on every beat in verses and choruses |
| Pumping sidechain | Volume-shaper ducking on bass, supersaw, strings, Rhodes and pluck, keyed to every kick (`duckCurve`) |
| Hard-tuned, processed trio vocals | 3 VOICEVOX singers. Every voiced frame's f0 is snapped to the exact note pitch (the "auto-tune" step effect). Bright EQ, firm compression, de-essing |
| Members trading lines, unison chorus | Verse lines rotate A → B → C. Pre-chorus goes solo → solo → all three. Chorus is all three in unison, plus a diatonic-third harmony on the answer lines |
| Robot vocoder chants | Intro, interlude and outro chant "ぽりごん / ハートビート", run through a 24-band channel vocoder over supersaw chords |
| J-pop harmony | Chorus uses IV–V–iii–vi (王道進行, Db–Eb–Cm–Fm) and resolves through ii–V–I (Bbm7–Eb–Ab). Verse sits on the relative minor |
| "Pikopiko" synth hooks | 16th-note square-wave riff with a pitch blip on each attack, doubled by a real glockenspiel |
| Sparkle and pop polish | Glockenspiel counterline, orchestra hits on chorus downbeats, cymbal swells, mark-tree chimes, noise risers |
| Piano/Rhodes colour | A real Rhodes (jRhodes3d) plays 3-3-2 stabs in the verses. A real grand piano (Salamander) drives the pre-chorus and plays the hook in the interlude break |

## Form (96 bars, 3:00 + tail)

| Bars | Section | Chords (1 per bar) | Arrangement |
|---|---|---|---|
| 1–8 | Intro | Fm Db Eb Cm ×2 | Vocoder chant, glock riff, filtered pluck opening up. Kick, hats and the square-lead riff come in at bar 5. Cymbal swell into the verse |
| 9–24 | Verse 1 | Fm Db Eb Cm Fm Db Bbm7 C7 ×2 | Rolling octave bass, Rhodes stabs, shaker/hat 16ths, voices take turns |
| 25–32 | Pre-chorus | Dbmaj7 Eb Cm7 Fm7 Bbm7 Cm7 Dbmaj7 Eb | Piano quarters, 8th-note supersaw with the filter opening, strings crescendo. Snare build goes 8ths → 16ths → 32nds, with a 4 s cymbal swell and a riser |
| 33–48 | Chorus 1 | Db Eb Cm Fm Bbm7 Eb Ab Ab, ×2 (last bar C7) | Full supersaw with sidechain, offbeat bass, glock counterline, orchestra hits, unison trio vocals |
| 49–56 | Interlude | Fm Db Eb Cm ×2 | Half-time break. Stuttered vocoder ("ぽ・り・ぽ・り・ごん"), square-lead riff, piano plays the hook. Beat and trance-gated saws return at bar 53 |
| 57–64 | Verse 2 | Fm Db Eb Cm Fm Db Bbm7 C7 | New lyrics, ends in unison |
| 65–72 | Pre-chorus 2 | as above | |
| 73–88 | Chorus 2 | Db Eb Cm Fm Bbm7 Eb Ab Ab ×2 | |
| 89–96 | Outro | Db Eb Fm Fm Db Eb Ab Ab | Echo of the hook, then the beat drops out and piano, glock and the vocoder carry it. Ends on a final Ab hit |

Key: A♭ major / F minor. The vocal range is C4 to E♭5.

## The hook

```
ぽ り ご ん の  は ー と び ー と      (bar 1–2 of the chorus)
F  Ab Ab Bb Ab  C5 . Bb Eb5 .  Db5
```

The intro's vocoder chant uses the same rhythm, so the listener hears the hook 30 seconds before the chorus arrives. Nakata often teases the hook this way.

## Lyrics (original)

**Verse 1**
真夜中のスクリーン / 揺れるピクセルの海 / 君の声がノイズを / すり抜けて届いた /
触れない距離でも / 心はシンクロする / 光の速さで / 今 君に会いにいく

**Pre-chorus**
ねえ 聞こえる? / この胸の音 / デジタルの波を越えて / 世界が変わる

**Chorus**
ポリゴンのハートビート / きらめく君のシグナル / 止まらない僕らのリズム / ずっと ずっと つないでいて /
ポリゴンのハートビート / 触れたら光るスペクトル / ゼロとイチのあいだで / 君を探してる

**Verse 2**
夢の中でログイン / 君の名前探す / 青い光の中 / 僕は君を呼んだ

All melodies, with one kana per note, are in `src/song.js`.
