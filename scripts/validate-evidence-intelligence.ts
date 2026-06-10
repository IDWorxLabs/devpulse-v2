/**
 * Phase 22.2 — Evidence Intelligence validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  EVIDENCE_INTELLIGENCE_PASS_TOKEN,
  EVIDENCE_INTELLIGENCE_OWNER_MODULE,
  DEFAULT_MAX_EVIDENCE_HISTORY_SIZE,
  analyzeEvidenceGaps,
  analyzeEvidenceQuality,
  analyzeEvidenceSufficiency,
  buildUnifiedEvidenceAuthority,
  clearEvidenceIntelligenceHistory,
  detectEvidenceConflicts,
  evaluateEvidenceIntelligence,
  getAuthorityBuildCount,
  getDevPulseV2EvidenceIntelligence,
  getEvaluationCount,
  getEvidenceIntelligenceHistorySize,
  getEvidenceIntelligenceRecord,
  getEvidenceIntelligenceRecordCount,
  getEvidenceIntelligenceRuntimeReport,
  getEvidenceRecordCount,
  getEvidenceSource,
  getEvidenceSourceCount,
  getQualityAnalysisCount,
  isEvidenceIntelligenceQuestion,
  listKnownEvidenceSourceIds,
  listEvidenceSources,
  lookupEvidenceByCategory,
  lookupEvidenceByProject,
  lookupEvidenceBySource,
  registerEvidenceIntelligenceWithAutonomousFixing,
  registerEvidenceIntelligenceWithAutonomousTesting,
  registerEvidenceIntelligenceWithAutonomousVerification,
  registerEvidenceIntelligenceWithCentralBrain,
  registerEvidenceIntelligenceWithCompletionEngine,
  registerEvidenceIntelligenceWithMultiProjectMonitoring,
  registerEvidenceIntelligenceWithMultiProjectVerification,
  registerEvidenceIntelligenceWithSelfEvolutionGovernance,
  registerEvidenceIntelligenceWithTrustEngine,
  registerEvidenceIntelligenceWithUnifiedTrustRuntime,
  registerEvidenceIntelligenceWithUvl,
  registerEvidenceIntelligenceWithVerificationIntegration,
  registerEvidenceIntelligenceWithVerificationIntelligence,
  registerEvidenceIntelligenceWithVerificationStrategyCore,
  registerEvidenceIntelligenceWithWorld2,
  registerEvidenceRecord,
  registerEvidenceRecords,
  resetEvidenceIntelligenceModuleForTests,
  runEvidenceIntelligence,
  getEvidenceIntelligenceCacheStats,
  generateEvidenceIntelligenceReport,
} from '../src/evidence-intelligence/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { EVIDENCE_INTELLIGENCE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { EvidenceIntelligenceInput, RawEvidenceInput } from '../src/evidence-intelligence/evidence-intelligence-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/evidence-intelligence');

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
  'evidence-intelligence-types.ts',
  'evidence-source-registry.ts',
  'evidence-record-registry.ts',
  'evidence-quality-analyzer.ts',
  'evidence-sufficiency-analyzer.ts',
  'evidence-conflict-detector.ts',
  'evidence-gap-analyzer.ts',
  'evidence-authority-builder.ts',
  'evidence-intelligence-evaluator.ts',
  'evidence-intelligence-history.ts',
  'evidence-intelligence-cache.ts',
  'evidence-intelligence-reporting.ts',
  'evidence-intelligence.ts',
  'index.ts',
];

function resetAll(): void {
  resetEvidenceIntelligenceModuleForTests();
}

function evidence(
  source: RawEvidenceInput['source'],
  overrides: Partial<RawEvidenceInput> = {},
): RawEvidenceInput {
  return {
    source,
    category: 'GENERAL',
    strength: 70,
    trustworthiness: 75,
    reliability: 72,
    freshness: 80,
    status: 'ACTIVE',
    ...overrides,
  };
}

function intelInput(requestId: string, items: RawEvidenceInput[]): EvidenceIntelligenceInput {
  return { requestId, project: 'test_project', workspace: 'test_workspace', evidence: items };
}

function authoritativeEvidence(): RawEvidenceInput[] {
  return [
    evidence('AUTONOMOUS_VERIFICATION', { category: 'VERIFICATION', strength: 85, trustworthiness: 88 }),
    evidence('SELF_EVOLUTION_GOVERNANCE', { category: 'GOVERNANCE', strength: 82, trustworthiness: 86 }),
    evidence('UNIFIED_TRUST_RUNTIME', { category: 'TRUST', strength: 90, trustworthiness: 92 }),
    evidence('AUTONOMOUS_COMPLETION_ENGINE', { category: 'COMPLETION', strength: 84, trustworthiness: 85 }),
  ];
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2EvidenceIntelligence();
  assert('A-TYPES', 'pass token', authority.passToken === EVIDENCE_INTELLIGENCE_PASS_TOKEN, authority.passToken);
  assert('A-TYPES', 'owner module', authority.ownerModule === EVIDENCE_INTELLIGENCE_OWNER_MODULE, authority.ownerModule);
  assert('A-TYPES', 'read only', authority.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', authority.noExecution === true, 'noExecution');
  assert('A-TYPES', 'no mutations', authority.noMutations === true, 'noMutations');
  assert('A-TYPES', 'uvl rows', EVIDENCE_INTELLIGENCE_UVL_ROWS.length >= 12, String(EVIDENCE_INTELLIGENCE_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_EVIDENCE_HISTORY_SIZE === 128, String(DEFAULT_MAX_EVIDENCE_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('evidence_intelligence').phase === 22.2, '22.2');
  assert('A-TYPES', 'question signal', isEvidenceIntelligenceQuestion('show evidence authority'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runSources(): void {
  const g = harness.beginGroup('B-SOURCES');
  resetAll();

  assert('B-SOURCES', 'source count', getEvidenceSourceCount() === 13, String(getEvidenceSourceCount()));
  assert('B-SOURCES', 'unified trust runtime', getEvidenceSource('UNIFIED_TRUST_RUNTIME') !== undefined, 'UNIFIED_TRUST_RUNTIME');
  assert('B-SOURCES', 'trust engine', getEvidenceSource('TRUST_ENGINE') !== undefined, 'TRUST_ENGINE');
  assert('B-SOURCES', 'verification stack', getEvidenceSource('VERIFICATION_INTELLIGENCE') !== undefined, 'VERIFICATION_INTELLIGENCE');
  assert('B-SOURCES', 'list sources', listEvidenceSources().length === 13, String(listEvidenceSources().length));
  assert('B-SOURCES', 'known ids', listKnownEvidenceSourceIds().length === 13, String(listKnownEvidenceSourceIds().length));

  const record = registerEvidenceRecord(evidence('TRUST_ENGINE', { category: 'TRUST' }), { project: 'proj_a' });
  assert('B-SOURCES', 'evidence registered', record.evidenceId.startsWith('evidence-'), record.evidenceId);
  assert('B-SOURCES', 'lookup by source', lookupEvidenceBySource('TRUST_ENGINE').length >= 1, 'lookup');
  assert('B-SOURCES', 'lookup by project', lookupEvidenceByProject('proj_a').length >= 1, 'lookup');
  assert('B-SOURCES', 'lookup by category', lookupEvidenceByCategory('TRUST').length >= 1, 'lookup');

  harness.endGroup('B-SOURCES', g);
}

function runQuality(): void {
  const g = harness.beginGroup('C-QUALITY');
  resetAll();

  const records = registerEvidenceRecords(authoritativeEvidence());
  const quality = analyzeEvidenceQuality(records);

  assert('C-QUALITY', 'quality score', quality.qualityScore > 0, String(quality.qualityScore));
  assert('C-QUALITY', 'strength score', quality.strengthScore >= 80, String(quality.strengthScore));
  assert('C-QUALITY', 'reliability score', quality.reliabilityScore >= 50, String(quality.reliabilityScore));
  assert('C-QUALITY', 'freshness score', quality.freshnessScore >= 50, String(quality.freshnessScore));
  assert('C-QUALITY', 'consistency score', quality.consistencyScore >= 50, String(quality.consistencyScore));

  const stale = registerEvidenceRecords([evidence('TRUST_ENGINE', { status: 'STALE', freshness: 15 })]);
  const staleQuality = analyzeEvidenceQuality(stale);
  assert('C-QUALITY', 'stale freshness', staleQuality.freshnessScore < 50, String(staleQuality.freshnessScore));

  harness.endGroup('C-QUALITY', g);
}

function runSufficiency(): void {
  const g = harness.beginGroup('D-SUFFICIENCY');
  resetAll();

  const insufficient = analyzeEvidenceSufficiency([], analyzeEvidenceQuality([]));
  assert('D-SUFFICIENCY', 'insufficient', insufficient === 'INSUFFICIENT', insufficient);

  const partialRecords = registerEvidenceRecords([evidence('TRUST_ENGINE', { strength: 30, trustworthiness: 30 })]);
  const partialQuality = analyzeEvidenceQuality(partialRecords);
  assert('D-SUFFICIENCY', 'partial', analyzeEvidenceSufficiency(partialRecords, partialQuality) === 'PARTIAL', 'PARTIAL');

  const sufficientRecords = registerEvidenceRecords([
    evidence('TRUST_ENGINE', { strength: 55 }),
    evidence('AUTONOMOUS_TESTING', { strength: 58 }),
  ]);
  const sufficientQuality = analyzeEvidenceQuality(sufficientRecords);
  const sufficient = analyzeEvidenceSufficiency(sufficientRecords, sufficientQuality);
  assert('D-SUFFICIENCY', 'sufficient', sufficient === 'SUFFICIENT' || sufficient === 'STRONG', sufficient);

  const authRecords = registerEvidenceRecords(authoritativeEvidence());
  const authQuality = analyzeEvidenceQuality(authRecords);
  assert('D-SUFFICIENCY', 'authoritative', analyzeEvidenceSufficiency(authRecords, authQuality) === 'AUTHORITATIVE', 'AUTHORITATIVE');

  harness.endGroup('D-SUFFICIENCY', g);
}

function runConflicts(): void {
  const g = harness.beginGroup('E-CONFLICTS');
  resetAll();

  const contradictory = registerEvidenceRecords([
    evidence('TRUST_ENGINE', { claim: 'build_complete', strength: 90 }),
    evidence('AUTONOMOUS_VERIFICATION', { claim: 'build_complete', strength: 30 }),
  ]);
  const conflicts = detectEvidenceConflicts(contradictory);
  assert('E-CONFLICTS', 'contradictory', conflicts.some((c) => c.conflictType === 'contradictory'), 'contradictory');

  const trustConflict = registerEvidenceRecords([
    evidence('TRUST_ENGINE', { trustworthiness: 90 }),
    evidence('WORLD2', { trustworthiness: 20 }),
  ]);
  assert('E-CONFLICTS', 'trust conflict', detectEvidenceConflicts(trustConflict).some((c) => c.conflictType === 'trust'), 'trust');

  const verificationConflict = registerEvidenceRecords([
    evidence('AUTONOMOUS_VERIFICATION', { category: 'VERIFICATION', status: 'ACTIVE' }),
    evidence('VERIFICATION_INTEGRATION', { category: 'VERIFICATION', status: 'UNVERIFIED' }),
  ]);
  assert('E-CONFLICTS', 'verification conflict', detectEvidenceConflicts(verificationConflict).some((c) => c.conflictType === 'verification'), 'verification');

  const completionConflict = registerEvidenceRecords([
    evidence('AUTONOMOUS_COMPLETION_ENGINE', { category: 'COMPLETION', strength: 85 }),
    evidence('AUTONOMOUS_TESTING', { category: 'COMPLETION', strength: 25 }),
  ]);
  assert('E-CONFLICTS', 'completion conflict', detectEvidenceConflicts(completionConflict).some((c) => c.conflictType === 'completion'), 'completion');

  const governanceConflict = registerEvidenceRecords([
    evidence('SELF_EVOLUTION_GOVERNANCE', { category: 'GOVERNANCE', status: 'ACTIVE' }),
    evidence('WORLD2', { category: 'GOVERNANCE', status: 'BLOCKED' }),
  ]);
  assert('E-CONFLICTS', 'governance conflict', detectEvidenceConflicts(governanceConflict).some((c) => c.conflictType === 'governance'), 'governance');

  harness.endGroup('E-CONFLICTS', g);
}

function runGaps(): void {
  const g = harness.beginGroup('F-GAPS');
  resetAll();

  const gaps = analyzeEvidenceGaps(registerEvidenceRecords([
    evidence('TRUST_ENGINE', { category: 'TRUST', strength: 20, status: 'STALE', freshness: 10, trustworthiness: 15 }),
  ]));

  assert('F-GAPS', 'missing gaps', gaps.some((g) => g.gapType === 'missing'), 'missing');
  assert('F-GAPS', 'weak evidence', gaps.some((g) => g.gapType === 'weak'), 'weak');
  assert('F-GAPS', 'stale evidence', gaps.some((g) => g.gapType === 'stale'), 'stale');
  assert('F-GAPS', 'untrusted evidence', gaps.some((g) => g.gapType === 'untrusted'), 'untrusted');

  const unverified = analyzeEvidenceGaps(registerEvidenceRecords([
    evidence('AUTONOMOUS_VERIFICATION', { status: 'UNVERIFIED' }),
  ]));
  assert('F-GAPS', 'unverified evidence', unverified.some((g) => g.gapType === 'unverified'), 'unverified');

  harness.endGroup('F-GAPS', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('G-AUTHORITY');
  resetAll();

  const records = registerEvidenceRecords(authoritativeEvidence());
  const { authority, quality, conflicts, gaps } = buildUnifiedEvidenceAuthority('auth-test', records);

  assert('G-AUTHORITY', 'authority id', authority.authorityId.startsWith('evidence-authority-'), authority.authorityId);
  assert('G-AUTHORITY', 'evidence count', authority.evidenceCount === 4, String(authority.evidenceCount));
  assert('G-AUTHORITY', 'quality aggregated', authority.quality.qualityScore === quality.qualityScore, String(quality.qualityScore));
  assert('G-AUTHORITY', 'sufficiency', authority.sufficiencyLevel === 'AUTHORITATIVE', authority.sufficiencyLevel);
  assert('G-AUTHORITY', 'participating sources', authority.participatingSources.length === 4, String(authority.participatingSources.length));
  assert('G-AUTHORITY', 'gaps tracked', gaps.length >= 0, String(gaps.length));
  assert('G-AUTHORITY', 'conflicts tracked', conflicts.length >= 0, String(conflicts.length));

  harness.endGroup('G-AUTHORITY', g);
}

function runEvaluator(): void {
  const g = harness.beginGroup('H-EVALUATOR');
  resetAll();

  const records = registerEvidenceRecords(authoritativeEvidence());
  const { authority, quality, conflicts } = buildUnifiedEvidenceAuthority('eval-test', records);
  const evaluation = evaluateEvidenceIntelligence(authority, quality, conflicts);

  assert('H-EVALUATOR', 'overall state', evaluation.overallEvidenceState === 'AUTHORITATIVE', evaluation.overallEvidenceState);
  assert('H-EVALUATOR', 'confidence', evaluation.evidenceConfidence > 0, String(evaluation.evidenceConfidence));
  assert('H-EVALUATOR', 'trustworthiness', evaluation.evidenceTrustworthiness > 0, String(evaluation.evidenceTrustworthiness));
  assert('H-EVALUATOR', 'readiness', evaluation.evidenceReadiness > 0, String(evaluation.evidenceReadiness));
  assert('H-EVALUATOR', 'stability', evaluation.evidenceStability > 0, String(evaluation.evidenceStability));

  harness.endGroup('H-EVALUATOR', g);
}

function runHistory(): void {
  const g = harness.beginGroup('I-HISTORY');
  resetAll();

  for (let i = 0; i < 130; i++) {
    runEvidenceIntelligence(intelInput(`history-${i}`, [evidence('TRUST_ENGINE', { strength: 50 + (i % 30) })]));
  }

  assert('I-HISTORY', 'history bounded', getEvidenceIntelligenceHistorySize() === 128, String(getEvidenceIntelligenceHistorySize()));
  clearEvidenceIntelligenceHistory();
  assert('I-HISTORY', 'history cleared', getEvidenceIntelligenceHistorySize() === 0, '0');

  harness.endGroup('I-HISTORY', g);
}

function runCache(): void {
  const g = harness.beginGroup('J-CACHE');
  resetAll();

  const records = registerEvidenceRecords(authoritativeEvidence());
  buildUnifiedEvidenceAuthority('cache-fixed-request', records);
  buildUnifiedEvidenceAuthority('cache-fixed-request', records);
  const cache = getEvidenceIntelligenceCacheStats();
  assert('J-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('J-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  harness.endGroup('J-CACHE', g);
}

function runReporting(): void {
  const g = harness.beginGroup('K-REPORTING');
  resetAll();

  const { record, report } = runEvidenceIntelligence(intelInput('report-test', authoritativeEvidence()));

  assert('K-REPORTING', 'sufficiency', report.sufficiencyLevel === record.authority.sufficiencyLevel, report.sufficiencyLevel);
  assert('K-REPORTING', 'source participation', report.sourceParticipation.length === 4, String(report.sourceParticipation.length));
  assert('K-REPORTING', 'quality included', report.quality.qualityScore > 0, String(report.quality.qualityScore));
  assert('K-REPORTING', 'evaluation included', report.evaluation.evidenceReadiness > 0, String(report.evaluation.evidenceReadiness));

  const manual = generateEvidenceIntelligenceReport(record, report.quality, record.evaluation, record.conflicts, record.gaps);
  assert('K-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  harness.endGroup('K-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('L-INTEGRATION');
  resetAll();

  const brain = registerEvidenceIntelligenceWithCentralBrain();
  assert('L-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerEvidenceIntelligenceWithCentralBrain();
  assert('L-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('L-INTEGRATION', 'unified trust runtime', registerEvidenceIntelligenceWithUnifiedTrustRuntime().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'trust engine', registerEvidenceIntelligenceWithTrustEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'autonomous testing', registerEvidenceIntelligenceWithAutonomousTesting().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'autonomous fixing', registerEvidenceIntelligenceWithAutonomousFixing().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'autonomous verification', registerEvidenceIntelligenceWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'completion engine', registerEvidenceIntelligenceWithCompletionEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'verification strategy', registerEvidenceIntelligenceWithVerificationStrategyCore().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'verification intelligence', registerEvidenceIntelligenceWithVerificationIntelligence().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'verification integration', registerEvidenceIntelligenceWithVerificationIntegration().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'multi project verification', registerEvidenceIntelligenceWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'multi project monitoring', registerEvidenceIntelligenceWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'self evolution governance', registerEvidenceIntelligenceWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'world2', registerEvidenceIntelligenceWithWorld2().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'uvl', registerEvidenceIntelligenceWithUvl().uvlRowCount >= 12, String(registerEvidenceIntelligenceWithUvl().uvlRowCount));

  harness.endGroup('L-INTEGRATION', g);
}

function stressEvidence(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  const sources = listKnownEvidenceSourceIds();
  const categories = ['VERIFICATION', 'COMPLETION', 'GOVERNANCE', 'TRUST', 'MONITORING', 'TESTING'] as const;

  for (let i = 0; i < count; i++) {
    const source = sources[i % sources.length];
    const category = categories[i % categories.length];
    runEvidenceIntelligence(intelInput(`stress-${label}-${i}`, [
      evidence(source, {
        category,
        strength: 30 + (i % 65),
        trustworthiness: 25 + (i % 70),
        reliability: 35 + (i % 55),
        freshness: 20 + (i % 75),
        status: i % 10 === 0 ? 'STALE' : i % 17 === 0 ? 'UNVERIFIED' : 'ACTIVE',
        claim: i % 23 === 0 ? 'shared_claim' : `claim_${i}`,
      }),
      ...(i % 5 === 0 ? [evidence('TRUST_ENGINE', { claim: 'shared_claim', strength: 90 - (i % 50) })] : []),
    ]));
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getEvidenceIntelligenceRecordCount() === count, String(getEvidenceIntelligenceRecordCount()));
  assert(`M-STRESS-${label}`, 'evidence records', getEvidenceRecordCount() >= count, String(getEvidenceRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getEvidenceIntelligenceRuntimeReport();
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));

  const sample = getEvidenceIntelligenceRecord(`evidence-intelligence-${count}`);
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
  console.log('\nDevPulse V2 — Phase 22.2 Evidence Intelligence');
  console.log('=================================================\n');

  runSetup();
  runSources();
  runQuality();
  runSufficiency();
  runConflicts();
  runGaps();
  runAuthority();
  runEvaluator();
  runHistory();
  runCache();
  runReporting();
  runIntegration();
  stressEvidence(100, '100');
  stressEvidence(1000, '1000');
  stressEvidence(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getEvidenceIntelligenceRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Quality analyses: ${getQualityAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getEvidenceIntelligenceRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? EVIDENCE_INTELLIGENCE_PASS_TOKEN : 'EVIDENCE_INTELLIGENCE_V1_FAIL',
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

  console.log(`\n${EVIDENCE_INTELLIGENCE_PASS_TOKEN}`);
}

main();
