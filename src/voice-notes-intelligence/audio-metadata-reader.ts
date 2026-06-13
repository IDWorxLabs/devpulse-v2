/**
 * Audio Metadata Reader — format and duration evidence from audio headers (V1).
 */

import type { AudioMetadataEvidence, SupportedVoiceFormat } from './voice-notes-types.js';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveSupportedVoiceFormat(
  filename: string,
  mimeType: string,
): SupportedVoiceFormat | null {
  const ext = filename.split('.').pop()?.toUpperCase() ?? '';
  if (ext === 'MP3' || mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') return 'MP3';
  if (ext === 'WAV' || mimeType === 'audio/wav' || mimeType === 'audio/x-wav') return 'WAV';
  if (ext === 'M4A' || mimeType === 'audio/mp4' || mimeType === 'audio/x-m4a') return 'M4A';
  if (ext === 'OGG' || mimeType === 'audio/ogg' || mimeType === 'application/ogg') return 'OGG';
  return null;
}

export function parseWavMetadata(buffer: Buffer): {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
} | null {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buffer.toString('ascii', 8, 12) !== 'WAVE') return null;

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;

    if (chunkId === 'fmt ' && chunkSize >= 16) {
      channels = buffer.readUInt16LE(dataStart + 2);
      sampleRate = buffer.readUInt32LE(dataStart + 4);
      bitsPerSample = buffer.readUInt16LE(dataStart + 14);
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
    }

    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  if (sampleRate === 0 || channels === 0 || bitsPerSample === 0) return null;
  const bytesPerSecond = (sampleRate * channels * bitsPerSample) / 8;
  const durationSeconds = bytesPerSecond > 0 ? dataSize / bytesPerSecond : 0;

  return { durationSeconds, sampleRate, channels };
}

export function parseMp3DurationEstimate(buffer: Buffer): number {
  let offset = 0;
  if (buffer.length >= 10 && buffer.toString('ascii', 0, 3) === 'ID3') {
    const id3Size =
      ((buffer[6] & 0x7f) << 21) |
      ((buffer[7] & 0x7f) << 14) |
      ((buffer[8] & 0x7f) << 7) |
      (buffer[9] & 0x7f);
    offset = 10 + id3Size;
  }

  for (let i = offset; i < buffer.length - 4; i += 1) {
    if (buffer[i] === 0xff && (buffer[i + 1] & 0xe0) === 0xe0) {
      const version = (buffer[i + 1] >> 3) & 0x03;
      const layer = (buffer[i + 1] >> 1) & 0x03;
      const bitrateIndex = (buffer[i + 2] >> 4) & 0x0f;
      const sampleRateIndex = (buffer[i + 2] >> 2) & 0x03;

      if (layer !== 0x01 || bitrateIndex === 0 || bitrateIndex === 0x0f || sampleRateIndex === 0x03) {
        continue;
      }

      const bitrates =
        version === 0x03
          ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
          : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
      const sampleRates =
        version === 0x03
          ? [44100, 48000, 32000, 0]
          : [22050, 24000, 16000, 0];

      const bitrateKbps = bitrates[bitrateIndex];
      const sampleRate = sampleRates[sampleRateIndex];
      if (bitrateKbps === 0 || sampleRate === 0) continue;

      const audioBytes = Math.max(0, buffer.length - i);
      return (audioBytes * 8) / (bitrateKbps * 1000);
    }
  }

  return 0;
}

export function parseOggDurationEstimate(buffer: Buffer): number {
  if (buffer.length < 28 || buffer.toString('ascii', 0, 4) !== 'OggS') return 0;

  let offset = 0;
  let lastGranule = 0;
  let sampleRate = 48000;

  while (offset + 27 <= buffer.length) {
    if (buffer.toString('ascii', offset, offset + 4) !== 'OggS') break;
    const headerType = buffer[offset + 5];
    const granule = Number(buffer.readBigUInt64LE(offset + 6));
    const pageSegments = buffer[offset + 26];
    const pageSize = 27 + pageSegments + buffer.readUInt16LE(offset + 27 + pageSegments - 2);
    if (granule > 0) lastGranule = granule;

    if (headerType === 0x02) {
      const segmentStart = offset + 27 + pageSegments;
      const id = buffer.toString('ascii', segmentStart, segmentStart + 6);
      if (id === 'vorbis') {
        sampleRate = buffer.readUInt32LE(segmentStart + 12);
      }
    }

    offset += Math.max(pageSize, 28);
  }

  return sampleRate > 0 ? lastGranule / sampleRate : 0;
}

export function parseM4aDurationEstimate(buffer: Buffer): number {
  if (buffer.length < 12 || buffer.toString('ascii', 4, 8) !== 'ftyp') return 0;

  let offset = 0;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (size < 8) break;

    if (type === 'mvhd' && offset + 28 <= buffer.length) {
      const version = buffer[offset + 8];
      if (version === 0) {
        const timescale = buffer.readUInt32BE(offset + 20);
        const duration = buffer.readUInt32BE(offset + 24);
        return timescale > 0 ? duration / timescale : 0;
      }
      if (version === 1 && offset + 36 <= buffer.length) {
        const timescale = buffer.readUInt32BE(offset + 28);
        const duration = Number(buffer.readBigUInt64BE(offset + 32));
        return timescale > 0 ? duration / timescale : 0;
      }
    }

    offset += size;
  }

  return 0;
}

export function extractAudioMetadata(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): AudioMetadataEvidence {
  const format = resolveSupportedVoiceFormat(filename, mimeType);
  let durationSeconds = 0;
  let sampleRate: number | null = null;
  let channels: number | null = null;

  if (format === 'WAV') {
    const wav = parseWavMetadata(buffer);
    if (wav) {
      durationSeconds = wav.durationSeconds;
      sampleRate = wav.sampleRate;
      channels = wav.channels;
    }
  } else if (format === 'MP3') {
    durationSeconds = parseMp3DurationEstimate(buffer);
  } else if (format === 'OGG') {
    durationSeconds = parseOggDurationEstimate(buffer);
  } else if (format === 'M4A') {
    durationSeconds = parseM4aDurationEstimate(buffer);
  }

  return {
    readOnly: true,
    format,
    durationSeconds: clamp(durationSeconds, 0, 86400),
    byteLength: buffer.length,
    sampleRate,
    channels,
  };
}

export function normalizeConfidence(value: number): number {
  return clamp(Math.round(value), 0, 100);
}
