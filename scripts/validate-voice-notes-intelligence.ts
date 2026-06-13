/**
 * Phase 26.24 — Voice Notes Intelligence V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VOICE_NOTES_INTELLIGENCE_PASS_TOKEN,
  MAX_VOICE_NOTES_HISTORY,
  analyzeVoiceNotes,
  assessVoiceNotesIntelligence,
  buildClarifyingQuestions,
  buildProjectUnderstandingSummary,
  buildVoiceNotesIntelligenceArtifacts,
  detectVoiceIntents,
  extractRequirementsFromTranscript,
  getVoiceNotesHistorySize,
  identifyMissingRequirements,
  resetVoiceNotesHistoryForTests,
  resetVoiceNotesIntelligenceModuleForTests,
  resolveSupportedVoiceFormat,
  transcribeVoiceNote,
} from '../src/voice-notes-intelligence/index.js';

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
  'src/voice-notes-intelligence/voice-notes-types.ts',
  'src/voice-notes-intelligence/voice-notes-registry.ts',
  'src/voice-notes-intelligence/voice-transcription-authority.ts',
  'src/voice-notes-intelligence/requirement-extraction-authority.ts',
  'src/voice-notes-intelligence/intent-detection-authority.ts',
  'src/voice-notes-intelligence/project-understanding-builder.ts',
  'src/voice-notes-intelligence/voice-notes-history.ts',
  'src/voice-notes-intelligence/voice-notes-report-builder.ts',
  'src/voice-notes-intelligence/voice-notes-intelligence-authority.ts',
  'src/voice-notes-intelligence/index.ts',
  'architecture/VOICE_NOTES_INTELLIGENCE_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const FULL_TRANSCRIPT =
  'We need to build a mobile app for iOS and Android. Users should sign up with OAuth authentication, ' +
  'see a dashboard screen, and checkout with Stripe integration. Admin users must approve orders before billing. ' +
  'Send email notifications for payment alerts. We need user, order, and product entities.';

function buildTranscriptWav(transcript: string, sampleRate = 16000, seconds = 2): Buffer {
  const numSamples = sampleRate * seconds;
  const dataSize = numSamples * 2;
  const trnBytes = Buffer.from(transcript, 'utf8');
  const trnChunk = Buffer.alloc(8 + trnBytes.length);
  trnChunk.write('trn ', 0, 4, 'ascii');
  trnChunk.writeUInt32LE(trnBytes.length, 4);
  trnBytes.copy(trnChunk, 8);

  const fmt = Buffer.alloc(24);
  fmt.write('fmt ', 0, 4, 'ascii');
  fmt.writeUInt32LE(16, 4);
  fmt.writeUInt16LE(1, 8);
  fmt.writeUInt16LE(1, 10);
  fmt.writeUInt32LE(sampleRate, 12);
  fmt.writeUInt32LE(sampleRate * 2, 16);
  fmt.writeUInt16LE(2, 20);
  fmt.writeUInt16LE(16, 22);

  const data = Buffer.alloc(8 + dataSize);
  data.write('data', 0, 4, 'ascii');
  data.writeUInt32LE(dataSize, 4);

  const riffSize = 4 + fmt.length + data.length + trnChunk.length;
  const header = Buffer.alloc(8);
  header.write('RIFF', 0, 4, 'ascii');
  header.writeUInt32LE(riffSize, 4);
  const wave = Buffer.from('WAVE', 'ascii');

  return Buffer.concat([header, wave, fmt, data, trnChunk]);
}

resetVoiceNotesIntelligenceModuleForTests();
resetVoiceNotesHistoryForTests();

const wavBuffer = buildTranscriptWav(FULL_TRANSCRIPT);
assert('A WAV format resolved', resolveSupportedVoiceFormat('note.wav', 'audio/wav') === 'WAV', 'WAV');

const transcription = transcribeVoiceNote({
  buffer: wavBuffer,
  filename: 'founder-note.wav',
  mimeType: 'audio/wav',
});
assert('B transcription produced', transcription.transcript != null, String(transcription.transcript != null));
assert(
  'B transcript confidence bounded',
  transcription.transcript != null &&
    transcription.transcript.confidence >= 0 &&
    transcription.transcript.confidence <= 100,
  String(transcription.transcript?.confidence),
);
assert(
  'B duration present',
  transcription.transcript != null && transcription.transcript.durationSeconds > 0,
  String(transcription.transcript?.durationSeconds),
);

const intents = detectVoiceIntents(FULL_TRANSCRIPT);
assert('C build intent detected', intents.primaryIntent === 'BUILD_REQUEST', intents.primaryIntent);
assert('C multiple intents', intents.detectedIntents.length >= 2, `${intents.detectedIntents.length}`);

const requirements = extractRequirementsFromTranscript(FULL_TRANSCRIPT);
assert('D screens extracted', requirements.screens.length >= 2, requirements.screens.join(', '));
assert('D roles extracted', requirements.userRoles.some((r) => /admin/i.test(r)), requirements.userRoles.join(', '));
assert('D integrations extracted', requirements.integrations.some((r) => /stripe/i.test(r)), requirements.integrations.join(', '));
assert('D auth extracted', requirements.authentication.length >= 1, requirements.authentication.join(', '));
assert('D entities extracted', requirements.dataEntities.length >= 2, requirements.dataEntities.join(', '));

const missing = identifyMissingRequirements(requirements);
assert('E missing requirements identified', missing.missingScreens.length >= 1, missing.missingScreens.join(', '));

const projectUnderstanding = buildProjectUnderstandingSummary({
  transcript: transcription.transcript!,
  requirements,
  intents,
});
assert('F product type mobile', projectUnderstanding.productType === 'MOBILE_APP', projectUnderstanding.productType);
assert(
  'F platform targets',
  projectUnderstanding.platformTargets.includes('IOS') && projectUnderstanding.platformTargets.includes('ANDROID'),
  projectUnderstanding.platformTargets.join(', '),
);
assert(
  'F confidence bounded',
  projectUnderstanding.confidenceScore >= 0 && projectUnderstanding.confidenceScore <= 100,
  String(projectUnderstanding.confidenceScore),
);

const clarifyingQuestions = buildClarifyingQuestions({
  requirements,
  platformTargets: projectUnderstanding.platformTargets.filter((p) => p !== 'UNKNOWN'),
  ...missing,
});
assert('G clarifying questions generated', clarifyingQuestions.length >= 1, `${clarifyingQuestions.length}`);
assert('G high priority questions', clarifyingQuestions.some((q) => q.priority === 'HIGH'), 'yes');

const analysis = analyzeVoiceNotes({
  content: wavBuffer,
  filename: 'founder-note.wav',
  mimeType: 'audio/wav',
});
assert('H full analysis produced', analysis != null, String(analysis != null));
assert('H project understanding summary', analysis != null && analysis.projectUnderstanding.featureInventory.length >= 3, String(analysis?.projectUnderstanding.featureInventory.length));

const mp3Rejected = analyzeVoiceNotes({
  content: Buffer.from([0xff, 0xfb, 0x90, 0x00]),
  filename: 'empty.mp3',
  mimeType: 'audio/mpeg',
});
assert('I MP3 without transcript rejected', mp3Rejected == null, 'null');

resetVoiceNotesHistoryForTests();
for (let i = 0; i < MAX_VOICE_NOTES_HISTORY + 4; i += 1) {
  analyzeVoiceNotes({
    content: wavBuffer,
    filename: `note-${i}.wav`,
    mimeType: 'audio/wav',
  });
}
assert(
  'J history bounded',
  getVoiceNotesHistorySize() <= MAX_VOICE_NOTES_HISTORY,
  `${getVoiceNotesHistorySize()}/${MAX_VOICE_NOTES_HISTORY}`,
);

const assessment = assessVoiceNotesIntelligence({
  content: wavBuffer,
  filename: 'assessment.wav',
  mimeType: 'audio/wav',
  skipHistoryRecording: true,
});
assert('K advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert('K orchestration complete', assessment.orchestrationState === 'VOICE_NOTES_INTELLIGENCE_COMPLETE', assessment.orchestrationState);

const artifacts = buildVoiceNotesIntelligenceArtifacts({
  analyses: analysis ? [analysis] : [],
});
assert('L report markdown', artifacts.markdown.includes('Voice Notes Intelligence Report'), 'yes');
assert('L clarifying questions in report', artifacts.markdown.includes('Clarifying Questions'), 'yes');
assert('L transcript in report', artifacts.markdown.includes('VOICE_TRANSCRIPT') || artifacts.markdown.includes(FULL_TRANSCRIPT.slice(0, 20)), 'yes');

writeFileSync(join(ROOT, 'architecture/VOICE_NOTES_INTELLIGENCE_REPORT.md'), artifacts.markdown, 'utf8');
assert('L report written', existsSync(join(ROOT, 'architecture/VOICE_NOTES_INTELLIGENCE_REPORT.md')), 'yes');

const authoritySource = readFileSync(
  join(ROOT, 'src/voice-notes-intelligence/voice-notes-intelligence-authority.ts'),
  'utf8',
);
const registrySource = readFileSync(join(ROOT, 'src/voice-notes-intelligence/voice-notes-registry.ts'), 'utf8');
assert(
  'M read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_PROJECT_MODIFICATION') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('M advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/VOICE_NOTES_INTELLIGENCE_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(VOICE_NOTES_INTELLIGENCE_PASS_TOKEN), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('N no validator recursion marker', !authoritySource.includes('validate-voice-notes-intelligence'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Voice Notes Intelligence V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getVoiceNotesHistorySize()}`);
  console.log(`Report path: architecture/VOICE_NOTES_INTELLIGENCE_REPORT.md`);
  console.log(`\n${VOICE_NOTES_INTELLIGENCE_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
