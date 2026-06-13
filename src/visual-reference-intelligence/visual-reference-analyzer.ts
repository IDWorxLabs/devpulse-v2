/**
 * Visual Reference Analyzer — image metadata and luminance sampling (V1).
 * Header parsing and lightweight pixel sampling only — no OCR.
 */

import { inflateSync } from 'node:zlib';
import type {
  ImageMetadataEvidence,
  LuminanceGridSample,
  SupportedVisualFormat,
} from './visual-reference-types.js';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rgbToLuminance(r: number, g: number, b: number): number {
  return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
}

export function resolveSupportedFormat(
  filename: string,
  mimeType: string,
): SupportedVisualFormat | null {
  const ext = filename.split('.').pop()?.toUpperCase() ?? '';
  if (ext === 'PNG' || mimeType === 'image/png') return 'PNG';
  if (ext === 'JPG' || ext === 'JPEG' || mimeType === 'image/jpeg') return ext === 'JPEG' ? 'JPEG' : 'JPG';
  if (ext === 'WEBP' || mimeType === 'image/webp') return 'WEBP';
  return null;
}

export function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9) break;
    if (offset + 3 >= buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      if (offset + 8 >= buffer.length) return null;
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + segmentLength;
  }
  return null;
}

export function parseWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return null;

  const chunkType = buffer.toString('ascii', 12, 16);
  if (chunkType === 'VP8X' && buffer.length >= 30) {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }
  if (chunkType === 'VP8 ' && buffer.length >= 30) {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (chunkType === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }
  return null;
}

export function extractImageMetadata(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): ImageMetadataEvidence {
  const format = resolveSupportedFormat(filename, mimeType);
  let width = 0;
  let height = 0;

  if (format === 'PNG') {
    const dims = parsePngDimensions(buffer);
    if (dims) {
      width = dims.width;
      height = dims.height;
    }
  } else if (format === 'JPG' || format === 'JPEG') {
    const dims = parseJpegDimensions(buffer);
    if (dims) {
      width = dims.width;
      height = dims.height;
    }
  } else if (format === 'WEBP') {
    const dims = parseWebpDimensions(buffer);
    if (dims) {
      width = dims.width;
      height = dims.height;
    }
  }

  const aspectRatio = height > 0 ? width / height : 0;

  return {
    readOnly: true,
    format,
    width,
    height,
    aspectRatio,
    byteLength: buffer.length,
  };
}

function decodePngRgba(buffer: Buffer): { width: number; height: number; rgba: Buffer } | null {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatParts: Buffer[] = [];

  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) break;

    if (type === 'IHDR' && length >= 13) {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
    } else if (type === 'IDAT') {
      idatParts.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (width === 0 || height === 0 || idatParts.length === 0) return null;
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) return null;

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = width * bytesPerPixel;
  const raw = inflateSync(Buffer.concat(idatParts));
  const rgba = Buffer.alloc(width * height * 4);

  let rawOffset = 0;
  for (let y = 0; y < height; y += 1) {
    if (rawOffset >= raw.length) break;
    const filterType = raw[rawOffset];
    rawOffset += 1;
    const rowStart = rawOffset;
    rawOffset += stride;

    if (filterType !== 0) continue;

    for (let x = 0; x < width; x += 1) {
      const src = rowStart + x * bytesPerPixel;
      const dst = (y * width + x) * 4;
      rgba[dst] = raw[src];
      rgba[dst + 1] = raw[src + 1];
      rgba[dst + 2] = raw[src + 2];
      rgba[dst + 3] = bytesPerPixel === 4 ? raw[src + 3] : 255;
    }
  }

  return { width, height, rgba };
}

export function sampleLuminanceGrid(buffer: Buffer, gridSize = 32): LuminanceGridSample | null {
  const decoded = decodePngRgba(buffer);
  if (!decoded) return null;

  const { width, height, rgba } = decoded;
  const cells: number[] = [];

  for (let gy = 0; gy < gridSize; gy += 1) {
    for (let gx = 0; gx < gridSize; gx += 1) {
      const x = Math.floor(((gx + 0.5) / gridSize) * width);
      const y = Math.floor(((gy + 0.5) / gridSize) * height);
      const idx = (y * width + x) * 4;
      cells.push(rgbToLuminance(rgba[idx], rgba[idx + 1], rgba[idx + 2]));
    }
  }

  return {
    readOnly: true,
    gridSize,
    width,
    height,
    cells,
  };
}

export function averageBandLuminance(
  sample: LuminanceGridSample,
  band: 'top' | 'bottom' | 'left' | 'right',
  thicknessRatio: number,
): number {
  const { gridSize, cells } = sample;
  const thickness = Math.max(1, Math.floor(gridSize * thicknessRatio));
  let sum = 0;
  let count = 0;

  for (let gy = 0; gy < gridSize; gy += 1) {
    for (let gx = 0; gx < gridSize; gx += 1) {
      const inBand =
        (band === 'top' && gy < thickness) ||
        (band === 'bottom' && gy >= gridSize - thickness) ||
        (band === 'left' && gx < thickness) ||
        (band === 'right' && gx >= gridSize - thickness);
      if (!inBand) continue;
      sum += cells[gy * gridSize + gx];
      count += 1;
    }
  }

  return count > 0 ? sum / count : 128;
}

export function detectCardBlocks(sample: LuminanceGridSample): number {
  const { gridSize, cells } = sample;
  let cardLikeBlocks = 0;
  const block = 4;

  for (let by = 2; by < gridSize - block - 2; by += block) {
    for (let bx = 2; bx < gridSize - block - 2; bx += block) {
      let minL = 255;
      let maxL = 0;
      for (let dy = 0; dy < block; dy += 1) {
        for (let dx = 0; dx < block; dx += 1) {
          const value = cells[(by + dy) * gridSize + (bx + dx)];
          minL = Math.min(minL, value);
          maxL = Math.max(maxL, value);
        }
      }
      const contrast = maxL - minL;
      const avg =
        Array.from({ length: block * block }, (_, i) => {
          const dy = Math.floor(i / block);
          const dx = i % block;
          return cells[(by + dy) * gridSize + (bx + dx)];
        }).reduce((a, b) => a + b, 0) /
        (block * block);

      if (contrast >= 18 && avg >= 140 && avg <= 245) {
        cardLikeBlocks += 1;
      }
    }
  }

  return cardLikeBlocks;
}

export function detectFormLikeRegion(sample: LuminanceGridSample): boolean {
  const { gridSize, cells } = sample;
  const midStart = Math.floor(gridSize * 0.25);
  const midEnd = Math.floor(gridSize * 0.75);
  let lightRows = 0;

  for (let gy = midStart; gy < midEnd; gy += 1) {
    let lightPixels = 0;
    for (let gx = midStart; gx < midEnd; gx += 1) {
      if (cells[gy * gridSize + gx] >= 200) lightPixels += 1;
    }
    if (lightPixels / (midEnd - midStart) >= 0.55) lightRows += 1;
  }

  return lightRows >= Math.floor((midEnd - midStart) * 0.35);
}

export function detectButtonGroup(sample: LuminanceGridSample): boolean {
  const { gridSize, cells } = sample;
  const bottomStart = Math.floor(gridSize * 0.7);
  let saturatedLow = 0;
  let saturatedHigh = 0;

  for (let gy = bottomStart; gy < gridSize; gy += 1) {
    for (let gx = 0; gx < gridSize; gx += 1) {
      const value = cells[gy * gridSize + gx];
      if (value <= 80) saturatedLow += 1;
      if (value >= 180) saturatedHigh += 1;
    }
  }

  const regionSize = (gridSize - bottomStart) * gridSize;
  return saturatedLow / regionSize >= 0.08 && saturatedHigh / regionSize >= 0.08;
}

export function detectModalOverlay(sample: LuminanceGridSample): boolean {
  const { gridSize, cells } = sample;
  const cx = Math.floor(gridSize / 2);
  const cy = Math.floor(gridSize / 2);
  const radius = Math.floor(gridSize * 0.22);

  let centerSum = 0;
  let edgeSum = 0;
  let centerCount = 0;
  let edgeCount = 0;

  for (let gy = 0; gy < gridSize; gy += 1) {
    for (let gx = 0; gx < gridSize; gx += 1) {
      const dist = Math.hypot(gx - cx, gy - cy);
      const value = cells[gy * gridSize + gx];
      if (dist <= radius) {
        centerSum += value;
        centerCount += 1;
      } else if (dist >= radius * 1.4) {
        edgeSum += value;
        edgeCount += 1;
      }
    }
  }

  if (centerCount === 0 || edgeCount === 0) return false;
  const centerAvg = centerSum / centerCount;
  const edgeAvg = edgeSum / edgeCount;
  return centerAvg - edgeAvg >= 35 && centerAvg >= 170;
}

export function normalizeConfidence(value: number): number {
  return clamp(Math.round(value), 0, 100);
}
