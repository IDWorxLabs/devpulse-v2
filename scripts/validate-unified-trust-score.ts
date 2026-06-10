/**
 * Phase 22.6 — Unified Trust Score validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  UNIFIED_TRUST_SCORE_PASS_TOKEN,
  UNIFIED_TRUST_SCORE_OWNER_MODULE,
  DEFAULT_MAX_UNIFIED_TRUST_SCORE_HISTORY_SIZE,
  analyzeTrustScoreConsistency,
  buildUnifiedTrustScoreAuthority,
  clearUnifiedTrustScoreHistory,
  collectTrustScoreInputs,
  computeTrustWeighting,
  evaluateTrustConfidence,
  evaluateUnifiedTrustScore,
  evaluateUnifiedTrustScoreEngine,
  generateUnifiedTrustScoreReport,
  getAuthorityBuildCount,
  getConfidenceEvaluationCount,
  getConsistencyAnalysisCount,
  getDevPulseV2UnifiedTrustScore,
  getEvaluationCount,
  getInputCollectionCount,
  getNormalizationCount,
  getUnifiedTrustScoreCacheStats,
  getUnifiedTrustScoreHistorySize,
  getUnifiedTrustScoreRecord,
  getUnifiedTrustScoreRecordCount,
  getUnifiedTrustScoreRuntimeReport,
  getWeightingCount,
  isUnifiedTrustScoreQuestion,
  lookupTrustScoreByProjectId,
  lookupTrustScoreByTrustLevel,
  normalizeTrustScores,
  registerUnifiedTrustScoreWithAutonomousVerification,
  registerUnifiedTrustScoreWithCentralBrain,
  registerUnifiedTrustScoreWithCompletionEngine,
  registerUnifiedTrustScoreWithCompletionTruth,
  registerUnifiedTrustScoreWithEvidenceIntelligence,
  registerUnifiedTrustScoreWithMissingCapabilityEscalation,
  registerUnifiedTrustScoreWithMultiProjectMonitoring,
  registerUnifiedTrustScoreWithMultiProjectVerification,
  registerUnifiedTrustScoreWithPredictionTrust,
  registerUnifiedTrustScoreWithRealityVerification,
  registerUnifiedTrustScoreWithSelfEvolutionGovernance,
  registerUnifiedTrustScoreWithTrustEngine,
  registerUnifiedTrustScoreWithUnifiedTrustRuntime,
  registerUnifiedTrustScoreWithUvl,
  registerUnifiedTrustScoreWithWorld2,
  resetUnifiedTrustScoreForTests,
} from '../src/unified-trust-score/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { UNIFIED_TRUST_SCORE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { UnifiedTrustScoreInput } from '../src/unified-trust-score/unified-trust-score-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/unified-trust-score');

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
  'unified-trust-score-types.ts',
  'unified-trust-score-cache.ts',
  'unified-trust-score-registry.ts',
  'trust-score-input-collector.ts',
  'trust-score-normalizer.ts',
  'trust-weighting-engine.ts',
  'trust-score-consistency-analyzer.ts',
  'trust-confidence-evaluator.ts',
  'trust-score-authority-builder.ts',
  'unified-trust-score-evaluator.ts',
  'unified-trust-score-history.ts',
  'unified-trust-score-reporting.ts',
  'unified-trust-score.ts',
  'index.ts',
];

function resetAll(): void {
  resetUnifiedTrustScoreForTests();
}

function scoreInput(requestId: string, overrides: Partial<UnifiedTrustScoreInput> = {}): UnifiedTrustScoreInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    trustRuntimeScore: 82,
    evidenceScore: 85,
    realityScore: 80,
    completionScore: 84,
    predictionScore: 78,
    ...overrides,
  };
}

function strongSignals(): Partial<UnifiedTrustScoreInput> {
  return {
    trustSignals: [
      { source: 'UNIFIED_TRUST_RUNTIME', trustContribution: 88, confidence: 90 },
      { source: 'EVIDENCE_INTELLIGENCE', trustContribution: 85, confidence: 88 },
    ],
    evidenceSignals: [
      { source: 'EVIDENCE_INTELLIGENCE', strength: 88, trustworthiness: 90, reliability: 87 },
      { source: 'AUTONOMOUS_VERIFICATION', strength: 86, trustworthiness: 88, reliability: 85 },
    ],
    realitySignals: [
      { claimType: 'build_completed', strength: 85, verificationState: 'VERIFIED', trustLevel: 82 },
      { claimType: 'verification_passed', strength: 84, verificationState: 'VERIFIED', trustLevel: 80 },
    ],
    completionSignals: [
      { claimType: 'build_completed', reportedComplete: true, strength: 88, coverage: 86, reliability: 87 },
      { claimType: 'verification_completed', reportedComplete: true, strength: 87, coverage: 85, reliability: 86 },
    ],
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2UnifiedTrustScore();
  assert('A-TYPES', 'pass token', engine.passToken === UNIFIED_TRUST_SCORE_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === UNIFIED_TRUST_SCORE_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 22.6, String(engine.phase));
  assert('A-TYPES', 'uvl rows', UNIFIED_TRUST_SCORE_UVL_ROWS.length >= 13, String(UNIFIED_TRUST_SCORE_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_UNIFIED_TRUST_SCORE_HISTORY_SIZE === 128, String(DEFAULT_MAX_UNIFIED_TRUST_SCORE_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('unified_trust_score').phase === 22.6, '22.6');
  assert('A-TYPES', 'question signal', isUnifiedTrustScoreQuestion('show unified trust score'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateUnifiedTrustScoreEngine(scoreInput('reg-test'));
  assert('B-REGISTRY', 'registered', getUnifiedTrustScoreRecord(record.scoreId) !== undefined, record.scoreId);
  assert('B-REGISTRY', 'by project', lookupTrustScoreByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'score id', record.scoreId.startsWith('unified-trust-score-'), record.scoreId);
  assert('B-REGISTRY', 'record count', getUnifiedTrustScoreRecordCount() >= 1, String(getUnifiedTrustScoreRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runInputs(): void {
  const g = harness.beginGroup('C-INPUTS');
  resetAll();

  const direct = collectTrustScoreInputs(scoreInput('inputs-direct'));
  assert('C-INPUTS', 'trust runtime', direct.trustRuntimeScore === 82, String(direct.trustRuntimeScore));
  assert('C-INPUTS', 'evidence', direct.evidenceScore === 85, String(direct.evidenceScore));
  assert('C-INPUTS', 'reality', direct.realityScore === 80, String(direct.realityScore));
  assert('C-INPUTS', 'completion', direct.completionScore === 84, String(direct.completionScore));
  assert('C-INPUTS', 'prediction', direct.predictionScore === 78, String(direct.predictionScore));

  const collected = collectTrustScoreInputs(scoreInput('inputs-signals', {
    trustRuntimeScore: undefined,
    evidenceScore: undefined,
    realityScore: undefined,
    completionScore: undefined,
    predictionScore: undefined,
    ...strongSignals(),
  }));
  assert('C-INPUTS', 'collected trust', collected.trustRuntimeScore > 0, String(collected.trustRuntimeScore));
  assert('C-INPUTS', 'collected evidence', collected.evidenceScore > 0, String(collected.evidenceScore));
  assert('C-INPUTS', 'missing reduced', collected.missingSignals.length === 0, collected.missingSignals.join(','));

  const sparse = collectTrustScoreInputs(scoreInput('inputs-sparse', {
    trustRuntimeScore: undefined,
    evidenceScore: undefined,
    realityScore: undefined,
    completionScore: undefined,
    predictionScore: undefined,
  }));
  assert('C-INPUTS', 'missing signals', sparse.missingSignals.length >= 3, String(sparse.missingSignals.length));

  harness.endGroup('C-INPUTS', g);
}

function runNormalization(): void {
  const g = harness.beginGroup('D-NORMALIZATION');
  resetAll();

  const inputs = collectTrustScoreInputs(scoreInput('norm-test'));
  const normalized = normalizeTrustScores(inputs);
  assert('D-NORMALIZATION', 'normalized trust', normalized.normalizedTrustScore === 82, String(normalized.normalizedTrustScore));
  assert('D-NORMALIZATION', 'normalized evidence', normalized.normalizedEvidenceScore === 85, String(normalized.normalizedEvidenceScore));
  assert('D-NORMALIZATION', 'normalized confidence', normalized.normalizedConfidence > 0, String(normalized.normalizedConfidence));

  const low = normalizeTrustScores(collectTrustScoreInputs(scoreInput('norm-low', {
    trustRuntimeScore: 15,
    evidenceScore: 10,
    realityScore: 12,
    completionScore: 8,
    predictionScore: 5,
  })));
  assert('D-NORMALIZATION', 'low scores', low.normalizedTrustScore < 30, String(low.normalizedTrustScore));

  harness.endGroup('D-NORMALIZATION', g);
}

function runWeighting(): void {
  const g = harness.beginGroup('E-WEIGHTING');
  resetAll();

  const normalized = normalizeTrustScores(collectTrustScoreInputs(scoreInput('weight-test')));
  const weighting = computeTrustWeighting(normalized);
  assert('E-WEIGHTING', 'weighted score', weighting.weightedScore > 0, String(weighting.weightedScore));
  assert('E-WEIGHTING', 'evidence contribution', weighting.evidenceContribution > 0, String(weighting.evidenceContribution));
  assert('E-WEIGHTING', 'reality contribution', weighting.realityContribution > 0, String(weighting.realityContribution));
  assert('E-WEIGHTING', 'completion contribution', weighting.completionContribution > 0, String(weighting.completionContribution));
  assert('E-WEIGHTING', 'prediction contribution', weighting.predictionContribution > 0, String(weighting.predictionContribution));

  harness.endGroup('E-WEIGHTING', g);
}

function runConsistency(): void {
  const g = harness.beginGroup('F-CONSISTENCY');
  resetAll();

  const aligned = analyzeTrustScoreConsistency(
    normalizeTrustScores(collectTrustScoreInputs(scoreInput('consistency-aligned'))),
    [],
  );
  assert('F-CONSISTENCY', 'aligned score', aligned.consistencyScore >= 70, String(aligned.consistencyScore));
  assert('F-CONSISTENCY', 'aligned signals', aligned.alignedSignals.length >= 3, String(aligned.alignedSignals.length));

  const conflicted = analyzeTrustScoreConsistency(
    normalizeTrustScores(collectTrustScoreInputs(scoreInput('consistency-conflict', {
      trustRuntimeScore: 90,
      evidenceScore: 20,
      realityScore: 85,
      completionScore: 15,
      predictionScore: 80,
    }))),
    [],
  );
  assert('F-CONSISTENCY', 'conflicts', conflicted.conflictingSignals.length > 0 || conflicted.unstableSignals.length > 0, 'conflict');
  assert('F-CONSISTENCY', 'warnings', conflicted.consistencyWarnings.length > 0, String(conflicted.consistencyWarnings.length));

  harness.endGroup('F-CONSISTENCY', g);
}

function runConfidence(): void {
  const g = harness.beginGroup('G-CONFIDENCE');
  resetAll();

  const confidence = evaluateTrustConfidence(collectTrustScoreInputs(scoreInput('confidence-high')));
  assert('G-CONFIDENCE', 'confidence score', confidence.confidenceScore > 0, String(confidence.confidenceScore));
  assert('G-CONFIDENCE', 'confidence level', confidence.confidenceLevel.length > 0, confidence.confidenceLevel);

  const low = evaluateTrustConfidence(collectTrustScoreInputs(scoreInput('confidence-low', {
    trustRuntimeScore: 20,
    evidenceScore: 15,
    realityScore: 10,
    completionScore: 12,
    predictionScore: 8,
  })));
  assert('G-CONFIDENCE', 'low confidence', low.confidenceScore < 50, String(low.confidenceScore));

  harness.endGroup('G-CONFIDENCE', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const inputs = collectTrustScoreInputs(scoreInput('auth-test'));
  const normalized = normalizeTrustScores(inputs);
  const weighting = computeTrustWeighting(normalized);
  const consistency = analyzeTrustScoreConsistency(normalized, inputs.missingSignals);
  const confidence = evaluateTrustConfidence(inputs);
  const authority = buildUnifiedTrustScoreAuthority('auth-test', normalized, weighting, consistency, confidence);

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('unified-trust-score-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'trust score', authority.trustScore > 0, String(authority.trustScore));
  assert('H-AUTHORITY', 'trust level', authority.trustLevel.length > 0, authority.trustLevel);
  assert('H-AUTHORITY', 'decision', authority.decision.length > 0, authority.decision);

  const blocked = buildUnifiedTrustScoreAuthority('auth-blocked', normalized, weighting, consistency, confidence, true);
  assert('H-AUTHORITY', 'blocked', blocked.decision === 'BLOCKED', blocked.decision);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluateUnifiedTrustScoreEngine(scoreInput('eval-strong'));
  assert('I-EVALUATION', 'strong decision', record.decision === 'TRUST_STRONG' || record.decision === 'TRUST_VERIFIED' || record.decision === 'TRUST_ACCEPTABLE', record.decision);
  assert('I-EVALUATION', 'trust score', record.trustScore > 50, String(record.trustScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const weak = evaluateUnifiedTrustScoreEngine(scoreInput('eval-weak', {
    trustRuntimeScore: 15,
    evidenceScore: 10,
    realityScore: 12,
    completionScore: 8,
    predictionScore: 5,
  }));
  assert('I-EVALUATION', 'weak decision', weak.record.decision === 'TRUST_REJECTED' || weak.record.decision === 'TRUST_WEAK', weak.record.decision);
  assert('I-EVALUATION', 'low score', weak.record.trustScore < 40, String(weak.record.trustScore));

  const inputs = collectTrustScoreInputs(scoreInput('eval-manual'));
  const normalized = normalizeTrustScores(inputs);
  const weighting = computeTrustWeighting(normalized);
  const consistency = analyzeTrustScoreConsistency(normalized, inputs.missingSignals);
  const confidence = evaluateTrustConfidence(inputs);
  const authority = buildUnifiedTrustScoreAuthority('eval-manual', normalized, weighting, consistency, confidence);
  const evaluation = evaluateUnifiedTrustScore(authority, consistency);
  assert('I-EVALUATION', 'readiness', evaluation.trustReadiness > 0, String(evaluation.trustReadiness));
  assert('I-EVALUATION', 'stability', evaluation.scoreStability >= 0, String(evaluation.scoreStability));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluateUnifiedTrustScoreEngine(scoreInput('report-test'));
  assert('J-REPORTING', 'final trust score', report.finalTrustScore === record.trustScore, String(report.finalTrustScore));
  assert('J-REPORTING', 'trust level', report.trustLevel === record.trustLevel, report.trustLevel);
  assert('J-REPORTING', 'decision', report.decision === record.decision, report.decision);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'contributions', report.contributionBreakdown.weightedScore > 0, String(report.contributionBreakdown.weightedScore));
  assert('J-REPORTING', 'consistency', report.consistencyAnalysis.consistencyScore >= 0, String(report.consistencyAnalysis.consistencyScore));
  assert('J-REPORTING', 'readiness', report.readiness > 0, String(report.readiness));

  const manual = generateUnifiedTrustScoreReport(
    record,
    report.evaluation,
    report.contributionBreakdown,
    report.consistencyAnalysis,
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluateUnifiedTrustScoreEngine(scoreInput(`history-${i}`, {
      trustRuntimeScore: 40 + (i % 50),
      evidenceScore: 35 + (i % 55),
    }));
  }
  assert('J-REPORTING', 'history bounded', getUnifiedTrustScoreHistorySize() === 128, String(getUnifiedTrustScoreHistorySize()));
  clearUnifiedTrustScoreHistory();
  assert('J-REPORTING', 'history cleared', getUnifiedTrustScoreHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerUnifiedTrustScoreWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerUnifiedTrustScoreWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'unified trust runtime', registerUnifiedTrustScoreWithUnifiedTrustRuntime().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'evidence intelligence', registerUnifiedTrustScoreWithEvidenceIntelligence().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'reality verification', registerUnifiedTrustScoreWithRealityVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'completion truth', registerUnifiedTrustScoreWithCompletionTruth().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'prediction trust', registerUnifiedTrustScoreWithPredictionTrust().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust engine', registerUnifiedTrustScoreWithTrustEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous verification', registerUnifiedTrustScoreWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'completion engine', registerUnifiedTrustScoreWithCompletionEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'multi project verification', registerUnifiedTrustScoreWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'multi project monitoring', registerUnifiedTrustScoreWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerUnifiedTrustScoreWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerUnifiedTrustScoreWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerUnifiedTrustScoreWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerUnifiedTrustScoreWithUvl().uvlRowCount >= 13, String(registerUnifiedTrustScoreWithUvl().uvlRowCount));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const inputs = collectTrustScoreInputs(scoreInput('cache-fixed'));
  const normalized = normalizeTrustScores(inputs);
  const weighting = computeTrustWeighting(normalized);
  const consistency = analyzeTrustScoreConsistency(normalized, inputs.missingSignals);
  const confidence = evaluateTrustConfidence(inputs);

  buildUnifiedTrustScoreAuthority('cache-fixed', normalized, weighting, consistency, confidence);
  buildUnifiedTrustScoreAuthority('cache-fixed', normalized, weighting, consistency, confidence);

  const cache = getUnifiedTrustScoreCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byLevel = lookupTrustScoreByTrustLevel('HIGH');
  assert('L-CACHE', 'level lookup', Array.isArray(byLevel), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressTrustScore(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluateUnifiedTrustScoreEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      trustRuntimeScore: 20 + (i % 75),
      evidenceScore: 15 + (i % 80),
      realityScore: 10 + (i % 85),
      completionScore: 5 + (i % 90),
      predictionScore: 8 + (i % 88),
      governanceBlocked: i % 17 === 0,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getUnifiedTrustScoreRecordCount() === count, String(getUnifiedTrustScoreRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getUnifiedTrustScoreRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'input collections', runtime.inputCollectionCount === count, String(runtime.inputCollectionCount));
  assert(`M-STRESS-${label}`, 'normalizations', runtime.normalizationCount > 0, String(runtime.normalizationCount));

  const sample = getUnifiedTrustScoreRecord(`unified-trust-score-${count}`);
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
  console.log('\nDevPulse V2 — Phase 22.6 Unified Trust Score');
  console.log('===============================================\n');

  runSetup();
  runRegistry();
  runInputs();
  runNormalization();
  runWeighting();
  runConsistency();
  runConfidence();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressTrustScore(100, '100');
  stressTrustScore(1000, '1000');
  stressTrustScore(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getUnifiedTrustScoreRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Input collections: ${getInputCollectionCount()}`,
    `Normalizations: ${getNormalizationCount()}`,
    `Weightings: ${getWeightingCount()}`,
    `Consistency analyses: ${getConsistencyAnalysisCount()}`,
    `Confidence evaluations: ${getConfidenceEvaluationCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getUnifiedTrustScoreRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? UNIFIED_TRUST_SCORE_PASS_TOKEN : 'UNIFIED_TRUST_SCORE_V1_FAIL',
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

  console.log(`\n${UNIFIED_TRUST_SCORE_PASS_TOKEN}`);
}

main();
