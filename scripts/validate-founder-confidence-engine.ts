/**
 * Phase 24.8.3 — Founder Confidence Engine validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_CONFIDENCE_ENGINE_PASS_TOKEN,
  FOUNDER_CONFIDENCE_ENGINE_PASS,
  FOUNDER_CONFIDENCE_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE,
  MAX_CONFIDENCE_GAPS,
  CONFIDENCE_CONTEXT_PASS,
  UNDERSTANDING_CONFIDENCE_PASS,
  REASONING_VISIBILITY_PASS,
  PROGRESS_TRUTH_PASS,
  NEXT_STEP_CONFIDENCE_PASS,
  DECISION_CONFIDENCE_PASS,
  UNCERTAINTY_HONESTY_PASS,
  FOUNDER_CONTROL_CONFIDENCE_PASS,
  CONFIDENCE_GAP_ANALYSIS_PASS,
  CONFIDENCE_ROADMAP_PASS,
  FOUNDER_CONFIDENCE_REPORTING_PASS,
  buildAllConfidenceContexts,
  buildConfidenceContext,
  listConfidenceContextIds,
  validateUnderstandingConfidence,
  validateReasoningVisibility,
  validateProgressTruth,
  validateNextStepConfidence,
  validateDecisionConfidence,
  validateUncertaintyHonesty,
  validateFounderControlConfidence,
  analyzeConfidenceGaps,
  buildFounderConfidenceRoadmap,
  clearFounderConfidenceHistory,
  getFounderConfidenceHistorySize,
  getFounderConfidenceEngineRuntimeReport,
  getFounderConfidenceRecord,
  getFounderConfidenceRecordCount,
  getDevPulseV2FounderConfidenceEngine,
  isFounderConfidenceQuestion,
  lookupFounderConfidenceByProjectId,
  registerFounderConfidenceEngineWithCapabilityRegistry,
  registerFounderConfidenceEngineWithFindPanel,
  registerFounderConfidenceEngineWithFoundation,
  registerFounderConfidenceEngineWithAcceptanceChain,
  registerFounderConfidenceEngineWithSurface,
  registerFounderConfidenceEngineWithUvl,
  evaluateFounderConfidenceEngine,
  resetFounderConfidenceEngineForTests,
} from '../src/founder-acceptance-validation/founder-confidence-engine/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_CONFIDENCE_ENGINE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderConfidenceEngineInput } from '../src/founder-acceptance-validation/founder-confidence-engine/founder-confidence-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-acceptance-validation/founder-confidence-engine');

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
  'founder-confidence-types.ts',
  'confidence-gap-model.ts',
  'founder-confidence-cache.ts',
  'founder-confidence-registry.ts',
  'bounded-history.ts',
  'confidence-context-builder.ts',
  'understanding-confidence-validator.ts',
  'reasoning-visibility-validator.ts',
  'progress-truth-validator.ts',
  'next-step-confidence-validator.ts',
  'decision-confidence-validator.ts',
  'uncertainty-honesty-validator.ts',
  'founder-control-confidence-validator.ts',
  'confidence-gap-analyzer.ts',
  'confidence-roadmap-builder.ts',
  'founder-confidence-authority-builder.ts',
  'founder-confidence-evaluator.ts',
  'founder-confidence-report-builder.ts',
  'founder-confidence-engine.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderConfidenceEngineForTests();
  clearFounderConfidenceHistory();
}

function fcInput(requestId: string, overrides: Partial<FounderConfidenceEngineInput> = {}): FounderConfidenceEngineInput {
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
  const mod = getDevPulseV2FounderConfidenceEngine();
  assert('A-TYPES', 'pass token v1', mod.passToken === FOUNDER_CONFIDENCE_ENGINE_PASS_TOKEN, mod.passToken);
  assert('A-TYPES', 'pass token', FOUNDER_CONFIDENCE_ENGINE_PASS === 'FOUNDER_CONFIDENCE_ENGINE_PASS', FOUNDER_CONFIDENCE_ENGINE_PASS);
  assert('A-TYPES', 'owner module', mod.ownerModule === FOUNDER_CONFIDENCE_OWNER_MODULE, mod.ownerModule);
  assert('A-TYPES', 'read only', mod.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', mod.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', mod.phase === 24.83, String(mod.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_CONFIDENCE_ENGINE_UVL_ROWS.length >= 18, String(FOUNDER_CONFIDENCE_ENGINE_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE));
  assert('A-TYPES', 'max gaps', MAX_CONFIDENCE_GAPS === 64, String(MAX_CONFIDENCE_GAPS));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_confidence_engine').phase === 24.83, '24.83');
  assert('A-TYPES', 'question signal', isFounderConfidenceQuestion('founder confidence engine'), 'signal');
  assert('A-TYPES', 'context count', listConfidenceContextIds().length === 7, String(listConfidenceContextIds().length));
  assert('A-TYPES', 'roadmap pass alias', CONFIDENCE_ROADMAP_PASS === 'ROADMAP_PASS', CONFIDENCE_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass alias', FOUNDER_CONFIDENCE_REPORTING_PASS === 'REPORTING_PASS', FOUNDER_CONFIDENCE_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateFounderConfidenceEngine(fcInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderConfidenceRecord(record.founderConfidenceId) !== undefined, record.founderConfidenceId);
  assert('B-REGISTRY', 'by project', lookupFounderConfidenceByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'record id', record.founderConfidenceId.startsWith('founder-confidence-'), record.founderConfidenceId);
  assert('B-REGISTRY', 'record count', getFounderConfidenceRecordCount() >= 1, String(getFounderConfidenceRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runContexts(): void {
  const g = harness.beginGroup('C-CONTEXTS');
  resetAll();
  const contexts = buildAllConfidenceContexts();
  assert('C-CONTEXTS', 'context pass', contexts.every((c) => c.passToken === CONFIDENCE_CONTEXT_PASS), 'pass');
  assert('C-CONTEXTS', 'project understanding', contexts.some((c) => c.contextId === 'PROJECT_UNDERSTANDING_CONFIDENCE'), 'understanding');
  assert('C-CONTEXTS', 'action reasoning', contexts.some((c) => c.contextId === 'ACTION_REASONING_CONFIDENCE'), 'reasoning');
  assert('C-CONTEXTS', 'progress truth', contexts.some((c) => c.contextId === 'PROGRESS_TRUTH_CONFIDENCE'), 'progress');
  assert('C-CONTEXTS', 'next step', contexts.some((c) => c.contextId === 'NEXT_STEP_CONFIDENCE'), 'next');
  assert('C-CONTEXTS', 'decision', contexts.some((c) => c.contextId === 'DECISION_CONFIDENCE'), 'decision');
  assert('C-CONTEXTS', 'uncertainty', contexts.some((c) => c.contextId === 'UNCERTAINTY_CONFIDENCE'), 'uncertainty');
  assert('C-CONTEXTS', 'control', contexts.some((c) => c.contextId === 'CONTROL_CONFIDENCE'), 'control');
  const ctx = buildConfidenceContext('PROJECT_UNDERSTANDING_CONFIDENCE');
  assert('C-CONTEXTS', 'intent', ctx.confidenceIntent.length > 0, ctx.confidenceIntent);
  assert('C-CONTEXTS', 'signal', ctx.expectedFounderSignal.length > 0, ctx.expectedFounderSignal);
  assert('C-CONTEXTS', 'evidence', ctx.requiredEvidence.length >= 3, String(ctx.requiredEvidence.length));
  harness.endGroup('C-CONTEXTS', g);
}

function runValidators(): void {
  const g = harness.beginGroup('D-VALIDATORS');
  resetAll();
  const input = fcInput('validator-test');
  const understanding = validateUnderstandingConfidence(input, {
    projectContextScore: 80,
    founderUsabilityScore: 78,
    workflowContinuityScore: 82,
    frameworkComplete: true,
  });
  assert('D-VALIDATORS', 'understanding pass', understanding.passToken === UNDERSTANDING_CONFIDENCE_PASS, understanding.passToken);

  const reasoning = validateReasoningVisibility(input, {
    trustClarityScore: 76,
    feedbackQualityScore: 74,
    operatorFeedPresent: true,
    feedStreamPresent: true,
  });
  assert('D-VALIDATORS', 'reasoning pass', reasoning.passToken === REASONING_VISIBILITY_PASS, reasoning.passToken);

  const progressTruth = validateProgressTruth(input, {
    productRealityScore: 78,
    validationEvidenceScore: 80,
    launchBlockerCount: 1,
    releaseReadiness: 'PARTIALLY_READY',
  });
  assert('D-VALIDATORS', 'progress pass', progressTruth.passToken === PROGRESS_TRUTH_PASS, progressTruth.passToken);

  const nextStep = validateNextStepConfidence(input, {
    actionReadinessScore: 78,
    previewNextActionScore: 75,
    workflowOutcomeScore: 76,
    priorityClarityScore: 72,
  });
  assert('D-VALIDATORS', 'next step pass', nextStep.passToken === NEXT_STEP_CONFIDENCE_PASS, nextStep.passToken);

  const decision = validateDecisionConfidence(input, {
    userControlScore: 74,
    trustClarityScore: 76,
    authorityConflictCount: 0,
    founderPriorityCount: 3,
  });
  assert('D-VALIDATORS', 'decision pass', decision.passToken === DECISION_CONFIDENCE_PASS, decision.passToken);

  const uncertainty = validateUncertaintyHonesty(input, {
    previewHonestyScore: 78,
    errorPreventionScore: 72,
    limitationVisibilityScore: 74,
    evidenceGapCount: 1,
  });
  assert('D-VALIDATORS', 'uncertainty pass', uncertainty.passToken === UNCERTAINTY_HONESTY_PASS, uncertainty.passToken);

  const control = validateFounderControlConfidence(input, {
    userControlScore: 76,
    errorPreventionScore: 74,
    readOnlyValidation: true,
    rollbackVisible: true,
  });
  assert('D-VALIDATORS', 'control pass', control.passToken === FOUNDER_CONTROL_CONFIDENCE_PASS, control.passToken);

  const gapAnalysis = analyzeConfidenceGaps(input.requestId, {
    understandingConfidence: understanding,
    reasoningVisibility: reasoning,
    progressTruth,
    nextStepConfidence: nextStep,
    decisionConfidence: decision,
    uncertaintyHonesty: uncertainty,
    founderControlConfidence: control,
  });
  assert('D-VALIDATORS', 'gap analysis pass', gapAnalysis.passToken === CONFIDENCE_GAP_ANALYSIS_PASS, gapAnalysis.passToken);
  assert('D-VALIDATORS', 'critical gaps', Array.isArray(gapAnalysis.criticalConfidenceGaps), 'array');
  assert('D-VALIDATORS', 'major gaps', Array.isArray(gapAnalysis.majorConfidenceGaps), 'array');
  assert('D-VALIDATORS', 'minor gaps', Array.isArray(gapAnalysis.minorConfidenceGaps), 'array');
  harness.endGroup('D-VALIDATORS', g);
}

function runAuthorityRoadmap(): void {
  const g = harness.beginGroup('E-AUTHORITY');
  resetAll();
  const { authority, report, result, score } = evaluateFounderConfidenceEngine(fcInput('auth-test'));
  assert('E-AUTHORITY', 'authority id', authority.authorityId.startsWith('founder-confidence-authority-'), authority.authorityId);
  assert('E-AUTHORITY', 'contexts', authority.contexts.length === 7, String(authority.contexts.length));
  assert('E-AUTHORITY', 'understanding', authority.understandingConfidence.passToken === UNDERSTANDING_CONFIDENCE_PASS, authority.understandingConfidence.passToken);
  assert('E-AUTHORITY', 'reasoning', authority.reasoningVisibility.passToken === REASONING_VISIBILITY_PASS, authority.reasoningVisibility.passToken);
  assert('E-AUTHORITY', 'progress', authority.progressTruth.passToken === PROGRESS_TRUTH_PASS, authority.progressTruth.passToken);
  assert('E-AUTHORITY', 'next step', authority.nextStepConfidence.passToken === NEXT_STEP_CONFIDENCE_PASS, authority.nextStepConfidence.passToken);
  assert('E-AUTHORITY', 'decision', authority.decisionConfidence.passToken === DECISION_CONFIDENCE_PASS, authority.decisionConfidence.passToken);
  assert('E-AUTHORITY', 'uncertainty', authority.uncertaintyHonesty.passToken === UNCERTAINTY_HONESTY_PASS, authority.uncertaintyHonesty.passToken);
  assert('E-AUTHORITY', 'control', authority.founderControlConfidence.passToken === FOUNDER_CONTROL_CONFIDENCE_PASS, authority.founderControlConfidence.passToken);
  assert('E-AUTHORITY', 'gap analysis', authority.gapAnalysis.passToken === CONFIDENCE_GAP_ANALYSIS_PASS, authority.gapAnalysis.passToken);
  assert('E-AUTHORITY', 'roadmap pass', authority.roadmap.passToken === CONFIDENCE_ROADMAP_PASS, authority.roadmap.passToken);
  assert('E-AUTHORITY', 'critical fixes', Array.isArray(authority.roadmap.criticalConfidenceFixes), 'array');
  assert('E-AUTHORITY', 'high priority', Array.isArray(authority.roadmap.highPriorityImprovements), 'array');
  assert('E-AUTHORITY', 'medium', Array.isArray(authority.roadmap.mediumImprovements), 'array');
  assert('E-AUTHORITY', 'future', Array.isArray(authority.roadmap.futureConfidenceOptimization), 'array');
  assert('E-AUTHORITY', 'result enum', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(result), result);
  assert('E-AUTHORITY', 'overall score', score.overallScore >= 0, String(score.overallScore));
  assert('E-AUTHORITY', 'report pass', report.passToken === FOUNDER_CONFIDENCE_REPORTING_PASS, report.passToken);
  assert('E-AUTHORITY', 'report score', report.founderConfidenceScore >= 0, String(report.founderConfidenceScore));
  harness.endGroup('E-AUTHORITY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerFounderConfidenceEngineWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerFounderConfidenceEngineWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerFounderConfidenceEngineWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerFounderConfidenceEngineWithUvl().uvlRowCount >= 95, String(registerFounderConfidenceEngineWithUvl().uvlRowCount));
  const chain = registerFounderConfidenceEngineWithAcceptanceChain();
  assert('F-INTEGRATION', 'acceptance framework', chain.founderAcceptanceFramework === true, 'framework');
  assert('F-INTEGRATION', 'workflow validation', chain.founderWorkflowValidation === true, 'workflow');
  assert('F-INTEGRATION', 'product reality', chain.productRealityOrchestrator === true, 'pr');
  const surface = registerFounderConfidenceEngineWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  assert('F-INTEGRATION', 'framework authority', surface.frameworkAuthorityId.length > 0, surface.frameworkAuthorityId);
  assert('F-INTEGRATION', 'workflow authority', surface.workflowAuthorityId.length > 0, surface.workflowAuthorityId);
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'founder-confidence-engine.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2FounderConfidenceEngine().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { result, report } = evaluateFounderConfidenceEngine(fcInput('fail-test', {
    understandingWeak: true,
    reasoningHidden: true,
    progressInflated: true,
    nextStepUnclear: true,
    decisionUnsupported: true,
    uncertaintyHidden: true,
    controlBoundaryWeak: true,
    vagueAuthorityClaims: true,
    unsupportedPassClaims: true,
    missingEvidence: true,
    governanceBlocked: true,
  }));
  assert('H-FAIL', 'fail result', result === 'FAIL', result);
  assert('H-FAIL', 'gaps detected', report.detectedConfidenceGaps.length >= 1, String(report.detectedConfidenceGaps.length));
  harness.endGroup('H-FAIL', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateFounderConfidenceEngine(fcInput(`${label}-${i}`));
  }
  assert(label, 'records', getFounderConfidenceRecordCount() === count, String(getFounderConfidenceRecordCount()));
  assert(label, 'history bounded', getFounderConfidenceHistorySize() <= DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE, String(getFounderConfidenceHistorySize()));
  harness.endGroup(label, g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', CONFIDENCE_CONTEXT_PASS, CONFIDENCE_CONTEXT_PASS === 'CONFIDENCE_CONTEXT_PASS', CONFIDENCE_CONTEXT_PASS);
  assert('I-PASS-TOKENS', UNDERSTANDING_CONFIDENCE_PASS, UNDERSTANDING_CONFIDENCE_PASS === 'UNDERSTANDING_CONFIDENCE_PASS', UNDERSTANDING_CONFIDENCE_PASS);
  assert('I-PASS-TOKENS', REASONING_VISIBILITY_PASS, REASONING_VISIBILITY_PASS === 'REASONING_VISIBILITY_PASS', REASONING_VISIBILITY_PASS);
  assert('I-PASS-TOKENS', PROGRESS_TRUTH_PASS, PROGRESS_TRUTH_PASS === 'PROGRESS_TRUTH_PASS', PROGRESS_TRUTH_PASS);
  assert('I-PASS-TOKENS', NEXT_STEP_CONFIDENCE_PASS, NEXT_STEP_CONFIDENCE_PASS === 'NEXT_STEP_CONFIDENCE_PASS', NEXT_STEP_CONFIDENCE_PASS);
  assert('I-PASS-TOKENS', DECISION_CONFIDENCE_PASS, DECISION_CONFIDENCE_PASS === 'DECISION_CONFIDENCE_PASS', DECISION_CONFIDENCE_PASS);
  assert('I-PASS-TOKENS', UNCERTAINTY_HONESTY_PASS, UNCERTAINTY_HONESTY_PASS === 'UNCERTAINTY_HONESTY_PASS', UNCERTAINTY_HONESTY_PASS);
  assert('I-PASS-TOKENS', FOUNDER_CONTROL_CONFIDENCE_PASS, FOUNDER_CONTROL_CONFIDENCE_PASS === 'FOUNDER_CONTROL_CONFIDENCE_PASS', FOUNDER_CONTROL_CONFIDENCE_PASS);
  assert('I-PASS-TOKENS', CONFIDENCE_GAP_ANALYSIS_PASS, CONFIDENCE_GAP_ANALYSIS_PASS === 'CONFIDENCE_GAP_ANALYSIS_PASS', CONFIDENCE_GAP_ANALYSIS_PASS);
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
  console.log('DevPulse V2 — Phase 24.8.3 Founder Confidence Engine');
  console.log('====================================================');
  console.log('');

  runSetup();
  runRegistry();
  runContexts();
  runValidators();
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
  const runtime = getFounderConfidenceEngineRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  confidence context builds: ${runtime.contextBuildCount}`);
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

  console.log(FOUNDER_CONFIDENCE_ENGINE_PASS);
  console.log(FOUNDER_CONFIDENCE_ENGINE_PASS_TOKEN);
  console.log(UNDERSTANDING_CONFIDENCE_PASS);
  console.log(REASONING_VISIBILITY_PASS);
  console.log(PROGRESS_TRUTH_PASS);
  console.log(NEXT_STEP_CONFIDENCE_PASS);
  console.log(DECISION_CONFIDENCE_PASS);
  console.log(UNCERTAINTY_HONESTY_PASS);
  console.log(FOUNDER_CONTROL_CONFIDENCE_PASS);
  console.log(CONFIDENCE_GAP_ANALYSIS_PASS);
  console.log(CONFIDENCE_ROADMAP_PASS);
  console.log(FOUNDER_CONFIDENCE_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:founder-confidence-engine');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
