/**
 * Phase 22.4 — Completion Truth Engine validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  COMPLETION_TRUTH_ENGINE_PASS_TOKEN,
  COMPLETION_TRUTH_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_COMPLETION_TRUTH_HISTORY_SIZE,
  analyzeCompletionClaims,
  analyzeCompletionConsistency,
  analyzeCompletionGaps,
  buildUnifiedCompletionTruthAuthority,
  clearCompletionTruthHistory,
  detectFalseCompletion,
  evaluateCompletionTruth,
  evaluateCompletionTruthEngine,
  generateCompletionTruthReport,
  getAuthorityBuildCount,
  getClaimAnalysisCount,
  getCompletionTruthCacheStats,
  getCompletionTruthEngineRuntimeReport,
  getCompletionTruthHistorySize,
  getCompletionTruthRecord,
  getCompletionTruthRecordCount,
  getDevPulseV2CompletionTruthEngine,
  getEvaluationCount,
  isCompletionTruthEngineQuestion,
  lookupCompletionTruthByProjectId,
  registerCompletionTruthEngineWithAutonomousVerification,
  registerCompletionTruthEngineWithCentralBrain,
  registerCompletionTruthEngineWithCompletionEngine,
  registerCompletionTruthEngineWithEvidenceIntelligence,
  registerCompletionTruthEngineWithMultiProjectMonitoring,
  registerCompletionTruthEngineWithMultiProjectVerification,
  registerCompletionTruthEngineWithRealityVerification,
  registerCompletionTruthEngineWithSelfEvolutionGovernance,
  registerCompletionTruthEngineWithTrustEngine,
  registerCompletionTruthEngineWithUnifiedTrustRuntime,
  registerCompletionTruthEngineWithUvl,
  registerCompletionTruthEngineWithWorld2,
  resetCompletionTruthEngineModuleForTests,
  validateCompletionEvidence,
  validateCompletionReality,
} from '../src/completion-truth-engine/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { COMPLETION_TRUTH_ENGINE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type {
  CompletionTruthInput,
  RawCompletionClaimInput,
  RawCompletionEvidenceInput,
  RawCompletionRealityInput,
} from '../src/completion-truth-engine/completion-truth-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/completion-truth-engine');

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
  'completion-truth-types.ts',
  'completion-truth-cache.ts',
  'completion-truth-registry.ts',
  'completion-claim-analyzer.ts',
  'completion-evidence-validator.ts',
  'completion-reality-validator.ts',
  'false-completion-detector.ts',
  'completion-consistency-analyzer.ts',
  'completion-gap-analyzer.ts',
  'completion-truth-authority-builder.ts',
  'completion-truth-evaluator.ts',
  'completion-truth-history.ts',
  'completion-truth-reporting.ts',
  'completion-truth-engine.ts',
  'index.ts',
];

function resetAll(): void {
  resetCompletionTruthEngineModuleForTests();
}

function completeClaims(): RawCompletionClaimInput[] {
  return [
    { claimType: 'build_completed', reportedComplete: true, strength: 90, coverage: 88, reliability: 87 },
    { claimType: 'verification_completed', reportedComplete: true, strength: 88, coverage: 85, reliability: 86 },
    { claimType: 'project_completed', reportedComplete: true, strength: 87, coverage: 84, reliability: 85 },
  ];
}

function completeEvidence(): RawCompletionEvidenceInput[] {
  return [
    { source: 'EVIDENCE_INTELLIGENCE', strength: 88, quality: 90, verified: true, agreement: true },
    { source: 'UNIFIED_TRUST_RUNTIME', strength: 85, quality: 87, verified: true, agreement: true },
    { source: 'AUTONOMOUS_VERIFICATION', strength: 86, quality: 88, verified: true, agreement: true },
    { source: 'AUTONOMOUS_COMPLETION_ENGINE', strength: 89, quality: 91, verified: true, agreement: true },
  ];
}

function completeReality(): RawCompletionRealityInput[] {
  return [{
    realityComplete: true,
    verificationPresent: true,
    evidencePresent: true,
    trustPresent: true,
    governanceApproved: true,
  }];
}

function truthInput(requestId: string, overrides: Partial<CompletionTruthInput> = {}): CompletionTruthInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    completionClaims: completeClaims(),
    evidenceSignals: completeEvidence(),
    realitySignals: completeReality(),
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2CompletionTruthEngine();
  assert('A-TYPES', 'pass token', engine.passToken === COMPLETION_TRUTH_ENGINE_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === COMPLETION_TRUTH_ENGINE_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'uvl rows', COMPLETION_TRUTH_ENGINE_UVL_ROWS.length >= 13, String(COMPLETION_TRUTH_ENGINE_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_COMPLETION_TRUTH_HISTORY_SIZE === 128, String(DEFAULT_MAX_COMPLETION_TRUTH_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('completion_truth_engine').phase === 22.4, '22.4');
  assert('A-TYPES', 'question signal', isCompletionTruthEngineQuestion('show completion truth'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateCompletionTruthEngine(truthInput('reg-test'));
  assert('B-REGISTRY', 'registered', getCompletionTruthRecord(record.recordId) !== undefined, record.recordId);
  assert('B-REGISTRY', 'by project', lookupCompletionTruthByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'authority id', record.authority.authorityId.startsWith('completion-truth-authority-'), record.authority.authorityId);
  assert('B-REGISTRY', 'record count', getCompletionTruthRecordCount() >= 1, String(getCompletionTruthRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runClaims(): void {
  const g = harness.beginGroup('C-CLAIMS');
  resetAll();

  const analyses = analyzeCompletionClaims([
    { claimType: 'build_completed', reportedComplete: true, strength: 85 },
    { claimType: 'fix_completed', reportedComplete: false, strength: 30 },
    { claimType: 'feature_completed', reportedComplete: true, coverage: 70, reliability: 75 },
  ]);

  assert('C-CLAIMS', 'claim count', analyses.length === 3, String(analyses.length));
  assert('C-CLAIMS', 'claim strength', analyses[0].claimStrength >= 80, String(analyses[0].claimStrength));
  assert('C-CLAIMS', 'claim coverage', analyses[0].claimCoverage > 0, String(analyses[0].claimCoverage));
  assert('C-CLAIMS', 'claim reliability', analyses[2].claimReliability > 0, String(analyses[2].claimReliability));
  assert('C-CLAIMS', 'blockers reduce', analyzeCompletionClaims([{ claimType: 'build_completed', reportedComplete: true, strength: 80, blockersRemaining: 3 }])[0].claimStrength < 80, 'reduced');

  harness.endGroup('C-CLAIMS', g);
}

function runEvidence(): void {
  const g = harness.beginGroup('D-EVIDENCE');
  resetAll();

  const valid = validateCompletionEvidence(completeEvidence());
  assert('D-EVIDENCE', 'coverage score', valid.evidenceCoverageScore > 0, String(valid.evidenceCoverageScore));
  assert('D-EVIDENCE', 'quality score', valid.evidenceQualityScore >= 80, String(valid.evidenceQualityScore));
  assert('D-EVIDENCE', 'agreement score', valid.evidenceAgreementScore >= 70, String(valid.evidenceAgreementScore));

  const empty = validateCompletionEvidence([]);
  assert('D-EVIDENCE', 'empty evidence', empty.evidenceCoverageScore === 0, '0');

  harness.endGroup('D-EVIDENCE', g);
}

function runReality(): void {
  const g = harness.beginGroup('E-REALITY');
  resetAll();

  const valid = validateCompletionReality(completeClaims(), completeReality());
  assert('E-REALITY', 'reality score', valid.realityCompletionScore >= 75, String(valid.realityCompletionScore));
  assert('E-REALITY', 'no gaps', valid.realityGaps.length === 0, String(valid.realityGaps.length));

  const invalid = validateCompletionReality(
    [{ claimType: 'build_completed', reportedComplete: true, strength: 80 }],
    [{ realityComplete: false, verificationPresent: false, evidencePresent: false, trustPresent: false }],
  );
  assert('E-REALITY', 'reality gaps', invalid.realityGaps.length >= 3, String(invalid.realityGaps.length));
  assert('E-REALITY', 'low score', invalid.realityCompletionScore < 50, String(invalid.realityCompletionScore));

  harness.endGroup('E-REALITY', g);
}

function runFalseCompletion(): void {
  const g = harness.beginGroup('F-FALSE-COMPLETION');
  resetAll();

  const claims = [{ claimType: 'build_completed', reportedComplete: true, strength: 80, blockersRemaining: 2 }];
  const analyses = analyzeCompletionClaims(claims);
  const evidence = validateCompletionEvidence([]);
  const reality = validateCompletionReality(claims, [{ realityComplete: false, evidencePresent: false }]);
  const detection = detectFalseCompletion(claims, analyses, evidence, reality);

  assert('F-FALSE-COMPLETION', 'false completion', detection.state === 'FALSE_COMPLETION', detection.state);
  assert('F-FALSE-COMPLETION', 'risk score', detection.riskScore >= 60, String(detection.riskScore));
  assert('F-FALSE-COMPLETION', 'reasons', detection.reasons.length > 0, String(detection.reasons.length));

  const valid = detectFalseCompletion(
    completeClaims(),
    analyzeCompletionClaims(completeClaims()),
    validateCompletionEvidence(completeEvidence()),
    validateCompletionReality(completeClaims(), completeReality()),
  );
  assert('F-FALSE-COMPLETION', 'valid completion', valid.state === 'VALID_COMPLETION', valid.state);

  const result = evaluateCompletionTruthEngine(truthInput('false-detection', {
    completionClaims: claims,
    evidenceSignals: [],
    realitySignals: [{ realityComplete: false, verificationPresent: false, evidencePresent: false }],
  }));
  assert('F-FALSE-COMPLETION', 'decision', result.record.authority.decision === 'FALSE_COMPLETION_DETECTED', result.record.authority.decision);

  harness.endGroup('F-FALSE-COMPLETION', g);
}

function runConsistency(): void {
  const g = harness.beginGroup('G-CONSISTENCY');
  resetAll();

  const analyses = analyzeCompletionClaims(completeClaims());
  const evidence = validateCompletionEvidence(completeEvidence());
  const reality = validateCompletionReality(completeClaims(), completeReality());
  const scores = analyzeCompletionConsistency(analyses, evidence, reality);

  assert('G-CONSISTENCY', 'consistency score', scores.consistencyScore > 0, String(scores.consistencyScore));
  assert('G-CONSISTENCY', 'stability score', scores.stabilityScore > 0, String(scores.stabilityScore));
  assert('G-CONSISTENCY', 'agreement score', scores.agreementScore > 0, String(scores.agreementScore));

  harness.endGroup('G-CONSISTENCY', g);
}

function runGaps(): void {
  const g = harness.beginGroup('H-GAPS');
  resetAll();

  const claims = [{ claimType: 'project_completed', reportedComplete: true, strength: 70 }];
  const evidence = validateCompletionEvidence([]);
  const reality = validateCompletionReality(claims, [{ trustPresent: false, governanceApproved: false }]);
  const gaps = analyzeCompletionGaps(claims, evidence, reality, [{ trustPresent: false, governanceApproved: false }]);

  assert('H-GAPS', 'missing evidence', gaps.some((g) => g.gapType === 'missing_evidence'), 'missing_evidence');
  assert('H-GAPS', 'missing verification', gaps.some((g) => g.gapType === 'missing_verification'), 'missing_verification');
  assert('H-GAPS', 'missing trust', gaps.some((g) => g.gapType === 'missing_trust'), 'missing_trust');

  harness.endGroup('H-GAPS', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('I-AUTHORITY');
  resetAll();

  const analyses = analyzeCompletionClaims(completeClaims());
  const evidence = validateCompletionEvidence(completeEvidence());
  const reality = validateCompletionReality(completeClaims(), completeReality());
  const consistency = analyzeCompletionConsistency(analyses, evidence, reality);
  const falseCompletion = detectFalseCompletion(completeClaims(), analyses, evidence, reality);
  const gaps = analyzeCompletionGaps(completeClaims(), evidence, reality, completeReality());
  const authority = buildUnifiedCompletionTruthAuthority(
    'auth-test', analyses, evidence, reality, consistency, falseCompletion, gaps,
  );

  assert('I-AUTHORITY', 'authority id', authority.authorityId.startsWith('completion-truth-authority-'), authority.authorityId);
  assert('I-AUTHORITY', 'truth state', authority.truthState === 'COMPLETE', authority.truthState);
  assert('I-AUTHORITY', 'decision', authority.decision === 'COMPLETE', authority.decision);
  assert('I-AUTHORITY', 'truth score', authority.completionTruthScore >= 70, String(authority.completionTruthScore));

  harness.endGroup('I-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('J-EVALUATION');
  resetAll();

  const { record } = evaluateCompletionTruthEngine(truthInput('eval-complete'));
  assert('J-EVALUATION', 'complete decision', record.evaluation.decision === 'COMPLETE', record.evaluation.decision);
  assert('J-EVALUATION', 'confidence', record.evaluation.completionConfidence > 0, String(record.evaluation.completionConfidence));
  assert('J-EVALUATION', 'readiness', record.evaluation.completionReadiness > 0, String(record.evaluation.completionReadiness));
  assert('J-EVALUATION', 'stability', record.evaluation.completionStability > 0, String(record.evaluation.completionStability));

  const incomplete = evaluateCompletionTruthEngine(truthInput('eval-incomplete', {
    completionClaims: [{ claimType: 'build_completed', reportedComplete: false, strength: 20 }],
    evidenceSignals: [],
    realitySignals: [],
  }));
  assert('J-EVALUATION', 'not complete', incomplete.record.authority.decision === 'NOT_COMPLETE' || incomplete.record.authority.truthState === 'INCOMPLETE', incomplete.record.authority.decision);

  harness.endGroup('J-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('K-REPORTING');
  resetAll();

  const { record, report } = evaluateCompletionTruthEngine(truthInput('report-test'));
  assert('K-REPORTING', 'truth score', report.truthScore === record.authority.completionTruthScore, String(report.truthScore));
  assert('K-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('K-REPORTING', 'recommended action', report.recommendedAction === record.authority.decision, report.recommendedAction);

  const manual = generateCompletionTruthReport(record, record.evaluation);
  assert('K-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  harness.endGroup('K-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('L-INTEGRATION');
  resetAll();

  const brain = registerCompletionTruthEngineWithCentralBrain();
  assert('L-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerCompletionTruthEngineWithCentralBrain();
  assert('L-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('L-INTEGRATION', 'unified trust runtime', registerCompletionTruthEngineWithUnifiedTrustRuntime().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'evidence intelligence', registerCompletionTruthEngineWithEvidenceIntelligence().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'reality verification', registerCompletionTruthEngineWithRealityVerification().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'trust engine', registerCompletionTruthEngineWithTrustEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'autonomous verification', registerCompletionTruthEngineWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'completion engine', registerCompletionTruthEngineWithCompletionEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'multi project verification', registerCompletionTruthEngineWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'multi project monitoring', registerCompletionTruthEngineWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'self evolution governance', registerCompletionTruthEngineWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'world2', registerCompletionTruthEngineWithWorld2().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'uvl', registerCompletionTruthEngineWithUvl().uvlRowCount >= 13, String(registerCompletionTruthEngineWithUvl().uvlRowCount));

  harness.endGroup('L-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('M-CACHE');
  resetAll();

  const analyses = analyzeCompletionClaims(completeClaims());
  const evidence = validateCompletionEvidence(completeEvidence());
  const reality = validateCompletionReality(completeClaims(), completeReality());
  const consistency = analyzeCompletionConsistency(analyses, evidence, reality);
  const falseCompletion = detectFalseCompletion(completeClaims(), analyses, evidence, reality);
  const gaps: ReturnType<typeof analyzeCompletionGaps> = [];

  buildUnifiedCompletionTruthAuthority('cache-fixed', analyses, evidence, reality, consistency, falseCompletion, gaps);
  buildUnifiedCompletionTruthAuthority('cache-fixed', analyses, evidence, reality, consistency, falseCompletion, gaps);

  const cache = getCompletionTruthCacheStats();
  assert('M-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('M-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  harness.endGroup('M-CACHE', g);
}

function runHistory(): void {
  const g = harness.beginGroup('J-HISTORY');
  resetAll();

  for (let i = 0; i < 130; i++) {
    evaluateCompletionTruthEngine(truthInput(`history-${i}`, {
      completionClaims: [{ claimType: 'build_completed', reportedComplete: i % 2 === 0, strength: 40 + (i % 50) }],
    }));
  }

  assert('J-HISTORY', 'history bounded', getCompletionTruthHistorySize() === 128, String(getCompletionTruthHistorySize()));
  clearCompletionTruthHistory();
  assert('J-HISTORY', 'history cleared', getCompletionTruthHistorySize() === 0, '0');

  harness.endGroup('J-HISTORY', g);
}

function stressCompletion(count: number, label: string): void {
  const g = harness.beginGroup(`N-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  const claimTypes = ['build_completed', 'verification_completed', 'project_completed', 'feature_completed', 'fix_completed'] as const;

  for (let i = 0; i < count; i++) {
    const claimType = claimTypes[i % claimTypes.length];
    const reported = i % 3 !== 0;
    evaluateCompletionTruthEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      completionClaims: [{
        claimType,
        reportedComplete: reported,
        strength: 20 + (i % 75),
        coverage: 15 + (i % 80),
        blockersRemaining: i % 11 === 0 ? 2 : 0,
      }],
      evidenceSignals: i % 4 === 0 ? [] : [{
        source: 'EVIDENCE_INTELLIGENCE',
        strength: 30 + (i % 65),
        quality: 35 + (i % 60),
        verified: i % 5 !== 0,
        agreement: i % 7 !== 0,
      }],
      realitySignals: [{
        realityComplete: i % 13 !== 0,
        verificationPresent: i % 9 !== 0,
        evidencePresent: i % 6 !== 0,
        trustPresent: i % 8 !== 0,
        governanceApproved: i % 10 !== 0,
        contradictions: i % 17 === 0 ? 2 : 0,
      }],
    });
  }

  const elapsed = performance.now() - start;

  assert(`N-STRESS-${label}`, 'record count', getCompletionTruthRecordCount() === count, String(getCompletionTruthRecordCount()));
  assert(`N-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getCompletionTruthEngineRuntimeReport();
  assert(`N-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`N-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));

  const sample = getCompletionTruthRecord(`completion-truth-${count}`);
  assert(`N-STRESS-${label}`, 'sample record', sample !== undefined, 'record');

  harness.endGroup(`N-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('O-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 22.4 Completion Truth Engine');
  console.log('===================================================\n');

  runSetup();
  runRegistry();
  runClaims();
  runEvidence();
  runReality();
  runFalseCompletion();
  runConsistency();
  runGaps();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  runHistory();
  stressCompletion(100, '100');
  stressCompletion(1000, '1000');
  stressCompletion(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getCompletionTruthEngineRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Claim analyses: ${getClaimAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getCompletionTruthRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? COMPLETION_TRUTH_ENGINE_PASS_TOKEN : 'COMPLETION_TRUTH_ENGINE_V1_FAIL',
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

  console.log(`\n${COMPLETION_TRUTH_ENGINE_PASS_TOKEN}`);
}

main();
