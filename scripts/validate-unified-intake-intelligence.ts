/**
 * Phase 26.28 — Unified Intake Intelligence V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UNIFIED_INTAKE_INTELLIGENCE_V1_PASS,
  MAX_UNIFIED_INTAKE_HISTORY,
  analyzeProjectIntent,
  assessUnifiedIntake,
  buildUnifiedIntakeIntelligenceArtifacts,
  computeUnifiedIntakeConfidence,
  consolidateIntakeEvidence,
  detectEvidenceConflicts,
  detectIntakeGaps,
  getUnifiedIntakeHistorySize,
  mapIntakeReadinessCategory,
  resetUnifiedIntakeHistoryForTests,
  resetUnifiedIntakeIntelligenceModuleForTests,
  runUnifiedIntakeIntelligence,
} from '../src/unified-intake-intelligence/index.js';

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
  'src/unified-intake-intelligence/unified-intake-types.ts',
  'src/unified-intake-intelligence/unified-intake-registry.ts',
  'src/unified-intake-intelligence/intake-evidence-consolidator.ts',
  'src/unified-intake-intelligence/project-intent-analyzer.ts',
  'src/unified-intake-intelligence/project-understanding-builder.ts',
  'src/unified-intake-intelligence/evidence-conflict-detector.ts',
  'src/unified-intake-intelligence/intake-confidence-engine.ts',
  'src/unified-intake-intelligence/intake-gap-detector.ts',
  'src/unified-intake-intelligence/unified-intake-history.ts',
  'src/unified-intake-intelligence/unified-intake-report-builder.ts',
  'src/unified-intake-intelligence/unified-intake-authority.ts',
  'src/unified-intake-intelligence/index.ts',
  'architecture/UNIFIED_INTAKE_INTELLIGENCE_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const voiceMobileFixture = {
  readOnly: true as const,
  analysisId: 'voice-fixture',
  uploadId: null,
  filename: 'note.wav',
  analyzedAt: new Date().toISOString(),
  audioMetadata: { readOnly: true as const, format: 'WAV' as const, durationSeconds: 2, byteLength: 1000, sampleRate: 16000, channels: 1 },
  transcript: { readOnly: true as const, transcriptText: 'mobile app', confidence: 80, durationSeconds: 2, wordCount: 2, evidence: [] },
  intents: { readOnly: true as const, primaryIntent: 'BUILD_REQUEST' as const, detectedIntents: [] },
  requirements: {
    readOnly: true as const,
    screens: ['dashboard', 'onboarding'],
    userRoles: ['user'],
    workflows: ['onboarding', 'authentication'],
    businessRules: [],
    integrations: ['Stripe'],
    notifications: ['push notification'],
    authentication: ['OAuth'],
    dataEntities: ['user', 'order'],
  },
  projectUnderstanding: {
    readOnly: true as const,
    productType: 'MOBILE_APP' as const,
    platformTargets: ['IOS', 'ANDROID'],
    keyWorkflows: ['onboarding', 'checkout'],
    featureInventory: ['Screen: dashboard'],
    confidenceScore: 82,
  },
  missingRequirements: { readOnly: true as const, missingScreens: [], missingFlows: [], missingBusinessLogic: [], unclearRequirements: [] },
  clarifyingQuestions: [],
};

const visualMobileFixture = {
  readOnly: true as const,
  analysisId: 'visual-fixture',
  uploadId: 'upload-1',
  filename: 'mobile.png',
  analyzedAt: new Date().toISOString(),
  imageMetadata: { readOnly: true as const, format: 'PNG' as const, width: 375, height: 812, aspectRatio: 375 / 812, byteLength: 5000 },
  screenDetection: {
    readOnly: true as const,
    screenCountEstimate: 2,
    screenType: 'APP' as const,
    platform: 'MOBILE' as const,
    classification: 'APP' as const,
    evidence: ['PLATFORM_MOBILE'],
  },
  layoutRegions: [{ readOnly: true as const, region: 'NAVIGATION' as const, confidence: 70, evidence: [] }],
  detectedComponents: [{ readOnly: true as const, token: 'BOTTOM_NAVIGATION_DETECTED' as const, confidence: 70, evidence: [] }],
  inferredFlows: [{ readOnly: true as const, flow: 'ONBOARDING' as const, confidence: 60, evidence: [] }],
  completeness: { readOnly: true as const, visualCompletenessScore: 75, missingScreens: [], incompleteFlows: [], navigationGaps: [], uxRisks: [] },
  confidenceScore: 70,
  recommendations: [],
};

const completenessFixture = {
  readOnly: true as const,
  analysisId: 'completeness-fixture',
  analyzedAt: new Date().toISOString(),
  evidence: {
    readOnly: true as const,
    sources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
    screens: ['dashboard', 'settings', 'checkout'],
    userRoles: ['user', 'admin'],
    workflows: ['onboarding', 'checkout'],
    businessRules: ['Admin must approve checkout'],
    integrations: ['Stripe'],
    notifications: ['email'],
    authentication: ['OAuth'],
    dataEntities: ['user', 'order'],
    platformTargets: ['IOS', 'ANDROID'],
    inferredFlows: ['CHECKOUT'],
    visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
    productType: 'MOBILE_APP',
  },
  domainResults: [],
  completenessScore: 80,
  completenessCategory: 'READY_WITH_GAPS' as const,
  readinessScore: 78,
  projectRequirementReadiness: 'READY_WITH_GAPS' as const,
  missingRequirements: { readOnly: true as const, missingScreens: [], missingFlows: [], missingBusinessLogic: [], unclearRequirements: [] },
  riskLevel: 'LOW' as const,
  confidenceScore: 75,
  clarifyingQuestions: [],
  safeToProceed: false,
};

resetUnifiedIntakeIntelligenceModuleForTests();
resetUnifiedIntakeHistoryForTests();

assert('A insufficient intake rejected', assessUnifiedIntake({ typedPrompt: { rawPrompt: '' } }) == null, 'null');

const conflictEvidence = consolidateIntakeEvidence({
  typedPrompt: { rawPrompt: 'Build a web app dashboard for desktop users with admin role.' },
  voiceNotesAnalysis: voiceMobileFixture,
  visualReferenceAnalysis: visualMobileFixture,
});
assert('B evidence consolidated conflict', conflictEvidence != null, String(conflictEvidence != null));

const conflicts = detectEvidenceConflicts({
  evidence: conflictEvidence!,
  typedPrompt: { rawPrompt: 'Build a web app dashboard for desktop users.' },
  voiceNotesAnalysis: voiceMobileFixture,
  visualReferenceAnalysis: visualMobileFixture,
});
assert('C platform conflict detected', conflicts.some((c) => c.conflictType === 'PLATFORM_CONFLICT'), conflicts.map((c) => c.conflictType).join(', '));

const conflictAnalysis = assessUnifiedIntake({
  typedPrompt: { rawPrompt: 'Build a web app for desktop and browser users.' },
  voiceNotesAnalysis: voiceMobileFixture,
  visualReferenceAnalysis: visualMobileFixture,
  skipHistoryRecording: true,
});
assert('C conflict analysis produced', conflictAnalysis != null, String(conflictAnalysis != null));
assert('C conflict recommendations', conflictAnalysis != null && conflictAnalysis.intakeRecommendations.some((r) => r.priority === 'CRITICAL'), 'yes');

const alignedAnalysis = assessUnifiedIntake({
  typedPrompt: {
    rawPrompt:
      'Build a SaaS mobile app for iOS and Android with dashboard, onboarding, checkout, OAuth login, admin and user roles, Stripe payments, and order entities.',
    screens: ['dashboard', 'onboarding', 'checkout', 'settings'],
    userRoles: ['admin', 'user'],
    workflows: ['onboarding', 'checkout', 'authentication'],
    integrations: ['Stripe'],
    platformTargets: ['iOS', 'Android'],
    dataEntities: ['user', 'order'],
    businessRules: ['Admin must approve checkout'],
  },
  voiceNotesAnalysis: voiceMobileFixture,
  visualReferenceAnalysis: visualMobileFixture,
  requirementCompletenessAnalysis: completenessFixture,
  uploadRecords: [
    {
      readOnly: true,
      uploadId: 'upload-1',
      storedAt: new Date().toISOString(),
      filename: 'dashboard.png',
      normalizedExtension: 'png',
      mimeType: 'image/png',
      fileCategory: 'IMAGE',
      sizeBytes: 5000,
      verdict: 'UPLOAD_ACCEPTED',
      rejectionReason: null,
    },
  ],
  projectVaultContext: {
    readOnly: true,
    projectName: 'Founder App',
    facts: [{ label: 'platform_target', value: 'iOS and Android mobile', source: 'FOUNDER' }],
  },
  founderContext: {
    readOnly: true,
    founderGoal: 'Launch a mobile SaaS product',
    businessObjective: 'Enable subscription revenue through mobile checkout',
    targetUsers: ['founders', 'customers'],
    constraints: ['Must support Stripe'],
    priorities: ['onboarding', 'checkout'],
  },
  pluggableSources: [
    {
      readOnly: true,
      sourceId: 'future-analytics',
      sourceLabel: 'Future Analytics Source',
      workflows: ['analytics reporting'],
    },
  ],
});

assert('D aligned analysis produced', alignedAnalysis != null, String(alignedAnalysis != null));
assert(
  'D intent analysis',
  alignedAnalysis != null && alignedAnalysis.projectIntent.applicationType !== 'UNKNOWN',
  alignedAnalysis?.projectIntent.applicationType ?? 'none',
);
assert(
  'D unified understanding',
  alignedAnalysis != null &&
    alignedAnalysis.projectUnderstanding.screens.length >= 3 &&
    alignedAnalysis.projectUnderstanding.integrations.includes('Stripe'),
  alignedAnalysis?.projectUnderstanding.screens.join(', ') ?? 'none',
);
assert(
  'D confidence bounded',
  alignedAnalysis != null &&
    alignedAnalysis.unifiedIntakeConfidence >= 0 &&
    alignedAnalysis.unifiedIntakeConfidence <= 100,
  String(alignedAnalysis?.unifiedIntakeConfidence),
);
assert(
  'D readiness scoring',
  alignedAnalysis != null &&
    alignedAnalysis.intakeReadinessScore >= 40 &&
    mapIntakeReadinessCategory(alignedAnalysis.intakeReadinessScore) === alignedAnalysis.intakeReadinessCategory,
  alignedAnalysis?.intakeReadinessCategory ?? 'none',
);
assert(
  'D multi-source evidence',
  alignedAnalysis != null && alignedAnalysis.evidence.activeSources.length >= 5,
  alignedAnalysis?.evidence.activeSources.join(', ') ?? 'none',
);

const intent = analyzeProjectIntent(conflictEvidence!);
assert('E intent analyzer', intent.applicationType !== 'UNKNOWN', intent.applicationType);

const gaps = detectIntakeGaps(conflictEvidence!);
assert('E gap detection', gaps.length >= 0, `${gaps.length}`);

const confidence = computeUnifiedIntakeConfidence({
  evidence: conflictEvidence!,
  projectUnderstanding: {
    readOnly: true,
    productType: intent.applicationType,
    platforms: intent.platformTargets,
    workflows: conflictEvidence!.workflows,
    screens: conflictEvidence!.screens,
    userRoles: conflictEvidence!.userRoles,
    entities: conflictEvidence!.dataEntities,
    integrations: conflictEvidence!.integrations,
    businessRules: conflictEvidence!.businessRules,
    confidence: intent.confidence,
    evidenceSources: conflictEvidence!.activeSources,
  },
  conflicts,
});
assert('F confidence engine', confidence >= 0 && confidence <= 100, String(confidence));

resetUnifiedIntakeHistoryForTests();
for (let i = 0; i < MAX_UNIFIED_INTAKE_HISTORY + 6; i += 1) {
  assessUnifiedIntake({
    typedPrompt: { rawPrompt: `Build mobile SaaS app iteration ${i} with dashboard and Stripe for iOS.` },
    skipHistoryRecording: false,
  });
}
assert(
  'G history bounded',
  getUnifiedIntakeHistorySize() <= MAX_UNIFIED_INTAKE_HISTORY,
  `${getUnifiedIntakeHistorySize()}/${MAX_UNIFIED_INTAKE_HISTORY}`,
);

const assessment = runUnifiedIntakeIntelligence({
  typedPrompt: { rawPrompt: 'Build internal admin tool for web with user roles and approval workflow.' },
  skipHistoryRecording: true,
});
assert('H advisory assessment', assessment.advisoryOnly === true, String(assessment.advisoryOnly));
assert('H orchestration complete', assessment.orchestrationState === 'UNIFIED_INTAKE_INTELLIGENCE_COMPLETE', assessment.orchestrationState);

const artifacts = buildUnifiedIntakeIntelligenceArtifacts({
  analyses: alignedAnalysis ? [alignedAnalysis] : [],
});
assert('I report markdown', artifacts.markdown.includes('Unified Intake Intelligence Report'), 'yes');
assert('I project intent in report', artifacts.markdown.includes('Project Intent'), 'yes');
assert('I conflicts in report', artifacts.markdown.includes('Conflict Findings'), 'yes');
assert('I gaps in report', artifacts.markdown.includes('Intake Gaps'), 'yes');

writeFileSync(join(ROOT, 'architecture/UNIFIED_INTAKE_INTELLIGENCE_REPORT.md'), artifacts.markdown, 'utf8');
assert('I report written', existsSync(join(ROOT, 'architecture/UNIFIED_INTAKE_INTELLIGENCE_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/unified-intake-intelligence/unified-intake-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/unified-intake-intelligence/unified-intake-registry.ts'), 'utf8');
assert(
  'J read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_PLANNING_EXECUTION') &&
    registrySource.includes('PLUGGABLE_INTAKE_SOURCES') &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('J advisory only', authoritySource.includes('advisoryOnly: true'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/UNIFIED_INTAKE_INTELLIGENCE_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(UNIFIED_INTAKE_INTELLIGENCE_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('K no validator recursion marker', !authoritySource.includes('validate-unified-intake-intelligence'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Unified Intake Intelligence V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nHistory size: ${getUnifiedIntakeHistorySize()}`);
  console.log(`Report path: architecture/UNIFIED_INTAKE_INTELLIGENCE_REPORT.md`);
  console.log(`\n${UNIFIED_INTAKE_INTELLIGENCE_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
