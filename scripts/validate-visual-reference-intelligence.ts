/**
 * Phase 26.23 — Visual Reference Intelligence V1 validation.
 */

import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  processUpload,
  resetUploadStorageForTests,
  resetUploadSystemModuleForTests,
} from '../src/upload-system/index.js';
import {
  VISUAL_REFERENCE_INTELLIGENCE_PASS_TOKEN,
  MAX_VISUAL_REFERENCE_HISTORY,
  analyzeVisualReference,
  assessVisualReferenceIntelligence,
  buildVisualReferenceIntelligenceArtifacts,
  detectUiComponents,
  extractImageMetadata,
  extractScreenFlows,
  extractUiLayout,
  getVisualReferenceHistorySize,
  parsePngDimensions,
  resetVisualReferenceHistoryForTests,
  resetVisualReferenceIntelligenceModuleForTests,
  sampleLuminanceGrid,
  detectScreenContext,
} from '../src/visual-reference-intelligence/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/visual-reference-intelligence/visual-reference-types.ts',
  'src/visual-reference-intelligence/visual-reference-registry.ts',
  'src/visual-reference-intelligence/visual-reference-analyzer.ts',
  'src/visual-reference-intelligence/ui-layout-extractor.ts',
  'src/visual-reference-intelligence/screen-flow-extractor.ts',
  'src/visual-reference-intelligence/component-detector.ts',
  'src/visual-reference-intelligence/visual-reference-history.ts',
  'src/visual-reference-intelligence/visual-reference-report-builder.ts',
  'src/visual-reference-intelligence/visual-reference-authority.ts',
  'src/visual-reference-intelligence/index.ts',
  'architecture/VISUAL_REFERENCE_INTELLIGENCE_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

type UiMockProfile = 'MOBILE_APP' | 'DESKTOP_DASHBOARD';

function pixelColor(profile: UiMockProfile, x: number, y: number, width: number, height: number): [number, number, number] {
  if (profile === 'MOBILE_APP') {
    if (y < Math.floor(height * 0.08)) return [28, 32, 44];
    if (y >= Math.floor(height * 0.92)) return [24, 28, 38];
    if (x > width * 0.08 && x < width * 0.92 && y > height * 0.18 && y < height * 0.28) return [235, 238, 245];
    if (x > width * 0.08 && x < width * 0.92 && y > height * 0.34 && y < height * 0.44) return [228, 232, 240];
    if (x > width * 0.12 && x < width * 0.88 && y > height * 0.52 && y < height * 0.78) return [248, 249, 252];
    return [245, 246, 250];
  }

  if (y < Math.floor(height * 0.1)) return [30, 34, 46];
  if (x < Math.floor(width * 0.19)) return [36, 40, 52];
  if (y >= Math.floor(height * 0.93)) return [32, 36, 48];
  if (x > width * 0.24 && x < width * 0.48 && y > height * 0.18 && y < height * 0.42) return [230, 234, 242];
  if (x > width * 0.52 && x < width * 0.76 && y > height * 0.18 && y < height * 0.42) return [226, 230, 238];
  return [242, 244, 248];
}

function buildUiMockPng(profile: UiMockProfile): Buffer {
  const width = profile === 'MOBILE_APP' ? 375 : 1280;
  const height = profile === 'MOBILE_APP' ? 812 : 720;
  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixelColor(profile, x, y, width, height);
      const px = rowOffset + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

resetUploadSystemModuleForTests();
resetUploadStorageForTests();
resetVisualReferenceIntelligenceModuleForTests();
resetVisualReferenceHistoryForTests();

const mobilePng = buildUiMockPng('MOBILE_APP');
const desktopPng = buildUiMockPng('DESKTOP_DASHBOARD');

assert('A PNG dimensions parsed', parsePngDimensions(mobilePng)?.width === 375, String(parsePngDimensions(mobilePng)?.width));
assert('A luminance grid sampled', sampleLuminanceGrid(mobilePng) != null, 'yes');

const metadata = extractImageMetadata(mobilePng, 'mobile-dashboard.png', 'image/png');
const sample = sampleLuminanceGrid(mobilePng)!;
const layoutRegions = extractUiLayout(metadata, sample);
assert('B layout extraction', layoutRegions.length >= 2, `${layoutRegions.length}`);

const components = detectUiComponents(layoutRegions, sample);
assert('C component detection', components.some((c) => c.token === 'HEADER_DETECTED'), components.map((c) => c.token).join(','));

const screen = detectScreenContext(metadata, layoutRegions, components);
assert('D screen detection platform', screen.platform === 'MOBILE', screen.platform);

const flows = extractScreenFlows(screen, layoutRegions, components);
assert('E flow detection', flows.length >= 1, `${flows.length}`);

const mobileUpload = processUpload({
  candidate: {
    filename: 'mobile-dashboard.png',
    mimeType: 'image/png',
    sizeBytes: mobilePng.length,
    content: mobilePng,
  },
});

assert('F upload accepted', mobileUpload.acceptance.verdict === 'UPLOAD_ACCEPTED', mobileUpload.acceptance.verdict);

const mobileAnalysis = analyzeVisualReference({ uploadId: mobileUpload.uploadId });
assert('G analysis produced', mobileAnalysis != null, String(mobileAnalysis != null));
assert(
  'G completeness score bounded',
  mobileAnalysis != null &&
    mobileAnalysis.completeness.visualCompletenessScore >= 0 &&
    mobileAnalysis.completeness.visualCompletenessScore <= 100,
  String(mobileAnalysis?.completeness.visualCompletenessScore),
);
assert(
  'G confidence score bounded',
  mobileAnalysis != null && mobileAnalysis.confidenceScore >= 0 && mobileAnalysis.confidenceScore <= 100,
  String(mobileAnalysis?.confidenceScore),
);

const desktopAnalysis = analyzeVisualReference({
  content: desktopPng,
  filename: 'desktop-dashboard.png',
  mimeType: 'image/png',
});
assert(
  'H desktop sidebar/header',
  desktopAnalysis != null &&
    desktopAnalysis.detectedComponents.some((c) => c.token === 'HEADER_DETECTED' || c.token === 'SIDEBAR_DETECTED'),
  desktopAnalysis?.detectedComponents.map((c) => c.token).join(',') ?? 'none',
);
assert(
  'H dashboard flow',
  desktopAnalysis != null && desktopAnalysis.inferredFlows.some((f) => f.flow === 'DASHBOARD'),
  desktopAnalysis?.inferredFlows.map((f) => f.flow).join(',') ?? 'none',
);

const pdfUpload = processUpload({
  candidate: {
    filename: 'spec.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 20,
    content: Buffer.from('%PDF-1.4 visual ref test'),
  },
  skipHistoryRecording: true,
});
const rejectedAnalysis = analyzeVisualReference({ uploadId: pdfUpload.uploadId });
assert('I non-image upload rejected', rejectedAnalysis == null, 'null');

resetVisualReferenceHistoryForTests();
for (let i = 0; i < MAX_VISUAL_REFERENCE_HISTORY + 4; i += 1) {
  analyzeVisualReference({
    content: mobilePng,
    filename: `screen-${i}.png`,
    mimeType: 'image/png',
  });
}
assert(
  'J history bounded',
  getVisualReferenceHistorySize() <= MAX_VISUAL_REFERENCE_HISTORY,
  `${getVisualReferenceHistorySize()}/${MAX_VISUAL_REFERENCE_HISTORY}`,
);

const assessment = assessVisualReferenceIntelligence({
  content: mobilePng,
  filename: 'assessment.png',
  mimeType: 'image/png',
  skipHistoryRecording: true,
});
assert('K advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert('K orchestration complete', assessment.orchestrationState === 'VISUAL_REFERENCE_INTELLIGENCE_COMPLETE', assessment.orchestrationState);

const artifacts = buildVisualReferenceIntelligenceArtifacts({
  analyses: mobileAnalysis && desktopAnalysis ? [mobileAnalysis, desktopAnalysis] : [],
});
assert('L report markdown', artifacts.markdown.includes('Visual Reference Intelligence Report'), 'yes');
assert('L completeness in report', artifacts.markdown.includes('Visual completeness score'), 'yes');
assert('L flow summaries', artifacts.markdown.includes('Flow Summaries'), 'yes');

writeFileSync(join(ROOT, 'architecture/VISUAL_REFERENCE_INTELLIGENCE_REPORT.md'), artifacts.markdown, 'utf8');
assert('L report written', existsSync(join(ROOT, 'architecture/VISUAL_REFERENCE_INTELLIGENCE_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/visual-reference-intelligence/visual-reference-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/visual-reference-intelligence/visual-reference-registry.ts'), 'utf8');
assert(
  'M read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_OCR_DOCUMENT_EXTRACTION') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('M advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/VISUAL_REFERENCE_INTELLIGENCE_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(VISUAL_REFERENCE_INTELLIGENCE_PASS_TOKEN), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('N no validator recursion marker', !authoritySource.includes('validate-visual-reference-intelligence'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Visual Reference Intelligence V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getVisualReferenceHistorySize()}`);
  console.log(`Report path: architecture/VISUAL_REFERENCE_INTELLIGENCE_REPORT.md`);
  console.log(`\n${VISUAL_REFERENCE_INTELLIGENCE_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
