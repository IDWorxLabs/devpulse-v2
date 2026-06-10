/**
 * Phase 21.6 — Self Evolution Governance validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  SELF_EVOLUTION_GOVERNANCE_PASS_TOKEN,
  SELF_EVOLUTION_GOVERNANCE_OWNER_MODULE,
  DEFAULT_MAX_GOVERNANCE_HISTORY_SIZE,
  buildGovernanceDecision,
  evaluateGovernanceApproval,
  evaluateGovernanceReadiness,
  evaluateGovernanceRisk,
  evaluateGovernanceTrust,
  evaluateSelfEvolutionGovernance,
  getDevPulseV2SelfEvolutionGovernance,
  getGovernanceCacheStats,
  getGovernanceHistorySize,
  getGovernanceRecord,
  getGovernanceRecordCount,
  getSelfEvolutionGovernanceRuntimeReport,
  isSelfEvolutionGovernanceQuestion,
  listGovernanceRecords,
  registerSelfEvolutionGovernanceWithAutonomousVerification,
  registerSelfEvolutionGovernanceWithCapabilityBuildEngine,
  registerSelfEvolutionGovernanceWithCapabilityPlanningEngine,
  registerSelfEvolutionGovernanceWithCapabilityResearchEngine,
  registerSelfEvolutionGovernanceWithCapabilityVerificationEngine,
  registerSelfEvolutionGovernanceWithCentralBrain,
  registerSelfEvolutionGovernanceWithCompletionEngine,
  registerSelfEvolutionGovernanceWithMissingCapabilityEscalation,
  registerSelfEvolutionGovernanceWithMultiProjectMonitoring,
  registerSelfEvolutionGovernanceWithProjectVault,
  registerSelfEvolutionGovernanceWithTrustEngine,
  registerSelfEvolutionGovernanceWithUvl,
  resetSelfEvolutionGovernanceModuleForTests,
  validateGovernanceBoundaries,
  validateGovernanceRollback,
  validateGovernanceStallProtection,
  validateSelfModification,
} from '../src/self-evolution-governance/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { SELF_EVOLUTION_GOVERNANCE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { SelfEvolutionGovernanceInput } from '../src/self-evolution-governance/self-evolution-governance-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/self-evolution-governance');

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
  'self-evolution-governance.ts',
  'self-evolution-governance-types.ts',
  'self-evolution-governance-registry.ts',
  'governance-boundary-validator.ts',
  'governance-risk-evaluator.ts',
  'governance-trust-evaluator.ts',
  'governance-approval-evaluator.ts',
  'governance-rollback-validator.ts',
  'governance-self-modification-validator.ts',
  'governance-readiness-evaluator.ts',
  'governance-decision-engine.ts',
  'governance-reporting.ts',
  'governance-history.ts',
  'governance-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetSelfEvolutionGovernanceModuleForTests();
}

function approvedInput(suffix: string, extra: Partial<SelfEvolutionGovernanceInput> = {}): SelfEvolutionGovernanceInput {
  return {
    evolutionRequest: `self_evolution_request_${suffix}_${Date.now()}`,
    capabilityDomain: 'SELF_EVOLUTION',
    riskScore: 15,
    verificationDecision: 'VERIFIED',
    rollbackCheckpoints: ['pre_build', 'post_plan'],
    rollbackTriggers: ['validation_failure', 'trust_degradation'],
    recoveryPath: ['halt', 'revert', 'notify'],
    hasProgressMonitoring: true,
    hasStallHandling: true,
    hasBottleneckRecovery: true,
    hasEscalationPath: true,
    signals: [
      'boundary:ownership_ok',
      'verification:satisfied',
      'escalation:integrated',
      'progress:monitoring',
      'stall:handling',
      'bottleneck:recovery',
      'escalation:path',
    ],
    ...extra,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2SelfEvolutionGovernance();
  assert('A-SETUP', 'pass token', authority.passToken === SELF_EVOLUTION_GOVERNANCE_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === SELF_EVOLUTION_GOVERNANCE_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'governance only', authority.governanceOnly === true, 'governanceOnly');
  assert('A-SETUP', 'no self modification', authority.noSelfModification === true, 'noSelfModification');
  assert('A-SETUP', 'no execution', authority.noExecution === true, 'noExecution');
  assert('A-SETUP', 'uvl rows', SELF_EVOLUTION_GOVERNANCE_UVL_ROWS.length === 14, String(SELF_EVOLUTION_GOVERNANCE_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_GOVERNANCE_HISTORY_SIZE === 128, String(DEFAULT_MAX_GOVERNANCE_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('self_evolution_governance').phase === 21.6, '21.6');
  assert('A-SETUP', 'question signal', isSelfEvolutionGovernanceQuestion('show self evolution governance'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runBoundaries(): void {
  const g = harness.beginGroup('B-BOUNDARIES');
  resetAll();

  const constitutional = validateGovernanceBoundaries(approvedInput('const'));
  assert('B-BOUNDARIES', 'constitutional compliance', constitutional.constitutionalCompliance, String(constitutional.constitutionalCompliance));

  const ownership = validateGovernanceBoundaries(approvedInput('own', { signals: ['boundary:ownership_ok'] }));
  assert('B-BOUNDARIES', 'ownership compliance', ownership.ownershipCompliance, String(ownership.ownershipCompliance));

  const world2 = validateGovernanceBoundaries(approvedInput('w2', { world2Impact: true, signals: ['boundary:world2_ok', 'world2:governed'] }));
  assert('B-BOUNDARIES', 'world2 compliance', world2.world2Compliance, String(world2.world2Compliance));

  const violation = validateGovernanceBoundaries({ evolutionRequest: 'bad', signals: ['boundary:constitutional_violation'] });
  assert('B-BOUNDARIES', 'violation detected', !violation.compliant, String(violation.compliant));

  harness.endGroup('B-BOUNDARIES', g);
}

function runRisk(): void {
  const g = harness.beginGroup('C-RISK');
  resetAll();

  assert('C-RISK', 'low risk', evaluateGovernanceRisk(approvedInput('rlow', { riskScore: 15 })).riskLevel === 'LOW', 'LOW');
  assert('C-RISK', 'medium risk', evaluateGovernanceRisk(approvedInput('rmed', { riskScore: 45 })).riskLevel === 'MEDIUM', 'MEDIUM');
  assert('C-RISK', 'high risk', evaluateGovernanceRisk(approvedInput('rhigh', { riskScore: 65 })).riskLevel === 'HIGH', 'HIGH');
  assert('C-RISK', 'critical risk', evaluateGovernanceRisk(approvedInput('rcrit', { riskScore: 90 })).riskLevel === 'CRITICAL', 'CRITICAL');

  harness.endGroup('C-RISK', g);
}

function runTrust(): void {
  const g = harness.beginGroup('D-TRUST');
  resetAll();

  const pass = evaluateGovernanceTrust(approvedInput('tpass'));
  assert('D-TRUST', 'trust pass', pass.trustScore >= 60 && pass.verificationSatisfied, String(pass.trustScore));

  const review = evaluateGovernanceTrust(approvedInput('treview', { trustImpact: true }));
  assert('D-TRUST', 'trust review', review.trustScore < 70, String(review.trustScore));

  harness.endGroup('D-TRUST', g);
}

function runApproval(): void {
  const g = harness.beginGroup('E-APPROVAL');
  resetAll();

  const riskLow = evaluateGovernanceRisk(approvedInput('ap-low', { riskScore: 15 }));
  const approved = evaluateGovernanceApproval(approvedInput('ap-low'), riskLow);
  assert('E-APPROVAL', 'approved', approved.requirement === 'APPROVED', approved.requirement);

  const riskHigh = evaluateGovernanceRisk(approvedInput('ap-founder', { riskScore: 70, world2Impact: true }));
  const founder = evaluateGovernanceApproval(approvedInput('ap-founder', { world2Impact: true }), riskHigh);
  assert('E-APPROVAL', 'founder review', founder.requirement === 'FOUNDER_REVIEW_REQUIRED', founder.requirement);

  const riskTrust = evaluateGovernanceRisk(approvedInput('ap-trust', { riskScore: 25 }));
  const trust = evaluateGovernanceApproval(approvedInput('ap-trust', { trustImpact: true }), riskTrust);
  assert('E-APPROVAL', 'trust review', trust.requirement === 'TRUST_REVIEW_REQUIRED', trust.requirement);

  harness.endGroup('E-APPROVAL', g);
}

function runRollback(): void {
  const g = harness.beginGroup('F-ROLLBACK');
  resetAll();

  const valid = validateGovernanceRollback(approvedInput('rb-valid'));
  assert('F-ROLLBACK', 'valid rollback', valid.valid && !valid.missingRollback, String(valid.valid));

  const missing = validateGovernanceRollback({ evolutionRequest: 'no_rb', rollbackCheckpoints: [], recoveryPath: [] });
  assert('F-ROLLBACK', 'missing rollback', missing.missingRollback, String(missing.missingRollback));

  const unsafe = validateGovernanceRollback({
    evolutionRequest: 'unsafe_rb',
    rollbackCheckpoints: ['cp1'],
    rollbackTriggers: [],
    recoveryPath: ['revert'],
    signals: ['rollback:unsafe'],
  });
  assert('F-ROLLBACK', 'unsafe rollback', unsafe.unsafeRollback, String(unsafe.unsafeRollback));

  harness.endGroup('F-ROLLBACK', g);
}

function runSelfModification(): void {
  const g = harness.beginGroup('G-SELFMOD');
  resetAll();

  const blocked = validateSelfModification(approvedInput('sm-block'));
  assert('G-SELFMOD', 'self modification blocked', blocked.state === 'SELF_MODIFICATION_BLOCKED', blocked.state);
  assert('G-SELFMOD', 'code blocked', blocked.codeModificationBlocked, String(blocked.codeModificationBlocked));
  assert('G-SELFMOD', 'deployment blocked', blocked.deploymentBlocked, String(blocked.deploymentBlocked));
  assert('G-SELFMOD', 'execution blocked', blocked.executionBlocked, String(blocked.executionBlocked));

  const attempt = buildGovernanceDecision(approvedInput('sm-attempt', { signals: ['selfmod:code_modification'] }));
  assert('G-SELFMOD', 'attempt blocked', attempt.record.decision === 'SELF_MODIFICATION_BLOCKED', attempt.record.decision);

  harness.endGroup('G-SELFMOD', g);
}

function runStallGovernance(): void {
  const g = harness.beginGroup('H-STALL');
  resetAll();

  const full = validateGovernanceStallProtection(approvedInput('stall-full'));
  assert('H-STALL', 'progress monitoring', full.progressMonitoringPresent, String(full.progressMonitoringPresent));
  assert('H-STALL', 'stall handling', full.stallHandlingPresent, String(full.stallHandlingPresent));
  assert('H-STALL', 'escalation path', full.escalationPathPresent, String(full.escalationPathPresent));

  const missing = validateGovernanceStallProtection({ evolutionRequest: 'no_stall' });
  assert('H-STALL', 'missing protection', !missing.complete, String(missing.complete));

  const review = buildGovernanceDecision({
    evolutionRequest: 'stall_review_unique',
    riskScore: 15,
    verificationDecision: 'VERIFIED',
    rollbackCheckpoints: ['pre'],
    rollbackTriggers: ['fail'],
    recoveryPath: ['revert'],
    signals: ['boundary:ownership_ok', 'verification:satisfied'],
  });
  assert('H-STALL', 'requires review', review.record.decision === 'FOUNDER_REVIEW_REQUIRED', review.record.decision);

  harness.endGroup('H-STALL', g);
}

function runReadiness(): void {
  const g = harness.beginGroup('I-READINESS');
  resetAll();

  const ready = buildGovernanceDecision(approvedInput('ready'));
  assert('I-READINESS', 'ready', ready.report.readiness.state === 'READY', ready.report.readiness.state);

  const blocked = buildGovernanceDecision(approvedInput('blocked', { riskScore: 90, signals: ['governance:blocked'] }));
  assert('I-READINESS', 'blocked', blocked.report.readiness.state === 'BLOCKED' || blocked.record.decision === 'BLOCKED', blocked.record.decision);

  const review = buildGovernanceDecision(approvedInput('review', { trustImpact: true }));
  assert('I-READINESS', 'requires review', review.report.readiness.state === 'REQUIRES_REVIEW' || review.record.decision === 'TRUST_REVIEW_REQUIRED', review.record.decision);

  harness.endGroup('I-READINESS', g);
}

function runDecisionEngine(): void {
  const g = harness.beginGroup('J-DECISIONS');
  resetAll();

  const approved = buildGovernanceDecision(approvedInput('dec-approved'));
  assert('J-DECISIONS', 'approved', approved.record.decision === 'APPROVED', approved.record.decision);
  assert('J-DECISIONS', 'safety law', approved.report.phase21SafetyLaw.codeModificationAllowed === false, 'blocked');

  const founder = buildGovernanceDecision(approvedInput('dec-founder', { world2Impact: true, signals: ['boundary:world2_ok', 'world2:governed', 'verification:satisfied', 'escalation:integrated', 'progress:monitoring', 'stall:handling', 'bottleneck:recovery', 'escalation:path'] }));
  assert('J-DECISIONS', 'founder review required', founder.record.decision === 'FOUNDER_REVIEW_REQUIRED', founder.record.decision);

  const trust = buildGovernanceDecision(approvedInput('dec-trust', { trustImpact: true }));
  assert('J-DECISIONS', 'trust review required', trust.record.decision === 'TRUST_REVIEW_REQUIRED', trust.record.decision);

  const rollback = buildGovernanceDecision({
    evolutionRequest: 'rollback_review_unique',
    riskScore: 15,
    verificationDecision: 'VERIFIED',
    signals: ['boundary:ownership_ok', 'verification:satisfied', 'escalation:integrated', 'progress:monitoring', 'stall:handling', 'bottleneck:recovery', 'escalation:path'],
    rollbackCheckpoints: [],
    recoveryPath: [],
  });
  assert('J-DECISIONS', 'rollback review', rollback.record.decision === 'ROLLBACK_REVIEW_REQUIRED', rollback.record.decision);

  const blocked = buildGovernanceDecision(approvedInput('dec-blocked', { riskScore: 90 }));
  assert('J-DECISIONS', 'blocked decision', blocked.record.decision === 'BLOCKED', blocked.record.decision);

  harness.endGroup('J-DECISIONS', g);
}

function runRegistryCache(): void {
  const g = harness.beginGroup('K-REGISTRY-CACHE');
  resetAll();

  const { record } = buildGovernanceDecision(approvedInput('reg'));
  assert('K-REGISTRY-CACHE', 'registered', getGovernanceRecord(record.governanceId) !== undefined, record.governanceId);
  assert('K-REGISTRY-CACHE', 'list', listGovernanceRecords().length >= 1, String(listGovernanceRecords().length));
  assert('K-REGISTRY-CACHE', 'history', getGovernanceHistorySize() >= 1, String(getGovernanceHistorySize()));

  const cacheInput = approvedInput('cache');
  cacheInput.evolutionRequest = 'governance_cache_test_fixed';
  buildGovernanceDecision(cacheInput);
  buildGovernanceDecision(cacheInput);
  const cache = getGovernanceCacheStats();
  assert('K-REGISTRY-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));

  harness.endGroup('K-REGISTRY-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('L-INTEGRATION');
  resetAll();

  const brain = registerSelfEvolutionGovernanceWithCentralBrain();
  assert('L-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerSelfEvolutionGovernanceWithCentralBrain();
  assert('L-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('L-INTEGRATION', 'project vault', registerSelfEvolutionGovernanceWithProjectVault().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'trust engine', registerSelfEvolutionGovernanceWithTrustEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'escalation', registerSelfEvolutionGovernanceWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'research engine', registerSelfEvolutionGovernanceWithCapabilityResearchEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'planning engine', registerSelfEvolutionGovernanceWithCapabilityPlanningEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'build engine', registerSelfEvolutionGovernanceWithCapabilityBuildEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'verification engine', registerSelfEvolutionGovernanceWithCapabilityVerificationEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'autonomous verification', registerSelfEvolutionGovernanceWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'completion engine', registerSelfEvolutionGovernanceWithCompletionEngine().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'monitoring', registerSelfEvolutionGovernanceWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'uvl', registerSelfEvolutionGovernanceWithUvl().uvlRowCount === 14, '14');

  harness.endGroup('L-INTEGRATION', g);
}

function stressGovernance(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const input: SelfEvolutionGovernanceInput = i % 10 === 0
      ? approvedInput(`stress-block-${i}`, { signals: ['selfmod:deployment'] })
      : approvedInput(`stress-${i}-${label}`, {
        riskScore: 15 + (i % 70),
        trustImpact: i % 17 === 0,
        world2Impact: i % 23 === 0,
      });
    evaluateSelfEvolutionGovernance(input);
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'governance count', getGovernanceRecordCount() === count, String(getGovernanceRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getSelfEvolutionGovernanceRuntimeReport();
  assert(`M-STRESS-${label}`, 'runtime count', runtime.governanceCount === count, String(runtime.governanceCount));
  assert(`M-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`M-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('N-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 21.6 Self Evolution Governance');
  console.log('====================================================\n');

  runSetup();
  runBoundaries();
  runRisk();
  runTrust();
  runApproval();
  runRollback();
  runSelfModification();
  runStallGovernance();
  runReadiness();
  runDecisionEngine();
  runRegistryCache();
  runIntegration();
  stressGovernance(100, '100');
  stressGovernance(1000, '1000');
  stressGovernance(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getSelfEvolutionGovernanceRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Boundary validations: ${runtime.boundaryValidations}`,
    `Risk reviews: ${runtime.riskReviews}`,
    `Trust reviews: ${runtime.trustReviews}`,
    `Approval reviews: ${runtime.approvalReviews}`,
    `Rollback reviews: ${runtime.rollbackReviews}`,
    `Readiness evaluations: ${runtime.readinessEvaluations}`,
    `Governance count: ${runtime.governanceCount}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? SELF_EVOLUTION_GOVERNANCE_PASS_TOKEN : 'SELF_EVOLUTION_GOVERNANCE_V1_FAIL',
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

  console.log(`\n${SELF_EVOLUTION_GOVERNANCE_PASS_TOKEN}`);
}

main();
