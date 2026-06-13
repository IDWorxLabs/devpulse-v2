/**
 * Phase 26.22 — Universal Upload Foundation V1 validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UPLOAD_SYSTEM_PASS_TOKEN,
  MAX_UPLOAD_SESSION_HISTORY,
  MAX_UPLOAD_SIZE_BYTES,
  buildUploadSystemReportMarkdown,
  classifyUploadCandidate,
  getUploadSessionHistorySize,
  getUploadStorageSize,
  processUpload,
  resetUploadSessionHistoryForTests,
  resetUploadStorageForTests,
  resetUploadSystemModuleForTests,
  validateUploadSecurity,
} from '../src/upload-system/index.js';

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
  'src/upload-system/upload-system-types.ts',
  'src/upload-system/upload-system-registry.ts',
  'src/upload-system/upload-acceptance-rules.ts',
  'src/upload-system/upload-file-classifier.ts',
  'src/upload-system/upload-security-validator.ts',
  'src/upload-system/upload-storage-authority.ts',
  'src/upload-system/upload-session-history.ts',
  'src/upload-system/upload-report-builder.ts',
  'src/upload-system/upload-system-authority.ts',
  'src/upload-system/index.ts',
  'architecture/UPLOAD_SYSTEM_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

resetUploadSystemModuleForTests();
resetUploadSessionHistoryForTests();
resetUploadStorageForTests();

const pngContent = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pngUpload = processUpload({
  candidate: {
    filename: 'screenshot.png',
    mimeType: 'image/png',
    sizeBytes: pngContent.length,
    content: pngContent,
  },
  skipHistoryRecording: true,
});

assert('A supported PNG accepted', pngUpload.acceptance.verdict === 'UPLOAD_ACCEPTED', pngUpload.acceptance.verdict);
assert('A PNG stored', pngUpload.stored === true, String(pngUpload.stored));
assert('A PNG category IMAGE', pngUpload.acceptance.classification.fileCategory === 'IMAGE', pngUpload.acceptance.classification.fileCategory);

const pdfContent = Buffer.from('%PDF-1.4 foundation test');
const pdfUpload = processUpload({
  candidate: {
    filename: 'spec.pdf',
    mimeType: 'application/pdf',
    sizeBytes: pdfContent.length,
    content: pdfContent,
  },
  skipHistoryRecording: true,
});
assert('B supported PDF accepted', pdfUpload.acceptance.verdict === 'UPLOAD_ACCEPTED', pdfUpload.acceptance.verdict);

const exeContent = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
const exeUpload = processUpload({
  candidate: {
    filename: 'malware.exe',
    mimeType: 'application/x-msdownload',
    sizeBytes: exeContent.length,
    content: exeContent,
  },
  skipHistoryRecording: true,
});
assert('C EXE rejected', exeUpload.acceptance.verdict === 'UPLOAD_REJECTED', exeUpload.acceptance.verdict);
assert(
  'C EXE invalid upload reason',
  exeUpload.acceptance.rejectionReason === 'INVALID_UPLOAD',
  exeUpload.acceptance.rejectionReason ?? 'none',
);

const jsUpload = processUpload({
  candidate: {
    filename: 'payload.js',
    mimeType: 'application/javascript',
    sizeBytes: 12,
    content: Buffer.from('alert("x")'),
  },
  skipHistoryRecording: true,
});
assert('D JS executable rejected', jsUpload.acceptance.verdict === 'UPLOAD_REJECTED', jsUpload.acceptance.verdict);

const zipUpload = processUpload({
  candidate: {
    filename: 'archive.zip',
    mimeType: 'application/zip',
    sizeBytes: 100,
    content: Buffer.alloc(100, 0),
  },
  skipHistoryRecording: true,
});
assert(
  'E unsupported type rejected',
  zipUpload.acceptance.verdict === 'UPLOAD_REJECTED' &&
    zipUpload.acceptance.rejectionReason === 'UNSUPPORTED_FILE_TYPE',
  `${zipUpload.acceptance.verdict}/${zipUpload.acceptance.rejectionReason}`,
);

const emptyUpload = processUpload({
  candidate: {
    filename: 'empty.txt',
    mimeType: 'text/plain',
    sizeBytes: 0,
    content: Buffer.alloc(0),
  },
  skipHistoryRecording: true,
});
assert(
  'F empty file rejected',
  emptyUpload.acceptance.verdict === 'UPLOAD_REJECTED' &&
    emptyUpload.acceptance.rejectionReason === 'EMPTY_FILE',
  emptyUpload.acceptance.rejectionReason ?? 'none',
);

const largeUpload = processUpload({
  candidate: {
    filename: 'huge.mp4',
    mimeType: 'video/mp4',
    sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1,
    content: Buffer.alloc(8),
  },
  skipHistoryRecording: true,
});
assert(
  'G file too large rejected',
  largeUpload.acceptance.rejectionReason === 'FILE_TOO_LARGE',
  largeUpload.acceptance.rejectionReason ?? 'none',
);

const securityUnit = validateUploadSecurity({
  filename: 'setup.msi',
  mimeType: 'application/octet-stream',
  sizeBytes: 100,
  content: Buffer.alloc(100),
});
assert('H MSI security blocked', securityUnit.blockedExtension, String(securityUnit.blockedExtension));

const classificationUnit = classifyUploadCandidate({
  filename: 'photo.webp',
  mimeType: 'image/webp',
  sizeBytes: 512,
});
assert('I webp classification', classificationUnit.fileCategory === 'IMAGE' && classificationUnit.supported, classificationUnit.fileCategory);

resetUploadSessionHistoryForTests();
for (let i = 0; i < MAX_UPLOAD_SESSION_HISTORY + 5; i += 1) {
  processUpload({
    candidate: {
      filename: `file-${i}.txt`,
      mimeType: 'text/plain',
      sizeBytes: 4,
      content: Buffer.from('test'),
    },
  });
}
assert(
  'J history bounded',
  getUploadSessionHistorySize() <= MAX_UPLOAD_SESSION_HISTORY,
  `${getUploadSessionHistorySize()}/${MAX_UPLOAD_SESSION_HISTORY}`,
);

const reportMarkdown = buildUploadSystemReportMarkdown();
assert('K report generated', reportMarkdown.includes('UPLOAD_SYSTEM_REPORT'), 'yes');
assert('K report supported types', reportMarkdown.includes('.png') && reportMarkdown.includes('.pdf'), 'yes');
assert('K report security checks', reportMarkdown.includes('Extension blocklist'), 'yes');

writeFileSync(join(ROOT, 'architecture/UPLOAD_SYSTEM_REPORT.md'), reportMarkdown, 'utf8');
assert('K report written to architecture', existsSync(join(ROOT, 'architecture/UPLOAD_SYSTEM_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/upload-system/upload-system-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/upload-system/upload-system-registry.ts'), 'utf8');
assert(
  'L infrastructure only safeguards',
  registrySource.includes('No OCR, screenshot analysis, voice transcription') &&
    !authoritySource.includes('performOcr') &&
    !authoritySource.includes('transcribe'),
  'yes',
);
assert('L advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/UPLOAD_SYSTEM_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(UPLOAD_SYSTEM_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Upload System V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nAccepted uploads in storage: ${getUploadStorageSize()}`);
  console.log(`History size: ${getUploadSessionHistorySize()}`);
  console.log(`Report path: architecture/UPLOAD_SYSTEM_REPORT.md`);
  console.log(`\n${UPLOAD_SYSTEM_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
