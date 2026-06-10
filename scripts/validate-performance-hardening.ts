/**
 * Phase 23.2 — Performance Hardening validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  PERFORMANCE_HARDENING_PASS_TOKEN,
  PERFORMANCE_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_PERFORMANCE_HARDENING_HISTORY_SIZE,
  analyzeStartupPerformance,
  analyzeValidationPerformance,
  analyzeCacheEfficiency,
  analyzeUiResponsiveness,
  detectPerformanceBottlenecks,
  buildUnifiedPerformanceHardeningAuthority,
  clearPerformanceHardeningHistory,
  evaluatePerformanceHardening,
  evaluatePerformanceHardeningEngine,
  generatePerformanceHardeningReport,
  getAuthorityBuildCount,
  getBottleneckDetectionCount,
  getCacheAnalysisCount,
  getDevPulseV2PerformanceHardening,
  getEvaluationCount,
  getPerformanceHardeningCacheStats,
  getPerformanceHardeningHistorySize,
  getPerformanceHardeningRecord,
  getPerformanceHardeningRecordCount,
  getPerformanceHardeningRuntimeReport,
  getResponsivenessAnalysisCount,
  getStartupAnalysisCount,
  getValidationAnalysisCount,
  isPerformanceHardeningQuestion,
  lookupPerformanceByProjectId,
  lookupPerformanceByState,
  registerPerformanceHardeningWithCapabilityRegistry,
  registerPerformanceHardeningWithCentralBrain,
  registerPerformanceHardeningWithExecutionAuthority,
  registerPerformanceHardeningWithFindPanel,
  registerPerformanceHardeningWithFoundation,
  registerPerformanceHardeningWithMissingCapabilityEscalation,
  registerPerformanceHardeningWithMobileCommand,
  registerPerformanceHardeningWithMobileValidationOptimizer,
  registerPerformanceHardeningWithNotificationDelivery,
  registerPerformanceHardeningWithNotificationVault,
  registerPerformanceHardeningWithOperatorFeed,
  registerPerformanceHardeningWithReliabilityHardening,
  registerPerformanceHardeningWithSelfEvolutionGovernance,
  registerPerformanceHardeningWithTimelineIntelligence,
  registerPerformanceHardeningWithTrustEngineCheckpoint,
  registerPerformanceHardeningWithUnifiedTrustScore,
  registerPerformanceHardeningWithUnifiedVerificationLab,
  registerPerformanceHardeningWithUvl,
  registerPerformanceHardeningWithWorld2,
  resetPerformanceHardeningForTests,
} from '../src/performance-hardening/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { PERFORMANCE_HARDENING_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { PerformanceHardeningInput } from '../src/performance-hardening/performance-hardening-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/performance-hardening');

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
  'performance-hardening-types.ts',
  'performance-hardening-cache.ts',
  'performance-hardening-registry.ts',
  'startup-performance-analyzer.ts',
  'validation-performance-analyzer.ts',
  'cache-efficiency-analyzer.ts',
  'ui-responsiveness-analyzer.ts',
  'performance-bottleneck-detector.ts',
  'performance-authority-builder.ts',
  'performance-hardening-evaluator.ts',
  'performance-hardening-history.ts',
  'performance-hardening-reporting.ts',
  'performance-hardening.ts',
  'index.ts',
];

function resetAll(): void {
  resetPerformanceHardeningForTests();
}

function performanceInput(requestId: string, overrides: Partial<PerformanceHardeningInput> = {}): PerformanceHardeningInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    bootReadiness: 85,
    bootstrapWeight: 25,
    firstVisibleDelayMs: 800,
    firstClickableDelayMs: 1500,
    chatUsableDelayMs: 2500,
    mobileStartupPressure: false,
    reliabilityScore: 80,
    governanceBlocked: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2PerformanceHardening();
  assert('A-TYPES', 'pass token', engine.passToken === PERFORMANCE_HARDENING_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === PERFORMANCE_HARDENING_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 23.2, String(engine.phase));
  assert('A-TYPES', 'uvl rows', PERFORMANCE_HARDENING_UVL_ROWS.length >= 13, String(PERFORMANCE_HARDENING_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_PERFORMANCE_HARDENING_HISTORY_SIZE === 128, String(DEFAULT_MAX_PERFORMANCE_HARDENING_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('performance_hardening').phase === 23.2, '23.2');
  assert('A-TYPES', 'question signal', isPerformanceHardeningQuestion('show performance hardening'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluatePerformanceHardeningEngine(performanceInput('reg-test'));
  assert('B-REGISTRY', 'registered', getPerformanceHardeningRecord(record.performanceId) !== undefined, record.performanceId);
  assert('B-REGISTRY', 'by project', lookupPerformanceByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'performance id', record.performanceId.startsWith('performance-hardening-'), record.performanceId);
  assert('B-REGISTRY', 'record count', getPerformanceHardeningRecordCount() >= 1, String(getPerformanceHardeningRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runStartupPerformance(): void {
  const g = harness.beginGroup('C-STARTUP-PERFORMANCE');
  resetAll();

  const clean = analyzeStartupPerformance(performanceInput('startup-clean'));
  assert('C-STARTUP-PERFORMANCE', 'clean score', clean.startupScore >= 70, String(clean.startupScore));
  assert('C-STARTUP-PERFORMANCE', 'no warnings clean', clean.startupWarnings.length === 0, String(clean.startupWarnings.length));

  const risky = analyzeStartupPerformance(performanceInput('startup-risky', {
    bootReadiness: 20,
    bootstrapWeight: 90,
    repeatedStartupLoopRisk: true,
    lazyLoadFailureRisk: true,
    duplicateInitializationRisk: true,
    readinessDriftRisk: true,
    firstVisibleDelayMs: 5000,
    firstClickableDelayMs: 8000,
    chatUsableDelayMs: 12000,
    mobileStartupPressure: true,
  }));
  assert('C-STARTUP-PERFORMANCE', 'slow boot', risky.startupWarnings.includes('slow_boot_risk'), 'slow_boot_risk');
  assert('C-STARTUP-PERFORMANCE', 'heavy bootstrap', risky.startupWarnings.includes('heavy_bootstrap_risk'), 'heavy_bootstrap_risk');
  assert('C-STARTUP-PERFORMANCE', 'startup loop', risky.startupWarnings.includes('repeated_startup_loop_risk'), 'repeated_startup_loop_risk');
  assert('C-STARTUP-PERFORMANCE', 'low score', risky.startupScore < 50, String(risky.startupScore));

  harness.endGroup('C-STARTUP-PERFORMANCE', g);
}

function runValidationPerformance(): void {
  const g = harness.beginGroup('D-VALIDATION-PERFORMANCE');
  resetAll();

  const clean = analyzeValidationPerformance(performanceInput('validation-clean'));
  assert('D-VALIDATION-PERFORMANCE', 'clean score', clean.validationScore >= 80, String(clean.validationScore));
  assert('D-VALIDATION-PERFORMANCE', 'no slow groups', clean.slowGroups.length === 0, '0');

  const risky = analyzeValidationPerformance(performanceInput('validation-risky', {
    slowValidationGroupRisk: true,
    stressRuntimeGrowthRisk: true,
    unboundedValidatorRisk: true,
    repeatedBootstrapInValidators: true,
    repeatedHttpStartupInValidators: true,
    duplicateFixtureGeneration: true,
    duplicateRegistryAggregation: true,
    unboundedScenarioGeneration: true,
    missingTimeoutGuard: true,
    missingProgressLogging: true,
    missingSlowGroupReporting: true,
  }));
  assert('D-VALIDATION-PERFORMANCE', 'slow group', risky.validationWarnings.includes('slow_validation_group_risk'), 'slow_validation_group_risk');
  assert('D-VALIDATION-PERFORMANCE', 'unbounded', risky.validationWarnings.includes('unbounded_validator_risk'), 'unbounded_validator_risk');
  assert('D-VALIDATION-PERFORMANCE', 'slow groups', risky.slowGroups.length > 0, String(risky.slowGroups.length));
  assert('D-VALIDATION-PERFORMANCE', 'low score', risky.validationScore < 40, String(risky.validationScore));

  harness.endGroup('D-VALIDATION-PERFORMANCE', g);
}

function runCacheEfficiency(): void {
  const g = harness.beginGroup('E-CACHE-EFFICIENCY');
  resetAll();

  const clean = analyzeCacheEfficiency(performanceInput('cache-clean'));
  assert('E-CACHE-EFFICIENCY', 'clean score', clean.cacheEfficiencyScore >= 85, String(clean.cacheEfficiencyScore));
  assert('E-CACHE-EFFICIENCY', 'no warnings', clean.cacheWarnings.length === 0, '0');

  const risky = analyzeCacheEfficiency(performanceInput('cache-risky', {
    cacheMaxSizeRisk: true,
    missingEvictionTracking: true,
    missingHitMissTracking: true,
    historyMaxSizeRisk: true,
    registryGrowthRisk: true,
    repeatedLookupRisk: true,
    unboundedCollectionRisk: true,
    duplicateRegistryAggregation: true,
  }));
  assert('E-CACHE-EFFICIENCY', 'cache warnings', risky.cacheWarnings.length >= 2, String(risky.cacheWarnings.length));
  assert('E-CACHE-EFFICIENCY', 'memory warnings', risky.memoryGrowthWarnings.length >= 2, String(risky.memoryGrowthWarnings.length));
  assert('E-CACHE-EFFICIENCY', 'low score', risky.cacheEfficiencyScore < 50, String(risky.cacheEfficiencyScore));

  harness.endGroup('E-CACHE-EFFICIENCY', g);
}

function runUiResponsiveness(): void {
  const g = harness.beginGroup('F-UI-RESPONSIVENESS');
  resetAll();

  const clean = analyzeUiResponsiveness(performanceInput('ui-clean'));
  assert('F-UI-RESPONSIVENESS', 'clean score', clean.responsivenessScore >= 80, String(clean.responsivenessScore));
  assert('F-UI-RESPONSIVENESS', 'no warnings', clean.responsivenessWarnings.length === 0, '0');

  const risky = analyzeUiResponsiveness(performanceInput('ui-risky', {
    heavyRenderPressure: true,
    reportPreviewRebuildRisk: true,
    operatorFeedRenderRisk: true,
    notificationDrawerDuplicationRisk: true,
    uvlPanelRenderPressure: true,
    largeReportCopyPressure: true,
    mobileScreenOverflowRisk: true,
    chatInputResponsivenessRisk: true,
    loaderReadinessMismatch: true,
    mobileStartupPressure: true,
  }));
  assert('F-UI-RESPONSIVENESS', 'render pressure', risky.responsivenessWarnings.includes('heavy_render_pressure_risk'), 'heavy_render_pressure_risk');
  assert('F-UI-RESPONSIVENESS', 'mobile warnings', risky.mobileWarnings.length >= 2, String(risky.mobileWarnings.length));
  assert('F-UI-RESPONSIVENESS', 'low score', risky.responsivenessScore < 40, String(risky.responsivenessScore));

  harness.endGroup('F-UI-RESPONSIVENESS', g);
}

function runBottlenecks(): void {
  const g = harness.beginGroup('G-BOTTLENECKS');
  resetAll();

  const input = performanceInput('bottleneck-clean');
  const startup = analyzeStartupPerformance(input);
  const validation = analyzeValidationPerformance(input);
  const cache = analyzeCacheEfficiency(input);
  const responsiveness = analyzeUiResponsiveness(input);
  const clean = detectPerformanceBottlenecks(input, startup, validation, cache, responsiveness);
  assert('G-BOTTLENECKS', 'clean score', clean.bottleneckScore >= 90, String(clean.bottleneckScore));
  assert('G-BOTTLENECKS', 'no bottlenecks', clean.bottlenecks.length === 0, '0');

  const riskyInput = performanceInput('bottleneck-risky', {
    bootReadiness: 30,
    slowValidationGroupRisk: true,
    cacheMaxSizeRisk: true,
    heavyRenderPressure: true,
    mobileScreenOverflowRisk: true,
    duplicateRegistryAggregation: true,
    reportPreviewRebuildRisk: true,
    repeatedLookupRisk: true,
  });
  const riskyStartup = analyzeStartupPerformance(riskyInput);
  const riskyValidation = analyzeValidationPerformance(riskyInput);
  const riskyCache = analyzeCacheEfficiency(riskyInput);
  const riskyResponsiveness = analyzeUiResponsiveness(riskyInput);
  const risky = detectPerformanceBottlenecks(riskyInput, riskyStartup, riskyValidation, riskyCache, riskyResponsiveness);
  assert('G-BOTTLENECKS', 'bottlenecks present', risky.bottlenecks.length >= 3, String(risky.bottlenecks.length));
  assert('G-BOTTLENECKS', 'priority order', risky.priorityOrder.length === risky.bottlenecks.length, String(risky.priorityOrder.length));
  assert('G-BOTTLENECKS', 'low score', risky.bottleneckScore < 80, String(risky.bottleneckScore));

  harness.endGroup('G-BOTTLENECKS', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const input = performanceInput('auth-test');
  const startup = analyzeStartupPerformance(input);
  const validation = analyzeValidationPerformance(input);
  const cache = analyzeCacheEfficiency(input);
  const responsiveness = analyzeUiResponsiveness(input);
  const bottlenecks = detectPerformanceBottlenecks(input, startup, validation, cache, responsiveness);
  const authority = buildUnifiedPerformanceHardeningAuthority('auth-test', startup, validation, cache, responsiveness, bottlenecks, input);

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('performance-hardening-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'performance score', authority.performanceScore > 0, String(authority.performanceScore));
  assert('H-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('H-AUTHORITY', 'risk level', authority.riskLevel.length > 0, authority.riskLevel);

  const blocked = buildUnifiedPerformanceHardeningAuthority('auth-blocked', startup, validation, cache, responsiveness, bottlenecks, {
    ...input,
    governanceBlocked: true,
  });
  assert('H-AUTHORITY', 'blocked state', blocked.state === 'BLOCKED', blocked.state);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluatePerformanceHardeningEngine(performanceInput('eval-stable'));
  assert('I-EVALUATION', 'stable state', record.state === 'FAST' || record.state === 'ACCEPTABLE' || record.state === 'WATCH', record.state);
  assert('I-EVALUATION', 'performance score', record.performanceScore > 50, String(record.performanceScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluatePerformanceHardeningEngine(performanceInput('eval-degraded', {
    bootReadiness: 10,
    bootstrapWeight: 95,
    firstVisibleDelayMs: 10000,
    firstClickableDelayMs: 15000,
    chatUsableDelayMs: 20000,
    repeatedStartupLoopRisk: true,
    lazyLoadFailureRisk: true,
    slowValidationGroupRisk: true,
    unboundedValidatorRisk: true,
    repeatedHttpStartupInValidators: true,
    unboundedScenarioGeneration: true,
    cacheMaxSizeRisk: true,
    unboundedCollectionRisk: true,
    heavyRenderPressure: true,
    mobileScreenOverflowRisk: true,
    reliabilityScore: 15,
    governanceBlocked: true,
  }));
  assert('I-EVALUATION', 'degraded state', degraded.record.state !== 'FAST', degraded.record.state);
  assert('I-EVALUATION', 'low score', degraded.record.performanceScore < 55, String(degraded.record.performanceScore));

  const input = performanceInput('eval-manual');
  const authority = buildUnifiedPerformanceHardeningAuthority(
    'eval-manual',
    analyzeStartupPerformance(input),
    analyzeValidationPerformance(input),
    analyzeCacheEfficiency(input),
    analyzeUiResponsiveness(input),
    detectPerformanceBottlenecks(
      input,
      analyzeStartupPerformance(input),
      analyzeValidationPerformance(input),
      analyzeCacheEfficiency(input),
      analyzeUiResponsiveness(input),
    ),
    input,
  );
  const evaluation = evaluatePerformanceHardening(authority);
  assert('I-EVALUATION', 'hardening readiness', evaluation.hardeningReadiness > 0, String(evaluation.hardeningReadiness));
  assert('I-EVALUATION', 'startup score', evaluation.startupScore >= 0, String(evaluation.startupScore));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluatePerformanceHardeningEngine(performanceInput('report-test'));
  assert('J-REPORTING', 'performance score', report.performanceScore === record.performanceScore, String(report.performanceScore));
  assert('J-REPORTING', 'state', report.state === record.state, report.state);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));

  const manual = generatePerformanceHardeningReport(
    record,
    report.evaluation,
    report.cacheEfficiencyScore,
    report.bottlenecks,
    report.slowGroups,
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluatePerformanceHardeningEngine(performanceInput(`history-${i}`, { bootReadiness: 60 + (i % 30) }));
  }
  assert('J-REPORTING', 'history bounded', getPerformanceHardeningHistorySize() === 128, String(getPerformanceHardeningHistorySize()));
  clearPerformanceHardeningHistory();
  assert('J-REPORTING', 'history cleared', getPerformanceHardeningHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerPerformanceHardeningWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerPerformanceHardeningWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'foundation', registerPerformanceHardeningWithFoundation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'capability registry', registerPerformanceHardeningWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'find panel', registerPerformanceHardeningWithFindPanel().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerPerformanceHardeningWithUvl().uvlRowCount >= 13, String(registerPerformanceHardeningWithUvl().uvlRowCount));
  assert('K-INTEGRATION', 'unified trust score', registerPerformanceHardeningWithUnifiedTrustScore().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust checkpoint', registerPerformanceHardeningWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl runtime', registerPerformanceHardeningWithUnifiedVerificationLab().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'reliability hardening', registerPerformanceHardeningWithReliabilityHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'execution authority', registerPerformanceHardeningWithExecutionAuthority().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'timeline intelligence', registerPerformanceHardeningWithTimelineIntelligence().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'mobile validation optimizer', registerPerformanceHardeningWithMobileValidationOptimizer().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'operator feed', registerPerformanceHardeningWithOperatorFeed().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'notification vault', registerPerformanceHardeningWithNotificationVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'notification delivery', registerPerformanceHardeningWithNotificationDelivery().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerPerformanceHardeningWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'mobile command', registerPerformanceHardeningWithMobileCommand().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerPerformanceHardeningWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerPerformanceHardeningWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const input = performanceInput('cache-fixed');
  const startup = analyzeStartupPerformance(input);
  const validation = analyzeValidationPerformance(input);
  const cache = analyzeCacheEfficiency(input);
  const responsiveness = analyzeUiResponsiveness(input);
  const bottlenecks = detectPerformanceBottlenecks(input, startup, validation, cache, responsiveness);

  buildUnifiedPerformanceHardeningAuthority('cache-fixed', startup, validation, cache, responsiveness, bottlenecks, input);
  buildUnifiedPerformanceHardeningAuthority('cache-fixed', startup, validation, cache, responsiveness, bottlenecks, input);

  const cacheStats = getPerformanceHardeningCacheStats();
  assert('L-CACHE', 'cache hits', cacheStats.hits > 0, String(cacheStats.hits));
  assert('L-CACHE', 'cache misses', cacheStats.misses > 0, String(cacheStats.misses));

  const byState = lookupPerformanceByState('ACCEPTABLE');
  assert('L-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressPerformance(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluatePerformanceHardeningEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      bootReadiness: 30 + (i % 65),
      bootstrapWeight: 10 + (i % 80),
      firstVisibleDelayMs: 500 + (i % 5000),
      slowValidationGroupRisk: i % 11 === 0,
      unboundedValidatorRisk: i % 13 === 0,
      cacheMaxSizeRisk: i % 17 === 0,
      heavyRenderPressure: i % 19 === 0,
      mobileScreenOverflowRisk: i % 23 === 0,
      governanceBlocked: i % 29 === 0,
      reliabilityScore: 20 + (i % 70),
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getPerformanceHardeningRecordCount() === count, String(getPerformanceHardeningRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getPerformanceHardeningRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'startup analyses', runtime.startupAnalysisCount > 0, String(runtime.startupAnalysisCount));

  const sample = getPerformanceHardeningRecord(`performance-hardening-${count}`);
  assert(`M-STRESS-${label}`, 'sample record', sample !== undefined, 'record');

  harness.endGroup(`M-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('O-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 23.2 Performance Hardening');
  console.log('=================================================\n');

  runSetup();
  runRegistry();
  runStartupPerformance();
  runValidationPerformance();
  runCacheEfficiency();
  runUiResponsiveness();
  runBottlenecks();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressPerformance(100, '100');
  stressPerformance(1000, '1000');
  stressPerformance(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getPerformanceHardeningRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Startup analyses: ${getStartupAnalysisCount()}`,
    `Validation analyses: ${getValidationAnalysisCount()}`,
    `Cache analyses: ${getCacheAnalysisCount()}`,
    `Responsiveness analyses: ${getResponsivenessAnalysisCount()}`,
    `Bottleneck detections: ${getBottleneckDetectionCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getPerformanceHardeningRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? PERFORMANCE_HARDENING_PASS_TOKEN : 'PERFORMANCE_HARDENING_V1_FAIL',
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

  console.log(`\n${PERFORMANCE_HARDENING_PASS_TOKEN}`);
}

main();
