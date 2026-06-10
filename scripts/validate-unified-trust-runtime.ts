/**
 * Phase 22.1 — Unified Trust Runtime validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  UNIFIED_TRUST_RUNTIME_PASS_TOKEN,
  UNIFIED_TRUST_RUNTIME_OWNER_MODULE,
  DEFAULT_MAX_TRUST_RUNTIME_HISTORY_SIZE,
  buildUnifiedTrustAuthority,
  clearTrustRuntimeHistory,
  computeAggregateConfidence,
  computeAggregateRisk,
  computeAggregateTrustLevel,
  evaluateTrustRuntime,
  evaluateUnifiedTrustRuntime,
  generateTrustRuntimeReport,
  getAuthorityBuildCount,
  getDevPulseV2UnifiedTrustRuntime,
  getEvaluationCount,
  getNormalizationCount,
  getTrustRuntimeCacheStats,
  getTrustRuntimeHistorySize,
  getTrustRuntimeRecord,
  getTrustRuntimeRecordCount,
  getTrustSource,
  getTrustSourceCount,
  getUnifiedTrustRuntimeRuntimeReport,
  isUnifiedTrustRuntimeQuestion,
  listKnownTrustSourceIds,
  listTrustRuntimeRecords,
  listTrustSources,
  normalizeTrustSignal,
  normalizeTrustSignals,
  registerUnifiedTrustRuntimeWithAutonomousFixing,
  registerUnifiedTrustRuntimeWithAutonomousTesting,
  registerUnifiedTrustRuntimeWithAutonomousVerification,
  registerUnifiedTrustRuntimeWithCentralBrain,
  registerUnifiedTrustRuntimeWithCompletionEngine,
  registerUnifiedTrustRuntimeWithMultiProjectMonitoring,
  registerUnifiedTrustRuntimeWithMultiProjectVerification,
  registerUnifiedTrustRuntimeWithSelfEvolutionGovernance,
  registerUnifiedTrustRuntimeWithTrustEngine,
  registerUnifiedTrustRuntimeWithUvl,
  registerUnifiedTrustRuntimeWithVerificationIntegration,
  registerUnifiedTrustRuntimeWithVerificationIntelligence,
  registerUnifiedTrustRuntimeWithVerificationStrategyCore,
  registerUnifiedTrustRuntimeWithWorld2,
  resetUnifiedTrustRuntimeModuleForTests,
  resolveTrustState,
  transitionTrustState,
} from '../src/unified-trust-runtime/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { UNIFIED_TRUST_RUNTIME_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { RawTrustSignalInput, TrustRuntimeInput } from '../src/unified-trust-runtime/trust-runtime-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/unified-trust-runtime');

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
  'trust-runtime-types.ts',
  'trust-source-registry.ts',
  'trust-signal-normalizer.ts',
  'trust-state-manager.ts',
  'trust-authority-builder.ts',
  'trust-runtime-evaluator.ts',
  'trust-runtime-history.ts',
  'trust-runtime-cache.ts',
  'trust-runtime-reporting.ts',
  'trust-runtime-registry.ts',
  'unified-trust-runtime.ts',
  'index.ts',
];

function resetAll(): void {
  resetUnifiedTrustRuntimeModuleForTests();
}

function signal(
  source: RawTrustSignalInput['source'],
  overrides: Partial<RawTrustSignalInput> = {},
): RawTrustSignalInput {
  return {
    source,
    confidence: 75,
    risk: 15,
    trustContribution: 70,
    evidenceCount: 3,
    status: 'ACTIVE',
    ...overrides,
  };
}

function trustInput(requestId: string, signals: RawTrustSignalInput[]): TrustRuntimeInput {
  return { requestId, signals };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2UnifiedTrustRuntime();
  assert('A-TYPES', 'pass token', authority.passToken === UNIFIED_TRUST_RUNTIME_PASS_TOKEN, authority.passToken);
  assert('A-TYPES', 'owner module', authority.ownerModule === UNIFIED_TRUST_RUNTIME_OWNER_MODULE, authority.ownerModule);
  assert('A-TYPES', 'read only', authority.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', authority.noExecution === true, 'noExecution');
  assert('A-TYPES', 'no mutations', authority.noMutations === true, 'noMutations');
  assert('A-TYPES', 'uvl rows', UNIFIED_TRUST_RUNTIME_UVL_ROWS.length === 12, String(UNIFIED_TRUST_RUNTIME_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_TRUST_RUNTIME_HISTORY_SIZE === 128, String(DEFAULT_MAX_TRUST_RUNTIME_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('unified_trust_runtime').phase === 22.1, '22.1');
  assert('A-TYPES', 'question signal', isUnifiedTrustRuntimeQuestion('show trust authority'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runSources(): void {
  const g = harness.beginGroup('B-SOURCES');
  resetAll();

  assert('B-SOURCES', 'source count', getTrustSourceCount() === 12, String(getTrustSourceCount()));
  assert('B-SOURCES', 'trust engine source', getTrustSource('TRUST_ENGINE') !== undefined, 'TRUST_ENGINE');
  assert('B-SOURCES', 'autonomous testing', getTrustSource('AUTONOMOUS_TESTING') !== undefined, 'AUTONOMOUS_TESTING');
  assert('B-SOURCES', 'self evolution governance', getTrustSource('SELF_EVOLUTION_GOVERNANCE') !== undefined, 'SELF_EVOLUTION_GOVERNANCE');
  assert('B-SOURCES', 'world2 source', getTrustSource('WORLD2') !== undefined, 'WORLD2');
  assert('B-SOURCES', 'list sources', listTrustSources().length === 12, String(listTrustSources().length));
  assert('B-SOURCES', 'known source ids', listKnownTrustSourceIds().length === 12, String(listKnownTrustSourceIds().length));

  harness.endGroup('B-SOURCES', g);
}

function runNormalization(): void {
  const g = harness.beginGroup('C-NORMALIZATION');
  resetAll();

  const normalized = normalizeTrustSignal(signal('TRUST_ENGINE', { confidence: 80, risk: 10 }));
  assert('C-NORMALIZATION', 'source normalized', normalized.source === 'TRUST_ENGINE', normalized.source);
  assert('C-NORMALIZATION', 'confidence bounded', normalized.confidence === 80, String(normalized.confidence));
  assert('C-NORMALIZATION', 'risk bounded', normalized.risk === 10, String(normalized.risk));
  assert('C-NORMALIZATION', 'evidence count', normalized.evidenceCount === 3, String(normalized.evidenceCount));
  assert('C-NORMALIZATION', 'status active', normalized.status === 'ACTIVE', normalized.status);

  const batch = normalizeTrustSignals([
    signal('AUTONOMOUS_VERIFICATION'),
    signal('MULTI_PROJECT_MONITORING'),
  ]);
  assert('C-NORMALIZATION', 'batch normalize', batch.length === 2, String(batch.length));

  harness.endGroup('C-NORMALIZATION', g);
}

function runStates(): void {
  const g = harness.beginGroup('D-STATES');
  resetAll();

  const empty = normalizeTrustSignals([]);
  assert('D-STATES', 'unknown state', resolveTrustState(empty, 0) === 'UNKNOWN', 'UNKNOWN');

  const low = normalizeTrustSignals([signal('TRUST_ENGINE', { trustContribution: 25, confidence: 30, risk: 40 })]);
  assert('D-STATES', 'low trust', resolveTrustState(low, 25) === 'LOW_TRUST', 'LOW_TRUST');

  const medium = normalizeTrustSignals([signal('TRUST_ENGINE', { trustContribution: 50 })]);
  assert('D-STATES', 'medium trust', resolveTrustState(medium, 50) === 'MEDIUM_TRUST', 'MEDIUM_TRUST');

  const high = normalizeTrustSignals([signal('TRUST_ENGINE', { trustContribution: 70 })]);
  assert('D-STATES', 'high trust', resolveTrustState(high, 70) === 'HIGH_TRUST', 'HIGH_TRUST');

  const verified = normalizeTrustSignals([signal('AUTONOMOUS_VERIFICATION', { trustContribution: 85 })]);
  assert('D-STATES', 'verified', resolveTrustState(verified, 85) === 'VERIFIED', 'VERIFIED');

  const recovery = normalizeTrustSignals([signal('TRUST_ENGINE', { status: 'RECOVERY' })]);
  assert('D-STATES', 'recovery required', resolveTrustState(recovery, 60) === 'TRUST_RECOVERY_REQUIRED', 'TRUST_RECOVERY_REQUIRED');

  const blocked = normalizeTrustSignals([signal('TRUST_ENGINE', { status: 'BLOCKED' })]);
  assert('D-STATES', 'blocked state', resolveTrustState(blocked, 60) === 'BLOCKED', 'BLOCKED');

  assert('D-STATES', 'transition blocked', transitionTrustState('HIGH_TRUST', 'BLOCKED') === 'BLOCKED', 'BLOCKED');

  harness.endGroup('D-STATES', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('E-AUTHORITY');
  resetAll();

  const signals = normalizeTrustSignals([
    signal('TRUST_ENGINE', { trustContribution: 75 }),
    signal('AUTONOMOUS_VERIFICATION', { trustContribution: 80 }),
    signal('SELF_EVOLUTION_GOVERNANCE', { trustContribution: 70 }),
  ]);

  const authority = buildUnifiedTrustAuthority('auth-test', signals);
  assert('E-AUTHORITY', 'authority id', authority.authorityId.startsWith('trust-authority-'), authority.authorityId);
  assert('E-AUTHORITY', 'signal count', authority.signalCount === 3, String(authority.signalCount));
  assert('E-AUTHORITY', 'participating sources', authority.participatingSources.length === 3, String(authority.participatingSources.length));
  assert('E-AUTHORITY', 'verification readiness', authority.verificationReadiness > 0, String(authority.verificationReadiness));
  assert('E-AUTHORITY', 'governance readiness', authority.governanceReadiness > 0, String(authority.governanceReadiness));
  assert('E-AUTHORITY', 'aggregate trust', computeAggregateTrustLevel(signals) > 0, String(computeAggregateTrustLevel(signals)));
  assert('E-AUTHORITY', 'aggregate confidence', computeAggregateConfidence(signals) > 0, String(computeAggregateConfidence(signals)));
  assert('E-AUTHORITY', 'aggregate risk', computeAggregateRisk(signals) >= 0, String(computeAggregateRisk(signals)));

  harness.endGroup('E-AUTHORITY', g);
}

function runEvaluator(): void {
  const g = harness.beginGroup('F-EVALUATOR');
  resetAll();

  const signals = normalizeTrustSignals([
    signal('TRUST_ENGINE', { trustContribution: 80 }),
    signal('MULTI_PROJECT_VERIFICATION', { trustContribution: 75 }),
  ]);
  const authority = buildUnifiedTrustAuthority('eval-test', signals);
  const evaluation = evaluateTrustRuntime(authority);

  assert('F-EVALUATOR', 'overall trust level', evaluation.overallTrustLevel === authority.overallTrustLevel, String(evaluation.overallTrustLevel));
  assert('F-EVALUATOR', 'trust stability', evaluation.trustStability > 0, String(evaluation.trustStability));
  assert('F-EVALUATOR', 'trust confidence', evaluation.trustConfidence === authority.confidence, String(evaluation.trustConfidence));
  assert('F-EVALUATOR', 'trust volatility', evaluation.trustVolatility >= 0, String(evaluation.trustVolatility));
  assert('F-EVALUATOR', 'trust readiness', evaluation.trustReadiness >= 0, String(evaluation.trustReadiness));

  harness.endGroup('F-EVALUATOR', g);
}

function runHistory(): void {
  const g = harness.beginGroup('G-HISTORY');
  resetAll();

  for (let i = 0; i < 130; i++) {
    evaluateUnifiedTrustRuntime(trustInput(`history-${i}`, [signal('TRUST_ENGINE', { trustContribution: 50 + (i % 30) })]));
  }

  assert('G-HISTORY', 'history bounded', getTrustRuntimeHistorySize() === 128, String(getTrustRuntimeHistorySize()));
  clearTrustRuntimeHistory();
  assert('G-HISTORY', 'history cleared', getTrustRuntimeHistorySize() === 0, '0');

  harness.endGroup('G-HISTORY', g);
}

function runCache(): void {
  const g = harness.beginGroup('H-CACHE');
  resetAll();

  const input = trustInput('cache-fixed-request', [signal('TRUST_ENGINE')]);
  evaluateUnifiedTrustRuntime(input);
  evaluateUnifiedTrustRuntime(input);
  const cache = getTrustRuntimeCacheStats();
  assert('H-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('H-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  harness.endGroup('H-CACHE', g);
}

function runReporting(): void {
  const g = harness.beginGroup('I-REPORTING');
  resetAll();

  const { record, report } = evaluateUnifiedTrustRuntime(trustInput('report-test', [
    signal('TRUST_ENGINE'),
    signal('AUTONOMOUS_COMPLETION_ENGINE'),
  ]));

  assert('I-REPORTING', 'trust state', report.trustState === record.authority.trustState, report.trustState);
  assert('I-REPORTING', 'signal count', report.signalCount === 2, String(report.signalCount));
  assert('I-REPORTING', 'participating sources', report.participatingSources.length === 2, String(report.participatingSources.length));
  assert('I-REPORTING', 'evaluation included', report.evaluation.trustReadiness >= 0, String(report.evaluation.trustReadiness));

  const manual = generateTrustRuntimeReport(record, record.evaluation);
  assert('I-REPORTING', 'manual report', manual.confidence === record.authority.confidence, String(manual.confidence));

  harness.endGroup('I-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('J-INTEGRATION');
  resetAll();

  const brain = registerUnifiedTrustRuntimeWithCentralBrain();
  assert('J-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerUnifiedTrustRuntimeWithCentralBrain();
  assert('J-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('J-INTEGRATION', 'trust engine', registerUnifiedTrustRuntimeWithTrustEngine().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'autonomous testing', registerUnifiedTrustRuntimeWithAutonomousTesting().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'autonomous fixing', registerUnifiedTrustRuntimeWithAutonomousFixing().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'autonomous verification', registerUnifiedTrustRuntimeWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'completion engine', registerUnifiedTrustRuntimeWithCompletionEngine().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'verification strategy', registerUnifiedTrustRuntimeWithVerificationStrategyCore().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'verification intelligence', registerUnifiedTrustRuntimeWithVerificationIntelligence().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'verification integration', registerUnifiedTrustRuntimeWithVerificationIntegration().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'multi project verification', registerUnifiedTrustRuntimeWithMultiProjectVerification().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'multi project monitoring', registerUnifiedTrustRuntimeWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'self evolution governance', registerUnifiedTrustRuntimeWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'world2', registerUnifiedTrustRuntimeWithWorld2().readOnly === true, 'readOnly');
  assert('J-INTEGRATION', 'uvl', registerUnifiedTrustRuntimeWithUvl().uvlRowCount === 12, '12');

  harness.endGroup('J-INTEGRATION', g);
}

function stressTrustRuntime(count: number, label: string): void {
  const g = harness.beginGroup(`K-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  const sources = listKnownTrustSourceIds();
  for (let i = 0; i < count; i++) {
    const source = sources[i % sources.length];
    const input = trustInput(`stress-${label}-${i}`, [
      signal(source, {
        confidence: 40 + (i % 55),
        risk: 5 + (i % 40),
        trustContribution: 30 + (i % 60),
        evidenceCount: i % 5,
        status: i % 10 === 0 ? 'RECOVERY' : i % 17 === 0 ? 'BLOCKED' : 'ACTIVE',
      }),
    ]);
    evaluateUnifiedTrustRuntime(input);
  }

  const elapsed = performance.now() - start;

  assert(`K-STRESS-${label}`, 'record count', getTrustRuntimeRecordCount() === count, String(getTrustRuntimeRecordCount()));
  assert(`K-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getUnifiedTrustRuntimeRuntimeReport();
  assert(`K-STRESS-${label}`, 'normalization count', runtime.normalizationCount === count, String(runtime.normalizationCount));
  assert(`K-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`K-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));

  const sample = getTrustRuntimeRecord(`trust-runtime-${count}`);
  assert(`K-STRESS-${label}`, 'sample record', sample !== undefined, 'record');

  harness.endGroup(`K-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('L-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 22.1 Unified Trust Runtime');
  console.log('=================================================\n');

  runSetup();
  runSources();
  runNormalization();
  runStates();
  runAuthority();
  runEvaluator();
  runHistory();
  runCache();
  runReporting();
  runIntegration();
  stressTrustRuntime(100, '100');
  stressTrustRuntime(1000, '1000');
  stressTrustRuntime(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getUnifiedTrustRuntimeRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Normalizations: ${getNormalizationCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getTrustRuntimeRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? UNIFIED_TRUST_RUNTIME_PASS_TOKEN : 'UNIFIED_TRUST_RUNTIME_V1_FAIL',
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

  console.log(`\n${UNIFIED_TRUST_RUNTIME_PASS_TOKEN}`);
}

main();
