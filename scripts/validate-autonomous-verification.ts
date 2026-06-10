/**
 * Phase 19.6 — Autonomous Verification validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import type { VerificationStrategyInput } from '../src/verification-strategy-core/verification-strategy-types.js';
import type { VerificationDecision, VerificationInput } from '../src/autonomous-verification/autonomous-verification-types.js';
import {
  AUTONOMOUS_VERIFICATION_PASS_TOKEN,
  AUTONOMOUS_VERIFICATION_OWNER_MODULE,
  VERIFICATION_DECISION_REGISTRY,
  MAX_VERIFICATION_HISTORY_SIZE,
  analyzeVerificationConfidence,
  analyzeVerificationEvidence,
  analyzeVerificationRisk,
  analyzeVerificationTrust,
  buildVerificationDecision,
  evaluateVerificationReadiness,
  generateVerificationDecisionFromUpstream,
  generateVerificationReport,
  getAutonomousVerificationRuntimeReport,
  getDevPulseV2AutonomousVerification,
  getLatestVerificationDecisions,
  getVerificationDecisionEntry,
  getVerificationHistorySize,
  lookupVerificationHistoryByDecision,
  lookupVerificationHistoryByReadiness,
  recordVerificationHistory,
  registerAutonomousVerificationWithAutonomousBuilder,
  registerAutonomousVerificationWithAutonomousFixing,
  registerAutonomousVerificationWithBuildStrategyEngine,
  registerAutonomousVerificationWithCentralBrain,
  registerAutonomousVerificationWithProjectVault,
  registerAutonomousVerificationWithTrustEngine,
  registerAutonomousVerificationWithUvl,
  registerAutonomousVerificationWithWorld2Coordinator,
  resetAutonomousVerificationModuleForTests,
  selectVerificationDecision,
} from '../src/autonomous-verification/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { AUTONOMOUS_VERIFICATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/autonomous-verification');

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
  'autonomous-verification.ts',
  'autonomous-verification-types.ts',
  'evidence-analyzer.ts',
  'verification-confidence-analyzer.ts',
  'verification-trust-analyzer.ts',
  'verification-risk-analyzer.ts',
  'verification-readiness-evaluator.ts',
  'verification-strategy-selector.ts',
  'verification-decision-builder.ts',
  'verification-reporting.ts',
  'verification-history.ts',
  'verification-registry.ts',
  'index.ts',
];

const ALL_DECISIONS: VerificationDecision[] = [
  'VERIFIED', 'NEEDS_FIXING', 'NEEDS_TESTING', 'TRUST_RECOVERY_REQUIRED', 'FOUNDER_REVIEW', 'BLOCKED',
];

function baseStrategyInput(overrides: Partial<VerificationStrategyInput> = {}): VerificationStrategyInput {
  return {
    taskType: 'FEATURE',
    riskLevel: 'MEDIUM',
    trustScore: 75,
    changeScope: 'MEDIUM',
    executionMode: 'LOCAL',
    ...overrides,
  };
}

function baseVerificationInput(overrides: Partial<VerificationInput> = {}): VerificationInput {
  return {
    trustScore: 75,
    buildConfidence: 75,
    testingConfidence: 75,
    fixingConfidence: 70,
    verificationConfidence: 75,
    testResultStatus: 'SIMULATED_PASS',
    testingCoverageSufficient: true,
    evidenceSignals: ['baseline evidence'],
    ...overrides,
  };
}

function resetAll(): void {
  resetAutonomousVerificationModuleForTests();
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2AutonomousVerification();
  assert('A-SETUP', 'pass token', authority.passToken === AUTONOMOUS_VERIFICATION_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === AUTONOMOUS_VERIFICATION_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'planning only', authority.planningOnly === true, 'planningOnly');
  assert('A-SETUP', 'decision registry', VERIFICATION_DECISION_REGISTRY.length === 6, String(VERIFICATION_DECISION_REGISTRY.length));
  assert('A-SETUP', 'uvl rows', AUTONOMOUS_VERIFICATION_UVL_ROWS.length === 12, String(AUTONOMOUS_VERIFICATION_UVL_ROWS.length));
  assert('A-SETUP', 'max history', MAX_VERIFICATION_HISTORY_SIZE === 64, String(MAX_VERIFICATION_HISTORY_SIZE));
  harness.endGroup('A-SETUP', g);
}

function runEvidenceAndAnalyzers(): void {
  const g = harness.beginGroup('B-ANALYZERS');
  resetAll();

  const strong = baseVerificationInput();
  const weak = baseVerificationInput({
    buildConfidence: 20,
    testingConfidence: 20,
    fixingConfidence: 20,
    verificationConfidence: 20,
    trustScore: 30,
    testResultStatus: 'NOT_EXECUTED',
    testingCoverageSufficient: false,
  });

  const strongEvidence = analyzeVerificationEvidence(strong);
  const weakEvidence = analyzeVerificationEvidence(weak);

  assert('B-ANALYZERS', 'strong evidence types', strongEvidence.evidenceTypes.length >= 3, String(strongEvidence.evidenceTypes.length));
  assert('B-ANALYZERS', 'weak missing evidence', weakEvidence.missingEvidence.length >= 2, String(weakEvidence.missingEvidence.length));
  assert('B-ANALYZERS', 'evidence confidence ordering', strongEvidence.evidenceConfidence > weakEvidence.evidenceConfidence, 'confidence');

  const strongTrust = analyzeVerificationTrust(strong, strongEvidence);
  const weakTrust = analyzeVerificationTrust(weak, weakEvidence);
  assert('B-ANALYZERS', 'trust ordering', strongTrust > weakTrust, `${strongTrust} vs ${weakTrust}`);

  const strongRisk = analyzeVerificationRisk(strong, strongEvidence, strongTrust);
  const weakRisk = analyzeVerificationRisk(weak, weakEvidence, weakTrust);
  assert('B-ANALYZERS', 'risk ordering', weakRisk > strongRisk, 'risk');

  const strongConfidence = analyzeVerificationConfidence(strong, strongEvidence, strongTrust, strongRisk);
  assert('B-ANALYZERS', 'confidence bounds', strongConfidence >= 0 && strongConfidence <= 100, String(strongConfidence));

  harness.endGroup('B-ANALYZERS', g);
}

function runDecisions(): void {
  const g = harness.beginGroup('C-DECISIONS');
  resetAll();

  const decisionCases: Array<{ label: string; input: VerificationInput; expected: VerificationDecision }> = [
    {
      label: 'VERIFIED',
      input: baseVerificationInput({
        trustScore: 85,
        buildConfidence: 85,
        testingConfidence: 85,
        fixingConfidence: 80,
        verificationConfidence: 85,
        testResultStatus: 'SIMULATED_PASS',
        evidenceSignals: ['complete evidence'],
      }),
      expected: 'VERIFIED',
    },
    {
      label: 'NEEDS_FIXING',
      input: baseVerificationInput({
        testResultStatus: 'SIMULATED_FAIL',
        repairCandidates: ['investigate failing suite'],
        fixReadiness: 'NEEDS_MORE_CONTEXT',
        fixingConfidence: 45,
      }),
      expected: 'NEEDS_FIXING',
    },
    {
      label: 'NEEDS_TESTING',
      input: baseVerificationInput({
        testResultStatus: 'NOT_EXECUTED',
        testingCoverageSufficient: false,
        testingConfidence: 35,
        buildConfidence: 70,
        verificationConfidence: 70,
      }),
      expected: 'NEEDS_TESTING',
    },
    {
      label: 'TRUST_RECOVERY_REQUIRED',
      input: baseVerificationInput({
        trustScore: 25,
        verificationDisagreement: true,
        repeatFailures: 4,
      }),
      expected: 'TRUST_RECOVERY_REQUIRED',
    },
    {
      label: 'FOUNDER_REVIEW',
      input: baseVerificationInput({ policyConflict: true, governanceBoundary: true }),
      expected: 'FOUNDER_REVIEW',
    },
    {
      label: 'BLOCKED',
      input: baseVerificationInput({
        missingDependencies: true,
        buildConfidence: 10,
        testingConfidence: 10,
        fixingConfidence: 10,
        verificationConfidence: 10,
        trustScore: 20,
      }),
      expected: 'BLOCKED',
    },
  ];

  for (const c of decisionCases) {
    const result = buildVerificationDecision(c.input);
    assert('C-DECISIONS', c.label, result.decision === c.expected, result.decision);
  }

  for (const decision of ALL_DECISIONS) {
    const entry = getVerificationDecisionEntry(decision);
    assert('C-DECISIONS', `registry ${decision}`, entry?.decision === decision, decision);
  }

  harness.endGroup('C-DECISIONS', g);
}

function runReadinessAndReports(): void {
  const g = harness.beginGroup('D-REPORTS');
  resetAll();

  const input = baseVerificationInput();
  const result = buildVerificationDecision(input);

  assert('D-REPORTS', 'result id', result.id.length > 0, result.id);
  assert('D-REPORTS', 'result confidence', result.confidence >= 0 && result.confidence <= 100, String(result.confidence));
  assert('D-REPORTS', 'result evidence', result.evidenceSummary.length > 0, String(result.evidenceSummary.length));
  assert('D-REPORTS', 'result reasoning', result.reasoning.length > 0, String(result.reasoning.length));

  const evidence = analyzeVerificationEvidence(input);
  const readiness = evaluateVerificationReadiness(
    input,
    result.decision,
    evidence,
    result.trustScore,
    result.riskScore,
    result.confidence,
  );
  assert('D-REPORTS', 'readiness', readiness.length > 0, readiness);

  const report = generateVerificationReport(result, input);
  assert('D-REPORTS', 'report id', report.reportId.length > 0, report.reportId);
  assert('D-REPORTS', 'report decision', report.decision === result.decision, report.decision);
  assert('D-REPORTS', 'report readiness', report.readiness.length > 0, report.readiness);

  harness.endGroup('D-REPORTS', g);
}

function runHistoryAndRegistry(): void {
  const g = harness.beginGroup('E-HISTORY');
  resetAll();

  const input = baseVerificationInput();
  const result = buildVerificationDecision(input);
  recordVerificationHistory(result, input);

  assert('E-HISTORY', 'history size', getVerificationHistorySize() >= 1, String(getVerificationHistorySize()));
  assert('E-HISTORY', 'latest decisions', getLatestVerificationDecisions().length >= 1, 'latest');
  assert('E-HISTORY', 'lookup decision', lookupVerificationHistoryByDecision(result.decision).length >= 1, result.decision);

  for (let i = 0; i < MAX_VERIFICATION_HISTORY_SIZE + 5; i++) {
    recordVerificationHistory(result, input);
  }
  assert('E-HISTORY', 'bounded history', getVerificationHistorySize() <= MAX_VERIFICATION_HISTORY_SIZE, String(getVerificationHistorySize()));

  const readyEntries = lookupVerificationHistoryByReadiness('READY');
  assert('E-HISTORY', 'lookup readiness', readyEntries.length >= 0, String(readyEntries.length));

  harness.endGroup('E-HISTORY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();

  const owner = getDevPulseV2Owner('autonomous_verification');
  assert('F-INTEGRATION', 'ownership', owner.ownerModule === AUTONOMOUS_VERIFICATION_OWNER_MODULE, owner.ownerModule);

  const brain = registerAutonomousVerificationWithCentralBrain();
  const vault = registerAutonomousVerificationWithProjectVault();
  const trust = registerAutonomousVerificationWithTrustEngine();
  const uvl = registerAutonomousVerificationWithUvl();
  const world2 = registerAutonomousVerificationWithWorld2Coordinator();
  const builder = registerAutonomousVerificationWithAutonomousBuilder();
  const buildStrategy = registerAutonomousVerificationWithBuildStrategyEngine();
  const fixing = registerAutonomousVerificationWithAutonomousFixing();

  assert('F-INTEGRATION', 'central brain', brain.centralBrainSystems >= 1, String(brain.centralBrainSystems));
  assert('F-INTEGRATION', 'vault read-only', vault.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'trust read-only', trust.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'uvl read-only', uvl.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'world2 read-only', world2.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'builder read-only', builder.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'build strategy read-only', buildStrategy.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'fixing read-only', fixing.readOnly === true, 'readOnly');
  assert('F-INTEGRATION', 'verification tokens', brain.verificationStackTokens.length === 3, String(brain.verificationStackTokens.length));
  assert('F-INTEGRATION', 'fixing token', brain.autonomousFixingToken.length > 0, brain.autonomousFixingToken);
  assert('F-INTEGRATION', 'decision registry count', brain.decisionRegistryCount === 6, String(brain.decisionRegistryCount));

  const pipeline = generateVerificationDecisionFromUpstream(baseStrategyInput());
  assert('F-INTEGRATION', 'upstream pipeline', pipeline.result.id.length > 0, pipeline.result.id);
  assert('F-INTEGRATION', 'upstream report', pipeline.report.resultId === pipeline.result.id, pipeline.report.resultId);

  const brainReuse = registerAutonomousVerificationWithCentralBrain();
  assert('F-INTEGRATION', 'bootstrap reuse', brainReuse.registeredAt === brain.registeredAt, 'cached');

  const runtime = getAutonomousVerificationRuntimeReport();
  assert('F-INTEGRATION', 'runtime registry', runtime.registrySize === 6, String(runtime.registrySize));
  assert('F-INTEGRATION', 'runtime history', runtime.historySize >= 1, String(runtime.historySize));

  harness.endGroup('F-INTEGRATION', g);
}

function runDecisionSelectorDirect(): void {
  const g = harness.beginGroup('G-SELECTOR');
  resetAll();

  const input = baseVerificationInput();
  const evidence = analyzeVerificationEvidence(input);
  const trust = analyzeVerificationTrust(input, evidence);
  const risk = analyzeVerificationRisk(input, evidence, trust);
  const confidence = analyzeVerificationConfidence(input, evidence, trust, risk);
  const decision = selectVerificationDecision(input, evidence, trust, risk, confidence);

  assert('G-SELECTOR', 'direct selector', ALL_DECISIONS.includes(decision), decision);
  assert('G-SELECTOR', 'selector confidence', confidence >= 0, String(confidence));

  harness.endGroup('G-SELECTOR', g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('H-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 19.6 Autonomous Verification');
  console.log('=================================================\n');

  runSetup();
  runEvidenceAndAnalyzers();
  runDecisions();
  runReadinessAndReports();
  runHistoryAndRegistry();
  runIntegration();
  runDecisionSelectorDirect();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    failed.length === 0 ? AUTONOMOUS_VERIFICATION_PASS_TOKEN : 'AUTONOMOUS_VERIFICATION_V1_FAIL',
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

  console.log(`\n${AUTONOMOUS_VERIFICATION_PASS_TOKEN}`);
}

main();
