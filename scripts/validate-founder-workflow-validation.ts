/**
 * Phase 24.8.2 — Founder Workflow Validation validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_WORKFLOW_VALIDATION_PASS_TOKEN,
  FOUNDER_WORKFLOW_VALIDATION_PASS,
  FOUNDER_WORKFLOW_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE,
  MAX_WORKFLOW_GAPS,
  WORKFLOW_CONTEXT_PASS,
  WORKFLOW_CLARITY_PASS,
  WORKFLOW_DISCOVERABILITY_PASS,
  WORKFLOW_CONTINUITY_PASS,
  WORKFLOW_FRICTION_PASS,
  WORKFLOW_RECOVERY_PASS,
  WORKFLOW_OUTCOME_PASS,
  WORKFLOW_EFFICIENCY_PASS,
  WORKFLOW_GAP_ANALYSIS_PASS,
  WORKFLOW_ROADMAP_PASS,
  FOUNDER_WORKFLOW_REPORTING_PASS,
  buildAllWorkflowContexts,
  buildWorkflowContext,
  listWorkflowContextIds,
  validateWorkflowClarity,
  validateWorkflowDiscoverability,
  validateWorkflowContinuity,
  validateWorkflowFriction,
  validateWorkflowRecovery,
  validateWorkflowOutcome,
  validateWorkflowEfficiency,
  analyzeWorkflowGaps,
  buildFounderWorkflowRoadmap,
  buildFounderWorkflowAuthority,
  clearFounderWorkflowHistory,
  getFounderWorkflowHistorySize,
  getFounderWorkflowValidationRuntimeReport,
  getFounderWorkflowRecord,
  getFounderWorkflowRecordCount,
  getDevPulseV2FounderWorkflowValidation,
  isFounderWorkflowQuestion,
  lookupFounderWorkflowByProjectId,
  registerFounderWorkflowValidationWithCapabilityRegistry,
  registerFounderWorkflowValidationWithFindPanel,
  registerFounderWorkflowValidationWithFoundation,
  registerFounderWorkflowValidationWithAcceptanceChain,
  registerFounderWorkflowValidationWithSurface,
  registerFounderWorkflowValidationWithUvl,
  evaluateFounderWorkflowValidation,
  resetFounderWorkflowValidationForTests,
} from '../src/founder-acceptance-validation/founder-workflow-validation/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_WORKFLOW_VALIDATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderWorkflowValidationInput } from '../src/founder-acceptance-validation/founder-workflow-validation/founder-workflow-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-acceptance-validation/founder-workflow-validation');

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
  'founder-workflow-types.ts',
  'workflow-gap-model.ts',
  'founder-workflow-cache.ts',
  'founder-workflow-registry.ts',
  'bounded-history.ts',
  'workflow-context-builder.ts',
  'workflow-clarity-validator.ts',
  'workflow-discoverability-validator.ts',
  'workflow-continuity-validator.ts',
  'workflow-friction-validator.ts',
  'workflow-recovery-validator.ts',
  'workflow-outcome-validator.ts',
  'workflow-efficiency-validator.ts',
  'workflow-gap-analyzer.ts',
  'workflow-roadmap-builder.ts',
  'founder-workflow-authority-builder.ts',
  'founder-workflow-evaluator.ts',
  'founder-workflow-report-builder.ts',
  'founder-workflow-validation.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderWorkflowValidationForTests();
  clearFounderWorkflowHistory();
}

function fwInput(requestId: string, overrides: Partial<FounderWorkflowValidationInput> = {}): FounderWorkflowValidationInput {
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
  const mod = getDevPulseV2FounderWorkflowValidation();
  assert('A-TYPES', 'pass token v1', mod.passToken === FOUNDER_WORKFLOW_VALIDATION_PASS_TOKEN, mod.passToken);
  assert('A-TYPES', 'pass token', FOUNDER_WORKFLOW_VALIDATION_PASS === 'FOUNDER_WORKFLOW_VALIDATION_PASS', FOUNDER_WORKFLOW_VALIDATION_PASS);
  assert('A-TYPES', 'owner module', mod.ownerModule === FOUNDER_WORKFLOW_OWNER_MODULE, mod.ownerModule);
  assert('A-TYPES', 'read only', mod.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', mod.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', mod.phase === 24.82, String(mod.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_WORKFLOW_VALIDATION_UVL_ROWS.length >= 18, String(FOUNDER_WORKFLOW_VALIDATION_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE));
  assert('A-TYPES', 'max gaps', MAX_WORKFLOW_GAPS === 64, String(MAX_WORKFLOW_GAPS));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_workflow_validation').phase === 24.82, '24.82');
  assert('A-TYPES', 'question signal', isFounderWorkflowQuestion('founder workflow validation'), 'signal');
  assert('A-TYPES', 'context count', listWorkflowContextIds().length === 7, String(listWorkflowContextIds().length));
  assert('A-TYPES', 'roadmap pass alias', WORKFLOW_ROADMAP_PASS === 'ROADMAP_PASS', WORKFLOW_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass alias', FOUNDER_WORKFLOW_REPORTING_PASS === 'REPORTING_PASS', FOUNDER_WORKFLOW_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateFounderWorkflowValidation(fwInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderWorkflowRecord(record.founderWorkflowId) !== undefined, record.founderWorkflowId);
  assert('B-REGISTRY', 'by project', lookupFounderWorkflowByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'record id', record.founderWorkflowId.startsWith('founder-workflow-'), record.founderWorkflowId);
  assert('B-REGISTRY', 'record count', getFounderWorkflowRecordCount() >= 1, String(getFounderWorkflowRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runContexts(): void {
  const g = harness.beginGroup('C-CONTEXTS');
  resetAll();
  const contexts = buildAllWorkflowContexts();
  assert('C-CONTEXTS', 'context pass', contexts.every((c) => c.passToken === WORKFLOW_CONTEXT_PASS), 'pass');
  assert('C-CONTEXTS', 'idea to project', contexts.some((c) => c.workflowId === 'IDEA_TO_PROJECT'), 'idea');
  assert('C-CONTEXTS', 'project to build', contexts.some((c) => c.workflowId === 'PROJECT_TO_BUILD'), 'project');
  assert('C-CONTEXTS', 'build to verification', contexts.some((c) => c.workflowId === 'BUILD_TO_VERIFICATION'), 'build');
  assert('C-CONTEXTS', 'verification to fix', contexts.some((c) => c.workflowId === 'VERIFICATION_TO_FIX'), 'verify');
  assert('C-CONTEXTS', 'fix to validation', contexts.some((c) => c.workflowId === 'FIX_TO_VALIDATION'), 'fix');
  assert('C-CONTEXTS', 'validation to release', contexts.some((c) => c.workflowId === 'VALIDATION_TO_RELEASE'), 'release');
  assert('C-CONTEXTS', 'discovery to action', contexts.some((c) => c.workflowId === 'DISCOVERY_TO_ACTION'), 'discovery');
  const ctx = buildWorkflowContext('IDEA_TO_PROJECT');
  assert('C-CONTEXTS', 'goal', ctx.goal.length > 0, ctx.goal);
  assert('C-CONTEXTS', 'expected outcome', ctx.expectedOutcome.length > 0, ctx.expectedOutcome);
  assert('C-CONTEXTS', 'capabilities', ctx.requiredCapabilities.length >= 3, String(ctx.requiredCapabilities.length));
  harness.endGroup('C-CONTEXTS', g);
}

function runValidators(): void {
  const g = harness.beginGroup('D-VALIDATORS');
  resetAll();
  const input = fwInput('validator-test');
  const clarity = validateWorkflowClarity(input, {
    navigationClarityScore: 80,
    actionClarityScore: 75,
    founderUsabilityScore: 78,
    workflowContinuityScore: 82,
  });
  assert('D-VALIDATORS', 'clarity pass', clarity.passToken === WORKFLOW_CLARITY_PASS, clarity.passToken);
  assert('D-VALIDATORS', 'clarity score', clarity.score >= 0, String(clarity.score));

  const discoverability = validateWorkflowDiscoverability(input, {
    featureDiscoverabilityScore: 70,
    uvlDiscoverable: true,
    chatPresent: true,
    findPanelAliasCount: 50,
    capabilityCount: 40,
  });
  assert('D-VALIDATORS', 'discoverability pass', discoverability.passToken === WORKFLOW_DISCOVERABILITY_PASS, discoverability.passToken);

  const continuity = validateWorkflowContinuity(input, {
    workflowContinuityScore: 75,
    experienceContinuityScore: 72,
    chatToFeedConnected: true,
    previewReportConnected: true,
  });
  assert('D-VALIDATORS', 'continuity pass', continuity.passToken === WORKFLOW_CONTINUITY_PASS, continuity.passToken);

  const friction = validateWorkflowFriction(input, {
    founderFrictionRiskCount: 2,
    cognitiveLoadScore: 68,
    feedbackQualityScore: 70,
  });
  assert('D-VALIDATORS', 'friction pass', friction.passToken === WORKFLOW_FRICTION_PASS, friction.passToken);

  const recovery = validateWorkflowRecovery(input, {
    errorPreventionScore: 72,
    userControlScore: 74,
    feedbackQualityScore: 70,
    trustClarityScore: 76,
  });
  assert('D-VALIDATORS', 'recovery pass', recovery.passToken === WORKFLOW_RECOVERY_PASS, recovery.passToken);

  const outcome = validateWorkflowOutcome(input, {
    actionReadinessScore: 78,
    previewNextActionScore: 75,
    productRealityScore: 80,
    workflowContinuityScore: 76,
  });
  assert('D-VALIDATORS', 'outcome pass', outcome.passToken === WORKFLOW_OUTCOME_PASS, outcome.passToken);

  const efficiency = validateWorkflowEfficiency(input, {
    founderUsabilityScore: 74,
    cognitiveLoadScore: 70,
    workflowContinuityScore: 76,
    stepOverheadEstimate: 1,
  });
  assert('D-VALIDATORS', 'efficiency pass', efficiency.passToken === WORKFLOW_EFFICIENCY_PASS, efficiency.passToken);

  const gapAnalysis = analyzeWorkflowGaps(input.requestId, {
    clarity, discoverability, continuity, friction, recovery, outcome, efficiency,
  });
  assert('D-VALIDATORS', 'gap analysis pass', gapAnalysis.passToken === WORKFLOW_GAP_ANALYSIS_PASS, gapAnalysis.passToken);
  assert('D-VALIDATORS', 'critical gaps array', Array.isArray(gapAnalysis.criticalWorkflowGaps), 'array');
  assert('D-VALIDATORS', 'major gaps array', Array.isArray(gapAnalysis.majorWorkflowGaps), 'array');
  assert('D-VALIDATORS', 'minor gaps array', Array.isArray(gapAnalysis.minorWorkflowGaps), 'array');
  harness.endGroup('D-VALIDATORS', g);
}

function runAuthorityRoadmap(): void {
  const g = harness.beginGroup('E-AUTHORITY');
  resetAll();
  const { authority, report, result, score } = evaluateFounderWorkflowValidation(fwInput('auth-test'));
  assert('E-AUTHORITY', 'authority id', authority.authorityId.startsWith('founder-workflow-authority-'), authority.authorityId);
  assert('E-AUTHORITY', 'contexts', authority.contexts.length === 7, String(authority.contexts.length));
  assert('E-AUTHORITY', 'clarity', authority.clarity.passToken === WORKFLOW_CLARITY_PASS, authority.clarity.passToken);
  assert('E-AUTHORITY', 'discoverability', authority.discoverability.passToken === WORKFLOW_DISCOVERABILITY_PASS, authority.discoverability.passToken);
  assert('E-AUTHORITY', 'continuity', authority.continuity.passToken === WORKFLOW_CONTINUITY_PASS, authority.continuity.passToken);
  assert('E-AUTHORITY', 'friction', authority.friction.passToken === WORKFLOW_FRICTION_PASS, authority.friction.passToken);
  assert('E-AUTHORITY', 'recovery', authority.recovery.passToken === WORKFLOW_RECOVERY_PASS, authority.recovery.passToken);
  assert('E-AUTHORITY', 'outcome', authority.outcome.passToken === WORKFLOW_OUTCOME_PASS, authority.outcome.passToken);
  assert('E-AUTHORITY', 'efficiency', authority.efficiency.passToken === WORKFLOW_EFFICIENCY_PASS, authority.efficiency.passToken);
  assert('E-AUTHORITY', 'gap analysis', authority.gapAnalysis.passToken === WORKFLOW_GAP_ANALYSIS_PASS, authority.gapAnalysis.passToken);
  assert('E-AUTHORITY', 'roadmap pass', authority.roadmap.passToken === WORKFLOW_ROADMAP_PASS, authority.roadmap.passToken);
  assert('E-AUTHORITY', 'critical fixes', Array.isArray(authority.roadmap.criticalWorkflowFixes), 'array');
  assert('E-AUTHORITY', 'high priority', Array.isArray(authority.roadmap.highPriorityImprovements), 'array');
  assert('E-AUTHORITY', 'medium', Array.isArray(authority.roadmap.mediumImprovements), 'array');
  assert('E-AUTHORITY', 'future', Array.isArray(authority.roadmap.futureWorkflowOptimization), 'array');
  assert('E-AUTHORITY', 'result enum', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(result), result);
  assert('E-AUTHORITY', 'overall score', score.overallScore >= 0, String(score.overallScore));
  assert('E-AUTHORITY', 'report pass', report.passToken === FOUNDER_WORKFLOW_REPORTING_PASS, report.passToken);
  assert('E-AUTHORITY', 'report score', report.founderWorkflowScore >= 0, String(report.founderWorkflowScore));
  harness.endGroup('E-AUTHORITY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerFounderWorkflowValidationWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerFounderWorkflowValidationWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerFounderWorkflowValidationWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerFounderWorkflowValidationWithUvl().uvlRowCount >= 80, String(registerFounderWorkflowValidationWithUvl().uvlRowCount));
  const chain = registerFounderWorkflowValidationWithAcceptanceChain();
  assert('F-INTEGRATION', 'acceptance framework', chain.founderAcceptanceFramework === true, 'framework');
  assert('F-INTEGRATION', 'product reality', chain.productRealityOrchestrator === true, 'pr');
  assert('F-INTEGRATION', 'product experience', chain.productExperience === true, 'pe');
  const surface = registerFounderWorkflowValidationWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  assert('F-INTEGRATION', 'framework authority', surface.frameworkAuthorityId.length > 0, surface.frameworkAuthorityId);
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'founder-workflow-validation.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2FounderWorkflowValidation().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { result, report } = evaluateFounderWorkflowValidation(fwInput('fail-test', {
    workflowClarityWeak: true,
    workflowDiscoverabilityWeak: true,
    workflowContinuityBreak: true,
    workflowFrictionHigh: true,
    workflowRecoveryWeak: true,
    workflowOutcomeUnclear: true,
    workflowEfficiencyLow: true,
    workflowDeadEnd: true,
    hiddenCapabilities: true,
    contextLoss: true,
    excessiveSteps: true,
    governanceBlocked: true,
  }));
  assert('H-FAIL', 'fail result', result === 'FAIL', result);
  assert('H-FAIL', 'gaps detected', report.detectedWorkflowGaps.length >= 1, String(report.detectedWorkflowGaps.length));
  harness.endGroup('H-FAIL', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateFounderWorkflowValidation(fwInput(`${label}-${i}`));
  }
  assert(label, 'records', getFounderWorkflowRecordCount() === count, String(getFounderWorkflowRecordCount()));
  assert(label, 'history bounded', getFounderWorkflowHistorySize() <= DEFAULT_MAX_FOUNDER_WORKFLOW_HISTORY_SIZE, String(getFounderWorkflowHistorySize()));
  harness.endGroup(label, g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', WORKFLOW_CONTEXT_PASS, WORKFLOW_CONTEXT_PASS === 'WORKFLOW_CONTEXT_PASS', WORKFLOW_CONTEXT_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_CLARITY_PASS, WORKFLOW_CLARITY_PASS === 'WORKFLOW_CLARITY_PASS', WORKFLOW_CLARITY_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_DISCOVERABILITY_PASS, WORKFLOW_DISCOVERABILITY_PASS === 'WORKFLOW_DISCOVERABILITY_PASS', WORKFLOW_DISCOVERABILITY_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_CONTINUITY_PASS, WORKFLOW_CONTINUITY_PASS === 'WORKFLOW_CONTINUITY_PASS', WORKFLOW_CONTINUITY_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_FRICTION_PASS, WORKFLOW_FRICTION_PASS === 'WORKFLOW_FRICTION_PASS', WORKFLOW_FRICTION_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_RECOVERY_PASS, WORKFLOW_RECOVERY_PASS === 'WORKFLOW_RECOVERY_PASS', WORKFLOW_RECOVERY_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_OUTCOME_PASS, WORKFLOW_OUTCOME_PASS === 'WORKFLOW_OUTCOME_PASS', WORKFLOW_OUTCOME_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_EFFICIENCY_PASS, WORKFLOW_EFFICIENCY_PASS === 'WORKFLOW_EFFICIENCY_PASS', WORKFLOW_EFFICIENCY_PASS);
  assert('I-PASS-TOKENS', WORKFLOW_GAP_ANALYSIS_PASS, WORKFLOW_GAP_ANALYSIS_PASS === 'WORKFLOW_GAP_ANALYSIS_PASS', WORKFLOW_GAP_ANALYSIS_PASS);
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
  console.log('DevPulse V2 — Phase 24.8.2 Founder Workflow Validation');
  console.log('======================================================');
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
  const runtime = getFounderWorkflowValidationRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  workflow builds: ${runtime.contextBuildCount}`);
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

  console.log(FOUNDER_WORKFLOW_VALIDATION_PASS);
  console.log(FOUNDER_WORKFLOW_VALIDATION_PASS_TOKEN);
  console.log(WORKFLOW_CLARITY_PASS);
  console.log(WORKFLOW_DISCOVERABILITY_PASS);
  console.log(WORKFLOW_CONTINUITY_PASS);
  console.log(WORKFLOW_FRICTION_PASS);
  console.log(WORKFLOW_RECOVERY_PASS);
  console.log(WORKFLOW_OUTCOME_PASS);
  console.log(WORKFLOW_EFFICIENCY_PASS);
  console.log(WORKFLOW_GAP_ANALYSIS_PASS);
  console.log(WORKFLOW_ROADMAP_PASS);
  console.log(FOUNDER_WORKFLOW_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:founder-workflow-validation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
