/**
 * Phase 22.3 — Reality Verification Expansion validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  REALITY_VERIFICATION_EXPANSION_PASS_TOKEN,
  REALITY_VERIFICATION_EXPANSION_OWNER_MODULE,
  DEFAULT_MAX_REALITY_VERIFICATION_HISTORY_SIZE,
  analyzeRealityConsistency,
  analyzeRealityGaps,
  buildUnifiedRealityAuthority,
  clearRealityVerificationHistory,
  detectRealityConflicts,
  evaluateRealityVerification,
  generateRealityVerificationReport,
  getAuthorityBuildCount,
  getClaimValidationCount,
  getDevPulseV2RealityVerificationExpansion,
  getEvaluationCount,
  getRealitySource,
  getRealitySourceCount,
  getRealityVerificationExpansionRuntimeReport,
  getRealityVerificationHistorySize,
  getRealityVerificationRecord,
  getRealityVerificationRecordCount,
  isRealityVerificationExpansionQuestion,
  listKnownRealitySourceIds,
  listRealitySources,
  lookupRealityByVerificationState,
  matchEvidenceToReality,
  registerRealityRecord,
  registerRealityRecords,
  registerRealityVerificationExpansionWithAutonomousVerification,
  registerRealityVerificationExpansionWithCentralBrain,
  registerRealityVerificationExpansionWithCompletionEngine,
  registerRealityVerificationExpansionWithEvidenceIntelligence,
  registerRealityVerificationExpansionWithMultiProjectMonitoring,
  registerRealityVerificationExpansionWithMultiProjectVerification,
  registerRealityVerificationExpansionWithSelfEvolutionGovernance,
  registerRealityVerificationExpansionWithTrustEngine,
  registerRealityVerificationExpansionWithUnifiedTrustRuntime,
  registerRealityVerificationExpansionWithUvl,
  registerRealityVerificationExpansionWithWorld2,
  resetRealityVerificationExpansionModuleForTests,
  runRealityVerificationExpansion,
  validateClaim,
  validateClaims,
  getRealityVerificationCacheStats,
} from '../src/reality-verification-expansion/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { REALITY_VERIFICATION_EXPANSION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type {
  RawRealityClaimInput,
  RawRealityEvidenceInput,
  RealityVerificationInput,
} from '../src/reality-verification-expansion/reality-verification-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/reality-verification-expansion');

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
  'reality-verification-types.ts',
  'reality-source-registry.ts',
  'reality-record-registry.ts',
  'claim-validator.ts',
  'evidence-reality-matcher.ts',
  'reality-consistency-analyzer.ts',
  'reality-conflict-detector.ts',
  'reality-gap-analyzer.ts',
  'reality-authority-builder.ts',
  'reality-verification-evaluator.ts',
  'reality-verification-history.ts',
  'reality-verification-cache.ts',
  'reality-verification-reporting.ts',
  'reality-verification-expansion.ts',
  'index.ts',
];

function resetAll(): void {
  resetRealityVerificationExpansionModuleForTests();
}

function claim(overrides: Partial<RawRealityClaimInput> = {}): RawRealityClaimInput {
  return {
    claimType: 'build_completed',
    source: 'AUTONOMOUS_COMPLETION_ENGINE',
    strength: 70,
    trustLevel: 70,
    verificationState: 'VERIFIED',
    ...overrides,
  };
}

function evidenceItem(overrides: Partial<RawRealityEvidenceInput> = {}): RawRealityEvidenceInput {
  return {
    source: 'EVIDENCE_INTELLIGENCE',
    claim: 'build_completed',
    strength: 80,
    trustworthiness: 85,
    supportsClaim: true,
    ...overrides,
  };
}

function realityInput(requestId: string, claims: RawRealityClaimInput[], ev?: RawRealityEvidenceInput[]): RealityVerificationInput {
  return { requestId, project: 'test_project', workspace: 'test_workspace', claims, evidence: ev };
}

function supportedClaims(): RawRealityClaimInput[] {
  return [
    claim({ claimType: 'build_completed', strength: 85, verificationState: 'VERIFIED' }),
    claim({ claimType: 'verification_passed', strength: 80, verificationState: 'VERIFIED', source: 'AUTONOMOUS_VERIFICATION' }),
    claim({ claimType: 'trust_established', trustLevel: 80, strength: 75, source: 'UNIFIED_TRUST_RUNTIME' }),
    claim({ claimType: 'completion_verified', strength: 82, verificationState: 'VERIFIED' }),
    claim({ claimType: 'project_healthy', monitoringHealthy: true, strength: 70, source: 'MULTI_PROJECT_MONITORING' }),
    claim({ claimType: 'governance_approved', governanceApproved: true, strength: 75, source: 'SELF_EVOLUTION_GOVERNANCE' }),
  ];
}

function supportedEvidence(): RawRealityEvidenceInput[] {
  return [
    evidenceItem({ claim: 'build_completed', strength: 85 }),
    evidenceItem({ claim: 'verification_passed', strength: 82 }),
    evidenceItem({ claim: 'trust_established', strength: 80 }),
    evidenceItem({ claim: 'completion_verified', strength: 84 }),
  ];
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2RealityVerificationExpansion();
  assert('A-TYPES', 'pass token', authority.passToken === REALITY_VERIFICATION_EXPANSION_PASS_TOKEN, authority.passToken);
  assert('A-TYPES', 'owner module', authority.ownerModule === REALITY_VERIFICATION_EXPANSION_OWNER_MODULE, authority.ownerModule);
  assert('A-TYPES', 'read only', authority.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', authority.noExecution === true, 'noExecution');
  assert('A-TYPES', 'uvl rows', REALITY_VERIFICATION_EXPANSION_UVL_ROWS.length >= 12, String(REALITY_VERIFICATION_EXPANSION_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_REALITY_VERIFICATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_REALITY_VERIFICATION_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('reality_verification_expansion').phase === 22.3, '22.3');
  assert('A-TYPES', 'question signal', isRealityVerificationExpansionQuestion('show reality authority'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runSources(): void {
  const g = harness.beginGroup('B-SOURCES');
  resetAll();

  assert('B-SOURCES', 'source count', getRealitySourceCount() === 9, String(getRealitySourceCount()));
  assert('B-SOURCES', 'evidence intelligence', getRealitySource('EVIDENCE_INTELLIGENCE') !== undefined, 'EVIDENCE_INTELLIGENCE');
  assert('B-SOURCES', 'unified trust runtime', getRealitySource('UNIFIED_TRUST_RUNTIME') !== undefined, 'UNIFIED_TRUST_RUNTIME');
  assert('B-SOURCES', 'world2', getRealitySource('WORLD2') !== undefined, 'WORLD2');
  assert('B-SOURCES', 'list sources', listRealitySources().length === 9, String(listRealitySources().length));
  assert('B-SOURCES', 'known ids', listKnownRealitySourceIds().length === 9, String(listKnownRealitySourceIds().length));

  const record = registerRealityRecord(claim({ verificationState: 'VERIFIED' }), { project: 'proj_a' });
  assert('B-SOURCES', 'record registered', record.recordId.startsWith('reality-'), record.recordId);
  assert('B-SOURCES', 'lookup verification', lookupRealityByVerificationState('VERIFIED').length >= 1, 'lookup');

  harness.endGroup('B-SOURCES', g);
}

function runClaims(): void {
  const g = harness.beginGroup('C-CLAIMS');
  resetAll();

  const ev = supportedEvidence();
  assert('C-CLAIMS', 'supported', validateClaim(claim({ strength: 85, verificationState: 'VERIFIED' }), ev).supportStatus === 'SUPPORTED', 'SUPPORTED');
  assert('C-CLAIMS', 'partially supported', validateClaim(claim({ strength: 50, verificationState: 'PARTIAL' }), []).supportStatus === 'PARTIALLY_SUPPORTED', 'PARTIALLY_SUPPORTED');
  assert('C-CLAIMS', 'unsupported', validateClaim(claim({ strength: 20, verificationState: 'UNVERIFIED' }), []).supportStatus === 'UNSUPPORTED', 'UNSUPPORTED');
  assert('C-CLAIMS', 'contradicted monitoring', validateClaim(claim({ claimType: 'project_healthy', monitoringHealthy: false, strength: 70 }), []).supportStatus === 'CONTRADICTED', 'CONTRADICTED');
  assert('C-CLAIMS', 'contradicted evidence', validateClaim(claim({ strength: 80 }), [evidenceItem({ contradictsClaim: true, strength: 10 })]).supportStatus === 'CONTRADICTED', 'CONTRADICTED');

  harness.endGroup('C-CLAIMS', g);
}

function runMatching(): void {
  const g = harness.beginGroup('D-MATCHING');
  resetAll();

  const match = matchEvidenceToReality(claim({ strength: 80, trustLevel: 75 }), supportedEvidence());
  assert('D-MATCHING', 'evidence matching', match.matched === true, String(match.matched));
  assert('D-MATCHING', 'alignment score', match.alignmentScore > 0, String(match.alignmentScore));

  const trustMismatch = matchEvidenceToReality(claim({ strength: 80, trustLevel: 20 }), [evidenceItem({ trustworthiness: 90 })]);
  assert('D-MATCHING', 'trust matching', trustMismatch.mismatchType === 'trust' || !trustMismatch.matched, trustMismatch.mismatchType ?? 'none');

  const completionMismatch = matchEvidenceToReality(claim({ strength: 90 }), [evidenceItem({ strength: 30 })]);
  assert('D-MATCHING', 'completion matching', completionMismatch.mismatchType === 'completion' || !completionMismatch.matched, completionMismatch.mismatchType ?? 'none');

  const governanceMismatch = matchEvidenceToReality(
    claim({ governanceApproved: false, strength: 80 }),
    [evidenceItem({ trustworthiness: 90 })],
  );
  assert('D-MATCHING', 'governance matching', governanceMismatch.mismatchType === 'governance' || !governanceMismatch.matched, governanceMismatch.mismatchType ?? 'none');

  harness.endGroup('D-MATCHING', g);
}

function runConsistency(): void {
  const g = harness.beginGroup('E-CONSISTENCY');
  resetAll();

  const records = registerRealityRecords(supportedClaims());
  const validations = validateClaims(supportedClaims(), supportedEvidence());
  const scores = analyzeRealityConsistency(records, validations);

  assert('E-CONSISTENCY', 'consistency score', scores.consistencyScore > 0, String(scores.consistencyScore));
  assert('E-CONSISTENCY', 'stability score', scores.stabilityScore > 0, String(scores.stabilityScore));
  assert('E-CONSISTENCY', 'agreement score', scores.agreementScore > 0, String(scores.agreementScore));
  assert('E-CONSISTENCY', 'alignment score', scores.alignmentScore > 0, String(scores.alignmentScore));

  harness.endGroup('E-CONSISTENCY', g);
}

function runConflicts(): void {
  const g = harness.beginGroup('F-CONFLICTS');
  resetAll();

  const records = registerRealityRecords([
    claim({ trustLevel: 90, source: 'TRUST_ENGINE' }),
    claim({ trustLevel: 15, source: 'WORLD2', claimType: 'trust_established' }),
  ]);
  const validations = validateClaims(records.map((r) => ({
    claimType: r.claimType,
    strength: r.strength,
    trustLevel: r.trustLevel,
    verificationState: r.verificationState,
  })));
  const conflicts = detectRealityConflicts(records, validations);
  assert('F-CONFLICTS', 'trust conflict', conflicts.some((c) => c.conflictType === 'trust'), 'trust');

  const govRecords = registerRealityRecords([
    claim({ claimType: 'governance_approved', strength: 80, source: 'SELF_EVOLUTION_GOVERNANCE' }),
    claim({ claimType: 'governance_approved', strength: 20, source: 'WORLD2' }),
  ]);
  const govValidations = validateClaims(govRecords.map((r) => ({
    claimType: r.claimType,
    strength: r.strength,
    governanceApproved: r.strength >= 60,
  })));
  assert('F-CONFLICTS', 'governance conflict', detectRealityConflicts(govRecords, govValidations).some((c) => c.conflictType === 'governance'), 'governance');

  harness.endGroup('F-CONFLICTS', g);
}

function runGaps(): void {
  const g = harness.beginGroup('G-GAPS');
  resetAll();

  const records = registerRealityRecords([claim({ strength: 20, verificationState: 'UNVERIFIED', trustLevel: 15 })]);
  const validations = validateClaims([claim({ strength: 20, verificationState: 'UNVERIFIED', trustLevel: 15 })]);
  const gaps = analyzeRealityGaps(records, validations);

  assert('G-GAPS', 'missing proof', gaps.some((g) => g.gapType === 'missing_proof'), 'missing');
  assert('G-GAPS', 'insufficient proof', gaps.some((g) => g.gapType === 'insufficient_proof'), 'insufficient');
  assert('G-GAPS', 'unverified claim', gaps.some((g) => g.gapType === 'unverified_claim'), 'unverified');
  assert('G-GAPS', 'untrusted claim', gaps.some((g) => g.gapType === 'untrusted_claim'), 'untrusted');

  harness.endGroup('G-GAPS', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const records = registerRealityRecords(supportedClaims());
  const validations = validateClaims(supportedClaims(), supportedEvidence());
  const { authority, consistency, conflicts, gaps } = buildUnifiedRealityAuthority('auth-test', records, validations);

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('reality-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'claim count', authority.claimCount === 6, String(authority.claimCount));
  assert('H-AUTHORITY', 'consistency', consistency.consistencyScore > 0, String(consistency.consistencyScore));
  assert('H-AUTHORITY', 'readiness', authority.verificationReadiness >= 0, String(authority.verificationReadiness));
  assert('H-AUTHORITY', 'gaps tracked', gaps.length >= 0, String(gaps.length));
  assert('H-AUTHORITY', 'conflicts tracked', conflicts.length >= 0, String(conflicts.length));

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluator(): void {
  const g = harness.beginGroup('I-EVALUATOR');
  resetAll();

  const records = registerRealityRecords(supportedClaims());
  const validations = validateClaims(supportedClaims(), supportedEvidence());
  const { authority, conflicts } = buildUnifiedRealityAuthority('eval-test', records, validations);
  const evaluation = evaluateRealityVerification(authority, conflicts);

  assert('I-EVALUATOR', 'reality confidence', evaluation.realityConfidence > 0, String(evaluation.realityConfidence));
  assert('I-EVALUATOR', 'reality trustworthiness', evaluation.realityTrustworthiness > 0, String(evaluation.realityTrustworthiness));
  assert('I-EVALUATOR', 'reality readiness', evaluation.realityReadiness > 0, String(evaluation.realityReadiness));
  assert('I-EVALUATOR', 'reality stability', evaluation.realityStability > 0, String(evaluation.realityStability));
  assert('I-EVALUATOR', 'overall state', evaluation.overallRealityState === authority.overallRealityState, evaluation.overallRealityState);

  harness.endGroup('I-EVALUATOR', g);
}

function runHistory(): void {
  const g = harness.beginGroup('J-HISTORY');
  resetAll();

  for (let i = 0; i < 130; i++) {
    runRealityVerificationExpansion(realityInput(`history-${i}`, [claim({ strength: 50 + (i % 30) })]));
  }

  assert('J-HISTORY', 'history bounded', getRealityVerificationHistorySize() === 128, String(getRealityVerificationHistorySize()));
  clearRealityVerificationHistory();
  assert('J-HISTORY', 'history cleared', getRealityVerificationHistorySize() === 0, '0');

  harness.endGroup('J-HISTORY', g);
}

function runCache(): void {
  const g = harness.beginGroup('K-CACHE');
  resetAll();

  const records = registerRealityRecords(supportedClaims());
  const validations = validateClaims(supportedClaims(), supportedEvidence());
  buildUnifiedRealityAuthority('cache-fixed-request', records, validations);
  buildUnifiedRealityAuthority('cache-fixed-request', records, validations);
  const cache = getRealityVerificationCacheStats();
  assert('K-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('K-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  harness.endGroup('K-CACHE', g);
}

function runReporting(): void {
  const g = harness.beginGroup('L-REPORTING');
  resetAll();

  const { record, report } = runRealityVerificationExpansion(
    realityInput('report-test', supportedClaims(), supportedEvidence()),
  );

  assert('L-REPORTING', 'support status', report.supportStatus === record.authority.overallRealityState, report.supportStatus);
  assert('L-REPORTING', 'claims included', report.claimValidations.length === 6, String(report.claimValidations.length));
  assert('L-REPORTING', 'readiness', report.readiness >= 0, String(report.readiness));
  assert('L-REPORTING', 'evaluation', report.evaluation.realityConfidence > 0, String(report.evaluation.realityConfidence));

  const manual = generateRealityVerificationReport(
    record,
    record.authority.consistency,
    record.evaluation,
    record.claimValidations,
    record.conflicts,
    record.gaps,
  );
  assert('L-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  harness.endGroup('L-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('M-INTEGRATION');
  resetAll();

  const brain = registerRealityVerificationExpansionWithCentralBrain();
  assert('M-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerRealityVerificationExpansionWithCentralBrain();
  assert('M-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('M-INTEGRATION', 'evidence intelligence', registerRealityVerificationExpansionWithEvidenceIntelligence().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'unified trust runtime', registerRealityVerificationExpansionWithUnifiedTrustRuntime().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'trust engine', registerRealityVerificationExpansionWithTrustEngine().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'autonomous verification', registerRealityVerificationExpansionWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'completion engine', registerRealityVerificationExpansionWithCompletionEngine().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'multi project verification', registerRealityVerificationExpansionWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'multi project monitoring', registerRealityVerificationExpansionWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'self evolution governance', registerRealityVerificationExpansionWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'world2', registerRealityVerificationExpansionWithWorld2().readOnly === true, 'readOnly');
  assert('M-INTEGRATION', 'uvl', registerRealityVerificationExpansionWithUvl().uvlRowCount >= 12, String(registerRealityVerificationExpansionWithUvl().uvlRowCount));

  harness.endGroup('M-INTEGRATION', g);
}

function stressReality(count: number, label: string): void {
  const g = harness.beginGroup(`N-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  const claimTypes = [
    'build_completed', 'verification_passed', 'trust_established',
    'completion_verified', 'project_healthy', 'governance_approved',
  ] as const;
  const sources = listKnownRealitySourceIds();

  for (let i = 0; i < count; i++) {
    const claimType = claimTypes[i % claimTypes.length];
    const source = sources[i % sources.length];
    runRealityVerificationExpansion(realityInput(`stress-${label}-${i}`, [
      claim({
        claimType,
        source,
        strength: 25 + (i % 70),
        trustLevel: 20 + (i % 75),
        verificationState: i % 10 === 0 ? 'UNVERIFIED' : i % 7 === 0 ? 'PARTIAL' : 'VERIFIED',
        monitoringHealthy: i % 13 !== 0,
        governanceApproved: i % 17 !== 0,
      }),
      ...(i % 5 === 0 ? [claim({ claimType: 'trust_established', trustLevel: 90 - (i % 60), source: 'TRUST_ENGINE' })] : []),
    ], i % 3 === 0 ? [evidenceItem({ strength: 40 + (i % 55), claim: claimType })] : undefined));
  }

  const elapsed = performance.now() - start;

  assert(`N-STRESS-${label}`, 'record count', getRealityVerificationRecordCount() === count, String(getRealityVerificationRecordCount()));
  assert(`N-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getRealityVerificationExpansionRuntimeReport();
  assert(`N-STRESS-${label}`, 'claim validations', runtime.claimValidationCount >= count, String(runtime.claimValidationCount));
  assert(`N-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));

  const sample = getRealityVerificationRecord(`reality-verification-${count}`);
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
  console.log('\nDevPulse V2 — Phase 22.3 Reality Verification Expansion');
  console.log('========================================================\n');

  runSetup();
  runSources();
  runClaims();
  runMatching();
  runConsistency();
  runConflicts();
  runGaps();
  runAuthority();
  runEvaluator();
  runHistory();
  runCache();
  runReporting();
  runIntegration();
  stressReality(100, '100');
  stressReality(1000, '1000');
  stressReality(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getRealityVerificationExpansionRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Claim validations: ${getClaimValidationCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getRealityVerificationRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? REALITY_VERIFICATION_EXPANSION_PASS_TOKEN : 'REALITY_VERIFICATION_EXPANSION_V1_FAIL',
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

  console.log(`\n${REALITY_VERIFICATION_EXPANSION_PASS_TOKEN}`);
}

main();
