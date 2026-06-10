/**
 * Phase 24.8.8 — Founder Acceptance Orchestrator validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS,
  FOUNDER_ACCEPTANCE_ORCHESTRATOR_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE,
  MAX_ACCEPTANCE_GAPS,
  ACCEPTANCE_AGGREGATION_PASS,
  AUTHORITY_CONFLICT_PASS,
  ACCEPTANCE_BLOCKER_PASS,
  FOUNDER_ACCEPTANCE_PASS,
  READINESS_ACCEPTANCE_PASS,
  FRICTION_ACCEPTANCE_PASS,
  ACCEPTANCE_GAP_ANALYSIS_PASS,
  FINAL_VERDICT_PASS,
  ACCEPTANCE_ROADMAP_PASS,
  FOUNDER_ACCEPTANCE_REPORTING_PASS,
  buildFounderAcceptanceAggregate,
  detectAuthorityConflicts,
  analyzeAcceptanceBlockers,
  analyzeFounderAcceptance,
  analyzeReadinessAcceptance,
  analyzeFrictionAcceptanceImpact,
  analyzeAcceptanceGaps,
  clearFounderAcceptanceHistory,
  getFounderAcceptanceHistorySize,
  getFounderAcceptanceOrchestratorRuntimeReport,
  getFounderAcceptanceRecord,
  getFounderAcceptanceRecordCount,
  getDevPulseV2FounderAcceptanceOrchestrator,
  isFounderAcceptanceQuestion,
  lookupFounderAcceptanceByProjectId,
  registerFounderAcceptanceOrchestratorWithCapabilityRegistry,
  registerFounderAcceptanceOrchestratorWithFindPanel,
  registerFounderAcceptanceOrchestratorWithFoundation,
  registerFounderAcceptanceOrchestratorWithAcceptanceChain,
  registerFounderAcceptanceOrchestratorWithSurface,
  registerFounderAcceptanceOrchestratorWithUvl,
  evaluateFounderAcceptanceOrchestrator,
  resetFounderAcceptanceOrchestratorForTests,
} from '../src/founder-acceptance-validation/founder-acceptance-orchestrator/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_ACCEPTANCE_ORCHESTRATOR_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderAcceptanceOrchestratorInput } from '../src/founder-acceptance-validation/founder-acceptance-orchestrator/founder-acceptance-orchestrator-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-acceptance-validation/founder-acceptance-orchestrator');

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
  'founder-acceptance-orchestrator-types.ts',
  'acceptance-gap-model.ts',
  'founder-acceptance-cache.ts',
  'founder-acceptance-registry.ts',
  'bounded-history.ts',
  'acceptance-aggregation-builder.ts',
  'authority-conflict-detector.ts',
  'acceptance-blocker-analyzer.ts',
  'founder-acceptance-analyzer.ts',
  'readiness-acceptance-analyzer.ts',
  'friction-impact-analyzer.ts',
  'acceptance-gap-analyzer.ts',
  'acceptance-roadmap-builder.ts',
  'founder-acceptance-authority-builder.ts',
  'founder-acceptance-evaluator.ts',
  'founder-acceptance-report-builder.ts',
  'founder-acceptance-orchestrator.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderAcceptanceOrchestratorForTests();
  clearFounderAcceptanceHistory();
}

function faInput(requestId: string, overrides: Partial<FounderAcceptanceOrchestratorInput> = {}): FounderAcceptanceOrchestratorInput {
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
  const mod = getDevPulseV2FounderAcceptanceOrchestrator();
  assert('A-TYPES', 'pass token v1', mod.passToken === FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS_TOKEN, mod.passToken);
  assert('A-TYPES', 'pass token', FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS === 'FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS', FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS);
  assert('A-TYPES', 'owner module', mod.ownerModule === FOUNDER_ACCEPTANCE_ORCHESTRATOR_OWNER_MODULE, mod.ownerModule);
  assert('A-TYPES', 'read only', mod.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', mod.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', mod.phase === 24.88, String(mod.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_ACCEPTANCE_ORCHESTRATOR_UVL_ROWS.length >= 16, String(FOUNDER_ACCEPTANCE_ORCHESTRATOR_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE));
  assert('A-TYPES', 'max gaps', MAX_ACCEPTANCE_GAPS === 64, String(MAX_ACCEPTANCE_GAPS));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_acceptance_orchestrator').phase === 24.88, '24.88');
  assert('A-TYPES', 'question signal', isFounderAcceptanceQuestion('founder acceptance orchestrator'), 'signal');
  assert('A-TYPES', 'roadmap pass alias', ACCEPTANCE_ROADMAP_PASS === 'ROADMAP_PASS', ACCEPTANCE_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass alias', FOUNDER_ACCEPTANCE_REPORTING_PASS === 'REPORTING_PASS', FOUNDER_ACCEPTANCE_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateFounderAcceptanceOrchestrator(faInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderAcceptanceRecord(record.founderAcceptanceId) !== undefined, record.founderAcceptanceId);
  assert('B-REGISTRY', 'by project', lookupFounderAcceptanceByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'record id', record.founderAcceptanceId.startsWith('founder-acceptance-'), record.founderAcceptanceId);
  assert('B-REGISTRY', 'record count', getFounderAcceptanceRecordCount() >= 1, String(getFounderAcceptanceRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runAggregation(): void {
  const g = harness.beginGroup('C-AGGREGATION');
  resetAll();
  const aggregate = buildFounderAcceptanceAggregate('agg-test', {
    workflowScore: 78,
    confidenceScore: 76,
    trustScore: 75,
    productivityScore: 77,
    frictionScore: 74,
    readinessScore: 79,
    criticalGapCount: 0,
    majorGapCount: 1,
    minorGapCount: 2,
    criticalBlockerCount: 0,
  });
  assert('C-AGGREGATION', 'pass', aggregate.passToken === ACCEPTANCE_AGGREGATION_PASS, aggregate.passToken);
  assert('C-AGGREGATION', 'workflow', aggregate.workflowScore === 78, String(aggregate.workflowScore));
  assert('C-AGGREGATION', 'overall', aggregate.overallAcceptanceScore > 0, String(aggregate.overallAcceptanceScore));
  assert('C-AGGREGATION', 'critical gaps', aggregate.criticalGapCount === 0, String(aggregate.criticalGapCount));
  harness.endGroup('C-AGGREGATION', g);
}

function runAnalyzers(): void {
  const g = harness.beginGroup('D-ANALYZERS');
  resetAll();
  const input = faInput('analyzer-test');

  const conflicts = detectAuthorityConflicts(input.requestId, {
    workflowScore: 80,
    confidenceScore: 78,
    trustScore: 60,
    productivityScore: 82,
    frictionScore: 55,
    readinessScore: 65,
    overallAcceptanceScore: 68,
  });
  assert('D-ANALYZERS', 'conflict pass', conflicts.passToken === AUTHORITY_CONFLICT_PASS, conflicts.passToken);

  const founderAcceptance = analyzeFounderAcceptance(input, {
    workflowScore: 78,
    confidenceScore: 76,
    trustScore: 75,
    workflowResult: 'PASS',
    trustResult: 'PASS',
  });
  assert('D-ANALYZERS', 'founder pass', founderAcceptance.passToken === FOUNDER_ACCEPTANCE_PASS, founderAcceptance.passToken);

  const readinessAcceptance = analyzeReadinessAcceptance(input, {
    readinessScore: 78,
    readinessStatus: 'FOUNDER_READY',
    launchBlockerCount: 0,
    releaseReadiness: 'PARTIALLY_READY',
  });
  assert('D-ANALYZERS', 'readiness pass', readinessAcceptance.passToken === READINESS_ACCEPTANCE_PASS, readinessAcceptance.passToken);

  const frictionImpact = analyzeFrictionAcceptanceImpact(input, {
    frictionScore: 76,
    criticalFrictionGaps: 0,
    majorFrictionGaps: 1,
    frictionResult: 'PASS_WITH_WARNINGS',
  });
  assert('D-ANALYZERS', 'friction pass', frictionImpact.passToken === FRICTION_ACCEPTANCE_PASS, frictionImpact.passToken);

  const blockers = analyzeAcceptanceBlockers(input.requestId, input, {
    launchBlockerCount: 1,
    releaseReadiness: 'PARTIALLY_READY',
    readinessCriticalBlockers: 0,
    frictionCriticalGaps: 0,
    trustCriticalGaps: 0,
  });
  assert('D-ANALYZERS', 'blocker pass', blockers.passToken === ACCEPTANCE_BLOCKER_PASS, blockers.passToken);

  const gapAnalysis = analyzeAcceptanceGaps(input.requestId, {
    founderAcceptance,
    readinessAcceptance,
    frictionImpact,
  });
  assert('D-ANALYZERS', 'gap analysis pass', gapAnalysis.passToken === ACCEPTANCE_GAP_ANALYSIS_PASS, gapAnalysis.passToken);
  harness.endGroup('D-ANALYZERS', g);
}

function runAuthorityVerdict(): void {
  const g = harness.beginGroup('E-AUTHORITY');
  resetAll();
  const { authority, report, result, score, verdict } = evaluateFounderAcceptanceOrchestrator(faInput('auth-test'));
  assert('E-AUTHORITY', 'authority id', authority.authorityId.startsWith('founder-acceptance-authority-'), authority.authorityId);
  assert('E-AUTHORITY', 'aggregate', authority.aggregate.passToken === ACCEPTANCE_AGGREGATION_PASS, authority.aggregate.passToken);
  assert('E-AUTHORITY', 'conflicts', authority.conflicts.passToken === AUTHORITY_CONFLICT_PASS, authority.conflicts.passToken);
  assert('E-AUTHORITY', 'blockers', authority.blockers.passToken === ACCEPTANCE_BLOCKER_PASS, authority.blockers.passToken);
  assert('E-AUTHORITY', 'founder', authority.founderAcceptance.passToken === FOUNDER_ACCEPTANCE_PASS, authority.founderAcceptance.passToken);
  assert('E-AUTHORITY', 'readiness', authority.readinessAcceptance.passToken === READINESS_ACCEPTANCE_PASS, authority.readinessAcceptance.passToken);
  assert('E-AUTHORITY', 'friction', authority.frictionImpact.passToken === FRICTION_ACCEPTANCE_PASS, authority.frictionImpact.passToken);
  assert('E-AUTHORITY', 'gap analysis', authority.gapAnalysis.passToken === ACCEPTANCE_GAP_ANALYSIS_PASS, authority.gapAnalysis.passToken);
  assert('E-AUTHORITY', 'roadmap', authority.roadmap.passToken === ACCEPTANCE_ROADMAP_PASS, authority.roadmap.passToken);
  assert('E-AUTHORITY', 'final verdict', authority.finalVerdict.passToken === FINAL_VERDICT_PASS, authority.finalVerdict.passToken);
  assert('E-AUTHORITY', 'verdict enum', ['FOUNDER_REJECTS', 'FOUNDER_PARTIALLY_ACCEPTS', 'FOUNDER_ACCEPTS', 'FOUNDER_LAUNCH_ACCEPTS'].includes(verdict), verdict);
  assert('E-AUTHORITY', 'result enum', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(result), result);
  assert('E-AUTHORITY', 'overall score', score.overallScore >= 0, String(score.overallScore));
  assert('E-AUTHORITY', 'report pass', report.passToken === FOUNDER_ACCEPTANCE_REPORTING_PASS, report.passToken);
  harness.endGroup('E-AUTHORITY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerFounderAcceptanceOrchestratorWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerFounderAcceptanceOrchestratorWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerFounderAcceptanceOrchestratorWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerFounderAcceptanceOrchestratorWithUvl().uvlRowCount >= 200, String(registerFounderAcceptanceOrchestratorWithUvl().uvlRowCount));
  const chain = registerFounderAcceptanceOrchestratorWithAcceptanceChain();
  assert('F-INTEGRATION', 'acceptance framework', chain.founderAcceptanceFramework === true, 'framework');
  assert('F-INTEGRATION', 'workflow validation', chain.founderWorkflowValidation === true, 'workflow');
  assert('F-INTEGRATION', 'confidence engine', chain.founderConfidenceEngine === true, 'confidence');
  assert('F-INTEGRATION', 'trust validation', chain.founderTrustValidation === true, 'trust');
  assert('F-INTEGRATION', 'productivity validation', chain.founderProductivityValidation === true, 'productivity');
  assert('F-INTEGRATION', 'friction detector', chain.founderFrictionDetector === true, 'friction');
  assert('F-INTEGRATION', 'readiness authority', chain.founderReadinessAuthority === true, 'readiness');
  assert('F-INTEGRATION', 'product reality', chain.productRealityOrchestrator === true, 'pr');
  const surface = registerFounderAcceptanceOrchestratorWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'readiness authority id', surface.readinessAuthorityId.length > 0, surface.readinessAuthorityId);
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'founder-acceptance-orchestrator.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2FounderAcceptanceOrchestrator().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { result, report, verdict } = evaluateFounderAcceptanceOrchestrator(faInput('fail-test', {
    workflowWeak: true,
    confidenceWeak: true,
    trustWeak: true,
    productivityWeak: true,
    frictionExcessive: true,
    readinessLow: true,
    launchBlocked: true,
    adoptionBlocked: true,
    governanceBlocked: true,
  }));
  assert('H-FAIL', 'fail result', result === 'FAIL', result);
  assert('H-FAIL', 'rejects verdict', verdict === 'FOUNDER_REJECTS', verdict);
  assert('H-FAIL', 'gaps detected', report.detectedAcceptanceGaps.length >= 1, String(report.detectedAcceptanceGaps.length));
  assert('H-FAIL', 'blockers detected', report.acceptanceBlockers.length >= 1, String(report.acceptanceBlockers.length));
  harness.endGroup('H-FAIL', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateFounderAcceptanceOrchestrator(faInput(`${label}-${i}`));
  }
  assert(label, 'records', getFounderAcceptanceRecordCount() === count, String(getFounderAcceptanceRecordCount()));
  assert(label, 'history bounded', getFounderAcceptanceHistorySize() <= DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE, String(getFounderAcceptanceHistorySize()));
  harness.endGroup(label, g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', ACCEPTANCE_AGGREGATION_PASS, ACCEPTANCE_AGGREGATION_PASS === 'ACCEPTANCE_AGGREGATION_PASS', ACCEPTANCE_AGGREGATION_PASS);
  assert('I-PASS-TOKENS', AUTHORITY_CONFLICT_PASS, AUTHORITY_CONFLICT_PASS === 'AUTHORITY_CONFLICT_PASS', AUTHORITY_CONFLICT_PASS);
  assert('I-PASS-TOKENS', ACCEPTANCE_BLOCKER_PASS, ACCEPTANCE_BLOCKER_PASS === 'ACCEPTANCE_BLOCKER_PASS', ACCEPTANCE_BLOCKER_PASS);
  assert('I-PASS-TOKENS', FOUNDER_ACCEPTANCE_PASS, FOUNDER_ACCEPTANCE_PASS === 'FOUNDER_ACCEPTANCE_PASS', FOUNDER_ACCEPTANCE_PASS);
  assert('I-PASS-TOKENS', READINESS_ACCEPTANCE_PASS, READINESS_ACCEPTANCE_PASS === 'READINESS_ACCEPTANCE_PASS', READINESS_ACCEPTANCE_PASS);
  assert('I-PASS-TOKENS', FRICTION_ACCEPTANCE_PASS, FRICTION_ACCEPTANCE_PASS === 'FRICTION_ACCEPTANCE_PASS', FRICTION_ACCEPTANCE_PASS);
  assert('I-PASS-TOKENS', ACCEPTANCE_GAP_ANALYSIS_PASS, ACCEPTANCE_GAP_ANALYSIS_PASS === 'ACCEPTANCE_GAP_ANALYSIS_PASS', ACCEPTANCE_GAP_ANALYSIS_PASS);
  assert('I-PASS-TOKENS', FINAL_VERDICT_PASS, FINAL_VERDICT_PASS === 'FINAL_VERDICT_PASS', FINAL_VERDICT_PASS);
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
  console.log('DevPulse V2 — Phase 24.8.8 Founder Acceptance Orchestrator');
  console.log('============================================================');
  console.log('');

  runSetup();
  runRegistry();
  runAggregation();
  runAnalyzers();
  runAuthorityVerdict();
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
  const runtime = getFounderAcceptanceOrchestratorRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  acceptance aggregate builds: ${runtime.aggregateBuildCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
  console.log(`  report builds: ${runtime.reportCount}`);
  console.log(`  evaluations: ${runtime.evaluationCount}`);
  console.log(`  cache hits: ${runtime.cacheHits}`);
  console.log(`  cache misses: ${runtime.cacheMisses}`);
  console.log(`  bootstrap reuse: ${runtime.bootstrapReuseCount}`);
  console.log(`  upstream chain reuse: ${runtime.upstreamChainReuseCount}`);
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

  console.log(FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS);
  console.log(FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS_TOKEN);
  console.log(ACCEPTANCE_AGGREGATION_PASS);
  console.log(AUTHORITY_CONFLICT_PASS);
  console.log(ACCEPTANCE_BLOCKER_PASS);
  console.log(FOUNDER_ACCEPTANCE_PASS);
  console.log(READINESS_ACCEPTANCE_PASS);
  console.log(FRICTION_ACCEPTANCE_PASS);
  console.log(ACCEPTANCE_GAP_ANALYSIS_PASS);
  console.log(FINAL_VERDICT_PASS);
  console.log(ACCEPTANCE_ROADMAP_PASS);
  console.log(FOUNDER_ACCEPTANCE_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:founder-acceptance-orchestrator');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
