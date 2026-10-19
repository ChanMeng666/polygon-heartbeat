// Standard MIDI File (type 1) writer. Note times/durations are in beats.
import fs from 'node:fs';

const PPQ = 480;

function vlq(n) {
  const out = [n & 0x7f];
  while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
  return out;
}

function trackChunk(events) {
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const bytes = [];
  let last = 0;
  for (const e of events) {
    bytes.push(...vlq(e.tick - last), ...e.data);
    last = e.tick;
  }
  bytes.push(0, 0xff, 0x2f, 0);
  const head = Buffer.from('MTrk');
  const len = Buffer.alloc(4); len.writeUInt32BE(bytes.length);
  return Buffer.concat([head, len, Buffer.from(bytes)]);
}

const text = (s) => [...Buffer.from(s, 'utf8')];

/**
 * tracks: [{ name, channel, program, bank, notes: [{t, d, p, v}], cc: [{t, c, v}] }]
 */
export function writeMidi(file, tracks, bpm) {
  const tempo = Math.round(60_000_000 / bpm);
  const conductor = [
    { tick: 0, order: 0, data: [0xff, 0x51, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255] },
    { tick: 0, order: 0, data: [0xff, 0x58, 4, 4, 2, 24, 8] },
  ];
  const chunks = [trackChunk(conductor)];
  for (const tr of tracks) {
    const ch = tr.channel ?? 0;
    const ev = [{ tick: 0, order: 0, data: [0xff, 0x03, ...vlq(text(tr.name).length), ...text(tr.name)] }];
    if (tr.bank != null) ev.push({ tick: 0, order: 1, data: [0xb0 | ch, 0, tr.bank] }, { tick: 0, order: 1, data: [0xb0 | ch, 32, 0] });
    if (tr.program != null) ev.push({ tick: 0, order: 2, data: [0xc0 | ch, tr.program] });
    for (const c of tr.cc ?? []) ev.push({ tick: Math.round(c.t * PPQ), order: 3, data: [0xb0 | ch, c.c, c.v] });
    for (const n of tr.notes) {
      const on = Math.round(n.t * PPQ);
      const off = Math.max(on + 1, Math.round((n.t + n.d) * PPQ));
      const v = Math.max(1, Math.min(127, Math.round(n.v)));
      ev.push({ tick: on, order: 5, data: [0x90 | ch, n.p, v] });
      ev.push({ tick: off, order: 4, data: [0x80 | ch, n.p, 0] });
    }
    chunks.push(trackChunk(ev));
  }
  const hdr = Buffer.alloc(14);
  hdr.write('MThd'); hdr.writeUInt32BE(6, 4); hdr.writeUInt16BE(1, 8);
  hdr.writeUInt16BE(chunks.length, 10); hdr.writeUInt16BE(PPQ, 12);
  fs.writeFileSync(file, Buffer.concat([hdr, ...chunks]));
}
