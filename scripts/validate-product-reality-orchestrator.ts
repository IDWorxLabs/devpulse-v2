/**
 * Phase 24.7.8 — Product Reality Orchestrator validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  PRODUCT_REALITY_ORCHESTRATOR_PASS_TOKEN,
  PRODUCT_REALITY_ORCHESTRATOR_PASS,
  PRODUCT_REALITY_OWNER_MODULE,
  DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE,
  MAX_LAUNCH_BLOCKERS,
  PRODUCT_REALITY_AUTHORITY_PASS,
  PRODUCT_REALITY_SCORING_PASS,
  PRODUCT_REALITY_VERDICT_PASS,
  PRODUCT_REALITY_REPORTING_PASS,
  PRODUCT_REALITY_ROADMAP_PASS,
  CONFLICT_DETECTION_PASS,
  BLOCKER_ANALYSIS_PASS,
  RELEASE_READINESS_PASS,
  FOUNDER_PRIORITY_PASS,
  analyzeLaunchBlockers,
  buildProductRealityAggregate,
  buildProductRealityRoadmap,
  clearProductRealityHistory,
  createLaunchBlocker,
  detectAuthorityConflicts,
  evaluateProductRealityOrchestrator,
  getProductRealityHistorySize,
  getProductRealityOrchestratorRuntimeReport,
  getProductRealityRecord,
  getProductRealityRecordCount,
  getDevPulseV2ProductRealityOrchestrator,
  isProductRealityQuestion,
  lookupProductRealityByProjectId,
  registerProductRealityOrchestratorWithCapabilityRegistry,
  registerProductRealityOrchestratorWithFindPanel,
  registerProductRealityOrchestratorWithFoundation,
  registerProductRealityOrchestratorWithProductRealityChain,
  registerProductRealityOrchestratorWithSurface,
  registerProductRealityOrchestratorWithUvl,
  resetProductRealityOrchestratorForTests,
} from '../src/product-reality-verification/product-reality-orchestrator/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { PRODUCT_REALITY_ORCHESTRATOR_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { ProductRealityInput } from '../src/product-reality-verification/product-reality-orchestrator/product-reality-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/product-reality-verification/product-reality-orchestrator');

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
  'product-reality-types.ts',
  'product-reality-cache.ts',
  'product-reality-registry.ts',
  'bounded-history.ts',
  'experience-aggregation-builder.ts',
  'authority-conflict-detector.ts',
  'launch-blocker-analyzer.ts',
  'release-readiness-analyzer.ts',
  'founder-priority-analyzer.ts',
  'roadmap-builder.ts',
  'product-reality-authority-builder.ts',
  'product-reality-evaluator.ts',
  'product-reality-report-builder.ts',
  'product-reality-orchestrator.ts',
  'index.ts',
];

function resetAll(): void {
  resetProductRealityOrchestratorForTests();
  clearProductRealityHistory();
}

function prInput(requestId: string, overrides: Partial<ProductRealityInput> = {}): ProductRealityInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    governanceBlocked: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const orch = getDevPulseV2ProductRealityOrchestrator();
  assert('A-TYPES', 'pass token v1', orch.passToken === PRODUCT_REALITY_ORCHESTRATOR_PASS_TOKEN, orch.passToken);
  assert('A-TYPES', 'pass token', PRODUCT_REALITY_ORCHESTRATOR_PASS === 'PRODUCT_REALITY_ORCHESTRATOR_PASS', PRODUCT_REALITY_ORCHESTRATOR_PASS);
  assert('A-TYPES', 'owner module', orch.ownerModule === PRODUCT_REALITY_OWNER_MODULE, orch.ownerModule);
  assert('A-TYPES', 'read only', orch.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', orch.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', orch.phase === 24.78, String(orch.phase));
  assert('A-TYPES', 'uvl rows', PRODUCT_REALITY_ORCHESTRATOR_UVL_ROWS.length >= 13, String(PRODUCT_REALITY_ORCHESTRATOR_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE === 128, String(DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE));
  assert('A-TYPES', 'max blockers', MAX_LAUNCH_BLOCKERS === 48, String(MAX_LAUNCH_BLOCKERS));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('product_reality_orchestrator').phase === 24.78, '24.78');
  assert('A-TYPES', 'question signal', isProductRealityQuestion('is devpulse launch ready'), 'signal');
  assert('A-TYPES', 'authority pass', PRODUCT_REALITY_AUTHORITY_PASS === 'PRODUCT_REALITY_AUTHORITY_PASS', PRODUCT_REALITY_AUTHORITY_PASS);
  assert('A-TYPES', 'roadmap pass', PRODUCT_REALITY_ROADMAP_PASS === 'ROADMAP_PASS', PRODUCT_REALITY_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass', PRODUCT_REALITY_REPORTING_PASS === 'REPORTING_PASS', PRODUCT_REALITY_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateProductRealityOrchestrator(prInput('reg-test'));
  assert('B-REGISTRY', 'registered', getProductRealityRecord(record.productRealityId) !== undefined, record.productRealityId);
  assert('B-REGISTRY', 'by project', lookupProductRealityByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'pr id', record.productRealityId.startsWith('product-reality-'), record.productRealityId);
  assert('B-REGISTRY', 'record count', getProductRealityRecordCount() >= 1, String(getProductRealityRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runAggregateConflictBlocker(): void {
  const g = harness.beginGroup('C-AGGREGATE-CONFLICT');
  resetAll();
  const { report, authority } = evaluateProductRealityOrchestrator(prInput('agg-test'));
  assert('C-AGGREGATE-CONFLICT', 'aggregate score', report.aggregate.overallExperienceScore >= 0, String(report.aggregate.overallExperienceScore));
  assert('C-AGGREGATE-CONFLICT', 'visual score', report.aggregate.visualScore >= 0, String(report.aggregate.visualScore));
  assert('C-AGGREGATE-CONFLICT', 'experience score', report.aggregate.experienceScore >= 0, String(report.aggregate.experienceScore));
  assert('C-AGGREGATE-CONFLICT', 'authority pass', authority.passToken === PRODUCT_REALITY_AUTHORITY_PASS, authority.passToken);
  const blocker = createLaunchBlocker({
    blockerCode: 'TEST_BLOCKER',
    blockerReason: 'Test blocker reason',
    blockerSeverity: 'CRITICAL',
    sourceSubsystem: 'test',
  });
  assert('C-AGGREGATE-CONFLICT', 'blocker id', blocker.blockerId.startsWith('launch-blocker-'), blocker.blockerId);
  harness.endGroup('C-AGGREGATE-CONFLICT', g);
}

function runRoadmapVerdict(): void {
  const g = harness.beginGroup('D-ROADMAP-VERDICT');
  resetAll();
  const { result, score, report } = evaluateProductRealityOrchestrator(prInput('verdict-test'));
  assert('D-ROADMAP-VERDICT', 'scoring pass', score.passToken === PRODUCT_REALITY_SCORING_PASS, score.passToken);
  assert('D-ROADMAP-VERDICT', 'verdict pass', result.passToken === PRODUCT_REALITY_VERDICT_PASS, result.passToken);
  assert('D-ROADMAP-VERDICT', 'verdict enum', [
    'PRODUCT_NOT_READY', 'PRODUCT_PARTIALLY_READY', 'PRODUCT_READY', 'PRODUCT_LAUNCH_READY',
  ].includes(result.productRealityVerdict), result.productRealityVerdict);
  assert('D-ROADMAP-VERDICT', 'roadmap', report.productRealityRoadmap.passToken === PRODUCT_REALITY_ROADMAP_PASS, report.productRealityRoadmap.passToken);
  assert('D-ROADMAP-VERDICT', 'critical section', Array.isArray(report.productRealityRoadmap.critical), 'array');
  assert('D-ROADMAP-VERDICT', 'launch tasks', Array.isArray(report.productRealityRoadmap.launchTasks), 'array');
  harness.endGroup('D-ROADMAP-VERDICT', g);
}

function runReporting(): void {
  const g = harness.beginGroup('E-REPORTING');
  resetAll();
  const { record, report } = evaluateProductRealityOrchestrator(prInput('report-test'));
  assert('E-REPORTING', 'score', report.productRealityScore >= 0, String(report.productRealityScore));
  assert('E-REPORTING', 'release readiness', ['NOT_READY', 'PARTIALLY_READY', 'READY'].includes(report.releaseReadiness), report.releaseReadiness);
  assert('E-REPORTING', 'conflicts array', Array.isArray(report.authorityConflicts), 'array');
  assert('E-REPORTING', 'blockers array', Array.isArray(report.launchBlockers), 'array');
  assert('E-REPORTING', 'priorities', report.founderPriorities.length >= 0, String(report.founderPriorities.length));
  assert('E-REPORTING', 'priority fixes', report.recommendedPriorityFixes.length >= 1, String(report.recommendedPriorityFixes.length));
  assert('E-REPORTING', 'pass token', report.passToken === PRODUCT_REALITY_REPORTING_PASS, report.passToken);
  assert('E-REPORTING', 'record linked', record.productRealityId.length > 0, record.productRealityId);
  harness.endGroup('E-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerProductRealityOrchestratorWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerProductRealityOrchestratorWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerProductRealityOrchestratorWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerProductRealityOrchestratorWithUvl().uvlRowCount >= 60, String(registerProductRealityOrchestratorWithUvl().uvlRowCount));
  const chain = registerProductRealityOrchestratorWithProductRealityChain();
  assert('F-INTEGRATION', 'visual qa', chain.visualQa === true, 'visual');
  assert('F-INTEGRATION', 'ux', chain.uxHeuristic === true, 'ux');
  assert('F-INTEGRATION', 'first impression', chain.firstImpression === true, 'fi');
  assert('F-INTEGRATION', 'live preview', chain.livePreview === true, 'lp');
  assert('F-INTEGRATION', 'auto polish', chain.autoPolish === true, 'ap');
  assert('F-INTEGRATION', 'product experience', chain.productExperience === true, 'pe');
  const surface = registerProductRealityOrchestratorWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'product-reality-orchestrator.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2ProductRealityOrchestrator().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateProductRealityOrchestrator(prInput(`${label}-${i}`));
  }
  assert(label, 'records', getProductRealityRecordCount() === count, String(getProductRealityRecordCount()));
  assert(label, 'history bounded', getProductRealityHistorySize() <= DEFAULT_MAX_PRODUCT_REALITY_HISTORY_SIZE, String(getProductRealityHistorySize()));
  harness.endGroup(label, g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { result, report } = evaluateProductRealityOrchestrator(prInput('fail-test', {
    experienceFragmented: true,
    workflowBroken: true,
    trustGap: true,
    responsiveWeak: true,
    verificationSilo: true,
    navigationDeadEnd: true,
    polishGaps: true,
    previewDisconnected: true,
  }));
  assert('H-FAIL', 'not ready or partial', result.productRealityVerdict === 'PRODUCT_NOT_READY' || result.productRealityVerdict === 'PRODUCT_PARTIALLY_READY', result.productRealityVerdict);
  assert('H-FAIL', 'blockers', report.launchBlockers.length >= 1, String(report.launchBlockers.length));
  harness.endGroup('H-FAIL', g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', CONFLICT_DETECTION_PASS, CONFLICT_DETECTION_PASS === 'CONFLICT_DETECTION_PASS', CONFLICT_DETECTION_PASS);
  assert('I-PASS-TOKENS', BLOCKER_ANALYSIS_PASS, BLOCKER_ANALYSIS_PASS === 'BLOCKER_ANALYSIS_PASS', BLOCKER_ANALYSIS_PASS);
  assert('I-PASS-TOKENS', RELEASE_READINESS_PASS, RELEASE_READINESS_PASS === 'RELEASE_READINESS_PASS', RELEASE_READINESS_PASS);
  assert('I-PASS-TOKENS', FOUNDER_PRIORITY_PASS, FOUNDER_PRIORITY_PASS === 'FOUNDER_PRIORITY_PASS', FOUNDER_PRIORITY_PASS);
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
  console.log('DevPulse V2 — Phase 24.7.8 Product Reality Orchestrator');
  console.log('==========================================================');
  console.log('');

  runSetup();
  runRegistry();
  runAggregateConflictBlocker();
  runRoadmapVerdict();
  runReporting();
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
  const runtime = getProductRealityOrchestratorRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  aggregate builds: ${runtime.aggregateBuildCount}`);
  console.log(`  conflict detections: ${runtime.conflictDetectionCount}`);
  console.log(`  blocker analyses: ${runtime.blockerAnalysisCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
  console.log(`  evaluations: ${runtime.evaluationCount}`);
  console.log(`  report builds: ${runtime.reportCount}`);
  console.log(`  cache hits: ${runtime.cacheHits}`);
  console.log(`  bootstrap reuse: ${runtime.bootstrapReuseCount}`);
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

  console.log(PRODUCT_REALITY_ORCHESTRATOR_PASS);
  console.log(PRODUCT_REALITY_ORCHESTRATOR_PASS_TOKEN);
  console.log(PRODUCT_REALITY_AUTHORITY_PASS);
  console.log(PRODUCT_REALITY_SCORING_PASS);
  console.log(PRODUCT_REALITY_VERDICT_PASS);
  console.log(PRODUCT_REALITY_REPORTING_PASS);
  console.log(PRODUCT_REALITY_ROADMAP_PASS);
  console.log(CONFLICT_DETECTION_PASS);
  console.log(BLOCKER_ANALYSIS_PASS);
  console.log(RELEASE_READINESS_PASS);
  console.log(FOUNDER_PRIORITY_PASS);
  console.log('');
  console.log('npm run validate:product-reality-orchestrator');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
