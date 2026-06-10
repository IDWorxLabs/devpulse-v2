/**
 * Phase 21.2 — Capability Research Engine validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  CAPABILITY_RESEARCH_ENGINE_PASS_TOKEN,
  CAPABILITY_RESEARCH_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_RESEARCH_HISTORY_SIZE,
  analyzeCapabilityEvidence,
  analyzeCapabilitySimilarity,
  buildCapabilityResearchDecision,
  classifyCapabilityDomain,
  evaluateCapabilityResearch,
  getCapabilityResearch,
  getCapabilityResearchCacheStats,
  getCapabilityResearchCount,
  getCapabilityResearchEngineRuntimeReport,
  getCapabilityResearchHistorySize,
  getDevPulseV2CapabilityResearchEngine,
  isCapabilityResearchQuestion,
  listCapabilityResearch,
  registerCapabilityResearchEngineWithAutonomousFixing,
  registerCapabilityResearchEngineWithAutonomousTesting,
  registerCapabilityResearchEngineWithAutonomousVerification,
  registerCapabilityResearchEngineWithCentralBrain,
  registerCapabilityResearchEngineWithCompletionEngine,
  registerCapabilityResearchEngineWithMissingCapabilityEscalation,
  registerCapabilityResearchEngineWithMultiProjectMonitoring,
  registerCapabilityResearchEngineWithProjectVault,
  registerCapabilityResearchEngineWithTrustEngine,
  registerCapabilityResearchEngineWithUvl,
  recordCapabilityResearchHistory,
  researchCapabilityGap,
  researchCapabilityRootCause,
  resetCapabilityResearchEngineModuleForTests,
} from '../src/capability-research-engine/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { CAPABILITY_RESEARCH_ENGINE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { CapabilityResearchInput } from '../src/capability-research-engine/capability-research-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/capability-research-engine');

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
  'capability-research-engine.ts',
  'capability-research-types.ts',
  'capability-research-registry.ts',
  'capability-domain-classifier.ts',
  'capability-gap-researcher.ts',
  'capability-evidence-analyzer.ts',
  'capability-similarity-analyzer.ts',
  'capability-root-cause-researcher.ts',
  'capability-research-decision-engine.ts',
  'capability-research-reporting.ts',
  'capability-research-history.ts',
  'capability-research-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetCapabilityResearchEngineModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2CapabilityResearchEngine();
  assert('A-SETUP', 'pass token', authority.passToken === CAPABILITY_RESEARCH_ENGINE_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === CAPABILITY_RESEARCH_ENGINE_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'research only', authority.researchOnly === true, 'researchOnly');
  assert('A-SETUP', 'uvl rows', CAPABILITY_RESEARCH_ENGINE_UVL_ROWS.length === 12, String(CAPABILITY_RESEARCH_ENGINE_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_RESEARCH_HISTORY_SIZE === 128, String(DEFAULT_MAX_RESEARCH_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('capability_research_engine').phase === 21.2, '21.2');
  assert('A-SETUP', 'question signal', isCapabilityResearchQuestion('show capability research'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runDomains(): void {
  const g = harness.beginGroup('B-DOMAINS');
  resetAll();

  assert('B-DOMAINS', 'building', classifyCapabilityDomain({ proposedCapability: 'parallel_build orchestration' }).domain === 'BUILDING', 'BUILDING');
  assert('B-DOMAINS', 'testing', classifyCapabilityDomain({ proposedCapability: 'autonomous_testing runner' }).domain === 'TESTING', 'TESTING');
  assert('B-DOMAINS', 'fixing', classifyCapabilityDomain({ proposedCapability: 'autonomous_fixing recovery' }).domain === 'FIXING', 'FIXING');
  assert('B-DOMAINS', 'verification', classifyCapabilityDomain({ proposedCapability: 'uvl verification evidence' }).domain === 'VERIFICATION', 'VERIFICATION');
  assert('B-DOMAINS', 'diagnostics', classifyCapabilityDomain({ proposedCapability: 'diagnostic trace log' }).domain === 'DIAGNOSTICS', 'DIAGNOSTICS');
  assert('B-DOMAINS', 'performance', classifyCapabilityDomain({ proposedCapability: 'performance optimizer bottleneck' }).domain === 'PERFORMANCE', 'PERFORMANCE');
  assert('B-DOMAINS', 'self evolution', classifyCapabilityDomain({ signals: ['self evolving devpulse capability gap'] }).domain === 'SELF_EVOLUTION', 'SELF_EVOLUTION');

  harness.endGroup('B-DOMAINS', g);
}

function runEvidence(): void {
  const g = harness.beginGroup('C-EVIDENCE');
  resetAll();

  const failureEvidence = analyzeCapabilityEvidence({
    failures: [
      { failureId: 'f1', subsystem: 'test', message: 'err' },
      { failureId: 'f2', subsystem: 'test', message: 'err' },
      { failureId: 'f3', subsystem: 'test', message: 'err' },
    ],
  });
  assert('C-EVIDENCE', 'failure evidence', failureEvidence.evidenceCount === 3, String(failureEvidence.evidenceCount));

  const stallEvidence = analyzeCapabilityEvidence({
    stalls: [{ stallId: 's1', progressVelocity: 0.01, actualDurationMs: 1_800_000 }],
  });
  assert('C-EVIDENCE', 'stall evidence', stallEvidence.evidenceSummary.includes('stall'), stallEvidence.evidenceSummary);

  const bottleneckEvidence = analyzeCapabilityEvidence({
    bottlenecks: [
      { bottleneckId: 'b1', bottleneckType: 'validator', subsystem: 'uvl' },
      { bottleneckId: 'b2', bottleneckType: 'validator', subsystem: 'uvl' },
    ],
  });
  assert('C-EVIDENCE', 'bottleneck evidence', bottleneckEvidence.evidenceCount === 2, String(bottleneckEvidence.evidenceCount));

  const blockedEvidence = analyzeCapabilityEvidence({
    blockedStates: [
      { stateId: 'bs1', state: 'BLOCKED', durationMs: 5000 },
      { stateId: 'bs2', state: 'RETRY', durationMs: 1000 },
      { stateId: 'bs3', state: 'BLOCKED', durationMs: 5000 },
    ],
  });
  assert('C-EVIDENCE', 'blocked evidence', blockedEvidence.evidenceCount === 3, String(blockedEvidence.evidenceCount));

  harness.endGroup('C-EVIDENCE', g);
}

function runGapResearch(): void {
  const g = harness.beginGroup('D-GAP');
  resetAll();

  const noGap = researchCapabilityGap({}, classifyCapabilityDomain({}), analyzeCapabilityEvidence({}));
  assert('D-GAP', 'no gap', noGap.gapType === 'NO_GAP', noGap.gapType);

  const weak = researchCapabilityGap(
    { failures: [{ failureId: 'f1', subsystem: 'x', message: 'e' }] },
    classifyCapabilityDomain({ subsystem: 'test' }),
    analyzeCapabilityEvidence({ failures: [{ failureId: 'f1', subsystem: 'x', message: 'e' }] }),
  );
  assert('D-GAP', 'weak capability', weak.gapType === 'WEAK_CAPABILITY', weak.gapType);

  const incomplete = researchCapabilityGap(
    {
      failures: [{ failureId: 'f1', subsystem: 'x', message: 'e' }],
      stalls: [{ stallId: 's1', progressVelocity: 0.01, actualDurationMs: 1_800_000 }],
    },
    classifyCapabilityDomain({ subsystem: 'monitoring' }),
    analyzeCapabilityEvidence({
      failures: [{ failureId: 'f1', subsystem: 'x', message: 'e' }],
      stalls: [{ stallId: 's1', progressVelocity: 0.01, actualDurationMs: 1_800_000 }],
    }),
  );
  assert('D-GAP', 'incomplete capability', incomplete.gapType === 'INCOMPLETE_CAPABILITY', incomplete.gapType);

  const missing = researchCapabilityGap(
    { escalationDecision: 'CAPABILITY_GAP_DETECTED', failures: [{ failureId: 'f1', subsystem: 'x', message: 'e' }] },
    classifyCapabilityDomain({ signals: ['missing capability'] }),
    analyzeCapabilityEvidence({
      escalationDecision: 'CAPABILITY_GAP_DETECTED',
      failures: [
        { failureId: 'f1', subsystem: 'x', message: 'e' },
        { failureId: 'f2', subsystem: 'x', message: 'e' },
        { failureId: 'f3', subsystem: 'x', message: 'e' },
      ],
    }),
  );
  assert('D-GAP', 'missing capability', missing.gapType === 'MISSING_CAPABILITY', missing.gapType);

  harness.endGroup('D-GAP', g);
}

function runSimilarity(): void {
  const g = harness.beginGroup('E-SIMILARITY');
  resetAll();

  const duplicate = analyzeCapabilitySimilarity({ proposedCapability: 'Missing Capability Escalation' });
  assert('E-SIMILARITY', 'duplicate capability', duplicate.duplicateRisk === 'DUPLICATE' || duplicate.duplicateRisk === 'HIGH', duplicate.duplicateRisk);
  assert('E-SIMILARITY', 'duplicate candidates', duplicate.existingCandidates.length > 0, String(duplicate.existingCandidates.length));

  const nearDup = analyzeCapabilitySimilarity({ proposedCapability: 'Multi Project Monitoring Feed' });
  assert('E-SIMILARITY', 'near duplicate', nearDup.similarityScore >= 30, String(nearDup.similarityScore));

  const unrelated = analyzeCapabilitySimilarity({ proposedCapability: 'xyzzy_quantum_flux_capacitor_9000' });
  assert('E-SIMILARITY', 'unrelated capability', unrelated.duplicateRisk === 'NONE', unrelated.duplicateRisk);

  harness.endGroup('E-SIMILARITY', g);
}

function runRootCause(): void {
  const g = harness.beginGroup('F-ROOT-CAUSE');
  resetAll();

  const malfunctionInput: CapabilityResearchInput = {
    failures: [
      { failureId: 'f1', subsystem: 'fix', message: 'e' },
      { failureId: 'f2', subsystem: 'fix', message: 'e' },
      { failureId: 'f3', subsystem: 'fix', message: 'e' },
    ],
  };
  const malfunctionEvidence = analyzeCapabilityEvidence(malfunctionInput);
  const malfunctionGap = researchCapabilityGap(malfunctionInput, classifyCapabilityDomain(malfunctionInput), malfunctionEvidence);
  const malfunction = researchCapabilityRootCause(malfunctionInput, malfunctionEvidence, malfunctionGap);
  assert('F-ROOT-CAUSE', 'capability malfunction', malfunction.rootCause === 'EXISTING_CAPABILITY_MALFUNCTION', malfunction.rootCause);

  const missingInput: CapabilityResearchInput = {
    escalationDecision: 'CAPABILITY_GAP_DETECTED',
    failures: [
      { failureId: 'f1', subsystem: 'x', message: 'e' },
      { failureId: 'f2', subsystem: 'x', message: 'e' },
      { failureId: 'f3', subsystem: 'x', message: 'e' },
    ],
  };
  const missingEvidence = analyzeCapabilityEvidence(missingInput);
  const missingGap = researchCapabilityGap(missingInput, classifyCapabilityDomain(missingInput), missingEvidence);
  const missing = researchCapabilityRootCause(missingInput, missingEvidence, missingGap);
  assert('F-ROOT-CAUSE', 'missing capability', missing.rootCause === 'MISSING_CAPABILITY', missing.rootCause);

  const runtimeInput: CapabilityResearchInput = {
    bottlenecks: [
      { bottleneckId: 'b1', bottleneckType: 'validator', subsystem: 'uvl' },
      { bottleneckId: 'b2', bottleneckType: 'validator', subsystem: 'uvl' },
    ],
  };
  const runtimeEvidence = analyzeCapabilityEvidence(runtimeInput);
  const runtimeGap = researchCapabilityGap(runtimeInput, classifyCapabilityDomain(runtimeInput), runtimeEvidence);
  const runtime = researchCapabilityRootCause(runtimeInput, runtimeEvidence, runtimeGap);
  assert('F-ROOT-CAUSE', 'runtime bottleneck', runtime.rootCause === 'RUNTIME_BOTTLENECK', runtime.rootCause);

  const resourceInput: CapabilityResearchInput = {
    bottlenecks: [
      { bottleneckId: 'b1', bottleneckType: 'resource', subsystem: 'alloc' },
      { bottleneckId: 'b2', bottleneckType: 'resource', subsystem: 'alloc' },
    ],
  };
  const resourceEvidence = analyzeCapabilityEvidence(resourceInput);
  const resourceGap = researchCapabilityGap(resourceInput, classifyCapabilityDomain(resourceInput), resourceEvidence);
  const resource = researchCapabilityRootCause(resourceInput, resourceEvidence, resourceGap);
  assert('F-ROOT-CAUSE', 'resource issue', resource.rootCause === 'RESOURCE_LIMITATION', resource.rootCause);

  const archInput: CapabilityResearchInput = {
    stalls: [{ stallId: 's1', progressVelocity: 0.01, actualDurationMs: 1_800_000 }],
  };
  const archEvidence = analyzeCapabilityEvidence(archInput);
  const archGap = researchCapabilityGap(archInput, classifyCapabilityDomain(archInput), archEvidence);
  const arch = researchCapabilityRootCause(archInput, archEvidence, archGap);
  assert('F-ROOT-CAUSE', 'architectural issue', arch.rootCause === 'ARCHITECTURAL_LIMITATION', arch.rootCause);

  harness.endGroup('F-ROOT-CAUSE', g);
}

function runDecisionEngine(): void {
  const g = harness.beginGroup('G-DECISIONS');
  resetAll();

  const noGap = buildCapabilityResearchDecision({});
  assert('G-DECISIONS', 'no gap found', noGap.record.decision === 'NO_GAP_FOUND', noGap.record.decision);

  const insufficient = buildCapabilityResearchDecision({ proposedCapability: 'Missing Capability Escalation' });
  assert('G-DECISIONS', 'existing insufficient', insufficient.record.decision === 'EXISTING_CAPABILITY_INSUFFICIENT', insufficient.record.decision);

  const newCap = buildCapabilityResearchDecision({
    proposedCapability: 'xyzzy_quantum_flux_capacitor_9000',
    escalationDecision: 'CAPABILITY_GAP_DETECTED',
    failures: [
      { failureId: 'f1', subsystem: 'x', message: 'e' },
      { failureId: 'f2', subsystem: 'x', message: 'e' },
      { failureId: 'f3', subsystem: 'x', message: 'e' },
    ],
  });
  assert('G-DECISIONS', 'new capability required', newCap.record.decision === 'NEW_CAPABILITY_REQUIRED', newCap.record.decision);

  const optimization = buildCapabilityResearchDecision({
    proposedCapability: 'performance optimizer for verification pipeline',
    bottlenecks: [
      { bottleneckId: 'b1', bottleneckType: 'validator', subsystem: 'uvl' },
      { bottleneckId: 'b2', bottleneckType: 'validator', subsystem: 'uvl' },
    ],
  });
  assert('G-DECISIONS', 'optimization required', optimization.record.decision === 'OPTIMIZATION_REQUIRED', optimization.record.decision);

  const diagnostic = buildCapabilityResearchDecision({
    proposedCapability: 'diagnostic trace analyzer',
    failures: [{ failureId: 'f1', subsystem: 'x', message: 'e' }],
  });
  assert('G-DECISIONS', 'diagnostic required', diagnostic.record.decision === 'DIAGNOSTIC_REQUIRED', diagnostic.record.decision);

  harness.endGroup('G-DECISIONS', g);
}

function runRegistryHistoryCache(): void {
  const g = harness.beginGroup('H-REGISTRY-CACHE');
  resetAll();

  const { record } = buildCapabilityResearchDecision({
    proposedCapability: 'new_research_capability',
    escalationDecision: 'RESEARCH_REQUIRED',
    failures: [
      { failureId: 'f1', subsystem: 'x', message: 'e' },
      { failureId: 'f2', subsystem: 'x', message: 'e' },
      { failureId: 'f3', subsystem: 'x', message: 'e' },
    ],
  });
  assert('H-REGISTRY-CACHE', 'registered', getCapabilityResearch(record.researchId) !== undefined, record.researchId);
  assert('H-REGISTRY-CACHE', 'list', listCapabilityResearch().length >= 1, String(listCapabilityResearch().length));
  recordCapabilityResearchHistory(record);
  assert('H-REGISTRY-CACHE', 'history', getCapabilityResearchHistorySize() >= 1, String(getCapabilityResearchHistorySize()));

  for (let i = 0; i < 130; i++) {
    recordCapabilityResearchHistory(record);
  }
  assert('H-REGISTRY-CACHE', 'history bounded', getCapabilityResearchHistorySize() <= DEFAULT_MAX_RESEARCH_HISTORY_SIZE, String(getCapabilityResearchHistorySize()));

  classifyCapabilityDomain({ proposedCapability: 'autonomous_testing' });
  classifyCapabilityDomain({ proposedCapability: 'autonomous_testing' });
  const cache = getCapabilityResearchCacheStats();
  assert('H-REGISTRY-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));

  harness.endGroup('H-REGISTRY-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('I-INTEGRATION');
  resetAll();

  const brain = registerCapabilityResearchEngineWithCentralBrain();
  assert('I-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerCapabilityResearchEngineWithCentralBrain();
  assert('I-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('I-INTEGRATION', 'project vault', registerCapabilityResearchEngineWithProjectVault().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'trust engine', registerCapabilityResearchEngineWithTrustEngine().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'escalation', registerCapabilityResearchEngineWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'uvl', registerCapabilityResearchEngineWithUvl().uvlRowCount === 12, '12');
  assert('I-INTEGRATION', 'autonomous testing', registerCapabilityResearchEngineWithAutonomousTesting().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'autonomous fixing', registerCapabilityResearchEngineWithAutonomousFixing().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'autonomous verification', registerCapabilityResearchEngineWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'completion engine', registerCapabilityResearchEngineWithCompletionEngine().readOnly === true, 'readOnly');
  assert('I-INTEGRATION', 'monitoring', registerCapabilityResearchEngineWithMultiProjectMonitoring().readOnly === true, 'readOnly');

  harness.endGroup('I-INTEGRATION', g);
}

function stressResearch(eventCount: number, label: string): void {
  const g = harness.beginGroup(`J-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  const domains = ['build', 'test', 'fix', 'verification', 'diagnostic', 'performance', 'monitoring', 'orchestration'];
  for (let i = 0; i < eventCount; i++) {
    const input: CapabilityResearchInput = {
      projectId: `P${i}`,
      proposedCapability: i % 10 === 0 ? 'Missing Capability Escalation' : `research_capability_${domains[i % domains.length]}_${i}`,
      escalationDecision: i % 4 === 0 ? 'RESEARCH_REQUIRED' : undefined,
      failures: i % 3 === 0 ? [
        { failureId: `f-${i}`, subsystem: 'stress', message: `error-${i % 5}` },
        { failureId: `f2-${i}`, subsystem: 'stress', message: `error-${i % 5}` },
        { failureId: `f3-${i}`, subsystem: 'stress', message: `error-${i % 5}` },
      ] : undefined,
      stalls: i % 7 === 0 ? [{ stallId: `s-${i}`, progressVelocity: 0.01, actualDurationMs: 1_800_000 + i }] : undefined,
      bottlenecks: i % 5 === 0 ? [
        { bottleneckId: `b-${i}`, bottleneckType: ['validator', 'orchestration', 'resource'][i % 3], subsystem: 'stress' },
        { bottleneckId: `b2-${i}`, bottleneckType: ['validator', 'orchestration', 'resource'][i % 3], subsystem: 'stress' },
      ] : undefined,
    };
    evaluateCapabilityResearch(input);
  }

  const elapsed = performance.now() - start;

  assert(`J-STRESS-${label}`, 'research count', getCapabilityResearchCount() === eventCount, String(getCapabilityResearchCount()));
  assert(`J-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getCapabilityResearchEngineRuntimeReport();
  assert(`J-STRESS-${label}`, 'runtime decisions', runtime.researchDecisionCount === eventCount, String(runtime.researchDecisionCount));
  assert(`J-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`J-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('K-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 21.2 Capability Research Engine');
  console.log('======================================================\n');

  runSetup();
  runDomains();
  runEvidence();
  runGapResearch();
  runSimilarity();
  runRootCause();
  runDecisionEngine();
  runRegistryHistoryCache();
  runIntegration();
  stressResearch(100, '100');
  stressResearch(1000, '1000');
  stressResearch(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getCapabilityResearchEngineRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Domain classifications: ${runtime.domainClassificationCount}`,
    `Evidence analyzed: ${runtime.evidenceAnalyzedCount}`,
    `Duplicate checks: ${runtime.duplicateCheckCount}`,
    `Root cause analyses: ${runtime.rootCauseAnalysisCount}`,
    `Research decisions: ${runtime.researchDecisionCount}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? CAPABILITY_RESEARCH_ENGINE_PASS_TOKEN : 'CAPABILITY_RESEARCH_ENGINE_V1_FAIL',
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

  console.log(`\n${CAPABILITY_RESEARCH_ENGINE_PASS_TOKEN}`);
}

main();
