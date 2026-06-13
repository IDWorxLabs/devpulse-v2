/**
 * Voice Transcription Authority — evidence-based transcript extraction (V1).
 * Reads embedded transcript markers from audio containers; no external ASR in V1.
 */

import {
  extractAudioMetadata,
  normalizeConfidence,
  resolveSupportedVoiceFormat,
} from './audio-metadata-reader.js';
import type { AudioMetadataEvidence, SupportedVoiceFormat, VoiceTranscript } from './voice-notes-types.js';

function readNullTerminatedText(buffer: Buffer, offset: number, maxLength: number): string {
  const end = Math.min(buffer.length, offset + maxLength);
  let sliceEnd = offset;
  while (sliceEnd < end && buffer[sliceEnd] !== 0) sliceEnd += 1;
  return buffer.toString('utf8', offset, sliceEnd).trim();
}

export function extractEmbeddedTranscriptFromWav(buffer: Buffer): string | null {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF') return null;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;

    if (chunkId === 'trn ' && chunkSize > 0 && dataStart + chunkSize <= buffer.length) {
      return buffer.toString('utf8', dataStart, dataStart + chunkSize).trim();
    }

    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  return null;
}

export function extractEmbeddedTranscriptFromId3(buffer: Buffer): string | null {
  if (buffer.length < 10 || buffer.toString('ascii', 0, 3) !== 'ID3') return null;

  const tagSize =
    ((buffer[6] & 0x7f) << 21) |
    ((buffer[7] & 0x7f) << 14) |
    ((buffer[8] & 0x7f) << 7) |
    (buffer[9] & 0x7f);

  let offset = 10;
  const tagEnd = Math.min(buffer.length, 10 + tagSize);

  while (offset + 10 <= tagEnd) {
    const frameId = buffer.toString('ascii', offset, offset + 4);
    const frameSize =
      ((buffer[offset + 4] & 0x7f) << 21) |
      ((buffer[offset + 5] & 0x7f) << 14) |
      ((buffer[offset + 6] & 0x7f) << 7) |
      (buffer[offset + 7] & 0x7f);
    const frameStart = offset + 10;
    const frameEnd = frameStart + frameSize;
    if (frameEnd > tagEnd) break;

    if (frameId === 'TXXX' && frameSize > 4) {
      const encoding = buffer[frameStart];
      const description = readNullTerminatedText(buffer, frameStart + 1, frameSize);
      const textStart = frameStart + 1 + Buffer.byteLength(description, 'utf8') + 1;
      const text = buffer.toString(encoding === 0 ? 'latin1' : 'utf8', textStart, frameEnd).trim();
      if (description.toUpperCase() === 'VOICE_TRANSCRIPT' && text.length > 0) {
        return text;
      }
    }

    offset = frameEnd;
  }

  return null;
}

export function extractEmbeddedTranscriptFromOgg(buffer: Buffer): string | null {
  if (buffer.length < 28 || buffer.toString('ascii', 0, 4) !== 'OggS') return null;

  let offset = 0;
  while (offset + 27 <= buffer.length) {
    if (buffer.toString('ascii', offset, offset + 4) !== 'OggS') break;
    const headerType = buffer[offset + 5];
    const pageSegments = buffer[offset + 26];
    let segmentOffset = offset + 27;
    let segmentLengthSum = 0;
    for (let s = 0; s < pageSegments; s += 1) {
      segmentLengthSum += buffer[segmentOffset + s];
    }
    const segmentStart = segmentOffset + pageSegments;

    if (headerType === 0x02) {
      const id = buffer.toString('ascii', segmentStart, segmentStart + 6);
      if (id === 'vorbis') {
        let commentOffset = segmentStart + 7;
        commentOffset += 4;
        const vendorLength = buffer.readUInt32LE(commentOffset);
        commentOffset += 4 + vendorLength;
        const userCommentCount = buffer.readUInt32LE(commentOffset);
        commentOffset += 4;

        for (let c = 0; c < userCommentCount; c += 1) {
          if (commentOffset + 4 > buffer.length) break;
          const commentLength = buffer.readUInt32LE(commentOffset);
          commentOffset += 4;
          const comment = buffer.toString('utf8', commentOffset, commentOffset + commentLength);
          commentOffset += commentLength;
          if (comment.startsWith('TRANSCRIPT=')) {
            return comment.slice('TRANSCRIPT='.length).trim();
          }
        }
      }
    }

    offset = segmentStart + segmentLengthSum;
  }

  return null;
}

export function extractEmbeddedTranscriptFromM4a(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  let offset = 0;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (size < 8) break;
    const dataStart = offset + 8;
    const dataEnd = offset + size;

    if (type === '\xa9des' && dataEnd <= buffer.length && size > 16) {
      const text = buffer.toString('utf8', dataStart + 8, dataEnd).replace(/\0/g, '').trim();
      if (text.length > 0) return text;
    }

    if (type === 'meta' || type === 'ilst' || type === 'moov' || type === 'udta') {
      const nested = extractEmbeddedTranscriptFromM4a(buffer.subarray(dataStart, dataEnd));
      if (nested) return nested;
    }

    offset += size;
  }

  return null;
}

export function extractEmbeddedTranscript(
  buffer: Buffer,
  format: SupportedVoiceFormat | null,
): string | null {
  if (!format) return null;
  if (format === 'WAV') return extractEmbeddedTranscriptFromWav(buffer);
  if (format === 'MP3') return extractEmbeddedTranscriptFromId3(buffer);
  if (format === 'OGG') return extractEmbeddedTranscriptFromOgg(buffer);
  if (format === 'M4A') return extractEmbeddedTranscriptFromM4a(buffer);
  return null;
}

export function transcribeVoiceNote(input: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  transcriptFixture?: string | null;
}): { metadata: AudioMetadataEvidence; transcript: VoiceTranscript | null } {
  const metadata = extractAudioMetadata(input.buffer, input.filename, input.mimeType);
  const format = resolveSupportedVoiceFormat(input.filename, input.mimeType);
  if (!format) {
    return { metadata, transcript: null };
  }

  const embedded = extractEmbeddedTranscript(input.buffer, format);
  const transcriptText = (input.transcriptFixture ?? embedded ?? '').trim();

  if (transcriptText.length === 0) {
    return { metadata, transcript: null };
  }

  const evidence: string[] = [];
  if (input.transcriptFixture) {
    evidence.push('TRANSCRIPT_FIXTURE');
  } else if (embedded) {
    evidence.push(`EMBEDDED_TRANSCRIPT_${format}`);
  }

  const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;
  const durationSeconds = metadata.durationSeconds > 0 ? metadata.durationSeconds : Math.max(1, wordCount * 0.4);
  const confidenceBase = embedded || input.transcriptFixture ? 78 : 40;
  const confidence = normalizeConfidence(confidenceBase + Math.min(15, Math.floor(wordCount / 4)));

  return {
    metadata,
    transcript: {
      readOnly: true,
      transcriptText,
      confidence,
      durationSeconds,
      wordCount,
      evidence,
    },
  };
}
