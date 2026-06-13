/**
 * Phase 26.34 — Multi-Source Intake Alignment Repair V1 validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MULTI_SOURCE_INTAKE_ALIGNMENT_REPAIR_V1_PASS,
  MAX_INTAKE_ALIGNMENT_HISTORY,
  ALIGNMENT_CATEGORIES,
  CONFLICT_CLASSIFICATIONS,
  SAFETY_GUARANTEES,
  assessIntakeAlignment,
  applyAlignmentRepairToUnifiedIntake,
  buildIntakeAlignmentReport,
  buildIntakeAlignmentReportMarkdown,
  computeSimulationAlignmentImpact,
  getIntakeAlignmentHistorySize,
  resetIntakeAlignmentEngineModuleForTests,
  resetIntakeAlignmentHistoryForTests,
  runIntakeAlignmentEngine,
} from '../src/intake-alignment-engine/index.js';
import {
  resetFounderSimulationEngineModuleForTests,
  simulateFounderJourney,
  getFounderSimulationScenarioByType,
} from '../src/founder-simulation-engine/index.js';
import type { UnifiedIntakeAnalysis, EvidenceConflict } from '../src/unified-intake-intelligence/unified-intake-types.js';
import type { VoiceNotesAnalysis } from '../src/voice-notes-intelligence/voice-notes-types.js';
import type { VisualReferenceAnalysis } from '../src/visual-reference-intelligence/visual-reference-types.js';

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
  'src/intake-alignment-engine/intake-alignment-types.ts',
  'src/intake-alignment-engine/intake-alignment-registry.ts',
  'src/intake-alignment-engine/evidence-normalizer.ts',
  'src/intake-alignment-engine/cross-source-entity-matcher.ts',
  'src/intake-alignment-engine/semantic-agreement-detector.ts',
  'src/intake-alignment-engine/platform-alignment-analyzer.ts',
  'src/intake-alignment-engine/workflow-alignment-analyzer.ts',
  'src/intake-alignment-engine/role-alignment-analyzer.ts',
  'src/intake-alignment-engine/alignment-confidence-engine.ts',
  'src/intake-alignment-engine/alignment-history.ts',
  'src/intake-alignment-engine/alignment-report-builder.ts',
  'src/intake-alignment-engine/intake-alignment-authority.ts',
  'src/intake-alignment-engine/simulation-alignment-impact.ts',
  'src/intake-alignment-engine/index.ts',
  'architecture/MULTI_SOURCE_INTAKE_ALIGNMENT_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

function buildRideSharingFalseConflictFixture(): {
  intake: UnifiedIntakeAnalysis;
  voice: VoiceNotesAnalysis;
  visual: VisualReferenceAnalysis;
} {
  const conflicts: EvidenceConflict[] = [
    {
      readOnly: true,
      conflictType: 'PLATFORM_CONFLICT',
      description: 'Typed prompt mentions web while voice and visual target mobile',
      conflictingEvidence: ['TYPED_PROMPT:WEB', 'VOICE_NOTES:MOBILE', 'VISUAL:MOBILE'],
      confidence: 72,
      recommendedClarification: 'Clarify primary platform',
    },
    {
      readOnly: true,
      conflictType: 'USER_ROLE_CONFLICT',
      description: 'Typed mentions rider while voice mentions driver',
      conflictingEvidence: ['TYPED_PROMPT:rider', 'VOICE_NOTES:driver'],
      confidence: 68,
      recommendedClarification: 'Clarify user roles',
    },
  ];

  const intake: UnifiedIntakeAnalysis = {
    readOnly: true,
    analysisId: 'unified-ride-sharing-fixture',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
      typedPromptExcerpt: 'Uber-style ride sharing app for iOS and Android',
      platforms: ['IOS', 'ANDROID', 'WEB'],
      screens: ['ride request', 'tracking', 'onboarding'],
      workflows: ['onboarding', 'ride request', 'tracking', 'payments'],
      userRoles: ['rider'],
      integrations: ['Stripe'],
      notifications: ['push notification'],
      authentication: ['OAuth'],
      dataEntities: ['user', 'ride'],
      businessRules: ['Drivers must complete onboarding'],
      visualComponents: ['BOTTOM_NAVIGATION_DETECTED'],
      inferredFlows: ['RIDE_REQUEST', 'TRACKING'],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 3,
      evidenceItemCount: 18,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'MOBILE_APP',
      platformTargets: ['IOS', 'ANDROID'],
      primaryPurpose: 'Ride sharing marketplace',
      targetUsers: ['drivers', 'riders'],
      businessObjective: 'Transportation marketplace revenue',
      confidence: 58,
      evidence: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'MOBILE_APP',
      platforms: ['IOS', 'ANDROID'],
      workflows: ['onboarding', 'ride request', 'tracking', 'payments'],
      screens: ['ride request', 'tracking', 'onboarding'],
      userRoles: ['rider'],
      entities: ['user', 'ride'],
      integrations: ['Stripe'],
      businessRules: ['Drivers must complete onboarding'],
      confidence: 58,
      evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE', 'VISUAL_REFERENCE_INTELLIGENCE'],
    },
    evidenceConflicts: conflicts,
    intakeGaps: [],
    unifiedIntakeConfidence: 52,
    intakeReadinessScore: 55,
    intakeReadinessCategory: 'PARTIAL_UNDERSTANDING',
    intakeReadiness: 'PARTIAL_UNDERSTANDING',
    intakeRecommendations: [],
  };

  const voice = {
    readOnly: true,
    analysisId: 'voice-ride-fixture',
    uploadId: null,
    filename: 'ride-sharing.wav',
    analyzedAt: new Date().toISOString(),
    audioMetadata: {
      readOnly: true,
      format: 'WAV' as const,
      durationSeconds: 30,
      byteLength: 1200,
      sampleRate: 44100,
      channels: 1,
    },
    transcript: {
      readOnly: true,
      transcriptText:
        'Drivers and riders connect through a mobile app with ride requests, tracking, and payments.',
      confidence: 88,
      durationSeconds: 30,
      wordCount: 14,
      evidence: ['VOICE_TRANSCRIPT'],
    },
    intents: {
      readOnly: true,
      primaryIntent: 'BUILD_REQUEST' as const,
      detectedIntents: [],
    },
    requirements: {
      readOnly: true,
      screens: ['ride request', 'tracking'],
      userRoles: ['driver', 'rider'],
      workflows: ['ride request', 'tracking', 'payments'],
      integrations: ['Stripe'],
      notifications: [],
      authentication: [],
      dataEntities: ['ride', 'driver'],
      businessRules: ['Drivers must accept ride requests'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'MOBILE_APP' as const,
      platformTargets: ['IOS', 'ANDROID'] as const,
      keyWorkflows: ['ride request', 'tracking'],
      featureInventory: ['payments'],
      confidenceScore: 85,
    },
    missingRequirements: {
      readOnly: true,
      missingScreens: [],
      missingFlows: [],
      missingBusinessLogic: [],
      unclearRequirements: [],
    },
    clarifyingQuestions: [],
  } as unknown as VoiceNotesAnalysis;

  const visual = {
    readOnly: true,
    analysisId: 'visual-ride-fixture',
    uploadId: null,
    filename: 'ride-sharing.png',
    analyzedAt: new Date().toISOString(),
    imageMetadata: {
      readOnly: true,
      format: 'PNG' as const,
      width: 390,
      height: 844,
      aspectRatio: 0.46,
      byteLength: 24000,
    },
    screenDetection: {
      readOnly: true,
      screenCountEstimate: 1,
      screenType: 'APP' as const,
      platform: 'MOBILE' as const,
      classification: 'APP' as const,
      evidence: ['MOBILE_UI_DETECTED'],
    },
    layoutRegions: [],
    detectedComponents: [],
    inferredFlows: [
      {
        readOnly: true,
        flow: 'CHECKOUT' as const,
        confidence: 70,
        evidence: ['CTA_BUTTON'],
      },
    ],
    completeness: {
      readOnly: true,
      visualCompletenessScore: 80,
      missingScreens: [],
      incompleteFlows: [],
      navigationGaps: [],
      uxRisks: [],
    },
    confidenceScore: 80,
    recommendations: [],
  } as unknown as VisualReferenceAnalysis;

  return { intake, voice, visual };
}

function buildRealPlatformConflictFixture(): UnifiedIntakeAnalysis {
  return {
    readOnly: true,
    analysisId: 'unified-real-conflict-fixture',
    analyzedAt: new Date().toISOString(),
    evidence: {
      readOnly: true,
      activeSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
      typedPromptExcerpt: 'Web-only dashboard for desktop users in browser only',
      platforms: ['WEB'],
      screens: ['dashboard'],
      workflows: ['onboarding'],
      userRoles: ['admin'],
      integrations: [],
      notifications: [],
      authentication: [],
      dataEntities: ['user'],
      businessRules: [],
      visualComponents: [],
      inferredFlows: [],
      uploadSummary: null,
      founderContext: null,
      sourceCount: 2,
      evidenceItemCount: 8,
    },
    projectIntent: {
      readOnly: true,
      applicationType: 'WEB_APP',
      platformTargets: ['WEB'],
      primaryPurpose: 'Web dashboard',
      targetUsers: ['admins'],
      businessObjective: 'Web analytics',
      confidence: 70,
      evidence: ['TYPED_PROMPT'],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'WEB_APP',
      platforms: ['WEB'],
      workflows: ['onboarding'],
      screens: ['dashboard'],
      userRoles: ['admin'],
      entities: ['user'],
      integrations: [],
      businessRules: [],
      confidence: 70,
      evidenceSources: ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
    },
    evidenceConflicts: [
      {
        readOnly: true,
        conflictType: 'PLATFORM_CONFLICT',
        description: 'Web-only typed vs mobile-only voice',
        conflictingEvidence: ['TYPED_PROMPT:WEB_ONLY', 'VOICE_NOTES:MOBILE_ONLY'],
        confidence: 90,
        recommendedClarification: 'Choose web or mobile',
      },
    ],
    intakeGaps: [],
    unifiedIntakeConfidence: 45,
    intakeReadinessScore: 40,
    intakeReadinessCategory: 'PARTIAL_UNDERSTANDING',
    intakeReadiness: 'PARTIAL_UNDERSTANDING',
    intakeRecommendations: [],
  };
}

resetIntakeAlignmentEngineModuleForTests();
resetIntakeAlignmentHistoryForTests();

const rideFixture = buildRideSharingFalseConflictFixture();
const rideAlignment = assessIntakeAlignment({
  unifiedIntakeAnalysis: rideFixture.intake,
  voiceNotesAnalysis: rideFixture.voice,
  visualReferenceAnalysis: rideFixture.visual,
  typedPrompt: 'Uber-style ride sharing app for iOS and Android with driver and rider roles',
  skipHistoryRecording: true,
});

assert('A ride-sharing alignment produced', rideAlignment != null, rideAlignment?.analysisId ?? 'null');
assert(
  'A semantic agreement detection',
  rideAlignment != null && rideAlignment.semanticAgreements.length >= 2,
  `${rideAlignment?.semanticAgreements.length ?? 0}`,
);
assert(
  'A role alignment high',
  rideAlignment != null && rideAlignment.roleAlignment.highRoleAlignment === true,
  String(rideAlignment?.roleAlignment.highRoleAlignment),
);
assert(
  'A workflow alignment strong',
  rideAlignment != null && rideAlignment.workflowAlignment.workflowAlignmentScore >= 65,
  String(rideAlignment?.workflowAlignment.workflowAlignmentScore),
);
assert(
  'A platform alignment no true conflict',
  rideAlignment != null && rideAlignment.platformAlignment.truePlatformConflict === false,
  String(rideAlignment?.platformAlignment.truePlatformConflict),
);
assert(
  'A alignment score high',
  rideAlignment != null && rideAlignment.alignmentScore >= 70,
  String(rideAlignment?.alignmentScore),
);
assert(
  'A alignment category high or strong',
  rideAlignment != null &&
    (rideAlignment.alignmentCategory === 'HIGH_ALIGNMENT' ||
      rideAlignment.alignmentCategory === 'STRONG_ALIGNMENT'),
  rideAlignment?.alignmentCategory ?? 'none',
);
assert(
  'B false conflict classification',
  rideAlignment != null && rideAlignment.falseConflictCount >= 1,
  `${rideAlignment?.falseConflictCount ?? 0} false, ${rideAlignment?.realConflictCount ?? 0} real`,
);
assert(
  'B platform conflict classified false',
  rideAlignment != null &&
    rideAlignment.classifiedConflicts.some(
      (c) => c.originalConflict.conflictType === 'PLATFORM_CONFLICT' && c.classification === 'FALSE_CONFLICT',
    ),
  rideAlignment?.classifiedConflicts.map((c) => `${c.originalConflict.conflictType}:${c.classification}`).join(', ') ?? 'none',
);

const realConflictIntake = buildRealPlatformConflictFixture();
const realAlignment = assessIntakeAlignment({
  unifiedIntakeAnalysis: realConflictIntake,
  typedPrompt: 'Web-only dashboard for desktop users in browser only',
  voiceNotesAnalysis: {
    readOnly: true,
    analysisId: 'voice-mobile-only',
    uploadId: null,
    filename: 'mobile-only.wav',
    analyzedAt: new Date().toISOString(),
    audioMetadata: {
      readOnly: true,
      format: 'WAV' as const,
      durationSeconds: 12,
      byteLength: 800,
      sampleRate: 44100,
      channels: 1,
    },
    transcript: {
      readOnly: true,
      transcriptText: 'Mobile-only iOS and Android app',
      confidence: 80,
      durationSeconds: 12,
      wordCount: 5,
      evidence: ['VOICE_TRANSCRIPT'],
    },
    intents: { readOnly: true, primaryIntent: 'BUILD_REQUEST' as const, detectedIntents: [] },
    requirements: {
      readOnly: true,
      screens: ['dashboard'],
      userRoles: ['user'],
      workflows: ['onboarding'],
      integrations: [],
      notifications: [],
      authentication: [],
      dataEntities: [],
      businessRules: [],
    },
    projectUnderstanding: {
      readOnly: true,
      productType: 'MOBILE_APP' as const,
      platformTargets: ['IOS', 'ANDROID'] as const,
      keyWorkflows: ['onboarding'],
      featureInventory: ['dashboard'],
      confidenceScore: 80,
    },
    missingRequirements: {
      readOnly: true,
      missingScreens: [],
      missingFlows: [],
      missingBusinessLogic: [],
      unclearRequirements: [],
    },
    clarifyingQuestions: [],
  } as unknown as VoiceNotesAnalysis,
  skipHistoryRecording: true,
});

assert('C real conflict alignment produced', realAlignment != null, 'null');
assert(
  'C real platform conflict retained',
  realAlignment != null && realAlignment.realConflictCount >= 1,
  `${realAlignment?.realConflictCount ?? 0}`,
);
assert(
  'C true platform conflict flagged',
  realAlignment != null && realAlignment.platformAlignment.truePlatformConflict === true,
  String(realAlignment?.platformAlignment.truePlatformConflict),
);

assert(
  'D confidence repair increases when justified',
  rideAlignment != null && rideAlignment.alignedConfidence > rideFixture.intake.unifiedIntakeConfidence,
  `${rideFixture.intake.unifiedIntakeConfidence} -> ${rideAlignment?.alignedConfidence ?? 0}`,
);

if (rideAlignment) {
  const repaired = applyAlignmentRepairToUnifiedIntake(rideFixture.intake, rideAlignment);
  assert(
    'D repaired intake fewer conflicts',
    repaired.evidenceConflicts.length < rideFixture.intake.evidenceConflicts.length,
    `${rideFixture.intake.evidenceConflicts.length} -> ${repaired.evidenceConflicts.length}`,
  );
  assert(
    'D repaired confidence matches aligned confidence',
    repaired.unifiedIntakeConfidence === rideAlignment.alignedConfidence,
    String(repaired.unifiedIntakeConfidence),
  );
}

const engineRun = runIntakeAlignmentEngine({
  unifiedIntakeAnalysis: rideFixture.intake,
  voiceNotesAnalysis: rideFixture.voice,
  visualReferenceAnalysis: rideFixture.visual,
  typedPrompt: 'Uber-style ride sharing app',
  skipHistoryRecording: false,
});
assert('E engine complete', engineRun.orchestrationState === 'INTAKE_ALIGNMENT_ENGINE_COMPLETE', engineRun.orchestrationState);
assert('E advisory only', engineRun.advisoryOnly === true, String(engineRun.advisoryOnly));

for (let i = 0; i < MAX_INTAKE_ALIGNMENT_HISTORY + 6; i += 1) {
  assessIntakeAlignment({
    unifiedIntakeAnalysis: rideFixture.intake,
    typedPrompt: `fixture-${i}`,
    skipHistoryRecording: false,
  });
}
assert(
  'F history bounded',
  getIntakeAlignmentHistorySize() <= MAX_INTAKE_ALIGNMENT_HISTORY,
  `${getIntakeAlignmentHistorySize()}/${MAX_INTAKE_ALIGNMENT_HISTORY}`,
);

const simulationImpact = computeSimulationAlignmentImpact({
  scenarioType: 'MOBILE_FIRST',
  unifiedIntakeAnalysis: rideFixture.intake,
  voiceNotesAnalysis: rideFixture.voice,
  visualReferenceAnalysis: rideFixture.visual,
  typedPrompt: 'Uber-style ride sharing app',
});
assert(
  'G simulation impact readiness improves',
  simulationImpact.readinessAfterRepair >= simulationImpact.readinessBeforeRepair,
  `${simulationImpact.readinessBeforeRepair} -> ${simulationImpact.readinessAfterRepair}`,
);
assert(
  'G simulation impact confidence improves',
  simulationImpact.confidenceAfterRepair >= simulationImpact.confidenceBeforeRepair,
  `${simulationImpact.confidenceBeforeRepair} -> ${simulationImpact.confidenceAfterRepair}`,
);
assert('G simulation impact false conflicts repaired', simulationImpact.falseConflictsRepaired >= 1, String(simulationImpact.falseConflictsRepaired));

resetFounderSimulationEngineModuleForTests();
const mobileScenario = getFounderSimulationScenarioByType('MOBILE_FIRST');
assert('H mobile scenario exists', mobileScenario != null, 'missing');
const mobileJourney = mobileScenario
  ? simulateFounderJourney({ scenario: mobileScenario, applyAlignmentRepair: true })
  : null;
assert('H mobile journey simulated', mobileJourney != null, 'null');
assert(
  'H mobile journey alignment impact present',
  mobileJourney?.alignmentImpact != null,
  mobileJourney?.alignmentImpact ? 'yes' : 'no',
);
assert(
  'H mobile scenario typed prompt ride sharing',
  mobileScenario != null && /ride.?shar|uber/i.test(mobileScenario.typedPrompt),
  mobileScenario?.typedPrompt.slice(0, 40) ?? 'none',
);

const report = buildIntakeAlignmentReport({
  analyses: rideAlignment ? [rideAlignment] : [],
  history: getIntakeAlignmentHistorySize() > 0 ? [{ analysisId: rideAlignment?.analysisId ?? 'x', timestamp: new Date().toISOString(), alignmentScore: rideAlignment?.alignmentScore ?? 0, alignmentCategory: rideAlignment?.alignmentCategory ?? 'CONFLICTED', alignedConfidence: rideAlignment?.alignedConfidence ?? 0, falseConflictCount: rideAlignment?.falseConflictCount ?? 0 }] : [],
});
const markdown = buildIntakeAlignmentReportMarkdown(report, rideAlignment ? [rideAlignment] : []);
assert('I report markdown title', markdown.includes('Multi-Source Intake Alignment Report'), 'yes');
assert('I alignment findings', markdown.includes('Alignment Findings'), 'yes');
assert('I false conflicts section', markdown.includes('False conflicts repaired'), 'yes');
assert('I recommendations section', markdown.includes('Recommendations'), 'yes');

writeFileSync(join(ROOT, 'architecture/MULTI_SOURCE_INTAKE_ALIGNMENT_REPORT.md'), markdown, 'utf8');
assert('I report written', existsSync(join(ROOT, 'architecture/MULTI_SOURCE_INTAKE_ALIGNMENT_REPORT.md')), 'yes');

const authoritySource = readFileSync(join(ROOT, 'src/intake-alignment-engine/intake-alignment-authority.ts'), 'utf8');
const registrySource = readFileSync(join(ROOT, 'src/intake-alignment-engine/intake-alignment-registry.ts'), 'utf8');
assert(
  'J read-only safeguards',
  registrySource.includes('NO_CODE_GENERATION') &&
    registrySource.includes('NO_PROJECT_MODIFICATION') &&
    registrySource.includes('NO_FAKE_CONFIDENCE_INFLATION') &&
    SAFETY_GUARANTEES.length >= 5 &&
    !authoritySource.includes('writeFileSync') &&
    !authoritySource.includes('generateCode'),
  'yes',
);
assert('J alignment categories defined', ALIGNMENT_CATEGORIES.length === 4, String(ALIGNMENT_CATEGORIES.length));
assert('J conflict classifications defined', CONFLICT_CLASSIFICATIONS.length === 2, String(CONFLICT_CLASSIFICATIONS.length));

const arch = readFileSync(join(ROOT, 'architecture/MULTI_SOURCE_INTAKE_ALIGNMENT_REPORT.md'), 'utf8');
assert('J pass token in report', arch.includes(MULTI_SOURCE_INTAKE_ALIGNMENT_REPAIR_V1_PASS), 'yes');

const authorityHash = createHash('sha256').update(authoritySource).digest('hex').slice(0, 12);
assert('K no validator recursion marker', !authoritySource.includes('validate-intake-alignment-engine'), authorityHash);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Multi-Source Intake Alignment Repair V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nRide-sharing alignment score: ${rideAlignment?.alignmentScore ?? 0}/100`);
  console.log(`Ride-sharing aligned confidence: ${rideAlignment?.alignedConfidence ?? 0}/100`);
  console.log(`False conflicts repaired: ${rideAlignment?.falseConflictCount ?? 0}`);
  console.log(`Simulation impact: readiness ${simulationImpact.readinessBeforeRepair} -> ${simulationImpact.readinessAfterRepair}`);
  console.log(`Simulation impact: confidence ${simulationImpact.confidenceBeforeRepair} -> ${simulationImpact.confidenceAfterRepair}`);
  console.log(`Mobile journey readiness: ${mobileJourney?.readinessScore ?? 0}/100`);
  console.log(`History size: ${getIntakeAlignmentHistorySize()}/${MAX_INTAKE_ALIGNMENT_HISTORY}`);
  console.log(`Report path: architecture/MULTI_SOURCE_INTAKE_ALIGNMENT_REPORT.md`);
  console.log(`\n${MULTI_SOURCE_INTAKE_ALIGNMENT_REPAIR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
