// Minimal WAV I/O: reads PCM16/24/32 + float32, writes stereo float32.
import fs from 'node:fs';

export function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF') throw new Error(`not a WAV: ${file}`);
  let pos = 12, fmt = null, data = null;
  while (pos + 8 <= b.length) {
    const id = b.toString('ascii', pos, pos + 4);
    const size = b.readUInt32LE(pos + 4);
    if (id === 'fmt ') {
      fmt = {
        format: b.readUInt16LE(pos + 8),
        channels: b.readUInt16LE(pos + 10),
        sampleRate: b.readUInt32LE(pos + 12),
        bits: b.readUInt16LE(pos + 22),
      };
      if (fmt.format === 0xfffe) fmt.format = b.readUInt16LE(pos + 32); // WAVE_FORMAT_EXTENSIBLE
    } else if (id === 'data') {
      data = b.subarray(pos + 8, pos + 8 + size);
    }
    pos += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error(`bad WAV: ${file}`);
  const { channels, bits, format } = fmt;
  const bps = bits / 8;
  const n = Math.floor(data.length / (bps * channels));
  const ch = Array.from({ length: channels }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < channels; c++) {
      const o = (i * channels + c) * bps;
      let v;
      if (format === 3) v = bits === 32 ? data.readFloatLE(o) : data.readDoubleLE(o);
      else if (bits === 16) v = data.readInt16LE(o) / 32768;
      else if (bits === 24) v = data.readIntLE(o, 3) / 8388608;
      else if (bits === 32) v = data.readInt32LE(o) / 2147483648;
      else if (bits === 8) v = (data[o] - 128) / 128;
      ch[c][i] = v;
    }
  }
  return { sampleRate: fmt.sampleRate, channels: ch };
}

export function writeWav(file, channels, sampleRate) {
  const nc = channels.length, n = channels[0].length;
  const buf = Buffer.alloc(44 + n * nc * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * nc * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(nc, 22);
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate * nc * 4, 28);
  buf.writeUInt16LE(nc * 4, 32); buf.writeUInt16LE(32, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * nc * 4, 40);
  const f = new Float32Array(buf.buffer, buf.byteOffset + 44, n * nc);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) f[i * nc + c] = channels[c][i];
  fs.writeFileSync(file, buf);
}

export const stereo = (n) => [new Float32Array(n), new Float32Array(n)];

export function peak(channels) {
  let p = 0;
  for (const c of channels) for (let i = 0; i < c.length; i++) p = Math.max(p, Math.abs(c[i]));
  return p;
}
