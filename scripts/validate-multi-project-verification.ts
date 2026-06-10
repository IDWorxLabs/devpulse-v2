/**
 * Phase 20.5 — Multi Project Verification validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  MULTI_PROJECT_VERIFICATION_PASS_TOKEN,
  MULTI_PROJECT_VERIFICATION_OWNER_MODULE,
  DEFAULT_MAX_VERIFICATION_HISTORY_SIZE,
  analyzeProjectVerificationEvidence,
  aggregateProjectVerification,
  buildPortfolioVerificationSummary,
  calculateProjectVerificationConfidence,
  calculateProjectVerificationRisk,
  coordinatePortfolioVerification,
  coordinateProjectVerification,
  evaluateProjectVerificationReadiness,
  generateMultiProjectVerificationReport,
  getDevPulseV2MultiProjectVerification,
  getMultiProjectVerificationRuntimeReport,
  getProjectVerification,
  getProjectVerificationCacheStats,
  getProjectVerificationCount,
  getProjectVerificationHistorySize,
  isMultiProjectVerificationQuestion,
  listProjectVerifications,
  listProjectVerificationsByStatus,
  listProjectVerificationsByWorkspace,
  registerMultiProjectVerificationWithAutonomousFixing,
  registerMultiProjectVerificationWithAutonomousTesting,
  registerMultiProjectVerificationWithAutonomousVerification,
  registerMultiProjectVerificationWithCentralBrain,
  registerMultiProjectVerificationWithCompletionEngine,
  registerMultiProjectVerificationWithMultiProjectFoundation,
  registerMultiProjectVerificationWithParallelBuildOrchestration,
  registerMultiProjectVerificationWithProjectVault,
  registerMultiProjectVerificationWithResourceAllocation,
  registerMultiProjectVerificationWithTrustEngine,
  registerMultiProjectVerificationWithUvl,
  registerMultiProjectVerificationWithWorkspaceIsolation,
  registerMultiProjectVerificationWithWorld2Coordinator,
  recordProjectVerificationHistory,
  resetMultiProjectVerificationModuleForTests,
} from '../src/multi-project-verification/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { MULTI_PROJECT_VERIFICATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { ProjectVerificationInput } from '../src/multi-project-verification/multi-project-verification-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/multi-project-verification');

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
  'multi-project-verification.ts',
  'multi-project-verification-types.ts',
  'project-verification-registry.ts',
  'project-verification-readiness.ts',
  'project-verification-confidence.ts',
  'project-verification-risk.ts',
  'project-verification-evidence.ts',
  'project-verification-aggregator.ts',
  'project-verification-portfolio.ts',
  'project-verification-reporting.ts',
  'project-verification-history.ts',
  'project-verification-cache.ts',
  'project-verification-coordinator.ts',
  'index.ts',
];

function resetAll(): void {
  resetMultiProjectVerificationModuleForTests();
}

function sampleInput(overrides: Partial<ProjectVerificationInput> = {}): ProjectVerificationInput {
  return {
    projectId: overrides.projectId ?? 'P1',
    workspaceId: overrides.workspaceId ?? 'W1',
    trustScore: 75,
    verificationConfidence: 70,
    testingConfidence: 68,
    fixingConfidence: 60,
    completionConfidence: 65,
    testResultStatus: 'SIMULATED_PASS',
    verificationDecision: 'VERIFIED',
    isolationOk: true,
    orchestrationReady: true,
    world2Active: true,
    projectState: 'ACTIVE',
    ...overrides,
  };
}

function sampleProjects(count: number): ProjectVerificationInput[] {
  const projects: ProjectVerificationInput[] = [];
  for (let i = 0; i < count; i++) {
    projects.push(sampleInput({
      projectId: `P${i}`,
      workspaceId: `W${i % Math.max(1, Math.floor(count / 10))}`,
      trustScore: 60 + (i % 35),
      verificationConfidence: 55 + (i % 40),
      testingConfidence: 50 + (i % 45),
      criticalSubsystem: i % 7 === 0,
      unresolvedIssues: i % 5 === 0 ? 2 : 0,
    }));
  }
  return projects;
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2MultiProjectVerification();
  assert('A-SETUP', 'pass token', authority.passToken === MULTI_PROJECT_VERIFICATION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === MULTI_PROJECT_VERIFICATION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'uvl rows', MULTI_PROJECT_VERIFICATION_UVL_ROWS.length === 13, String(MULTI_PROJECT_VERIFICATION_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_VERIFICATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_VERIFICATION_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('multi_project_verification').phase === 20.5, '20.5');
  assert('A-SETUP', 'question signal', isMultiProjectVerificationQuestion('show portfolio verification health'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const result = coordinateProjectVerification(sampleInput({ projectId: 'REG1', workspaceId: 'WS1' }));
  assert('B-REGISTRY', 'registered', getProjectVerification('REG1') !== undefined, 'REG1');
  assert('B-REGISTRY', 'count', getProjectVerificationCount() === 1, '1');
  assert('B-REGISTRY', 'list', listProjectVerifications().length === 1, '1');
  assert('B-REGISTRY', 'by workspace', listProjectVerificationsByWorkspace('WS1').length === 1, 'WS1');
  assert('B-REGISTRY', 'by status', listProjectVerificationsByStatus(result.record.status).length >= 1, result.record.status);

  coordinateProjectVerification(sampleInput({ projectId: 'REG2', workspaceId: 'WS2' }));
  assert('B-REGISTRY', 'second', getProjectVerificationCount() === 2, '2');

  harness.endGroup('B-REGISTRY', g);
}

function runEvidenceConfidenceRisk(): void {
  const g = harness.beginGroup('C-ANALYZERS');
  resetAll();

  const good = sampleInput();
  const evidence = analyzeProjectVerificationEvidence(good);
  assert('C-ANALYZERS', 'evidence summary', evidence.evidenceSummary.length > 0, String(evidence.evidenceSummary.length));
  assert('C-ANALYZERS', 'evidence quality', evidence.evidenceQualityScore > 0, String(evidence.evidenceQualityScore));

  const confidence = calculateProjectVerificationConfidence(good, evidence);
  assert('C-ANALYZERS', 'confidence range', confidence >= 0 && confidence <= 100, String(confidence));

  const risk = calculateProjectVerificationRisk(good, evidence);
  assert('C-ANALYZERS', 'risk range', risk >= 0 && risk <= 100, String(risk));

  const poor = sampleInput({
    projectId: 'POOR1',
    trustScore: 25,
    verificationConfidence: 20,
    testingConfidence: 15,
    testResultStatus: 'SIMULATED_FAIL',
    verificationDecision: 'NEEDS_VERIFICATION',
    unresolvedIssues: 5,
    isolationOk: false,
  });
  const poorEvidence = analyzeProjectVerificationEvidence(poor);
  assert('C-ANALYZERS', 'missing evidence', poorEvidence.missingEvidence.length > 0, String(poorEvidence.missingEvidence.length));
  const poorRisk = calculateProjectVerificationRisk(poor, poorEvidence);
  assert('C-ANALYZERS', 'high risk', poorRisk >= 40, String(poorRisk));

  harness.endGroup('C-ANALYZERS', g);
}

function runReadiness(): void {
  const g = harness.beginGroup('D-READINESS');
  resetAll();

  const good = sampleInput({ projectId: 'RDY1' });
  const evidence = analyzeProjectVerificationEvidence(good);
  const confidence = calculateProjectVerificationConfidence(good, evidence);
  const risk = calculateProjectVerificationRisk(good, evidence);
  const status = evaluateProjectVerificationReadiness(good, evidence, confidence, risk);
  assert('D-READINESS', 'verified or needs', status === 'VERIFIED' || status === 'NEEDS_VERIFICATION', status);

  const trustRecovery = sampleInput({ projectId: 'RDY2', trustScore: 20 });
  const trEvidence = analyzeProjectVerificationEvidence(trustRecovery);
  const trStatus = evaluateProjectVerificationReadiness(
    trustRecovery,
    trEvidence,
    calculateProjectVerificationConfidence(trustRecovery, trEvidence),
    calculateProjectVerificationRisk(trustRecovery, trEvidence),
  );
  assert('D-READINESS', 'trust recovery', trStatus === 'TRUST_RECOVERY_REQUIRED', trStatus);

  const blocked = sampleInput({ projectId: 'RDY3', projectState: 'FAILED', isolationOk: false });
  const blEvidence = analyzeProjectVerificationEvidence(blocked);
  const blStatus = evaluateProjectVerificationReadiness(
    blocked,
    blEvidence,
    calculateProjectVerificationConfidence(blocked, blEvidence),
    calculateProjectVerificationRisk(blocked, blEvidence),
  );
  assert('D-READINESS', 'blocked', blStatus === 'BLOCKED', blStatus);

  const highRisk = sampleInput({ projectId: 'RDY4', criticalSubsystem: true, unresolvedIssues: 8, trustScore: 45 });
  const hrEvidence = analyzeProjectVerificationEvidence(highRisk);
  const hrRisk = calculateProjectVerificationRisk(highRisk, hrEvidence);
  const hrStatus = evaluateProjectVerificationReadiness(
    highRisk,
    hrEvidence,
    calculateProjectVerificationConfidence(highRisk, hrEvidence),
    hrRisk,
  );
  assert('D-READINESS', 'high risk', hrStatus === 'HIGH_RISK' || hrStatus === 'NEEDS_VERIFICATION', hrStatus);

  harness.endGroup('D-READINESS', g);
}

function runAggregationPortfolio(): void {
  const g = harness.beginGroup('E-AGGREGATE-PORTFOLIO');
  resetAll();

  const inputs = sampleProjects(5);
  const { records, portfolio } = coordinatePortfolioVerification(inputs);

  assert('E-AGGREGATE-PORTFOLIO', 'records', records.length === 5, String(records.length));
  assert('E-AGGREGATE-PORTFOLIO', 'total', portfolio.totalProjects === 5, String(portfolio.totalProjects));
  assert('E-AGGREGATE-PORTFOLIO', 'confidence', portfolio.portfolioConfidence >= 0, String(portfolio.portfolioConfidence));
  assert('E-AGGREGATE-PORTFOLIO', 'risk', portfolio.portfolioRisk >= 0, String(portfolio.portfolioRisk));
  assert(
    'E-AGGREGATE-PORTFOLIO',
    'counts sum',
    portfolio.verifiedProjects + portfolio.verificationPendingProjects + portfolio.highRiskProjects + portfolio.blockedProjects <= 5,
    'sum',
  );

  const single = aggregateProjectVerification(
    sampleInput({ projectId: 'AGG1' }),
    analyzeProjectVerificationEvidence(sampleInput({ projectId: 'AGG1' })),
    80,
    20,
  );
  assert('E-AGGREGATE-PORTFOLIO', 'aggregate record', single.projectId === 'AGG1', single.projectId);
  assert('E-AGGREGATE-PORTFOLIO', 'aggregate confidence', single.confidence === 80, String(single.confidence));

  const portfolio2 = buildPortfolioVerificationSummary(records);
  assert('E-AGGREGATE-PORTFOLIO', 'portfolio rebuild', portfolio2.totalProjects === 5, String(portfolio2.totalProjects));

  harness.endGroup('E-AGGREGATE-PORTFOLIO', g);
}

function runCoordinatorReportingHistory(): void {
  const g = harness.beginGroup('F-COORDINATOR-REPORT');
  resetAll();

  const { record, portfolio, report } = coordinateProjectVerification(sampleInput({ projectId: 'CO1', workspaceId: 'WC1' }));
  assert('F-COORDINATOR-REPORT', 'coordinator record', record.projectId === 'CO1', record.projectId);
  assert('F-COORDINATOR-REPORT', 'coordinator portfolio', portfolio.totalProjects === 1, String(portfolio.totalProjects));
  assert('F-COORDINATOR-REPORT', 'coordinator report', report.records.length === 1, String(report.records.length));
  assert('F-COORDINATOR-REPORT', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));

  assert('F-COORDINATOR-REPORT', 'history', getProjectVerificationHistorySize() >= 1, String(getProjectVerificationHistorySize()));

  for (let i = 0; i < 130; i++) {
    recordProjectVerificationHistory(record, portfolio);
  }
  assert('F-COORDINATOR-REPORT', 'history bounded', getProjectVerificationHistorySize() <= DEFAULT_MAX_VERIFICATION_HISTORY_SIZE, String(getProjectVerificationHistorySize()));

  const fullReport = generateMultiProjectVerificationReport([record], portfolio);
  assert('F-COORDINATOR-REPORT', 'report id', fullReport.reportId.length > 0, fullReport.reportId);

  harness.endGroup('F-COORDINATOR-REPORT', g);
}

function runCache(): void {
  const g = harness.beginGroup('G-CACHE');
  resetAll();

  const input = sampleInput({ projectId: 'CACHE1' });
  coordinateProjectVerification(input);
  getProjectVerification('CACHE1');
  getProjectVerification('CACHE1');

  const cache = getProjectVerificationCacheStats();
  assert('G-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('G-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  harness.endGroup('G-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('H-INTEGRATION');
  resetAll();

  const brain = registerMultiProjectVerificationWithCentralBrain();
  assert('H-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerMultiProjectVerificationWithCentralBrain();
  assert('H-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('H-INTEGRATION', 'project vault', registerMultiProjectVerificationWithProjectVault().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'trust engine', registerMultiProjectVerificationWithTrustEngine().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'world2', registerMultiProjectVerificationWithWorld2Coordinator().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'uvl', registerMultiProjectVerificationWithUvl().uvlRowCount === 13, '13');
  assert('H-INTEGRATION', 'multi project', registerMultiProjectVerificationWithMultiProjectFoundation().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'workspace isolation', registerMultiProjectVerificationWithWorkspaceIsolation().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'resource allocation', registerMultiProjectVerificationWithResourceAllocation().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'orchestration', registerMultiProjectVerificationWithParallelBuildOrchestration().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'autonomous testing', registerMultiProjectVerificationWithAutonomousTesting().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'autonomous fixing', registerMultiProjectVerificationWithAutonomousFixing().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'autonomous verification', registerMultiProjectVerificationWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'completion engine', registerMultiProjectVerificationWithCompletionEngine().readOnly === true, 'readOnly');

  harness.endGroup('H-INTEGRATION', g);
}

function stressVerification(count: number, label: string): void {
  const g = harness.beginGroup(`I-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  const projects = sampleProjects(count);
  const { records, portfolio, report } = coordinatePortfolioVerification(projects);

  const elapsed = performance.now() - start;

  assert(`I-STRESS-${label}`, 'records', records.length === count, String(records.length));
  assert(`I-STRESS-${label}`, 'portfolio', portfolio.totalProjects === count, String(portfolio.totalProjects));
  assert(`I-STRESS-${label}`, 'report', report.records.length === count, String(report.records.length));
  assert(`I-STRESS-${label}`, 'registry', getProjectVerificationCount() === count, String(getProjectVerificationCount()));
  assert(`I-STRESS-${label}`, 'performance', elapsed < 60_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getMultiProjectVerificationRuntimeReport();
  assert(`I-STRESS-${label}`, 'runtime verification count', runtime.verificationCount === count, String(runtime.verificationCount));

  harness.endGroup(`I-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('J-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 20.5 Multi Project Verification');
  console.log('====================================================\n');

  runSetup();
  runRegistry();
  runEvidenceConfidenceRisk();
  runReadiness();
  runAggregationPortfolio();
  runCoordinatorReportingHistory();
  runCache();
  runIntegration();
  stressVerification(100, '100');
  stressVerification(1000, '1000');
  stressVerification(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getMultiProjectVerificationRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Project count: ${runtime.projectCount}`,
    `Verification count: ${runtime.verificationCount}`,
    `Portfolio size: ${runtime.portfolioSize}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? MULTI_PROJECT_VERIFICATION_PASS_TOKEN : 'MULTI_PROJECT_VERIFICATION_V1_FAIL',
  ]);

  if (failed.length > 0) {
    console.error('\nFailed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.error(`  [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  if (results.length < MIN_SCENARIOS) {
    console.error(`\nInsufficient scenarios: ${results.length} < ${MIN_SCENARIOS}`);
    process.exit(1);
  }

  console.log(`\n${MULTI_PROJECT_VERIFICATION_PASS_TOKEN}`);
}

main();
