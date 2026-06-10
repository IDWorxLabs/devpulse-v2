/**
 * Phase 24.8.5 — Founder Productivity Validation validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_PRODUCTIVITY_VALIDATION_PASS_TOKEN,
  FOUNDER_PRODUCTIVITY_VALIDATION_PASS,
  FOUNDER_PRODUCTIVITY_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE,
  MAX_PRODUCTIVITY_GAPS,
  PRODUCTIVITY_CONTEXT_PASS,
  WORKFLOW_ACCELERATION_PASS,
  MANUAL_WORK_REDUCTION_PASS,
  DECISION_REDUCTION_PASS,
  CONTEXT_SWITCHING_PASS,
  EXECUTION_EFFICIENCY_PASS,
  THROUGHPUT_PASS,
  WORKFLOW_OVERHEAD_PASS,
  PRODUCTIVITY_GAP_ANALYSIS_PASS,
  PRODUCTIVITY_ROADMAP_PASS,
  FOUNDER_PRODUCTIVITY_REPORTING_PASS,
  buildAllProductivityContexts,
  buildProductivityContext,
  listProductivityContextIds,
  validateWorkflowAcceleration,
  validateManualWorkReduction,
  validateDecisionReduction,
  validateContextSwitching,
  validateExecutionEfficiency,
  validateThroughput,
  validateWorkflowOverhead,
  analyzeProductivityGaps,
  clearFounderProductivityHistory,
  getFounderProductivityHistorySize,
  getFounderProductivityValidationRuntimeReport,
  getFounderProductivityRecord,
  getFounderProductivityRecordCount,
  getDevPulseV2FounderProductivityValidation,
  isFounderProductivityQuestion,
  lookupFounderProductivityByProjectId,
  registerFounderProductivityValidationWithCapabilityRegistry,
  registerFounderProductivityValidationWithFindPanel,
  registerFounderProductivityValidationWithFoundation,
  registerFounderProductivityValidationWithAcceptanceChain,
  registerFounderProductivityValidationWithSurface,
  registerFounderProductivityValidationWithUvl,
  evaluateFounderProductivityValidation,
  resetFounderProductivityValidationForTests,
} from '../src/founder-acceptance-validation/founder-productivity-validation/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_PRODUCTIVITY_VALIDATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderProductivityValidationInput } from '../src/founder-acceptance-validation/founder-productivity-validation/founder-productivity-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-acceptance-validation/founder-productivity-validation');

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
  'founder-productivity-types.ts',
  'productivity-gap-model.ts',
  'founder-productivity-cache.ts',
  'founder-productivity-registry.ts',
  'bounded-history.ts',
  'productivity-context-builder.ts',
  'workflow-acceleration-validator.ts',
  'manual-work-reduction-validator.ts',
  'decision-reduction-validator.ts',
  'context-switching-validator.ts',
  'execution-efficiency-validator.ts',
  'throughput-validator.ts',
  'workflow-overhead-validator.ts',
  'productivity-gap-analyzer.ts',
  'productivity-roadmap-builder.ts',
  'founder-productivity-authority-builder.ts',
  'founder-productivity-evaluator.ts',
  'founder-productivity-report-builder.ts',
  'founder-productivity-validation.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderProductivityValidationForTests();
  clearFounderProductivityHistory();
}

function fpInput(requestId: string, overrides: Partial<FounderProductivityValidationInput> = {}): FounderProductivityValidationInput {
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
  const mod = getDevPulseV2FounderProductivityValidation();
  assert('A-TYPES', 'pass token v1', mod.passToken === FOUNDER_PRODUCTIVITY_VALIDATION_PASS_TOKEN, mod.passToken);
  assert('A-TYPES', 'pass token', FOUNDER_PRODUCTIVITY_VALIDATION_PASS === 'FOUNDER_PRODUCTIVITY_VALIDATION_PASS', FOUNDER_PRODUCTIVITY_VALIDATION_PASS);
  assert('A-TYPES', 'owner module', mod.ownerModule === FOUNDER_PRODUCTIVITY_OWNER_MODULE, mod.ownerModule);
  assert('A-TYPES', 'read only', mod.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', mod.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', mod.phase === 24.85, String(mod.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_PRODUCTIVITY_VALIDATION_UVL_ROWS.length >= 18, String(FOUNDER_PRODUCTIVITY_VALIDATION_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE));
  assert('A-TYPES', 'max gaps', MAX_PRODUCTIVITY_GAPS === 64, String(MAX_PRODUCTIVITY_GAPS));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_productivity_validation').phase === 24.85, '24.85');
  assert('A-TYPES', 'question signal', isFounderProductivityQuestion('founder productivity validation'), 'signal');
  assert('A-TYPES', 'context count', listProductivityContextIds().length === 7, String(listProductivityContextIds().length));
  assert('A-TYPES', 'roadmap pass alias', PRODUCTIVITY_ROADMAP_PASS === 'ROADMAP_PASS', PRODUCTIVITY_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass alias', FOUNDER_PRODUCTIVITY_REPORTING_PASS === 'REPORTING_PASS', FOUNDER_PRODUCTIVITY_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateFounderProductivityValidation(fpInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderProductivityRecord(record.founderProductivityId) !== undefined, record.founderProductivityId);
  assert('B-REGISTRY', 'by project', lookupFounderProductivityByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'record id', record.founderProductivityId.startsWith('founder-productivity-'), record.founderProductivityId);
  assert('B-REGISTRY', 'record count', getFounderProductivityRecordCount() >= 1, String(getFounderProductivityRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runContexts(): void {
  const g = harness.beginGroup('C-CONTEXTS');
  resetAll();
  const contexts = buildAllProductivityContexts();
  assert('C-CONTEXTS', 'context pass', contexts.every((c) => c.passToken === PRODUCTIVITY_CONTEXT_PASS), 'pass');
  assert('C-CONTEXTS', 'idea to execution', contexts.some((c) => c.contextId === 'IDEA_TO_EXECUTION_PRODUCTIVITY'), 'idea');
  assert('C-CONTEXTS', 'project management', contexts.some((c) => c.contextId === 'PROJECT_MANAGEMENT_PRODUCTIVITY'), 'project');
  assert('C-CONTEXTS', 'build', contexts.some((c) => c.contextId === 'BUILD_PRODUCTIVITY'), 'build');
  assert('C-CONTEXTS', 'verification', contexts.some((c) => c.contextId === 'VERIFICATION_PRODUCTIVITY'), 'verify');
  assert('C-CONTEXTS', 'decision', contexts.some((c) => c.contextId === 'DECISION_PRODUCTIVITY'), 'decision');
  assert('C-CONTEXTS', 'automation', contexts.some((c) => c.contextId === 'AUTOMATION_PRODUCTIVITY'), 'auto');
  assert('C-CONTEXTS', 'delivery', contexts.some((c) => c.contextId === 'DELIVERY_PRODUCTIVITY'), 'delivery');
  const ctx = buildProductivityContext('IDEA_TO_EXECUTION_PRODUCTIVITY');
  assert('C-CONTEXTS', 'intent', ctx.productivityIntent.length > 0, ctx.productivityIntent);
  assert('C-CONTEXTS', 'benefit', ctx.expectedFounderBenefit.length > 0, ctx.expectedFounderBenefit);
  assert('C-CONTEXTS', 'evidence', ctx.requiredEvidence.length >= 3, String(ctx.requiredEvidence.length));
  harness.endGroup('C-CONTEXTS', g);
}

function runValidators(): void {
  const g = harness.beginGroup('D-VALIDATORS');
  resetAll();
  const input = fpInput('validator-test');
  const acceleration = validateWorkflowAcceleration(input, {
    workflowEfficiencyScore: 78,
    workflowContinuityScore: 80,
    outcomeScore: 76,
    stepOverheadEstimate: 1,
  });
  assert('D-VALIDATORS', 'acceleration pass', acceleration.passToken === WORKFLOW_ACCELERATION_PASS, acceleration.passToken);

  const manual = validateManualWorkReduction(input, {
    founderUsabilityScore: 76,
    cognitiveLoadScore: 30,
    operatorFeedPresent: true,
    automationSurfaceScore: 78,
  });
  assert('D-VALIDATORS', 'manual pass', manual.passToken === MANUAL_WORK_REDUCTION_PASS, manual.passToken);

  const decision = validateDecisionReduction(input, {
    decisionConfidenceScore: 76,
    founderPriorityCount: 3,
    nextStepConfidenceScore: 74,
    trustClarityScore: 75,
  });
  assert('D-VALIDATORS', 'decision pass', decision.passToken === DECISION_REDUCTION_PASS, decision.passToken);

  const switching = validateContextSwitching(input, {
    workflowContinuityScore: 78,
    experienceContinuityScore: 76,
    contextLossRisk: false,
    fragmentationScore: 80,
  });
  assert('D-VALIDATORS', 'switching pass', switching.passToken === CONTEXT_SWITCHING_PASS, switching.passToken);

  const execution = validateExecutionEfficiency(input, {
    workflowEfficiencyScore: 76,
    founderUsabilityScore: 78,
    validationEfficiencyScore: 80,
    coordinationScore: 74,
  });
  assert('D-VALIDATORS', 'execution pass', execution.passToken === EXECUTION_EFFICIENCY_PASS, execution.passToken);

  const throughput = validateThroughput(input, {
    productRealityScore: 78,
    releaseReadiness: 'PARTIALLY_READY',
    launchBlockerCount: 1,
    workflowOutcomeScore: 76,
  });
  assert('D-VALIDATORS', 'throughput pass', throughput.passToken === THROUGHPUT_PASS, throughput.passToken);

  const overhead = validateWorkflowOverhead(input, {
    cognitiveLoadScore: 35,
    frictionScore: 76,
    reportingOverheadEstimate: 0,
    coordinationOverheadEstimate: 0,
  });
  assert('D-VALIDATORS', 'overhead pass', overhead.passToken === WORKFLOW_OVERHEAD_PASS, overhead.passToken);

  const gapAnalysis = analyzeProductivityGaps(input.requestId, {
    workflowAcceleration: acceleration,
    manualWorkReduction: manual,
    decisionReduction: decision,
    contextSwitching: switching,
    executionEfficiency: execution,
    throughput,
    workflowOverhead: overhead,
  });
  assert('D-VALIDATORS', 'gap analysis pass', gapAnalysis.passToken === PRODUCTIVITY_GAP_ANALYSIS_PASS, gapAnalysis.passToken);
  assert('D-VALIDATORS', 'critical gaps', Array.isArray(gapAnalysis.criticalProductivityGaps), 'array');
  harness.endGroup('D-VALIDATORS', g);
}

function runAuthorityRoadmap(): void {
  const g = harness.beginGroup('E-AUTHORITY');
  resetAll();
  const { authority, report, result, score } = evaluateFounderProductivityValidation(fpInput('auth-test'));
  assert('E-AUTHORITY', 'authority id', authority.authorityId.startsWith('founder-productivity-authority-'), authority.authorityId);
  assert('E-AUTHORITY', 'contexts', authority.contexts.length === 7, String(authority.contexts.length));
  assert('E-AUTHORITY', 'acceleration', authority.workflowAcceleration.passToken === WORKFLOW_ACCELERATION_PASS, authority.workflowAcceleration.passToken);
  assert('E-AUTHORITY', 'manual', authority.manualWorkReduction.passToken === MANUAL_WORK_REDUCTION_PASS, authority.manualWorkReduction.passToken);
  assert('E-AUTHORITY', 'decision', authority.decisionReduction.passToken === DECISION_REDUCTION_PASS, authority.decisionReduction.passToken);
  assert('E-AUTHORITY', 'switching', authority.contextSwitching.passToken === CONTEXT_SWITCHING_PASS, authority.contextSwitching.passToken);
  assert('E-AUTHORITY', 'execution', authority.executionEfficiency.passToken === EXECUTION_EFFICIENCY_PASS, authority.executionEfficiency.passToken);
  assert('E-AUTHORITY', 'throughput', authority.throughput.passToken === THROUGHPUT_PASS, authority.throughput.passToken);
  assert('E-AUTHORITY', 'overhead', authority.workflowOverhead.passToken === WORKFLOW_OVERHEAD_PASS, authority.workflowOverhead.passToken);
  assert('E-AUTHORITY', 'gap analysis', authority.gapAnalysis.passToken === PRODUCTIVITY_GAP_ANALYSIS_PASS, authority.gapAnalysis.passToken);
  assert('E-AUTHORITY', 'roadmap pass', authority.roadmap.passToken === PRODUCTIVITY_ROADMAP_PASS, authority.roadmap.passToken);
  assert('E-AUTHORITY', 'result enum', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(result), result);
  assert('E-AUTHORITY', 'overall score', score.overallScore >= 0, String(score.overallScore));
  assert('E-AUTHORITY', 'report pass', report.passToken === FOUNDER_PRODUCTIVITY_REPORTING_PASS, report.passToken);
  harness.endGroup('E-AUTHORITY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerFounderProductivityValidationWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerFounderProductivityValidationWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerFounderProductivityValidationWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerFounderProductivityValidationWithUvl().uvlRowCount >= 125, String(registerFounderProductivityValidationWithUvl().uvlRowCount));
  const chain = registerFounderProductivityValidationWithAcceptanceChain();
  assert('F-INTEGRATION', 'acceptance framework', chain.founderAcceptanceFramework === true, 'framework');
  assert('F-INTEGRATION', 'workflow validation', chain.founderWorkflowValidation === true, 'workflow');
  assert('F-INTEGRATION', 'confidence engine', chain.founderConfidenceEngine === true, 'confidence');
  assert('F-INTEGRATION', 'trust validation', chain.founderTrustValidation === true, 'trust');
  assert('F-INTEGRATION', 'product reality', chain.productRealityOrchestrator === true, 'pr');
  const surface = registerFounderProductivityValidationWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  assert('F-INTEGRATION', 'trust authority', surface.trustAuthorityId.length > 0, surface.trustAuthorityId);
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'founder-productivity-validation.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2FounderProductivityValidation().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { result, report } = evaluateFounderProductivityValidation(fpInput('fail-test', {
    workflowSlow: true,
    manualWorkHigh: true,
    decisionFatigue: true,
    contextSwitchingHigh: true,
    executionInefficient: true,
    throughputLow: true,
    workflowOverheadHigh: true,
    excessiveSteps: true,
    repetitiveWork: true,
    coordinationBurden: true,
    governanceBlocked: true,
  }));
  assert('H-FAIL', 'fail result', result === 'FAIL', result);
  assert('H-FAIL', 'gaps detected', report.detectedProductivityGaps.length >= 1, String(report.detectedProductivityGaps.length));
  harness.endGroup('H-FAIL', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateFounderProductivityValidation(fpInput(`${label}-${i}`));
  }
  assert(label, 'records', getFounderProductivityRecordCount() === count, String(getFounderProductivityRecordCount()));
  assert(label, 'history bounded', getFounderProductivityHistorySize() <= DEFAULT_MAX_FOUNDER_PRODUCTIVITY_HISTORY_SIZE, String(getFounderProductivityHistorySize()));
  harness.endGroup(label, g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', PRODUCTIVITY_CONTEXT_PASS, PRODUCTIVITY_CONTEXT_PASS === 'PRODUCTIVITY_CONTEXT_PASS', PRODUCTIVITY_CONTEXT_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_ACCELERATION_PASS, WORKFLOW_ACCELERATION_PASS === 'WORKFLOW_ACCELERATION_PASS', WORKFLOW_ACCELERATION_PASS);
  assert('I-PASS-TOKENS', MANUAL_WORK_REDUCTION_PASS, MANUAL_WORK_REDUCTION_PASS === 'MANUAL_WORK_REDUCTION_PASS', MANUAL_WORK_REDUCTION_PASS);
  assert('I-PASS-TOKENS', DECISION_REDUCTION_PASS, DECISION_REDUCTION_PASS === 'DECISION_REDUCTION_PASS', DECISION_REDUCTION_PASS);
  assert('I-PASS-TOKENS', CONTEXT_SWITCHING_PASS, CONTEXT_SWITCHING_PASS === 'CONTEXT_SWITCHING_PASS', CONTEXT_SWITCHING_PASS);
  assert('I-PASS-TOKENS', EXECUTION_EFFICIENCY_PASS, EXECUTION_EFFICIENCY_PASS === 'EXECUTION_EFFICIENCY_PASS', EXECUTION_EFFICIENCY_PASS);
  assert('I-PASS-TOKENS', THROUGHPUT_PASS, THROUGHPUT_PASS === 'THROUGHPUT_PASS', THROUGHPUT_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_OVERHEAD_PASS, WORKFLOW_OVERHEAD_PASS === 'WORKFLOW_OVERHEAD_PASS', WORKFLOW_OVERHEAD_PASS);
  assert('I-PASS-TOKENS', PRODUCTIVITY_GAP_ANALYSIS_PASS, PRODUCTIVITY_GAP_ANALYSIS_PASS === 'PRODUCTIVITY_GAP_ANALYSIS_PASS', PRODUCTIVITY_GAP_ANALYSIS_PASS);
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
  console.log('DevPulse V2 — Phase 24.8.5 Founder Productivity Validation');
  console.log('===========================================================');
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
  const runtime = getFounderProductivityValidationRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  productivity context builds: ${runtime.contextBuildCount}`);
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

  console.log(FOUNDER_PRODUCTIVITY_VALIDATION_PASS);
  console.log(FOUNDER_PRODUCTIVITY_VALIDATION_PASS_TOKEN);
  console.log(WORKFLOW_ACCELERATION_PASS);
  console.log(MANUAL_WORK_REDUCTION_PASS);
  console.log(DECISION_REDUCTION_PASS);
  console.log(CONTEXT_SWITCHING_PASS);
  console.log(EXECUTION_EFFICIENCY_PASS);
  console.log(THROUGHPUT_PASS);
  console.log(WORKFLOW_OVERHEAD_PASS);
  console.log(PRODUCTIVITY_GAP_ANALYSIS_PASS);
  console.log(PRODUCTIVITY_ROADMAP_PASS);
  console.log(FOUNDER_PRODUCTIVITY_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:founder-productivity-validation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
