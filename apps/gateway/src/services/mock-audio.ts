import { writeFileSync } from "node:fs";

/** Lightweight WAV writer for MOCK_WORKERS gateway-side fallback */
export function writeMockWav(path: string, durationSec: number, withVocal: boolean): void {
  const sampleRate = 22050;
  const samples = Math.min(sampleRate * durationSec, sampleRate * 30);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let v = Math.sin(2 * Math.PI * 220 * t) * 0.2;
    if (withVocal) v += Math.sin(2 * Math.PI * 440 * t) * 0.15 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t));
    const int16 = Math.max(-32768, Math.min(32767, Math.floor(v * 32767)));
    data.writeInt16LE(int16, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
}
