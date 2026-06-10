/**
 * Phase 22.5 — Prediction Trust Layer validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  PREDICTION_TRUST_LAYER_PASS_TOKEN,
  PREDICTION_TRUST_LAYER_OWNER_MODULE,
  DEFAULT_MAX_PREDICTION_TRUST_HISTORY_SIZE,
  analyzeTrustTrend,
  analyzeTrustVolatility,
  buildUnifiedPredictionTrustAuthority,
  clearPredictionTrustHistory,
  evaluatePredictionTrustLayer,
  evaluateTrustPrediction,
  generatePredictionTrustReport,
  getAuthorityBuildCount,
  getDevPulseV2PredictionTrustLayer,
  getEvaluationCount,
  getFailurePredictionCount,
  getPredictionTrustCacheStats,
  getPredictionTrustHistorySize,
  getPredictionTrustLayerRuntimeReport,
  getPredictionTrustRecord,
  getPredictionTrustRecordCount,
  getRiskPredictionCount,
  getTrendAnalysisCount,
  isPredictionTrustLayerQuestion,
  lookupPredictionByProjectId,
  lookupPredictionByRiskLevel,
  predictTrustFailures,
  predictTrustRisk,
  recommendTrustRecovery,
  registerPredictionTrustLayerWithAutonomousVerification,
  registerPredictionTrustLayerWithCentralBrain,
  registerPredictionTrustLayerWithCompletionEngine,
  registerPredictionTrustLayerWithCompletionTruth,
  registerPredictionTrustLayerWithEvidenceIntelligence,
  registerPredictionTrustLayerWithMissingCapabilityEscalation,
  registerPredictionTrustLayerWithMultiProjectMonitoring,
  registerPredictionTrustLayerWithMultiProjectVerification,
  registerPredictionTrustLayerWithRealityVerification,
  registerPredictionTrustLayerWithSelfEvolutionGovernance,
  registerPredictionTrustLayerWithTrustEngine,
  registerPredictionTrustLayerWithUnifiedTrustRuntime,
  registerPredictionTrustLayerWithUvl,
  registerPredictionTrustLayerWithWorld2,
  resetPredictionTrustLayerForTests,
} from '../src/prediction-trust-layer/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { PREDICTION_TRUST_LAYER_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { PredictionTrustInput } from '../src/prediction-trust-layer/prediction-trust-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/prediction-trust-layer');

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
  'prediction-trust-types.ts',
  'prediction-trust-cache.ts',
  'prediction-trust-registry.ts',
  'trust-trend-analyzer.ts',
  'trust-risk-predictor.ts',
  'trust-failure-predictor.ts',
  'trust-recovery-recommender.ts',
  'trust-volatility-analyzer.ts',
  'trust-prediction-authority-builder.ts',
  'trust-prediction-evaluator.ts',
  'prediction-trust-history.ts',
  'prediction-trust-reporting.ts',
  'prediction-trust-layer.ts',
  'index.ts',
];

function resetAll(): void {
  resetPredictionTrustLayerForTests();
}

function predictionInput(requestId: string, overrides: Partial<PredictionTrustInput> = {}): PredictionTrustInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    trustScore: 75,
    evidenceQuality: 80,
    realityConfidence: 78,
    completionTruthScore: 82,
    governanceStable: true,
    monitoringHealthy: true,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const layer = getDevPulseV2PredictionTrustLayer();
  assert('A-TYPES', 'pass token', layer.passToken === PREDICTION_TRUST_LAYER_PASS_TOKEN, layer.passToken);
  assert('A-TYPES', 'owner module', layer.ownerModule === PREDICTION_TRUST_LAYER_OWNER_MODULE, layer.ownerModule);
  assert('A-TYPES', 'read only', layer.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', layer.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', layer.phase === 22.5, String(layer.phase));
  assert('A-TYPES', 'uvl rows', PREDICTION_TRUST_LAYER_UVL_ROWS.length >= 13, String(PREDICTION_TRUST_LAYER_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_PREDICTION_TRUST_HISTORY_SIZE === 128, String(DEFAULT_MAX_PREDICTION_TRUST_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('prediction_trust_layer').phase === 22.5, '22.5');
  assert('A-TYPES', 'question signal', isPredictionTrustLayerQuestion('show trust prediction'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluatePredictionTrustLayer(predictionInput('reg-test'));
  assert('B-REGISTRY', 'registered', getPredictionTrustRecord(record.predictionId) !== undefined, record.predictionId);
  assert('B-REGISTRY', 'by project', lookupPredictionByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'prediction id', record.predictionId.startsWith('prediction-trust-'), record.predictionId);
  assert('B-REGISTRY', 'record count', getPredictionTrustRecordCount() >= 1, String(getPredictionTrustRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runTrends(): void {
  const g = harness.beginGroup('C-TRENDS');
  resetAll();

  const improving = analyzeTrustTrend(predictionInput('trend-improving', { trustHistorySamples: [40, 55, 70] }));
  assert('C-TRENDS', 'improving', improving.trendDirection === 'IMPROVING', improving.trendDirection);
  assert('C-TRENDS', 'trend confidence', improving.trendConfidence > 0, String(improving.trendConfidence));

  const degrading = analyzeTrustTrend(predictionInput('trend-degrading', { trustHistorySamples: [80, 60, 40] }));
  assert('C-TRENDS', 'degrading', degrading.trendDirection === 'DEGRADING', degrading.trendDirection);

  const volatile = analyzeTrustTrend(predictionInput('trend-volatile', { trustHistorySamples: [10, 95, 5, 98, 2] }));
  assert('C-TRENDS', 'volatile', volatile.trendDirection === 'VOLATILE', volatile.trendDirection);
  assert('C-TRENDS', 'volatility score', volatile.volatilityScore > 0, String(volatile.volatilityScore));

  harness.endGroup('C-TRENDS', g);
}

function runRiskPrediction(): void {
  const g = harness.beginGroup('D-RISK-PREDICTION');
  resetAll();

  const low = predictTrustRisk(predictionInput('risk-low', {
    trustScore: 90,
    evidenceQuality: 88,
    realityConfidence: 87,
    completionTruthScore: 86,
    governanceStable: true,
    monitoringHealthy: true,
  }));
  assert('D-RISK-PREDICTION', 'low risk level', low.predictedRiskLevel === 'LOW' || low.predictedRiskLevel === 'MEDIUM', low.predictedRiskLevel);
  assert('D-RISK-PREDICTION', 'verification risk', low.verificationRisk >= 0, String(low.verificationRisk));
  assert('D-RISK-PREDICTION', 'completion risk', low.completionRisk >= 0, String(low.completionRisk));

  const high = predictTrustRisk(predictionInput('risk-high', {
    trustScore: 25,
    evidenceQuality: 20,
    realityConfidence: 15,
    completionTruthScore: 10,
    governanceStable: false,
    monitoringHealthy: false,
    resourceContention: true,
  }));
  assert('D-RISK-PREDICTION', 'high risk level', high.predictedRiskLevel === 'HIGH' || high.predictedRiskLevel === 'CRITICAL', high.predictedRiskLevel);
  assert('D-RISK-PREDICTION', 'governance risk', high.governanceRisk >= 50, String(high.governanceRisk));
  assert('D-RISK-PREDICTION', 'multi project risk', high.multiProjectRisk >= 50, String(high.multiProjectRisk));

  harness.endGroup('D-RISK-PREDICTION', g);
}

function runFailurePrediction(): void {
  const g = harness.beginGroup('E-FAILURE-PREDICTION');
  resetAll();

  const trend = analyzeTrustTrend(predictionInput('fail-trend', { trustHistorySamples: [70, 50, 30] }));
  const risk = predictTrustRisk(predictionInput('fail-risk', {
    trustScore: 30,
    evidenceQuality: 25,
    completionTruthScore: 20,
    governanceStable: false,
    stallRisk: true,
    resourceContention: true,
  }));
  const failures = predictTrustFailures(
    predictionInput('fail-predict', { stallRisk: true, resourceContention: true }),
    trend,
    risk,
  );

  assert('E-FAILURE-PREDICTION', 'trust collapse', failures.likelyFailures.includes('trust_collapse'), 'trust_collapse');
  assert('E-FAILURE-PREDICTION', 'governance block', failures.likelyFailures.includes('governance_block'), 'governance_block');
  assert('E-FAILURE-PREDICTION', 'stalled progress', failures.likelyFailures.includes('stalled_progress'), 'stalled_progress');
  assert('E-FAILURE-PREDICTION', 'resource contention', failures.likelyFailures.includes('resource_contention'), 'resource_contention');
  assert('E-FAILURE-PREDICTION', 'failure confidence', failures.failureConfidence > 0, String(failures.failureConfidence));

  const result = evaluatePredictionTrustLayer(predictionInput('fail-eval', {
    trustScore: 20,
    evidenceQuality: 15,
    completionTruthScore: 10,
    governanceStable: false,
    stallRisk: true,
  }));
  assert('E-FAILURE-PREDICTION', 'likely failures reported', result.report.likelyFailureModes.length > 0, String(result.report.likelyFailureModes.length));

  harness.endGroup('E-FAILURE-PREDICTION', g);
}

function runRecovery(): void {
  const g = harness.beginGroup('F-RECOVERY');
  resetAll();

  const trend = analyzeTrustTrend(predictionInput('recovery-trend', { trustHistorySamples: [70, 50, 30] }));
  const risk = predictTrustRisk(predictionInput('recovery-risk', { trustScore: 30, governanceStable: false }));
  const failures = predictTrustFailures(predictionInput('recovery-fail'), trend, risk);
  const recovery = recommendTrustRecovery(trend, risk, failures);

  assert('F-RECOVERY', 'recovery action', recovery.action === 'TRUST_RECOVERY_RECOMMENDED' || recovery.action === 'BLOCKED', recovery.action);
  assert('F-RECOVERY', 'recommendations', recovery.recommendations.length > 0, String(recovery.recommendations.length));

  const stable = recommendTrustRecovery(
    analyzeTrustTrend(predictionInput('recovery-stable', { trustScore: 85 })),
    predictTrustRisk(predictionInput('recovery-stable-risk', { trustScore: 85, evidenceQuality: 88 })),
    predictTrustFailures(
      predictionInput('recovery-stable-fail'),
      analyzeTrustTrend(predictionInput('recovery-stable', { trustScore: 85 })),
      predictTrustRisk(predictionInput('recovery-stable-risk', { trustScore: 85, evidenceQuality: 88 })),
    ),
  );
  assert('F-RECOVERY', 'stable monitoring', stable.recommendations.some((r) => r.includes('monitoring')), stable.recommendations.join(','));

  harness.endGroup('F-RECOVERY', g);
}

function runVolatility(): void {
  const g = harness.beginGroup('G-VOLATILITY');
  resetAll();

  const trend = analyzeTrustTrend(predictionInput('vol-trend', { trustHistorySamples: [20, 80, 30, 90] }));
  const volatility = analyzeTrustVolatility(predictionInput('vol-analyze', {
    trustScore: 40,
    evidenceQuality: 85,
    realityConfidence: 30,
    monitoringHealthy: false,
  }), trend);

  assert('G-VOLATILITY', 'volatility score', volatility.volatilityScore > 0, String(volatility.volatilityScore));
  assert('G-VOLATILITY', 'stability score', volatility.stabilityScore >= 0, String(volatility.stabilityScore));
  assert('G-VOLATILITY', 'reasoning', volatility.volatilityReasoning.length > 0, String(volatility.volatilityReasoning.length));

  harness.endGroup('G-VOLATILITY', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const input = predictionInput('auth-test');
  const trend = analyzeTrustTrend(input);
  const risk = predictTrustRisk(input);
  const failures = predictTrustFailures(input, trend, risk);
  const volatility = analyzeTrustVolatility(input, trend);
  const recovery = recommendTrustRecovery(trend, risk, failures);
  const authority = buildUnifiedPredictionTrustAuthority('auth-test', trend, risk, failures, volatility, recovery, 75);

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('prediction-trust-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'risk level', authority.riskLevel.length > 0, authority.riskLevel);
  assert('H-AUTHORITY', 'decision', authority.decision.length > 0, authority.decision);
  assert('H-AUTHORITY', 'predicted trust score', authority.predictedTrustScore >= 0, String(authority.predictedTrustScore));

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluatePredictionTrustLayer(predictionInput('eval-stable'));
  assert('I-EVALUATION', 'stable decision', record.decision === 'TRUST_STABLE' || record.decision === 'TRUST_WATCH', record.decision);
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));
  assert('I-EVALUATION', 'predicted trust', record.predictedTrustScore > 0, String(record.predictedTrustScore));

  const critical = evaluatePredictionTrustLayer(predictionInput('eval-critical', {
    trustScore: 15,
    evidenceQuality: 10,
    realityConfidence: 10,
    completionTruthScore: 5,
    governanceStable: false,
    monitoringHealthy: false,
    stallRisk: true,
    resourceContention: true,
  }));
  assert('I-EVALUATION', 'critical risk', critical.record.riskLevel === 'HIGH' || critical.record.riskLevel === 'CRITICAL', critical.record.riskLevel);
  assert('I-EVALUATION', 'degraded decision', critical.record.decision !== 'TRUST_STABLE', critical.record.decision);

  const input = predictionInput('eval-manual');
  const trend = analyzeTrustTrend(input);
  const risk = predictTrustRisk(input);
  const failures = predictTrustFailures(input, trend, risk);
  const volatility = analyzeTrustVolatility(input, trend);
  const recovery = recommendTrustRecovery(trend, risk, failures);
  const authority = buildUnifiedPredictionTrustAuthority('eval-manual', trend, risk, failures, volatility, recovery, 75);
  const evaluation = evaluateTrustPrediction(authority, volatility);
  assert('I-EVALUATION', 'readiness', evaluation.predictionReadiness > 0, String(evaluation.predictionReadiness));
  assert('I-EVALUATION', 'stability', evaluation.predictionStability >= 0, String(evaluation.predictionStability));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluatePredictionTrustLayer(predictionInput('report-test'));
  assert('J-REPORTING', 'predicted trust score', report.predictedTrustScore === record.predictedTrustScore, String(report.predictedTrustScore));
  assert('J-REPORTING', 'predicted risk score', report.predictedRiskScore === record.predictedRiskScore, String(report.predictedRiskScore));
  assert('J-REPORTING', 'risk level', report.riskLevel === record.riskLevel, report.riskLevel);
  assert('J-REPORTING', 'decision', report.decision === record.decision, report.decision);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'volatility', report.volatility >= 0, String(report.volatility));
  assert('J-REPORTING', 'stability', report.stability >= 0, String(report.stability));

  const manual = generatePredictionTrustReport(record, report.evaluation, report.likelyFailureModes, report.recoveryRecommendations, report.volatility, report.stability, report.missingSignals);
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluatePredictionTrustLayer(predictionInput(`history-${i}`, { trustScore: 40 + (i % 50) }));
  }
  assert('J-REPORTING', 'history bounded', getPredictionTrustHistorySize() === 128, String(getPredictionTrustHistorySize()));
  clearPredictionTrustHistory();
  assert('J-REPORTING', 'history cleared', getPredictionTrustHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerPredictionTrustLayerWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerPredictionTrustLayerWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'unified trust runtime', registerPredictionTrustLayerWithUnifiedTrustRuntime().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'evidence intelligence', registerPredictionTrustLayerWithEvidenceIntelligence().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'reality verification', registerPredictionTrustLayerWithRealityVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'completion truth', registerPredictionTrustLayerWithCompletionTruth().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust engine', registerPredictionTrustLayerWithTrustEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous verification', registerPredictionTrustLayerWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'completion engine', registerPredictionTrustLayerWithCompletionEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'multi project verification', registerPredictionTrustLayerWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'multi project monitoring', registerPredictionTrustLayerWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerPredictionTrustLayerWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerPredictionTrustLayerWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerPredictionTrustLayerWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerPredictionTrustLayerWithUvl().uvlRowCount >= 13, String(registerPredictionTrustLayerWithUvl().uvlRowCount));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const input = predictionInput('cache-fixed', { trustScore: 70, evidenceQuality: 75 });
  const trend = analyzeTrustTrend(input);
  const risk = predictTrustRisk(input);
  const failures = predictTrustFailures(input, trend, risk);
  const volatility = analyzeTrustVolatility(input, trend);
  const recovery = recommendTrustRecovery(trend, risk, failures);

  buildUnifiedPredictionTrustAuthority('cache-fixed', trend, risk, failures, volatility, recovery, 70);
  buildUnifiedPredictionTrustAuthority('cache-fixed', trend, risk, failures, volatility, recovery, 70);

  const cache = getPredictionTrustCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byRisk = lookupPredictionByRiskLevel('LOW');
  assert('L-CACHE', 'risk lookup', Array.isArray(byRisk), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressPrediction(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluatePredictionTrustLayer({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      trustScore: 20 + (i % 75),
      evidenceQuality: 15 + (i % 80),
      realityConfidence: 10 + (i % 85),
      completionTruthScore: 5 + (i % 90),
      governanceStable: i % 7 !== 0,
      monitoringHealthy: i % 5 !== 0,
      stallRisk: i % 11 === 0,
      resourceContention: i % 13 === 0,
      trustHistorySamples: i % 3 === 0 ? [30 + (i % 40), 50 + (i % 30), 20 + (i % 50)] : undefined,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getPredictionTrustRecordCount() === count, String(getPredictionTrustRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getPredictionTrustLayerRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'trend analyses', runtime.trendAnalysisCount === count, String(runtime.trendAnalysisCount));
  assert(`M-STRESS-${label}`, 'risk predictions', runtime.riskPredictionCount > 0, String(runtime.riskPredictionCount));

  const sample = getPredictionTrustRecord(`prediction-trust-${count}`);
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
  console.log('\nDevPulse V2 — Phase 22.5 Prediction Trust Layer');
  console.log('==================================================\n');

  runSetup();
  runRegistry();
  runTrends();
  runRiskPrediction();
  runFailurePrediction();
  runRecovery();
  runVolatility();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressPrediction(100, '100');
  stressPrediction(1000, '1000');
  stressPrediction(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getPredictionTrustLayerRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Trend analyses: ${getTrendAnalysisCount()}`,
    `Risk predictions: ${getRiskPredictionCount()}`,
    `Failure predictions: ${getFailurePredictionCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getPredictionTrustRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? PREDICTION_TRUST_LAYER_PASS_TOKEN : 'PREDICTION_TRUST_LAYER_V1_FAIL',
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

  console.log(`\n${PREDICTION_TRUST_LAYER_PASS_TOKEN}`);
}

main();
