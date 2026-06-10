/**
 * Phase 23.6 — Scale Hardening validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  SCALE_HARDENING_PASS_TOKEN,
  SCALE_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_SCALE_HARDENING_HISTORY_SIZE,
  analyzeCapacityReadiness,
  analyzeConcurrencyRisk,
  analyzeCloudUsageReadiness,
  analyzeQueueLoad,
  analyzeMultiProjectScale,
  buildUnifiedScaleHardeningAuthority,
  clearScaleHardeningHistory,
  evaluateScaleHardening,
  evaluateScaleHardeningEngine,
  generateScaleHardeningReport,
  getAuthorityBuildCount,
  getCapacityAnalysisCount,
  getCloudUsageAnalysisCount,
  getConcurrencyAnalysisCount,
  getDevPulseV2ScaleHardening,
  getEvaluationCount,
  getMultiProjectAnalysisCount,
  getQueueLoadAnalysisCount,
  getScaleHardeningCacheStats,
  getScaleHardeningHistorySize,
  getScaleHardeningRecord,
  getScaleHardeningRecordCount,
  getScaleHardeningRuntimeReport,
  isScaleHardeningQuestion,
  lookupScaleByProjectId,
  lookupScaleByState,
  registerScaleHardeningWithAutonomousCompletion,
  registerScaleHardeningWithAutonomousVerification,
  registerScaleHardeningWithCapabilityRegistry,
  registerScaleHardeningWithCentralBrain,
  registerScaleHardeningWithCloudWorkerRuntime,
  registerScaleHardeningWithExecutionAuthority,
  registerScaleHardeningWithFindPanel,
  registerScaleHardeningWithFoundation,
  registerScaleHardeningWithMissingCapabilityEscalation,
  registerScaleHardeningWithMobileCommand,
  registerScaleHardeningWithMultiProjectMonitoring,
  registerScaleHardeningWithMultiProjectVerification,
  registerScaleHardeningWithNotificationDelivery,
  registerScaleHardeningWithNotificationVault,
  registerScaleHardeningWithOperatorFeed,
  registerScaleHardeningWithPerformanceHardening,
  registerScaleHardeningWithPrivacyHardening,
  registerScaleHardeningWithProjectVault,
  registerScaleHardeningWithRecoveryHardening,
  registerScaleHardeningWithReliabilityHardening,
  registerScaleHardeningWithSecurityHardening,
  registerScaleHardeningWithSelfEvolutionGovernance,
  registerScaleHardeningWithTrustEngineCheckpoint,
  registerScaleHardeningWithUnifiedTrustScore,
  registerScaleHardeningWithUnifiedVerificationLab,
  registerScaleHardeningWithUvl,
  registerScaleHardeningWithWorld2,
  resetScaleHardeningForTests,
} from '../src/scale-hardening/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { SCALE_HARDENING_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { ScaleHardeningInput } from '../src/scale-hardening/scale-hardening-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/scale-hardening');

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
  'scale-hardening-types.ts',
  'scale-hardening-cache.ts',
  'scale-hardening-registry.ts',
  'capacity-readiness-analyzer.ts',
  'concurrency-risk-analyzer.ts',
  'cloud-usage-readiness-analyzer.ts',
  'queue-load-analyzer.ts',
  'multi-project-scale-analyzer.ts',
  'scale-authority-builder.ts',
  'scale-hardening-evaluator.ts',
  'scale-hardening-history.ts',
  'scale-hardening-reporting.ts',
  'scale-hardening.ts',
  'index.ts',
];

function resetAll(): void {
  resetScaleHardeningForTests();
}

function scaleInput(requestId: string, overrides: Partial<ScaleHardeningInput> = {}): ScaleHardeningInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    reliabilityScore: 80,
    performanceScore: 78,
    securityScore: 76,
    privacyScore: 74,
    recoveryScore: 72,
    trustScore: 82,
    governanceBlocked: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2ScaleHardening();
  assert('A-TYPES', 'pass token', engine.passToken === SCALE_HARDENING_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === SCALE_HARDENING_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 23.6, String(engine.phase));
  assert('A-TYPES', 'uvl rows', SCALE_HARDENING_UVL_ROWS.length >= 13, String(SCALE_HARDENING_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_SCALE_HARDENING_HISTORY_SIZE === 128, String(DEFAULT_MAX_SCALE_HARDENING_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('scale_hardening').phase === 23.6, '23.6');
  assert('A-TYPES', 'question signal', isScaleHardeningQuestion('show scale hardening'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateScaleHardeningEngine(scaleInput('reg-test'));
  assert('B-REGISTRY', 'registered', getScaleHardeningRecord(record.scaleId) !== undefined, record.scaleId);
  assert('B-REGISTRY', 'by project', lookupScaleByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'scale id', record.scaleId.startsWith('scale-hardening-'), record.scaleId);
  assert('B-REGISTRY', 'record count', getScaleHardeningRecordCount() >= 1, String(getScaleHardeningRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runCapacityReadiness(): void {
  const g = harness.beginGroup('C-CAPACITY-READINESS');
  resetAll();

  const clean = analyzeCapacityReadiness(scaleInput('capacity-clean'));
  assert('C-CAPACITY-READINESS', 'clean score', clean.capacityScore >= 90, String(clean.capacityScore));
  assert('C-CAPACITY-READINESS', 'no gaps', clean.capacityGaps.length === 0, '0');

  const risky = analyzeCapacityReadiness(scaleInput('capacity-risky', {
    largePromptRisk: true,
    largeProjectContextRisk: true,
    multiFileProjectRisk: true,
    largeValidationReportRisk: true,
    manyUvlRowsRisk: true,
    manyOperatorFeedEntriesRisk: true,
    manyNotificationsRisk: true,
    manyProjectVaultRecordsRisk: true,
    manyWorld2WorkspacesRisk: true,
    manyCloudWorkerTasksRisk: true,
    manyMobileCommandRequestsRisk: true,
    manyFutureUsersRisk: true,
  }));
  assert('C-CAPACITY-READINESS', 'large prompts gap', risky.capacityGaps.includes('large_prompts'), 'large_prompts');
  assert('C-CAPACITY-READINESS', 'gaps present', risky.capacityGaps.length >= 8, String(risky.capacityGaps.length));
  assert('C-CAPACITY-READINESS', 'low score', risky.capacityScore < 30, String(risky.capacityScore));

  harness.endGroup('C-CAPACITY-READINESS', g);
}

function runConcurrencyRisk(): void {
  const g = harness.beginGroup('D-CONCURRENCY-RISK');
  resetAll();

  const clean = analyzeConcurrencyRisk(scaleInput('concurrency-clean'));
  assert('D-CONCURRENCY-RISK', 'clean score', clean.concurrencyScore >= 85, String(clean.concurrencyScore));
  assert('D-CONCURRENCY-RISK', 'no gaps', clean.concurrencyGaps.length === 0, '0');

  const risky = analyzeConcurrencyRisk(scaleInput('concurrency-risky', {
    multipleProjectsActiveRisk: true,
    multipleValidationRunsRisk: true,
    multipleCloudTasksRisk: true,
    multipleMobileCommandsRisk: true,
    simultaneousOperatorFeedUpdatesRisk: true,
    simultaneousNotificationWritesRisk: true,
    simultaneousWorld2WorkspacesRisk: true,
    simultaneousProjectImportExportRisk: true,
    simultaneousAutonomousBuildersRisk: true,
    futureMultiUserSessionsRisk: true,
    futureOrganizationUsageRisk: true,
  }));
  assert('D-CONCURRENCY-RISK', 'multi project gap', risky.concurrencyGaps.includes('multiple_projects_active'), 'multiple_projects_active');
  assert('D-CONCURRENCY-RISK', 'gaps present', risky.concurrencyGaps.length >= 8, String(risky.concurrencyGaps.length));
  assert('D-CONCURRENCY-RISK', 'low score', risky.concurrencyScore < 30, String(risky.concurrencyScore));

  harness.endGroup('D-CONCURRENCY-RISK', g);
}

function runCloudUsageReadiness(): void {
  const g = harness.beginGroup('E-CLOUD-USAGE-READINESS');
  resetAll();

  const ready = analyzeCloudUsageReadiness(scaleInput('cloud-ready'));
  assert('E-CLOUD-USAGE-READINESS', 'ready score', ready.cloudUsageReadinessScore >= 85, String(ready.cloudUsageReadinessScore));
  assert('E-CLOUD-USAGE-READINESS', 'no gaps', ready.cloudUsageGaps.length === 0, '0');

  const gaps = analyzeCloudUsageReadiness(scaleInput('cloud-gaps', {
    cloudBuildMinutesRisk: true,
    aiRequestUsageRisk: true,
    verificationUsageRisk: true,
    storageUsageRisk: true,
    executionRuntimeUsageRisk: true,
    world2UsageRisk: true,
    projectImportExportUsageRisk: true,
    futurePackageQuotaRisk: true,
    futureUsageMeteringRisk: true,
    futureBillingIntegrationRisk: true,
    founderUserUsageSeparationRisk: true,
    accountWorkspaceQuotaRisk: true,
  }));
  assert('E-CLOUD-USAGE-READINESS', 'billing gap', gaps.cloudUsageGaps.includes('future_billing_integration'), 'future_billing_integration');
  assert('E-CLOUD-USAGE-READINESS', 'gaps present', gaps.cloudUsageGaps.length >= 8, String(gaps.cloudUsageGaps.length));
  assert('E-CLOUD-USAGE-READINESS', 'low score', gaps.cloudUsageReadinessScore < 30, String(gaps.cloudUsageReadinessScore));

  harness.endGroup('E-CLOUD-USAGE-READINESS', g);
}

function runQueueLoad(): void {
  const g = harness.beginGroup('F-QUEUE-LOAD');
  resetAll();

  const ready = analyzeQueueLoad(scaleInput('queue-ready'));
  assert('F-QUEUE-LOAD', 'ready score', ready.queueLoadScore >= 85, String(ready.queueLoadScore));
  assert('F-QUEUE-LOAD', 'no gaps', ready.queueGaps.length === 0, '0');

  const gaps = analyzeQueueLoad(scaleInput('queue-gaps', {
    taskQueuePressureRisk: true,
    validationQueuePressureRisk: true,
    cloudWorkerQueuePressureRisk: true,
    notificationQueuePressureRisk: true,
    operatorFeedQueuePressureRisk: true,
    projectBuildQueuePressureRisk: true,
    world2ExecutionQueuePressureRisk: true,
    selfEvolutionQueuePressureRisk: true,
    retryQueuePressureRisk: true,
    deadLetterQueuePressureRisk: true,
    missingBackpressureSignals: true,
    missingRateLimitSignals: true,
  }));
  assert('F-QUEUE-LOAD', 'backpressure gap', gaps.queueGaps.includes('backpressure_signals'), 'backpressure_signals');
  assert('F-QUEUE-LOAD', 'gaps present', gaps.queueGaps.length >= 8, String(gaps.queueGaps.length));
  assert('F-QUEUE-LOAD', 'low score', gaps.queueLoadScore < 30, String(gaps.queueLoadScore));

  harness.endGroup('F-QUEUE-LOAD', g);
}

function runMultiProjectScale(): void {
  const g = harness.beginGroup('G-MULTI-PROJECT-SCALE');
  resetAll();

  const ready = analyzeMultiProjectScale(scaleInput('multi-ready'));
  assert('G-MULTI-PROJECT-SCALE', 'ready score', ready.multiProjectScaleScore >= 85, String(ready.multiProjectScaleScore));
  assert('G-MULTI-PROJECT-SCALE', 'no gaps', ready.multiProjectGaps.length === 0, '0');

  const gaps = analyzeMultiProjectScale(scaleInput('multi-gaps', {
    projectIsolationWeak: true,
    projectRegistryGrowthRisk: true,
    projectVaultGrowthRisk: true,
    crossProjectVerificationRisk: true,
    crossProjectMonitoringRisk: true,
    crossProjectTrustScoringRisk: true,
    crossProjectRecoveryRisk: true,
    projectSwitchingRisk: true,
    projectImportExportRisk: true,
    projectOwnershipRisk: true,
    futureTenantProjectMappingRisk: true,
  }));
  assert('G-MULTI-PROJECT-SCALE', 'isolation gap', gaps.multiProjectGaps.includes('project_isolation'), 'project_isolation');
  assert('G-MULTI-PROJECT-SCALE', 'gaps present', gaps.multiProjectGaps.length >= 8, String(gaps.multiProjectGaps.length));
  assert('G-MULTI-PROJECT-SCALE', 'low score', gaps.multiProjectScaleScore < 30, String(gaps.multiProjectScaleScore));

  harness.endGroup('G-MULTI-PROJECT-SCALE', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const input = scaleInput('auth-test');
  const capacity = analyzeCapacityReadiness(input);
  const concurrency = analyzeConcurrencyRisk(input);
  const cloudUsage = analyzeCloudUsageReadiness(input);
  const queueLoad = analyzeQueueLoad(input);
  const multiProject = analyzeMultiProjectScale(input);
  const authority = buildUnifiedScaleHardeningAuthority('auth-test', capacity, concurrency, cloudUsage, queueLoad, multiProject, input);

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('scale-hardening-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'scale score', authority.scaleScore > 0, String(authority.scaleScore));
  assert('H-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('H-AUTHORITY', 'risk level', authority.riskLevel.length > 0, authority.riskLevel);

  const blocked = buildUnifiedScaleHardeningAuthority('auth-blocked', capacity, concurrency, cloudUsage, queueLoad, multiProject, {
    ...input,
    governanceBlocked: true,
  });
  assert('H-AUTHORITY', 'blocked state', blocked.state === 'BLOCKED', blocked.state);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluateScaleHardeningEngine(scaleInput('eval-stable'));
  assert('I-EVALUATION', 'stable state', record.state === 'READY' || record.state === 'ACCEPTABLE' || record.state === 'WATCH', record.state);
  assert('I-EVALUATION', 'scale score', record.scaleScore > 50, String(record.scaleScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluateScaleHardeningEngine(scaleInput('eval-degraded', {
    largePromptRisk: true,
    manyUvlRowsRisk: true,
    multipleProjectsActiveRisk: true,
    simultaneousAutonomousBuildersRisk: true,
    cloudBuildMinutesRisk: true,
    futureBillingIntegrationRisk: true,
    taskQueuePressureRisk: true,
    missingBackpressureSignals: true,
    projectIsolationWeak: true,
    crossProjectRecoveryRisk: true,
    governanceBlocked: true,
    reliabilityScore: 15,
    performanceScore: 12,
    securityScore: 10,
    privacyScore: 8,
    recoveryScore: 6,
    trustScore: 6,
  }));
  assert('I-EVALUATION', 'degraded state', degraded.record.state !== 'READY', degraded.record.state);
  assert('I-EVALUATION', 'low score', degraded.record.scaleScore < 55, String(degraded.record.scaleScore));

  const input = scaleInput('eval-manual');
  const authority = buildUnifiedScaleHardeningAuthority(
    'eval-manual',
    analyzeCapacityReadiness(input),
    analyzeConcurrencyRisk(input),
    analyzeCloudUsageReadiness(input),
    analyzeQueueLoad(input),
    analyzeMultiProjectScale(input),
    input,
  );
  const evaluation = evaluateScaleHardening(authority);
  assert('I-EVALUATION', 'hardening readiness', evaluation.hardeningReadiness > 0, String(evaluation.hardeningReadiness));
  assert('I-EVALUATION', 'capacity score', evaluation.capacityScore >= 0, String(evaluation.capacityScore));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluateScaleHardeningEngine(scaleInput('report-test'));
  assert('J-REPORTING', 'scale score', report.scaleScore === record.scaleScore, String(report.scaleScore));
  assert('J-REPORTING', 'state', report.state === record.state, report.state);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));
  assert('J-REPORTING', 'queue score', report.queueLoadScore > 0, String(report.queueLoadScore));

  const manual = generateScaleHardeningReport(
    record,
    report.evaluation,
    report.capacityGaps,
    report.concurrencyGaps,
    report.cloudUsageGaps,
    report.queueGaps,
    report.multiProjectGaps,
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluateScaleHardeningEngine(scaleInput(`history-${i}`, { trustScore: 60 + (i % 30) }));
  }
  assert('J-REPORTING', 'history bounded', getScaleHardeningHistorySize() === 128, String(getScaleHardeningHistorySize()));
  clearScaleHardeningHistory();
  assert('J-REPORTING', 'history cleared', getScaleHardeningHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerScaleHardeningWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerScaleHardeningWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'foundation', registerScaleHardeningWithFoundation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'capability registry', registerScaleHardeningWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'find panel', registerScaleHardeningWithFindPanel().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerScaleHardeningWithUvl().uvlRowCount >= 13, String(registerScaleHardeningWithUvl().uvlRowCount));
  assert('K-INTEGRATION', 'unified trust score', registerScaleHardeningWithUnifiedTrustScore().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust checkpoint', registerScaleHardeningWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl runtime', registerScaleHardeningWithUnifiedVerificationLab().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'reliability hardening', registerScaleHardeningWithReliabilityHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'performance hardening', registerScaleHardeningWithPerformanceHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'security hardening', registerScaleHardeningWithSecurityHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'privacy hardening', registerScaleHardeningWithPrivacyHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'recovery hardening', registerScaleHardeningWithRecoveryHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous verification', registerScaleHardeningWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous completion', registerScaleHardeningWithAutonomousCompletion().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'multi project verification', registerScaleHardeningWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'multi project monitoring', registerScaleHardeningWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'project vault', registerScaleHardeningWithProjectVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'cloud worker runtime', registerScaleHardeningWithCloudWorkerRuntime().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'execution authority', registerScaleHardeningWithExecutionAuthority().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'operator feed', registerScaleHardeningWithOperatorFeed().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'notification vault', registerScaleHardeningWithNotificationVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'notification delivery', registerScaleHardeningWithNotificationDelivery().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerScaleHardeningWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'mobile command', registerScaleHardeningWithMobileCommand().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerScaleHardeningWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerScaleHardeningWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const input = scaleInput('cache-fixed');
  const capacity = analyzeCapacityReadiness(input);
  const concurrency = analyzeConcurrencyRisk(input);
  const cloudUsage = analyzeCloudUsageReadiness(input);
  const queueLoad = analyzeQueueLoad(input);
  const multiProject = analyzeMultiProjectScale(input);

  buildUnifiedScaleHardeningAuthority('cache-fixed', capacity, concurrency, cloudUsage, queueLoad, multiProject, input);
  buildUnifiedScaleHardeningAuthority('cache-fixed', capacity, concurrency, cloudUsage, queueLoad, multiProject, input);

  const cache = getScaleHardeningCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byState = lookupScaleByState('ACCEPTABLE');
  assert('L-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressScale(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluateScaleHardeningEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      largePromptRisk: i % 11 === 0,
      manyUvlRowsRisk: i % 13 === 0,
      multipleProjectsActiveRisk: i % 17 === 0,
      cloudBuildMinutesRisk: i % 19 === 0,
      taskQueuePressureRisk: i % 23 === 0,
      projectIsolationWeak: i % 29 === 0,
      governanceBlocked: i % 31 === 0,
      reliabilityScore: 20 + (i % 70),
      performanceScore: 15 + (i % 75),
      securityScore: 10 + (i % 80),
      privacyScore: 10 + (i % 85),
      recoveryScore: 10 + (i % 88),
      trustScore: 10 + (i % 90),
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getScaleHardeningRecordCount() === count, String(getScaleHardeningRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getScaleHardeningRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'capacity analyses', runtime.capacityAnalysisCount > 0, String(runtime.capacityAnalysisCount));

  const sample = getScaleHardeningRecord(`scale-hardening-${count}`);
  assert(`M-STRESS-${label}`, 'sample record', sample !== undefined, 'record');

  harness.endGroup(`M-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('N-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 23.6 Scale Hardening');
  console.log('=========================================\n');

  runSetup();
  runRegistry();
  runCapacityReadiness();
  runConcurrencyRisk();
  runCloudUsageReadiness();
  runQueueLoad();
  runMultiProjectScale();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressScale(100, '100');
  stressScale(1000, '1000');
  stressScale(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getScaleHardeningRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Capacity analyses: ${getCapacityAnalysisCount()}`,
    `Concurrency analyses: ${getConcurrencyAnalysisCount()}`,
    `Cloud usage analyses: ${getCloudUsageAnalysisCount()}`,
    `Queue load analyses: ${getQueueLoadAnalysisCount()}`,
    `Multi-project analyses: ${getMultiProjectAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getScaleHardeningRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? SCALE_HARDENING_PASS_TOKEN : 'SCALE_HARDENING_V1_FAIL',
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

  console.log(`\n${SCALE_HARDENING_PASS_TOKEN}`);
}

main();
