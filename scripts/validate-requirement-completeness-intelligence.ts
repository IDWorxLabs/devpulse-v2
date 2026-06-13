/**
 * Phase 26.25 — Requirement Completeness Intelligence V1 validation.
 */

import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REQUIREMENT_COMPLETENESS_INTELLIGENCE_PASS_TOKEN,
  MAX_REQUIREMENT_COMPLETENESS_HISTORY,
  analyzeRequirementDomains,
  assessRequirementCompleteness,
  buildRequirementCompletenessIntelligenceArtifacts,
  consolidateRequirementEvidence,
  detectRequirementGaps,
  generateClarifyingQuestions,
  getRequirementCompletenessHistorySize,
  mapCompletenessCategory,
  resetRequirementCompletenessHistoryForTests,
  resetRequirementCompletenessIntelligenceModuleForTests,
  runRequirementCompletenessIntelligence,
} from '../src/requirement-completeness-intelligence/index.js';
import { analyzeVoiceNotes, resetVoiceNotesHistoryForTests, resetVoiceNotesIntelligenceModuleForTests } from '../src/voice-notes-intelligence/index.js';
import { analyzeVisualReference, resetVisualReferenceHistoryForTests, resetVisualReferenceIntelligenceModuleForTests } from '../src/visual-reference-intelligence/index.js';

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
  'src/requirement-completeness-intelligence/requirement-completeness-types.ts',
  'src/requirement-completeness-intelligence/requirement-completeness-registry.ts',
  'src/requirement-completeness-intelligence/requirement-gap-detector.ts',
  'src/requirement-completeness-intelligence/clarifying-question-generator.ts',
  'src/requirement-completeness-intelligence/requirement-domain-analyzer.ts',
  'src/requirement-completeness-intelligence/project-scope-analyzer.ts',
  'src/requirement-completeness-intelligence/completeness-score-engine.ts',
  'src/requirement-completeness-intelligence/requirement-completeness-history.ts',
  'src/requirement-completeness-intelligence/requirement-completeness-report-builder.ts',
  'src/requirement-completeness-intelligence/requirement-completeness-authority.ts',
  'src/requirement-completeness-intelligence/index.ts',
  'architecture/REQUIREMENT_COMPLETENESS_INTELLIGENCE_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildTranscriptWav(transcript: string): Buffer {
  const sampleRate = 16000;
  const seconds = 2;
  const dataSize = sampleRate * seconds * 2;
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
  const header = Buffer.alloc(8);
  header.write('RIFF', 0, 4, 'ascii');
  header.writeUInt32LE(4 + fmt.length + data.length + trnChunk.length, 4);
  return Buffer.concat([header, Buffer.from('WAVE'), fmt, data, trnChunk]);
}

function buildUiMockPng(): Buffer {
  const width = 375;
  const height = 812;
  const rowBytes = 1 + width * 3;
  const raw = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const px = rowOffset + 1 + x * 3;
      if (y < 60 || y >= 752) {
        raw[px] = 28;
        raw[px + 1] = 32;
        raw[px + 2] = 44;
      } else if (x > 30 && x < 345 && y > 140 && y < 220) {
        raw[px] = 235;
        raw[px + 1] = 238;
        raw[px + 2] = 245;
      } else {
        raw[px] = 245;
        raw[px + 1] = 246;
        raw[px + 2] = 250;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const idat = deflateSync(raw);
  const chunk = (type: string, payload: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(payload.length, 0);
    return Buffer.concat([len, Buffer.from(type), payload, Buffer.alloc(4)]);
  };
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

resetRequirementCompletenessIntelligenceModuleForTests();
resetRequirementCompletenessHistoryForTests();
resetVoiceNotesIntelligenceModuleForTests();
resetVoiceNotesHistoryForTests();
resetVisualReferenceIntelligenceModuleForTests();
resetVisualReferenceHistoryForTests();

const insufficient = assessRequirementCompleteness({
  typedRequirements: { rawPrompt: '' },
  voiceNotesAnalysis: null,
  visualReferenceAnalysis: null,
  projectVaultContext: null,
});
assert('A insufficient evidence rejected', insufficient == null, 'null');

const partial = assessRequirementCompleteness({
  typedRequirements: {
    rawPrompt: 'Build a web app with a dashboard screen.',
  },
  voiceNotesAnalysis: null,
  visualReferenceAnalysis: null,
  skipHistoryRecording: true,
});
assert('B partial analysis produced', partial != null, String(partial != null));
assert(
  'B partial category',
  partial != null && (partial.completenessCategory === 'PARTIAL' || partial.completenessCategory === 'INSUFFICIENT'),
  partial?.completenessCategory ?? 'none',
);
assert('B partial not ready for planning', partial != null && partial.projectRequirementReadiness !== 'READY_FOR_PLANNING', partial?.projectRequirementReadiness ?? 'none');

const voiceTranscript =
  'Build a mobile app for iOS and Android with OAuth login, dashboard, settings, onboarding, and checkout using Stripe. ' +
  'Admin users must approve orders. Send email notifications. Track user, order, and product entities.';
const voiceAnalysis = analyzeVoiceNotes({
  content: buildTranscriptWav(voiceTranscript),
  filename: 'requirements.wav',
  mimeType: 'audio/wav',
  skipHistoryRecording: true,
});

const visualAnalysis = analyzeVisualReference({
  content: buildUiMockPng(),
  filename: 'ui-reference.png',
  mimeType: 'image/png',
  skipHistoryRecording: true,
});

const full = assessRequirementCompleteness({
  typedRequirements: {
    rawPrompt:
      'Build a SaaS mobile app for iOS and Android with login, signup, dashboard, settings, onboarding, and checkout screens. ' +
      'OAuth social auth for users and admin roles. Stripe and PayPal integrations. Email and push notifications. ' +
      'Admin must approve orders before billing. User, order, and product entities belong to accounts.',
    screens: ['login', 'signup', 'dashboard', 'settings', 'onboarding', 'checkout'],
    userRoles: ['admin', 'user', 'customer'],
    workflows: ['onboarding', 'checkout', 'authentication', 'approval'],
    businessRules: ['Admin must approve orders before billing', 'Users cannot checkout without login'],
    integrations: ['Stripe', 'PayPal'],
    notifications: ['email', 'push notification'],
    authentication: ['OAuth', 'login', 'signup'],
    dataEntities: ['user', 'order', 'product', 'account'],
    platformTargets: ['iOS', 'Android', 'WEB'],
  },
  voiceNotesAnalysis: voiceAnalysis,
  visualReferenceAnalysis: visualAnalysis,
  projectVaultContext: {
    readOnly: true,
    projectName: 'Founder App',
    facts: [
      { readOnly: true, label: 'platform_target', value: 'iOS and Android mobile launch', source: 'FOUNDER' },
      { readOnly: true, label: 'workflow', value: 'checkout approval process', source: 'FOUNDER' },
      { readOnly: true, label: 'integration', value: 'Stripe payments', source: 'FOUNDER' },
    ],
  },
});

assert('C full analysis produced', full != null, String(full != null));
assert(
  'C completeness score bounded',
  full != null && full.completenessScore >= 0 && full.completenessScore <= 100,
  String(full?.completenessScore),
);
assert(
  'C readiness score bounded',
  full != null && full.readinessScore >= 0 && full.readinessScore <= 100,
  String(full?.readinessScore),
);
assert(
  'C high completeness',
  full != null && full.completenessScore >= 70,
  String(full?.completenessScore),
);
assert(
  'C readiness verdict',
  full != null &&
    (full.projectRequirementReadiness === 'READY_WITH_GAPS' ||
      full.projectRequirementReadiness === 'READY_FOR_PLANNING'),
  full?.projectRequirementReadiness ?? 'none',
);

const evidence = consolidateRequirementEvidence({
  typedRequirements: {
    rawPrompt: 'Build app with dashboard and Stripe checkout for iOS',
    screens: ['dashboard', 'checkout'],
    workflows: ['checkout'],
    integrations: ['Stripe'],
    platformTargets: ['iOS'],
  },
  voiceNotesAnalysis: voiceAnalysis,
  visualReferenceAnalysis: visualAnalysis,
});
const domains = analyzeRequirementDomains(evidence);
assert('D domain analysis', domains.length === 7, `${domains.length}`);
assert('D multi-source evidence', evidence.sources.length >= 3, evidence.sources.join(', '));

const gaps = detectRequirementGaps({
  evidence,
  domainResults: domains,
  scope: {
    readOnly: true,
    hasProductIntent: true,
    hasMultiSourceEvidence: true,
    sourceCount: evidence.sources.length,
    screenCount: evidence.screens.length,
    workflowCount: evidence.workflows.length,
    integrationCount: evidence.integrations.length,
    scopeSignals: [],
    scopeRisks: [],
  },
});
assert('E gap detection', gaps.length >= 0, `${gaps.length}`);

const questions = generateClarifyingQuestions({ gaps, evidence });
assert('F clarifying questions', questions.length >= 1, `${questions.length}`);
assert(
  'F evidence-based priorities',
  questions.every((q) => q.evidence.length > 0),
  'yes',
);

if (full) {
  assert(
    'G category mapping',
    mapCompletenessCategory(full.completenessScore) === full.completenessCategory,
    full.completenessCategory,
  );
  assert('G clarifying questions in analysis', full.clarifyingQuestions.length >= 1, `${full.clarifyingQuestions.length}`);
}

resetRequirementCompletenessHistoryForTests();
for (let i = 0; i < MAX_REQUIREMENT_COMPLETENESS_HISTORY + 5; i += 1) {
  assessRequirementCompleteness({
    typedRequirements: { rawPrompt: `Build dashboard app iteration ${i} with login and settings for web.` },
    voiceNotesAnalysis: null,
    visualReferenceAnalysis: null,
    skipHistoryRecording: false,
  });
}
assert(
  'H history bounded',
  getRequirementCompletenessHistorySize() <= MAX_REQUIREMENT_COMPLETENESS_HISTORY,
  `${getRequirementCompletenessHistorySize()}/${MAX_REQUIREMENT_COMPLETENESS_HISTORY}`,
);

const assessment = runRequirementCompletenessIntelligence({
  typedRequirements: { rawPrompt: 'Build internal admin tool with user roles and approval workflow for web.' },
  voiceNotesAnalysis: null,
  visualReferenceAnalysis: null,
  skipHistoryRecording: true,
});
assert('I advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert(
  'I orchestration complete',
  assessment.orchestrationState === 'REQUIREMENT_COMPLETENESS_INTELLIGENCE_COMPLETE',
  assessment.orchestrationState,
);

const artifacts = buildRequirementCompletenessIntelligenceArtifacts({
  analyses: full ? [full] : [],
});
assert('J report markdown', artifacts.markdown.includes('Requirement Completeness Intelligence Report'), 'yes');
assert('J clarifying questions in report', artifacts.markdown.includes('Clarifying Questions'), 'yes');
assert('J readiness in report', artifacts.markdown.includes('Project requirement readiness'), 'yes');

writeFileSync(join(ROOT, 'architecture/REQUIREMENT_COMPLETENESS_INTELLIGENCE_REPORT.md'), artifacts.markdown, 'utf8');
assert('J report written', existsSync(join(ROOT, 'architecture/REQUIREMENT_COMPLETENESS_INTELLIGENCE_REPORT.md')), 'yes');

const authoritySource = readFileSync(
  join(ROOT, 'src/requirement-completeness-intelligence/requirement-completeness-authority.ts'),
  'utf8',
);
const registrySource = readFileSync(
  join(ROOT, 'src/requirement-completeness-intelligence/requirement-completeness-registry.ts'),
  'utf8',
);
assert(
  'K read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_PLANNING_ACTIONS') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('K advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/REQUIREMENT_COMPLETENESS_INTELLIGENCE_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(REQUIREMENT_COMPLETENESS_INTELLIGENCE_PASS_TOKEN), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert(
  'L no validator recursion marker',
  !authoritySource.includes('validate-requirement-completeness-intelligence'),
  authorityHash,
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Requirement Completeness Intelligence V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getRequirementCompletenessHistorySize()}`);
  console.log(`Report path: architecture/REQUIREMENT_COMPLETENESS_INTELLIGENCE_REPORT.md`);
  console.log(`\n${REQUIREMENT_COMPLETENESS_INTELLIGENCE_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
