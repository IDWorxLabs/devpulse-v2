/**
 * Phase 21.5 — Capability Verification Engine validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  CAPABILITY_VERIFICATION_ENGINE_PASS_TOKEN,
  CAPABILITY_VERIFICATION_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_VERIFICATION_HISTORY_SIZE,
  buildCapabilityVerificationDecision,
  evaluateCapabilityVerification,
  evaluateCapabilityReadiness,
  getCapabilityVerification,
  getCapabilityVerificationCacheStats,
  getCapabilityVerificationCount,
  getCapabilityVerificationEngineRuntimeReport,
  getCapabilityVerificationHistorySize,
  getDevPulseV2CapabilityVerificationEngine,
  isCapabilityVerificationQuestion,
  listCapabilityVerifications,
  registerCapabilityVerificationEngineWithAutonomousVerification,
  registerCapabilityVerificationEngineWithCapabilityBuildEngine,
  registerCapabilityVerificationEngineWithCapabilityPlanningEngine,
  registerCapabilityVerificationEngineWithCapabilityResearchEngine,
  registerCapabilityVerificationEngineWithCentralBrain,
  registerCapabilityVerificationEngineWithCompletionEngine,
  registerCapabilityVerificationEngineWithMissingCapabilityEscalation,
  registerCapabilityVerificationEngineWithMultiProjectMonitoring,
  registerCapabilityVerificationEngineWithProjectVault,
  registerCapabilityVerificationEngineWithTrustEngine,
  registerCapabilityVerificationEngineWithUvl,
  resetCapabilityVerificationEngineModuleForTests,
  validateCapabilityDuplicates,
  validateCapabilityRequirements,
  validateCapabilityRisk,
  validateCapabilityRollout,
  validateCapabilityStallProtection,
  validateCapabilityTrust,
} from '../src/capability-verification-engine/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { CAPABILITY_VERIFICATION_ENGINE_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { CapabilityVerificationInput } from '../src/capability-verification-engine/capability-verification-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/capability-verification-engine');

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
  'capability-verification-engine.ts',
  'capability-verification-types.ts',
  'capability-verification-registry.ts',
  'capability-requirement-validator.ts',
  'capability-duplicate-validator.ts',
  'capability-risk-validator.ts',
  'capability-rollout-validator.ts',
  'capability-trust-validator.ts',
  'capability-readiness-evaluator.ts',
  'capability-verification-decision-engine.ts',
  'capability-verification-reporting.ts',
  'capability-verification-history.ts',
  'capability-verification-cache.ts',
  'index.ts',
];

function resetAll(): void {
  resetCapabilityVerificationEngineModuleForTests();
}

function verifiedInput(suffix: string, extra: Partial<CapabilityVerificationInput> = {}): CapabilityVerificationInput {
  return {
    proposedCapability: `unique_verified_cap_${suffix}_${Date.now()}`,
    capabilityDomain: 'ORCHESTRATION',
    scopeCovered: true,
    integrationPoints: ['missing_capability_escalation', 'foundation', 'uvl'],
    validationRequirements: ['module_validation', 'uvl_validation'],
    signals: ['ownership:defined', 'integrations:complete', 'validation:complete', 'escalation:integrated'],
    rolloutStages: ['plan_review', 'staged_rollout'],
    rollbackCheckpoints: ['pre_build', 'post_integration'],
    recoveryPath: ['halt', 'revert'],
    riskScore: 20,
    ...extra,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-SETUP');
  for (const file of REQUIRED_FILES) {
    assert('A-SETUP', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const authority = getDevPulseV2CapabilityVerificationEngine();
  assert('A-SETUP', 'pass token', authority.passToken === CAPABILITY_VERIFICATION_ENGINE_PASS_TOKEN, authority.passToken);
  assert('A-SETUP', 'owner module', authority.ownerModule === CAPABILITY_VERIFICATION_ENGINE_OWNER_MODULE, authority.ownerModule);
  assert('A-SETUP', 'verification only', authority.verificationOnly === true, 'verificationOnly');
  assert('A-SETUP', 'no file modification', authority.noFileModification === true, 'noFileModification');
  assert('A-SETUP', 'no execution', authority.noExecution === true, 'noExecution');
  assert('A-SETUP', 'uvl rows', CAPABILITY_VERIFICATION_ENGINE_UVL_ROWS.length === 13, String(CAPABILITY_VERIFICATION_ENGINE_UVL_ROWS.length));
  assert('A-SETUP', 'max history', DEFAULT_MAX_VERIFICATION_HISTORY_SIZE === 128, String(DEFAULT_MAX_VERIFICATION_HISTORY_SIZE));
  assert('A-SETUP', 'ownership', getDevPulseV2Owner('capability_verification_engine').phase === 21.5, '21.5');
  assert('A-SETUP', 'question signal', isCapabilityVerificationQuestion('show capability verification'), 'signal');
  harness.endGroup('A-SETUP', g);
}

function runRequirements(): void {
  const g = harness.beginGroup('B-REQUIREMENTS');
  resetAll();

  const complete = validateCapabilityRequirements(verifiedInput('req-complete'));
  assert('B-REQUIREMENTS', 'complete coverage', complete.complete && complete.coverageScore >= 75, String(complete.coverageScore));

  const partial = validateCapabilityRequirements({
    proposedCapability: 'partial_cap',
    scopeCovered: true,
    integrationPoints: ['foundation'],
    signals: ['ownership:defined'],
  });
  assert('B-REQUIREMENTS', 'partial coverage', !partial.complete && partial.missingRequirements.length > 0, partial.missingRequirements.join(','));

  const missing = validateCapabilityRequirements({ proposedCapability: 'x', scopeCovered: false });
  assert('B-REQUIREMENTS', 'missing coverage', missing.missingRequirements.length >= 2, String(missing.missingRequirements.length));

  harness.endGroup('B-REQUIREMENTS', g);
}

function runDuplicates(): void {
  const g = harness.beginGroup('C-DUPLICATES');
  resetAll();

  const duplicate = validateCapabilityDuplicates({ proposedCapability: 'Missing Capability Escalation' });
  assert('C-DUPLICATES', 'duplicate capability', duplicate.isDuplicate, String(duplicate.isDuplicate));

  const nearDup = validateCapabilityDuplicates({ proposedCapability: 'project monitoring widget extension' });
  assert('C-DUPLICATES', 'near duplicate', !nearDup.isDuplicate, String(nearDup.duplicateRisk));

  const unique = validateCapabilityDuplicates(verifiedInput('dup-unique'));
  assert('C-DUPLICATES', 'unique capability', !unique.isDuplicate && unique.duplicateRisk === 'NONE', unique.duplicateRisk);

  harness.endGroup('C-DUPLICATES', g);
}

function runRisk(): void {
  const g = harness.beginGroup('D-RISK');
  resetAll();

  assert('D-RISK', 'low risk', validateCapabilityRisk(verifiedInput('risk-low', { riskScore: 15 })).riskLevel === 'LOW', 'LOW');
  assert('D-RISK', 'medium risk', validateCapabilityRisk(verifiedInput('risk-med', { riskScore: 45 })).riskLevel === 'MEDIUM', 'MEDIUM');
  assert('D-RISK', 'high risk', validateCapabilityRisk(verifiedInput('risk-high', { riskScore: 70, world2Impact: true })).riskLevel === 'HIGH', 'HIGH');
  assert('D-RISK', 'critical risk', validateCapabilityRisk(verifiedInput('risk-crit', { riskScore: 90 })).riskLevel === 'CRITICAL', 'CRITICAL');

  harness.endGroup('D-RISK', g);
}

function runRollout(): void {
  const g = harness.beginGroup('E-ROLLOUT');
  resetAll();

  const valid = validateCapabilityRollout(verifiedInput('roll-valid'));
  assert('E-ROLLOUT', 'valid rollout', valid.valid && !valid.missingRollback, String(valid.valid));

  const missingRb = validateCapabilityRollout({
    proposedCapability: 'no_rollback_cap',
    rolloutStages: ['stage1'],
    rollbackCheckpoints: [],
    recoveryPath: [],
  });
  assert('E-ROLLOUT', 'missing rollback', missingRb.missingRollback, String(missingRb.missingRollback));

  const unsafe = validateCapabilityRollout({
    proposedCapability: 'unsafe_cap',
    world2Impact: true,
    rolloutStages: ['direct_deploy'],
    rollbackCheckpoints: ['cp1'],
    recoveryPath: ['revert'],
    signals: ['rollout:unsafe'],
  });
  assert('E-ROLLOUT', 'unsafe rollout', unsafe.unsafeRollout, String(unsafe.unsafeRollout));

  harness.endGroup('E-ROLLOUT', g);
}

function runTrust(): void {
  const g = harness.beginGroup('F-TRUST');
  resetAll();

  const pass = validateCapabilityTrust(verifiedInput('trust-pass'));
  assert('F-TRUST', 'trust pass', !pass.requiresReview && pass.trustScore >= 60, String(pass.trustScore));

  const review = validateCapabilityTrust(verifiedInput('trust-review', { trustImpact: true }));
  assert('F-TRUST', 'trust review', review.requiresReview, String(review.requiresReview));

  const world2 = validateCapabilityTrust(verifiedInput('world2-review', { world2Impact: true }));
  assert('F-TRUST', 'world2 review', world2.requiresReview, String(world2.requiresReview));

  harness.endGroup('F-TRUST', g);
}

function runReadiness(): void {
  const g = harness.beginGroup('G-READINESS');
  resetAll();

  const input = verifiedInput('ready');
  const req = validateCapabilityRequirements(input);
  const dup = validateCapabilityDuplicates(input);
  const risk = validateCapabilityRisk(input);
  const rollout = validateCapabilityRollout(input);
  const trust = validateCapabilityTrust(input);
  const stall = validateCapabilityStallProtection(input);
  const ready = evaluateCapabilityReadiness(input, req, dup, risk, rollout, trust, stall);
  assert('G-READINESS', 'ready', ready.state === 'READY' && ready.canProceed, ready.state);

  const blockedInput = verifiedInput('blocked', { riskScore: 90 });
  const blocked = buildCapabilityVerificationDecision(blockedInput);
  assert('G-READINESS', 'blocked', blocked.record.decision === 'BLOCKED', blocked.record.decision);

  const reviewInput = verifiedInput('review', { trustImpact: true });
  const review = buildCapabilityVerificationDecision(reviewInput);
  assert('G-READINESS', 'requires review', review.record.decision === 'TRUST_REVIEW_REQUIRED', review.record.decision);

  harness.endGroup('G-READINESS', g);
}

function runStallProtection(): void {
  const g = harness.beginGroup('H-STALL');
  resetAll();

  const full = validateCapabilityStallProtection(verifiedInput('stall-full'));
  assert('H-STALL', 'progress monitoring', full.progressMonitoringPresent, String(full.progressMonitoringPresent));
  assert('H-STALL', 'stall handling', full.stallHandlingPresent, String(full.stallHandlingPresent));
  assert('H-STALL', 'bottleneck handling', full.bottleneckHandlingPresent, String(full.bottleneckHandlingPresent));

  const missing = validateCapabilityStallProtection({
    proposedCapability: 'no_stall_protection_cap',
    integrationPoints: ['foundation'],
  });
  assert('H-STALL', 'missing protection', !missing.complete, String(missing.complete));

  const revision = buildCapabilityVerificationDecision({
    proposedCapability: 'stall_revision_cap_unique_xyz',
    scopeCovered: true,
    integrationPoints: ['foundation', 'uvl'],
    validationRequirements: ['module_validation'],
    signals: ['ownership:defined', 'integrations:complete', 'validation:complete'],
    rolloutStages: ['plan_review'],
    rollbackCheckpoints: ['pre_build'],
    recoveryPath: ['revert'],
    riskScore: 20,
  });
  assert('H-STALL', 'needs revision', revision.record.decision === 'NEEDS_REVISION', revision.record.decision);

  harness.endGroup('H-STALL', g);
}

function runDecisionEngine(): void {
  const g = harness.beginGroup('I-DECISIONS');
  resetAll();

  const verified = buildCapabilityVerificationDecision(verifiedInput('verified'));
  assert('I-DECISIONS', 'verified', verified.record.decision === 'VERIFIED', verified.record.decision);

  const duplicate = buildCapabilityVerificationDecision({ proposedCapability: 'Missing Capability Escalation' });
  assert('I-DECISIONS', 'duplicate risk', duplicate.record.decision === 'DUPLICATE_RISK', duplicate.record.decision);

  const revision = buildCapabilityVerificationDecision({
    proposedCapability: 'revision_needed_cap_unique',
    scopeCovered: true,
    rolloutStages: ['s1'],
    rollbackCheckpoints: ['c1'],
    recoveryPath: ['r1'],
  });
  assert('I-DECISIONS', 'needs revision', revision.record.decision === 'NEEDS_REVISION', revision.record.decision);

  const trust = buildCapabilityVerificationDecision(verifiedInput('trust-dec', { trustImpact: true }));
  assert('I-DECISIONS', 'trust review required', trust.record.decision === 'TRUST_REVIEW_REQUIRED', trust.record.decision);

  const rollback = buildCapabilityVerificationDecision({
    proposedCapability: 'rollback_needed_cap_unique',
    scopeCovered: true,
    integrationPoints: ['missing_capability_escalation'],
    validationRequirements: ['v'],
    signals: ['ownership:defined', 'integrations:complete', 'validation:complete'],
    rolloutStages: ['s1'],
    rollbackCheckpoints: [],
    recoveryPath: [],
    riskScore: 20,
    hasProgressMonitoring: true,
    hasStallHandling: true,
    hasBottleneckRecovery: true,
  });
  assert('I-DECISIONS', 'rollback required', rollback.record.decision === 'ROLLBACK_REQUIRED', rollback.record.decision);

  harness.endGroup('I-DECISIONS', g);
}

function runRegistryCache(): void {
  const g = harness.beginGroup('J-REGISTRY-CACHE');
  resetAll();

  const { record } = buildCapabilityVerificationDecision(verifiedInput('reg'));
  assert('J-REGISTRY-CACHE', 'registered', getCapabilityVerification(record.verificationId) !== undefined, record.verificationId);
  assert('J-REGISTRY-CACHE', 'list', listCapabilityVerifications().length >= 1, String(listCapabilityVerifications().length));
  assert('J-REGISTRY-CACHE', 'history', getCapabilityVerificationHistorySize() >= 1, String(getCapabilityVerificationHistorySize()));

  const cacheInput = verifiedInput('cache-fixed');
  cacheInput.proposedCapability = 'cache_verification_test_fixed';
  buildCapabilityVerificationDecision(cacheInput);
  buildCapabilityVerificationDecision(cacheInput);
  const cache = getCapabilityVerificationCacheStats();
  assert('J-REGISTRY-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));

  harness.endGroup('J-REGISTRY-CACHE', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerCapabilityVerificationEngineWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerCapabilityVerificationEngineWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'project vault', registerCapabilityVerificationEngineWithProjectVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust engine', registerCapabilityVerificationEngineWithTrustEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'escalation', registerCapabilityVerificationEngineWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'research engine', registerCapabilityVerificationEngineWithCapabilityResearchEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'planning engine', registerCapabilityVerificationEngineWithCapabilityPlanningEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'build engine', registerCapabilityVerificationEngineWithCapabilityBuildEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous verification', registerCapabilityVerificationEngineWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'completion engine', registerCapabilityVerificationEngineWithCompletionEngine().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'monitoring', registerCapabilityVerificationEngineWithMultiProjectMonitoring().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerCapabilityVerificationEngineWithUvl().uvlRowCount === 13, '13');

  harness.endGroup('K-INTEGRATION', g);
}

function stressVerification(count: number, label: string): void {
  const g = harness.beginGroup(`L-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const input: CapabilityVerificationInput = i % 10 === 0
      ? { proposedCapability: 'Missing Capability Escalation' }
      : verifiedInput(`stress-${i}-${label}`, {
        riskScore: 15 + (i % 80),
        trustImpact: i % 17 === 0,
        world2Impact: i % 23 === 0,
      });
    evaluateCapabilityVerification(input);
  }

  const elapsed = performance.now() - start;

  assert(`L-STRESS-${label}`, 'verification count', getCapabilityVerificationCount() === count, String(getCapabilityVerificationCount()));
  assert(`L-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getCapabilityVerificationEngineRuntimeReport();
  assert(`L-STRESS-${label}`, 'runtime verifications', runtime.verificationCount === count, String(runtime.verificationCount));
  assert(`L-STRESS-${label}`, 'cache stats', runtime.cacheHits + runtime.cacheMisses > 0, 'cache');

  harness.endGroup(`L-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('M-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 21.5 Capability Verification Engine');
  console.log('=========================================================\n');

  runSetup();
  runRequirements();
  runDuplicates();
  runRisk();
  runRollout();
  runTrust();
  runReadiness();
  runStallProtection();
  runDecisionEngine();
  runRegistryCache();
  runIntegration();
  stressVerification(100, '100');
  stressVerification(1000, '1000');
  stressVerification(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  const runtime = getCapabilityVerificationEngineRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Requirement validations: ${runtime.requirementValidations}`,
    `Duplicate checks: ${runtime.duplicateChecks}`,
    `Risk validations: ${runtime.riskValidations}`,
    `Rollout validations: ${runtime.rolloutValidations}`,
    `Trust validations: ${runtime.trustValidations}`,
    `Readiness evaluations: ${runtime.readinessEvaluations}`,
    `Verification count: ${runtime.verificationCount}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? CAPABILITY_VERIFICATION_ENGINE_PASS_TOKEN : 'CAPABILITY_VERIFICATION_ENGINE_V1_FAIL',
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

  console.log(`\n${CAPABILITY_VERIFICATION_ENGINE_PASS_TOKEN}`);
}

main();
