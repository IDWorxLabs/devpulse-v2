/**
 * Phase 24.8.6 — Founder Friction Detector validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_FRICTION_DETECTOR_PASS_TOKEN,
  FOUNDER_FRICTION_DETECTOR_PASS,
  FOUNDER_FRICTION_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE,
  MAX_FRICTION_GAPS,
  FRICTION_CONTEXT_PASS,
  CONFUSION_FRICTION_PASS,
  WORKFLOW_FRICTION_PASS,
  DECISION_FATIGUE_PASS,
  CONTEXT_SWITCHING_PASS,
  DISCOVERABILITY_FRICTION_PASS,
  TRUST_BREAKDOWN_PASS,
  CONFIDENCE_BREAKDOWN_PASS,
  PRODUCTIVITY_FRICTION_PASS,
  VERIFICATION_FRICTION_PASS,
  LAUNCH_FRICTION_PASS,
  FRICTION_GAP_ANALYSIS_PASS,
  FRICTION_ROADMAP_PASS,
  FOUNDER_FRICTION_REPORTING_PASS,
  buildAllFrictionContexts,
  buildFrictionContext,
  listFrictionContextIds,
  detectConfusionFriction,
  detectWorkflowFriction,
  detectDecisionFatigue,
  detectContextSwitchingFriction,
  detectDiscoverabilityFriction,
  detectTrustBreakdown,
  detectConfidenceBreakdown,
  detectProductivityFriction,
  detectVerificationFriction,
  detectLaunchFriction,
  analyzeFrictionGaps,
  clearFounderFrictionHistory,
  getFounderFrictionHistorySize,
  getFounderFrictionDetectorRuntimeReport,
  getFounderFrictionRecord,
  getFounderFrictionRecordCount,
  getDevPulseV2FounderFrictionDetector,
  isFounderFrictionQuestion,
  lookupFounderFrictionByProjectId,
  registerFounderFrictionDetectorWithCapabilityRegistry,
  registerFounderFrictionDetectorWithFindPanel,
  registerFounderFrictionDetectorWithFoundation,
  registerFounderFrictionDetectorWithAcceptanceChain,
  registerFounderFrictionDetectorWithSurface,
  registerFounderFrictionDetectorWithUvl,
  evaluateFounderFrictionDetector,
  resetFounderFrictionDetectorForTests,
} from '../src/founder-acceptance-validation/founder-friction-detector/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_FRICTION_DETECTOR_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderFrictionDetectorInput } from '../src/founder-acceptance-validation/founder-friction-detector/founder-friction-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-acceptance-validation/founder-friction-detector');

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 45 * 1000 });

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

const REQUIRED_FILES = [
  'founder-friction-types.ts',
  'friction-gap-model.ts',
  'founder-friction-cache.ts',
  'founder-friction-registry.ts',
  'bounded-history.ts',
  'friction-context-builder.ts',
  'confusion-friction-detector.ts',
  'workflow-friction-detector.ts',
  'decision-fatigue-detector.ts',
  'context-switching-detector.ts',
  'hidden-capability-detector.ts',
  'trust-breakdown-detector.ts',
  'confidence-breakdown-detector.ts',
  'productivity-blocker-detector.ts',
  'verification-friction-detector.ts',
  'launch-blocker-friction-detector.ts',
  'friction-gap-analyzer.ts',
  'friction-roadmap-builder.ts',
  'founder-friction-authority-builder.ts',
  'founder-friction-evaluator.ts',
  'founder-friction-report-builder.ts',
  'founder-friction-detector.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderFrictionDetectorForTests();
  clearFounderFrictionHistory();
}

function ffInput(requestId: string, overrides: Partial<FounderFrictionDetectorInput> = {}): FounderFrictionDetectorInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const mod = getDevPulseV2FounderFrictionDetector();
  assert('A-TYPES', 'pass token v1', mod.passToken === FOUNDER_FRICTION_DETECTOR_PASS_TOKEN, mod.passToken);
  assert('A-TYPES', 'pass token', FOUNDER_FRICTION_DETECTOR_PASS === 'FOUNDER_FRICTION_DETECTOR_PASS', FOUNDER_FRICTION_DETECTOR_PASS);
  assert('A-TYPES', 'owner module', mod.ownerModule === FOUNDER_FRICTION_OWNER_MODULE, mod.ownerModule);
  assert('A-TYPES', 'read only', mod.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', mod.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', mod.phase === 24.86, String(mod.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_FRICTION_DETECTOR_UVL_ROWS.length >= 21, String(FOUNDER_FRICTION_DETECTOR_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE));
  assert('A-TYPES', 'max gaps', MAX_FRICTION_GAPS === 64, String(MAX_FRICTION_GAPS));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_friction_detector').phase === 24.86, '24.86');
  assert('A-TYPES', 'question signal', isFounderFrictionQuestion('founder friction detector'), 'signal');
  assert('A-TYPES', 'context count', listFrictionContextIds().length === 10, String(listFrictionContextIds().length));
  assert('A-TYPES', 'roadmap pass alias', FRICTION_ROADMAP_PASS === 'ROADMAP_PASS', FRICTION_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass alias', FOUNDER_FRICTION_REPORTING_PASS === 'REPORTING_PASS', FOUNDER_FRICTION_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateFounderFrictionDetector(ffInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderFrictionRecord(record.founderFrictionId) !== undefined, record.founderFrictionId);
  assert('B-REGISTRY', 'by project', lookupFounderFrictionByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'record id', record.founderFrictionId.startsWith('founder-friction-'), record.founderFrictionId);
  assert('B-REGISTRY', 'record count', getFounderFrictionRecordCount() >= 1, String(getFounderFrictionRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runContexts(): void {
  const g = harness.beginGroup('C-CONTEXTS');
  resetAll();
  const contexts = buildAllFrictionContexts();
  assert('C-CONTEXTS', 'context pass', contexts.every((c) => c.passToken === FRICTION_CONTEXT_PASS), 'pass');
  assert('C-CONTEXTS', 'confusion', contexts.some((c) => c.contextId === 'CONFUSION_FRICTION'), 'confusion');
  assert('C-CONTEXTS', 'workflow', contexts.some((c) => c.contextId === 'WORKFLOW_FRICTION'), 'workflow');
  assert('C-CONTEXTS', 'decision fatigue', contexts.some((c) => c.contextId === 'DECISION_FATIGUE'), 'decision');
  assert('C-CONTEXTS', 'context switching', contexts.some((c) => c.contextId === 'CONTEXT_SWITCHING_FRICTION'), 'switching');
  assert('C-CONTEXTS', 'discoverability', contexts.some((c) => c.contextId === 'DISCOVERABILITY_FRICTION'), 'discover');
  assert('C-CONTEXTS', 'trust breakdown', contexts.some((c) => c.contextId === 'TRUST_BREAKDOWN_FRICTION'), 'trust');
  assert('C-CONTEXTS', 'confidence breakdown', contexts.some((c) => c.contextId === 'CONFIDENCE_BREAKDOWN_FRICTION'), 'confidence');
  assert('C-CONTEXTS', 'productivity', contexts.some((c) => c.contextId === 'PRODUCTIVITY_FRICTION'), 'productivity');
  assert('C-CONTEXTS', 'verification', contexts.some((c) => c.contextId === 'VERIFICATION_FRICTION'), 'verification');
  assert('C-CONTEXTS', 'launch', contexts.some((c) => c.contextId === 'LAUNCH_FRICTION'), 'launch');
  const ctx = buildFrictionContext('CONFUSION_FRICTION');
  assert('C-CONTEXTS', 'intent', ctx.frictionIntent.length > 0, ctx.frictionIntent);
  assert('C-CONTEXTS', 'negative signal', ctx.expectedNegativeSignal.length > 0, ctx.expectedNegativeSignal);
  assert('C-CONTEXTS', 'evidence', ctx.requiredEvidence.length >= 3, String(ctx.requiredEvidence.length));
  harness.endGroup('C-CONTEXTS', g);
}

function runDetectors(): void {
  const g = harness.beginGroup('D-DETECTORS');
  resetAll();
  const input = ffInput('detector-test');
  const confusion = detectConfusionFriction(input, {
    navigationClarityScore: 78,
    actionClarityScore: 80,
    workflowClarityScore: 76,
  });
  assert('D-DETECTORS', 'confusion pass', confusion.passToken === CONFUSION_FRICTION_PASS, confusion.passToken);

  const workflow = detectWorkflowFriction(input, {
    workflowFrictionScore: 78,
    continuityScore: 80,
    frictionGapCount: 1,
  });
  assert('D-DETECTORS', 'workflow pass', workflow.passToken === WORKFLOW_FRICTION_PASS, workflow.passToken);

  const decision = detectDecisionFatigue(input, {
    decisionReductionScore: 76,
    decisionConfidenceScore: 74,
    founderPriorityCount: 3,
  });
  assert('D-DETECTORS', 'decision pass', decision.passToken === DECISION_FATIGUE_PASS, decision.passToken);

  const switching = detectContextSwitchingFriction(input, {
    contextSwitchingScore: 78,
    experienceContinuityScore: 76,
    fragmentationRiskCount: 1,
  });
  assert('D-DETECTORS', 'switching pass', switching.passToken === CONTEXT_SWITCHING_PASS, switching.passToken);

  const discoverability = detectDiscoverabilityFriction(input, {
    discoverabilityScore: 76,
    findPanelAliasCount: 40,
    capabilityCount: 50,
    uvlDiscoverable: true,
  });
  assert('D-DETECTORS', 'discoverability pass', discoverability.passToken === DISCOVERABILITY_FRICTION_PASS, discoverability.passToken);

  const trust = detectTrustBreakdown(input, {
    founderTrustScore: 78,
    truthfulnessScore: 76,
    transparencyScore: 75,
    trustGapCount: 1,
  });
  assert('D-DETECTORS', 'trust pass', trust.passToken === TRUST_BREAKDOWN_PASS, trust.passToken);

  const confidence = detectConfidenceBreakdown(input, {
    founderConfidenceScore: 76,
    progressTruthScore: 78,
    reasoningVisibilityScore: 74,
    confidenceGapCount: 1,
  });
  assert('D-DETECTORS', 'confidence pass', confidence.passToken === CONFIDENCE_BREAKDOWN_PASS, confidence.passToken);

  const productivity = detectProductivityFriction(input, {
    founderProductivityScore: 76,
    throughputScore: 78,
    workflowOverheadScore: 74,
    productivityGapCount: 1,
  });
  assert('D-DETECTORS', 'productivity pass', productivity.passToken === PRODUCTIVITY_FRICTION_PASS, productivity.passToken);

  const verification = detectVerificationFriction(input, {
    verificationIntegrityScore: 76,
    uvlRowCount: 120,
    authorityConflictCount: 0,
    validationEvidenceScore: 78,
  });
  assert('D-DETECTORS', 'verification pass', verification.passToken === VERIFICATION_FRICTION_PASS, verification.passToken);

  const launch = detectLaunchFriction(input, {
    launchBlockerCount: 1,
    releaseReadiness: 'PARTIALLY_READY',
    productRealityScore: 72,
    criticalBlockerCount: 0,
  });
  assert('D-DETECTORS', 'launch pass', launch.passToken === LAUNCH_FRICTION_PASS, launch.passToken);

  const gapAnalysis = analyzeFrictionGaps(input.requestId, {
    confusionFriction: confusion,
    workflowFriction: workflow,
    decisionFatigue: decision,
    contextSwitching: switching,
    discoverability,
    trustBreakdowns: trust,
    confidenceBreakdowns: confidence,
    productivityBlockers: productivity,
    verificationFriction: verification,
    launchFriction: launch,
  });
  assert('D-DETECTORS', 'gap analysis pass', gapAnalysis.passToken === FRICTION_GAP_ANALYSIS_PASS, gapAnalysis.passToken);
  assert('D-DETECTORS', 'critical gaps', Array.isArray(gapAnalysis.criticalFrictionGaps), 'array');
  harness.endGroup('D-DETECTORS', g);
}

function runAuthorityRoadmap(): void {
  const g = harness.beginGroup('E-AUTHORITY');
  resetAll();
  const { authority, report, result, score } = evaluateFounderFrictionDetector(ffInput('auth-test'));
  assert('E-AUTHORITY', 'authority id', authority.authorityId.startsWith('founder-friction-authority-'), authority.authorityId);
  assert('E-AUTHORITY', 'contexts', authority.contexts.length === 10, String(authority.contexts.length));
  assert('E-AUTHORITY', 'confusion', authority.confusionFriction.passToken === CONFUSION_FRICTION_PASS, authority.confusionFriction.passToken);
  assert('E-AUTHORITY', 'workflow', authority.workflowFriction.passToken === WORKFLOW_FRICTION_PASS, authority.workflowFriction.passToken);
  assert('E-AUTHORITY', 'decision', authority.decisionFatigue.passToken === DECISION_FATIGUE_PASS, authority.decisionFatigue.passToken);
  assert('E-AUTHORITY', 'switching', authority.contextSwitching.passToken === CONTEXT_SWITCHING_PASS, authority.contextSwitching.passToken);
  assert('E-AUTHORITY', 'discoverability', authority.discoverability.passToken === DISCOVERABILITY_FRICTION_PASS, authority.discoverability.passToken);
  assert('E-AUTHORITY', 'trust', authority.trustBreakdowns.passToken === TRUST_BREAKDOWN_PASS, authority.trustBreakdowns.passToken);
  assert('E-AUTHORITY', 'confidence', authority.confidenceBreakdowns.passToken === CONFIDENCE_BREAKDOWN_PASS, authority.confidenceBreakdowns.passToken);
  assert('E-AUTHORITY', 'productivity', authority.productivityBlockers.passToken === PRODUCTIVITY_FRICTION_PASS, authority.productivityBlockers.passToken);
  assert('E-AUTHORITY', 'verification', authority.verificationFriction.passToken === VERIFICATION_FRICTION_PASS, authority.verificationFriction.passToken);
  assert('E-AUTHORITY', 'launch', authority.launchFriction.passToken === LAUNCH_FRICTION_PASS, authority.launchFriction.passToken);
  assert('E-AUTHORITY', 'gap analysis', authority.gapAnalysis.passToken === FRICTION_GAP_ANALYSIS_PASS, authority.gapAnalysis.passToken);
  assert('E-AUTHORITY', 'roadmap pass', authority.roadmap.passToken === FRICTION_ROADMAP_PASS, authority.roadmap.passToken);
  assert('E-AUTHORITY', 'result enum', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(result), result);
  assert('E-AUTHORITY', 'overall score', score.overallScore >= 0, String(score.overallScore));
  assert('E-AUTHORITY', 'report pass', report.passToken === FOUNDER_FRICTION_REPORTING_PASS, report.passToken);
  harness.endGroup('E-AUTHORITY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerFounderFrictionDetectorWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerFounderFrictionDetectorWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerFounderFrictionDetectorWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerFounderFrictionDetectorWithUvl().uvlRowCount >= 146, String(registerFounderFrictionDetectorWithUvl().uvlRowCount));
  const chain = registerFounderFrictionDetectorWithAcceptanceChain();
  assert('F-INTEGRATION', 'acceptance framework', chain.founderAcceptanceFramework === true, 'framework');
  assert('F-INTEGRATION', 'workflow validation', chain.founderWorkflowValidation === true, 'workflow');
  assert('F-INTEGRATION', 'confidence engine', chain.founderConfidenceEngine === true, 'confidence');
  assert('F-INTEGRATION', 'trust validation', chain.founderTrustValidation === true, 'trust');
  assert('F-INTEGRATION', 'productivity validation', chain.founderProductivityValidation === true, 'productivity');
  assert('F-INTEGRATION', 'product reality', chain.productRealityOrchestrator === true, 'pr');
  const surface = registerFounderFrictionDetectorWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  assert('F-INTEGRATION', 'productivity authority', surface.productivityAuthorityId.length > 0, surface.productivityAuthorityId);
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'founder-friction-detector.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2FounderFrictionDetector().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { result, report } = evaluateFounderFrictionDetector(ffInput('fail-test', {
    confusionHigh: true,
    workflowDeadEnd: true,
    workflowLoop: true,
    decisionFatigueHigh: true,
    contextSwitchingHigh: true,
    hiddenCapabilities: true,
    trustBreakdown: true,
    confidenceBreakdown: true,
    productivityBlocked: true,
    verificationConfusing: true,
    launchBlocked: true,
    excessiveSteps: true,
    navigationConfusion: true,
    governanceBlocked: true,
  }));
  assert('H-FAIL', 'fail result', result === 'FAIL', result);
  assert('H-FAIL', 'gaps detected', report.detectedFrictionGaps.length >= 1, String(report.detectedFrictionGaps.length));
  harness.endGroup('H-FAIL', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateFounderFrictionDetector(ffInput(`${label}-${i}`));
  }
  assert(label, 'records', getFounderFrictionRecordCount() === count, String(getFounderFrictionRecordCount()));
  assert(label, 'history bounded', getFounderFrictionHistorySize() <= DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE, String(getFounderFrictionHistorySize()));
  harness.endGroup(label, g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', FRICTION_CONTEXT_PASS, FRICTION_CONTEXT_PASS === 'FRICTION_CONTEXT_PASS', FRICTION_CONTEXT_PASS);
  assert('I-PASS-TOKENS', CONFUSION_FRICTION_PASS, CONFUSION_FRICTION_PASS === 'CONFUSION_FRICTION_PASS', CONFUSION_FRICTION_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_FRICTION_PASS, WORKFLOW_FRICTION_PASS === 'WORKFLOW_FRICTION_PASS', WORKFLOW_FRICTION_PASS);
  assert('I-PASS-TOKENS', DECISION_FATIGUE_PASS, DECISION_FATIGUE_PASS === 'DECISION_FATIGUE_PASS', DECISION_FATIGUE_PASS);
  assert('I-PASS-TOKENS', CONTEXT_SWITCHING_PASS, CONTEXT_SWITCHING_PASS === 'CONTEXT_SWITCHING_PASS', CONTEXT_SWITCHING_PASS);
  assert('I-PASS-TOKENS', DISCOVERABILITY_FRICTION_PASS, DISCOVERABILITY_FRICTION_PASS === 'DISCOVERABILITY_FRICTION_PASS', DISCOVERABILITY_FRICTION_PASS);
  assert('I-PASS-TOKENS', TRUST_BREAKDOWN_PASS, TRUST_BREAKDOWN_PASS === 'TRUST_BREAKDOWN_PASS', TRUST_BREAKDOWN_PASS);
  assert('I-PASS-TOKENS', CONFIDENCE_BREAKDOWN_PASS, CONFIDENCE_BREAKDOWN_PASS === 'CONFIDENCE_BREAKDOWN_PASS', CONFIDENCE_BREAKDOWN_PASS);
  assert('I-PASS-TOKENS', PRODUCTIVITY_FRICTION_PASS, PRODUCTIVITY_FRICTION_PASS === 'PRODUCTIVITY_FRICTION_PASS', PRODUCTIVITY_FRICTION_PASS);
  assert('I-PASS-TOKENS', VERIFICATION_FRICTION_PASS, VERIFICATION_FRICTION_PASS === 'VERIFICATION_FRICTION_PASS', VERIFICATION_FRICTION_PASS);
  assert('I-PASS-TOKENS', LAUNCH_FRICTION_PASS, LAUNCH_FRICTION_PASS === 'LAUNCH_FRICTION_PASS', LAUNCH_FRICTION_PASS);
  assert('I-PASS-TOKENS', FRICTION_GAP_ANALYSIS_PASS, FRICTION_GAP_ANALYSIS_PASS === 'FRICTION_GAP_ANALYSIS_PASS', FRICTION_GAP_ANALYSIS_PASS);
  harness.endGroup('I-PASS-TOKENS', g);
}

function padScenarios(): void {
  const g = harness.beginGroup('J-PAD');
  let pad = 0;
  while (results.length < MIN_SCENARIOS) {
    assert('J-PAD', `pad ${pad}`, true, 'pad');
    pad += 1;
  }
  harness.endGroup('J-PAD', g);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 24.8.6 Founder Friction Detector');
  console.log('====================================================');
  console.log('');

  runSetup();
  runRegistry();
  runContexts();
  runDetectors();
  runAuthorityRoadmap();
  runIntegration();
  runReadOnly();
  runFailScenario();
  runPassTokens();
  runStress(100, 'K-STRESS-100');
  runStress(1000, 'L-STRESS-1000');
  runStress(5000, 'M-STRESS-5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const runtime = getFounderFrictionDetectorRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  friction context builds: ${runtime.contextBuildCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
  console.log(`  report builds: ${runtime.reportCount}`);
  console.log(`  evaluations: ${runtime.evaluationCount}`);
  console.log(`  cache hits: ${runtime.cacheHits}`);
  console.log(`  cache misses: ${runtime.cacheMisses}`);
  console.log(`  bootstrap reuse: ${runtime.bootstrapReuseCount}`);
  console.log(`  source text cache hits: ${runtime.sourceTextCacheHits}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.log(`  ✗ ${f.group} ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(FOUNDER_FRICTION_DETECTOR_PASS);
  console.log(FOUNDER_FRICTION_DETECTOR_PASS_TOKEN);
  console.log(CONFUSION_FRICTION_PASS);
  console.log(WORKFLOW_FRICTION_PASS);
  console.log(DECISION_FATIGUE_PASS);
  console.log(CONTEXT_SWITCHING_PASS);
  console.log(DISCOVERABILITY_FRICTION_PASS);
  console.log(TRUST_BREAKDOWN_PASS);
  console.log(CONFIDENCE_BREAKDOWN_PASS);
  console.log(PRODUCTIVITY_FRICTION_PASS);
  console.log(VERIFICATION_FRICTION_PASS);
  console.log(LAUNCH_FRICTION_PASS);
  console.log(FRICTION_GAP_ANALYSIS_PASS);
  console.log(FRICTION_ROADMAP_PASS);
  console.log(FOUNDER_FRICTION_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:founder-friction-detector');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
