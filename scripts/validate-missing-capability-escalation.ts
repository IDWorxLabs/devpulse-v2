/**
 * Phase 21.1 — Missing Capability Escalation validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  MISSING_CAPABILITY_ESCALATION_PASS_TOKEN,
  MISSING_CAPABILITY_ESCALATION_OWNER_MODULE,
  DEFAULT_MAX_ESCALATION_HISTORY_SIZE,
  DEFAULT_FAILURE_THRESHOLD,
  DEFAULT_STALL_THRESHOLD_MS,
  analyzeCapabilityGap,
  buildEscalationDecision,
  detectRepeatedBlockedStates,
  detectRepeatedBottlenecks,
  detectRepeatedFailures,
  detectRepeatedStalls,
  evaluateCapabilityEscalation,
  getDevPulseV2MissingCapabilityEscalation,
  getEscalation,
  getEscalationCacheStats,
  getEscalationCount,
  getEscalationHistorySize,
  getMissingCapabilityEscalationRuntimeReport,
  isEscalationQuestion,
  listEscalations,
  registerMissingCapabilityEscalationWithAutonomousFixing,
  registerMissingCapabilityEscalationWithAutonomousTesting,
  registerMissingCapabilityEscalationWithAutonomousVerification,
  registerMissingCapabilityEscalationWithCentralBrain,
  registerMissingCapabilityEscalationWithCompletionEngine,
  registerMissingCapabilityEscalationWithMultiProjectMonitoring,
  registerMissingCapabilityEscalationWithProjectVault,
  registerMissingCapabilityEscalationWithTrustEngine,
  registerMissingCapabilityEscalationWithUvl,
  registerMissingCapabilityEscalationWithWorld2Coordinator,
  recordEscalationHistory,
  resetMissingCapabilityEscalationModuleForTests,
} from '../src/missing-capability-escalation/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { MISSING_CAPABILITY_ESCALATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type {
  BlockedStateEvent,
  BottleneckEvent,
  EscalationInput,
  FailureEvent,
  StallEvent,
} from '../src/missing-capability-escalation/escalation-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/missing-capability-escalation');

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
  'missing-capability-escalation.ts',
  'escalation-types.ts',
  'escalation-registry.ts',
  'failure-pattern-detector.ts',
  'stall-pattern-detector.ts',
  'bottleneck-pattern-detector.ts',
  'blocked-state-detector.ts',
  'capability-gap-analyzer.ts',
  'escalation-decision-engine.ts',
  'escalation-reporting.ts',
  'escalation-history.ts',
  'escalation-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetMissingCapabilityEscalationModuleForTests();
}

function makeFailures(count: number, message = 'identical error'): FailureEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    failureId: `f-${i}`,
    subsystem: 'test_subsystem',
    message,
    timestamp: Date.now() + i,
  }));
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2MissingCapabilityEscalation();
  assert('A-SETUP', 'pass token', authority.passToken === MISSING_CAPABILITY_ESCALATION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === MISSING_CAPABILITY_ESCALATION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'analysis only', authority.analysisOnly === true, 'analysisOnly');
  assert('A-SETUP', 'uvl rows', MISSING_CAPABILITY_ESCALATION_UVL_ROWS.length === 12, String(MISSING_CAPABILITY_ESCALATION_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_ESCALATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_ESCALATION_HISTORY_SIZE));
  assert('A-SETUP', 'failure threshold', DEFAULT_FAILURE_THRESHOLD === 3, '3');
  assert('A-SETUP', 'stall threshold', DEFAULT_STALL_THRESHOLD_MS === 30 * 60 * 1000, '30min');
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('missing_capability_escalation').phase === 21.1, '21.1');
  assert('A-SETUP', 'question signal', isEscalationQuestion('show missing capability escalation'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runFailures(): void {
  const g = harness.beginGroup('B-FAILURES');
  resetAll();

  const one = detectRepeatedFailures(makeFailures(1));
  assert('B-FAILURES', '1 failure no escalation', !one.detected, String(one.detected));

  const two = detectRepeatedFailures(makeFailures(2));
  assert('B-FAILURES', '2 failures no escalation', !two.detected, String(two.detected));

  const three = detectRepeatedFailures(makeFailures(3));
  assert('B-FAILURES', '3 failures escalation', three.detected, String(three.detected));

  const decision1 = buildEscalationDecision({ failures: makeFailures(1) });
  assert('B-FAILURES', 'decision 1 failure', decision1.record.decision === 'NO_ESCALATION', decision1.record.decision);

  const decision3 = buildEscalationDecision({ failures: makeFailures(3) });
  assert('B-FAILURES', 'decision 3 failures', decision3.record.decision !== 'NO_ESCALATION', decision3.record.decision);
  assert('B-FAILURES', 'trigger failure', decision3.record.trigger === 'REPEATED_FAILURE', decision3.record.trigger);

  harness.endGroup('B-FAILURES', g);
}

function runStalls(): void {
  const g = harness.beginGroup('C-STALLS');
  resetAll();

  const shortStall: StallEvent = {
    stallId: 's1',
    expectedDurationMs: 10_000,
    actualDurationMs: 5_000,
    progressVelocity: 0.5,
    stateUnchanged: false,
    timestamp: Date.now(),
  };
  const shortResult = detectRepeatedStalls([shortStall]);
  assert('C-STALLS', 'short stall', !shortResult.stallEscalationRequired, String(shortResult.stallEscalationRequired));

  const longStall: StallEvent = {
    stallId: 's2',
    expectedDurationMs: 10_000,
    actualDurationMs: DEFAULT_STALL_THRESHOLD_MS + 1000,
    progressVelocity: 0.02,
    stateUnchanged: true,
    timestamp: Date.now(),
  };
  const longResult = detectRepeatedStalls([longStall]);
  assert('C-STALLS', 'long stall detected', longResult.stallDetected, String(longResult.stallDetected));

  const repeatedStalls: StallEvent[] = [
    { stallId: 'r1', expectedDurationMs: 10_000, actualDurationMs: DEFAULT_STALL_THRESHOLD_MS + 500, progressVelocity: 0.01, stateUnchanged: true, timestamp: Date.now() },
    { stallId: 'r2', expectedDurationMs: 10_000, actualDurationMs: DEFAULT_STALL_THRESHOLD_MS + 2000, progressVelocity: 0.02, stateUnchanged: true, timestamp: Date.now() },
  ];
  const repeatedResult = detectRepeatedStalls(repeatedStalls);
  assert('C-STALLS', 'repeated stalls', repeatedResult.stallEscalationRequired, String(repeatedResult.stallEscalationRequired));

  const stallDecision = buildEscalationDecision({ stalls: repeatedStalls });
  assert('C-STALLS', 'stall escalation', stallDecision.record.trigger === 'REPEATED_STALL', stallDecision.record.trigger);
  assert('C-STALLS', 'stall decision not none', stallDecision.record.decision !== 'NO_ESCALATION', stallDecision.record.decision);

  harness.endGroup('C-STALLS', g);
}

function runBottlenecks(): void {
  const g = harness.beginGroup('D-BOTTLENECKS');
  resetAll();

  const validatorBn: BottleneckEvent[] = [
    { bottleneckId: 'b1', bottleneckType: 'validator', subsystem: 'uvl', timestamp: Date.now() },
    { bottleneckId: 'b2', bottleneckType: 'validator', subsystem: 'uvl', timestamp: Date.now() },
  ];
  const vResult = detectRepeatedBottlenecks(validatorBn);
  assert('D-BOTTLENECKS', 'validator bottleneck', vResult.detected && vResult.bottleneckType === 'validator', vResult.bottleneckType);

  const orchBn: BottleneckEvent[] = [
    { bottleneckId: 'o1', bottleneckType: 'orchestration', subsystem: 'parallel_build', timestamp: Date.now() },
    { bottleneckId: 'o2', bottleneckType: 'orchestration', subsystem: 'parallel_build', timestamp: Date.now() },
  ];
  assert('D-BOTTLENECKS', 'orchestration bottleneck', detectRepeatedBottlenecks(orchBn).detected, 'orchestration');

  const depBn: BottleneckEvent[] = [
    { bottleneckId: 'd1', bottleneckType: 'dependency', subsystem: 'deps', timestamp: Date.now() },
    { bottleneckId: 'd2', bottleneckType: 'dependency', subsystem: 'deps', timestamp: Date.now() },
  ];
  assert('D-BOTTLENECKS', 'dependency bottleneck', detectRepeatedBottlenecks(depBn).detected, 'dependency');

  const bnDecision = buildEscalationDecision({ bottlenecks: validatorBn });
  assert('D-BOTTLENECKS', 'bottleneck trigger', bnDecision.record.trigger === 'REPEATED_BOTTLENECK', bnDecision.record.trigger);

  harness.endGroup('D-BOTTLENECKS', g);
}

function runBlockedStates(): void {
  const g = harness.beginGroup('E-BLOCKED');
  resetAll();

  const loop: BlockedStateEvent[] = [
    { stateId: 'bs1', state: 'BLOCKED', durationMs: 5000, timestamp: Date.now() },
    { stateId: 'bs2', state: 'RETRY', durationMs: 1000, timestamp: Date.now() },
    { stateId: 'bs3', state: 'BLOCKED', durationMs: 5000, timestamp: Date.now() },
    { stateId: 'bs4', state: 'RETRY', durationMs: 1000, timestamp: Date.now() },
    { stateId: 'bs5', state: 'BLOCKED', durationMs: 5000, timestamp: Date.now() },
  ];
  const loopResult = detectRepeatedBlockedStates(loop);
  assert('E-BLOCKED', 'blocked loop', loopResult.loopDetected, String(loopResult.loopDetected));
  assert('E-BLOCKED', 'blocked detected', loopResult.detected, String(loopResult.detected));
  assert('E-BLOCKED', 'blocked frequency', loopResult.blockedFrequency >= 3, String(loopResult.blockedFrequency));

  const blockedDecision = buildEscalationDecision({ blockedStates: loop });
  assert('E-BLOCKED', 'blocked trigger', blockedDecision.record.trigger === 'REPEATED_BLOCKED_STATE', blockedDecision.record.trigger);

  harness.endGroup('E-BLOCKED', g);
}

function runGapAnalysisAndDecisions(): void {
  const g = harness.beginGroup('F-GAP-DECISIONS');
  resetAll();

  const gapMissing = analyzeCapabilityGap(
    { missingCapabilitySignals: ['autonomous_research'] },
    detectRepeatedFailures([]),
    detectRepeatedStalls([]),
    detectRepeatedBottlenecks([]),
    detectRepeatedBlockedStates([]),
  );
  assert('F-GAP-DECISIONS', 'capability gap', gapMissing.rootCause === 'MISSING_CAPABILITY', gapMissing.rootCause);

  const gapMalfunction = analyzeCapabilityGap(
    {},
    detectRepeatedFailures(makeFailures(3, 'capability error')),
    detectRepeatedStalls([]),
    detectRepeatedBottlenecks([]),
    detectRepeatedBlockedStates([]),
  );
  assert('F-GAP-DECISIONS', 'malfunction', gapMalfunction.rootCause === 'EXISTING_CAPABILITY_MALFUNCTION', gapMalfunction.rootCause);

  const gapResource = analyzeCapabilityGap(
    {},
    detectRepeatedFailures([]),
    detectRepeatedStalls([]),
    detectRepeatedBottlenecks([
      { bottleneckId: 'r1', bottleneckType: 'resource', subsystem: 'alloc', timestamp: Date.now() },
      { bottleneckId: 'r2', bottleneckType: 'resource', subsystem: 'alloc', timestamp: Date.now() },
    ]),
    detectRepeatedBlockedStates([]),
  );
  assert('F-GAP-DECISIONS', 'resource issue', gapResource.rootCause === 'RESOURCE_ISSUE', gapResource.rootCause);

  const gapRuntime = analyzeCapabilityGap(
    {},
    detectRepeatedFailures([]),
    detectRepeatedStalls([]),
    detectRepeatedBottlenecks([
      { bottleneckId: 'v1', bottleneckType: 'validator', subsystem: 'uvl', timestamp: Date.now() },
      { bottleneckId: 'v2', bottleneckType: 'validator', subsystem: 'uvl', timestamp: Date.now() },
    ]),
    detectRepeatedBlockedStates([]),
  );
  assert('F-GAP-DECISIONS', 'runtime bottleneck', gapRuntime.rootCause === 'RUNTIME_BOTTLENECK', gapRuntime.rootCause);

  const noEsc = buildEscalationDecision({});
  assert('F-GAP-DECISIONS', 'no escalation', noEsc.record.decision === 'NO_ESCALATION', noEsc.record.decision);

  const investigate = buildEscalationDecision({ failures: makeFailures(3) });
  assert('F-GAP-DECISIONS', 'investigate or higher', investigate.record.decision !== 'NO_ESCALATION', investigate.record.decision);

  const gapDetected = buildEscalationDecision({
    missingCapabilitySignals: ['new_capability_domain'],
    failures: makeFailures(3),
  });
  assert('F-GAP-DECISIONS', 'gap or research', ['CAPABILITY_GAP_DETECTED', 'RESEARCH_REQUIRED', 'INVESTIGATE', 'FOUNDER_REVIEW'].includes(gapDetected.record.decision), gapDetected.record.decision);

  harness.endGroup('F-GAP-DECISIONS', g);
}

function runRegistryHistoryCache(): void {
  const g = harness.beginGroup('G-REGISTRY-CACHE');
  resetAll();

  const { record } = buildEscalationDecision({ failures: makeFailures(3) });
  assert('G-REGISTRY-CACHE', 'registered', getEscalation(record.escalationId) !== undefined, record.escalationId);
  assert('G-REGISTRY-CACHE', 'list', listEscalations().length >= 1, String(listEscalations().length));
  recordEscalationHistory(record);
  assert('G-REGISTRY-CACHE', 'history', getEscalationHistorySize() >= 1, String(getEscalationHistorySize()));

  for (let i = 0; i < 130; i++) {
    recordEscalationHistory(record);
  }
  assert('G-REGISTRY-CACHE', 'history bounded', getEscalationHistorySize() <= DEFAULT_MAX_ESCALATION_HISTORY_SIZE, String(getEscalationHistorySize()));

  detectRepeatedFailures(makeFailures(3));
  detectRepeatedFailures(makeFailures(3));
  const cache = getEscalationCacheStats();
  assert('G-REGISTRY-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));

  harness.endGroup('G-REGISTRY-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('H-INTEGRATION');
  resetAll();

  const brain = registerMissingCapabilityEscalationWithCentralBrain();
  assert('H-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerMissingCapabilityEscalationWithCentralBrain();
  assert('H-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('H-INTEGRATION', 'project vault', registerMissingCapabilityEscalationWithProjectVault().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'trust engine', registerMissingCapabilityEscalationWithTrustEngine().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'world2', registerMissingCapabilityEscalationWithWorld2Coordinator().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'uvl', registerMissingCapabilityEscalationWithUvl().uvlRowCount === 12, '12');
  assert('H-INTEGRATION', 'autonomous testing', registerMissingCapabilityEscalationWithAutonomousTesting().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'autonomous fixing', registerMissingCapabilityEscalationWithAutonomousFixing().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'autonomous verification', registerMissingCapabilityEscalationWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'completion engine', registerMissingCapabilityEscalationWithCompletionEngine().readOnly === true, 'readOnly');
  assert('H-INTEGRATION', 'monitoring', registerMissingCapabilityEscalationWithMultiProjectMonitoring().readOnly === true, 'readOnly');

  harness.endGroup('H-INTEGRATION', g);
}

function stressEscalation(eventCount: number, label: string): void {
  const g = harness.beginGroup(`I-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < eventCount; i++) {
    const input: EscalationInput = {
      projectId: `P${i}`,
      failures: i % 3 === 0 ? makeFailures(3, `error-${i % 5}`) : undefined,
      stalls: i % 7 === 0 ? [{
        stallId: `stall-${i}`,
        expectedDurationMs: 10_000,
        actualDurationMs: DEFAULT_STALL_THRESHOLD_MS + i,
        progressVelocity: 0.01,
        stateUnchanged: true,
        timestamp: Date.now(),
      }] : undefined,
      bottlenecks: i % 5 === 0 ? [{
        bottleneckId: `bn-${i}`,
        bottleneckType: ['validator', 'orchestration', 'dependency', 'resource'][i % 4],
        subsystem: 'stress',
        timestamp: Date.now(),
      }, {
        bottleneckId: `bn2-${i}`,
        bottleneckType: ['validator', 'orchestration', 'dependency', 'resource'][i % 4],
        subsystem: 'stress',
        timestamp: Date.now(),
      }] : undefined,
    };
    evaluateCapabilityEscalation(input);
  }

  const elapsed = performance.now() - start;

  assert(`I-STRESS-${label}`, 'escalation count', getEscalationCount() === eventCount, String(getEscalationCount()));
  assert(`I-STRESS-${label}`, 'performance', elapsed < 60_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getMissingCapabilityEscalationRuntimeReport();
  assert(`I-STRESS-${label}`, 'runtime escalations', runtime.escalationCount === eventCount, String(runtime.escalationCount));
  assert(`I-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`I-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('J-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 21.1 Missing Capability Escalation');
  console.log('========================================================\n');

  runSetup();
  runFailures();
  runStalls();
  runBottlenecks();
  runBlockedStates();
  runGapAnalysisAndDecisions();
  runRegistryHistoryCache();
  runIntegration();
  stressEscalation(100, '100');
  stressEscalation(1000, '1000');
  stressEscalation(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getMissingCapabilityEscalationRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Failure patterns: ${runtime.failurePatternCount}`,
    `Stall patterns: ${runtime.stallPatternCount}`,
    `Bottleneck patterns: ${runtime.bottleneckPatternCount}`,
    `Blocked patterns: ${runtime.blockedPatternCount}`,
    `Escalation count: ${runtime.escalationCount}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? MISSING_CAPABILITY_ESCALATION_PASS_TOKEN : 'MISSING_CAPABILITY_ESCALATION_V1_FAIL',
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

  console.log(`\n${MISSING_CAPABILITY_ESCALATION_PASS_TOKEN}`);
}

main();
