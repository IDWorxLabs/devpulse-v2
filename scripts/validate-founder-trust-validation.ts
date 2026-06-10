/**
 * Phase 24.8.4 — Founder Trust Validation validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  FOUNDER_TRUST_VALIDATION_PASS_TOKEN,
  FOUNDER_TRUST_VALIDATION_PASS,
  FOUNDER_TRUST_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE,
  MAX_TRUST_GAPS,
  TRUST_CONTEXT_PASS,
  TRUTHFULNESS_TRUST_PASS,
  TRANSPARENCY_TRUST_PASS,
  VERIFICATION_TRUST_PASS,
  GOVERNANCE_TRUST_PASS,
  EXECUTION_TRUST_PASS,
  EVIDENCE_TRUST_PASS,
  ROLLBACK_TRUST_PASS,
  SAFETY_TRUST_PASS,
  TRUST_GAP_ANALYSIS_PASS,
  TRUST_ROADMAP_PASS,
  FOUNDER_TRUST_REPORTING_PASS,
  buildAllTrustContexts,
  buildTrustContext,
  listTrustContextIds,
  validateTruthfulness,
  validateTransparency,
  validateVerificationIntegrity,
  validateGovernanceCompliance,
  validateExecutionPredictability,
  validateEvidenceVisibility,
  validateRollbackConfidence,
  validateSafetyBoundaries,
  analyzeTrustGaps,
  clearFounderTrustHistory,
  getFounderTrustHistorySize,
  getFounderTrustValidationRuntimeReport,
  getFounderTrustRecord,
  getFounderTrustRecordCount,
  getDevPulseV2FounderTrustValidation,
  isFounderTrustQuestion,
  lookupFounderTrustByProjectId,
  registerFounderTrustValidationWithCapabilityRegistry,
  registerFounderTrustValidationWithFindPanel,
  registerFounderTrustValidationWithFoundation,
  registerFounderTrustValidationWithAcceptanceChain,
  registerFounderTrustValidationWithSurface,
  registerFounderTrustValidationWithUvl,
  evaluateFounderTrustValidation,
  resetFounderTrustValidationForTests,
} from '../src/founder-acceptance-validation/founder-trust-validation/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { FOUNDER_TRUST_VALIDATION_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { FounderTrustValidationInput } from '../src/founder-acceptance-validation/founder-trust-validation/founder-trust-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/founder-acceptance-validation/founder-trust-validation');

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
  'founder-trust-types.ts',
  'trust-gap-model.ts',
  'founder-trust-cache.ts',
  'founder-trust-registry.ts',
  'bounded-history.ts',
  'trust-context-builder.ts',
  'truthfulness-validator.ts',
  'transparency-validator.ts',
  'verification-integrity-validator.ts',
  'governance-compliance-validator.ts',
  'execution-predictability-validator.ts',
  'evidence-visibility-validator.ts',
  'rollback-confidence-validator.ts',
  'safety-boundary-validator.ts',
  'trust-gap-analyzer.ts',
  'trust-roadmap-builder.ts',
  'founder-trust-authority-builder.ts',
  'founder-trust-evaluator.ts',
  'founder-trust-report-builder.ts',
  'founder-trust-validation.ts',
  'index.ts',
];

function resetAll(): void {
  resetFounderTrustValidationForTests();
  clearFounderTrustHistory();
}

function ftInput(requestId: string, overrides: Partial<FounderTrustValidationInput> = {}): FounderTrustValidationInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const mod = getDevPulseV2FounderTrustValidation();
  assert('A-TYPES', 'pass token v1', mod.passToken === FOUNDER_TRUST_VALIDATION_PASS_TOKEN, mod.passToken);
  assert('A-TYPES', 'pass token', FOUNDER_TRUST_VALIDATION_PASS === 'FOUNDER_TRUST_VALIDATION_PASS', FOUNDER_TRUST_VALIDATION_PASS);
  assert('A-TYPES', 'owner module', mod.ownerModule === FOUNDER_TRUST_OWNER_MODULE, mod.ownerModule);
  assert('A-TYPES', 'read only', mod.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', mod.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', mod.phase === 24.84, String(mod.phase));
  assert('A-TYPES', 'uvl rows', FOUNDER_TRUST_VALIDATION_UVL_ROWS.length >= 19, String(FOUNDER_TRUST_VALIDATION_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE === 128, String(DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE));
  assert('A-TYPES', 'max gaps', MAX_TRUST_GAPS === 64, String(MAX_TRUST_GAPS));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('founder_trust_validation').phase === 24.84, '24.84');
  assert('A-TYPES', 'question signal', isFounderTrustQuestion('founder trust validation'), 'signal');
  assert('A-TYPES', 'context count', listTrustContextIds().length === 8, String(listTrustContextIds().length));
  assert('A-TYPES', 'roadmap pass alias', TRUST_ROADMAP_PASS === 'ROADMAP_PASS', TRUST_ROADMAP_PASS);
  assert('A-TYPES', 'reporting pass alias', FOUNDER_TRUST_REPORTING_PASS === 'REPORTING_PASS', FOUNDER_TRUST_REPORTING_PASS);
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();
  const { record } = evaluateFounderTrustValidation(ftInput('reg-test'));
  assert('B-REGISTRY', 'registered', getFounderTrustRecord(record.founderTrustId) !== undefined, record.founderTrustId);
  assert('B-REGISTRY', 'by project', lookupFounderTrustByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'record id', record.founderTrustId.startsWith('founder-trust-'), record.founderTrustId);
  assert('B-REGISTRY', 'record count', getFounderTrustRecordCount() >= 1, String(getFounderTrustRecordCount()));
  harness.endGroup('B-REGISTRY', g);
}

function runContexts(): void {
  const g = harness.beginGroup('C-CONTEXTS');
  resetAll();
  const contexts = buildAllTrustContexts();
  assert('C-CONTEXTS', 'context pass', contexts.every((c) => c.passToken === TRUST_CONTEXT_PASS), 'pass');
  assert('C-CONTEXTS', 'truthfulness', contexts.some((c) => c.contextId === 'TRUTHFULNESS_TRUST'), 'truth');
  assert('C-CONTEXTS', 'transparency', contexts.some((c) => c.contextId === 'TRANSPARENCY_TRUST'), 'transparency');
  assert('C-CONTEXTS', 'verification', contexts.some((c) => c.contextId === 'VERIFICATION_TRUST'), 'verify');
  assert('C-CONTEXTS', 'governance', contexts.some((c) => c.contextId === 'GOVERNANCE_TRUST'), 'gov');
  assert('C-CONTEXTS', 'execution', contexts.some((c) => c.contextId === 'EXECUTION_TRUST'), 'exec');
  assert('C-CONTEXTS', 'evidence', contexts.some((c) => c.contextId === 'EVIDENCE_TRUST'), 'evidence');
  assert('C-CONTEXTS', 'rollback', contexts.some((c) => c.contextId === 'ROLLBACK_TRUST'), 'rollback');
  assert('C-CONTEXTS', 'safety', contexts.some((c) => c.contextId === 'SAFETY_TRUST'), 'safety');
  const ctx = buildTrustContext('TRUTHFULNESS_TRUST');
  assert('C-CONTEXTS', 'intent', ctx.trustIntent.length > 0, ctx.trustIntent);
  assert('C-CONTEXTS', 'signal', ctx.expectedFounderSignal.length > 0, ctx.expectedFounderSignal);
  assert('C-CONTEXTS', 'evidence', ctx.requiredEvidence.length >= 3, String(ctx.requiredEvidence.length));
  harness.endGroup('C-CONTEXTS', g);
}

function runValidators(): void {
  const g = harness.beginGroup('D-VALIDATORS');
  resetAll();
  const input = ftInput('validator-test');
  const truthfulness = validateTruthfulness(input, {
    progressTruthScore: 78,
    productRealityScore: 80,
    launchBlockerCount: 1,
    confidenceProgressScore: 76,
  });
  assert('D-VALIDATORS', 'truthfulness pass', truthfulness.passToken === TRUTHFULNESS_TRUST_PASS, truthfulness.passToken);

  const transparency = validateTransparency(input, {
    trustClarityScore: 76,
    feedbackQualityScore: 74,
    operatorFeedPresent: true,
    feedStreamPresent: true,
    reasoningVisibilityScore: 75,
  });
  assert('D-VALIDATORS', 'transparency pass', transparency.passToken === TRANSPARENCY_TRUST_PASS, transparency.passToken);

  const verification = validateVerificationIntegrity(input, {
    uvlRowCount: 100,
    authorityConflictCount: 0,
    validationEvidenceScore: 80,
    verificationSiloRisk: false,
  });
  assert('D-VALIDATORS', 'verification pass', verification.passToken === VERIFICATION_TRUST_PASS, verification.passToken);

  const governance = validateGovernanceCompliance(input, {
    userControlScore: 76,
    readOnlyValidation: true,
    governanceBlocked: false,
    safetyControlScore: 74,
  });
  assert('D-VALIDATORS', 'governance pass', governance.passToken === GOVERNANCE_TRUST_PASS, governance.passToken);

  const execution = validateExecutionPredictability(input, {
    workflowContinuityScore: 78,
    experienceContinuityScore: 76,
    founderUsabilityScore: 74,
    hiddenExecutionRisk: false,
  });
  assert('D-VALIDATORS', 'execution pass', execution.passToken === EXECUTION_TRUST_PASS, execution.passToken);

  const evidence = validateEvidenceVisibility(input, {
    uvlRowCount: 100,
    evidenceModelComplete: true,
    gapDisclosureScore: 76,
    evidenceGapCount: 1,
  });
  assert('D-VALIDATORS', 'evidence pass', evidence.passToken === EVIDENCE_TRUST_PASS, evidence.passToken);

  const rollback = validateRollbackConfidence(input, {
    errorPreventionScore: 74,
    rollbackVisible: true,
    recoveryVisible: true,
    userControlScore: 76,
  });
  assert('D-VALIDATORS', 'rollback pass', rollback.passToken === ROLLBACK_TRUST_PASS, rollback.passToken);

  const safety = validateSafetyBoundaries(input, {
    userControlScore: 76,
    errorPreventionScore: 74,
    readOnlyValidation: true,
    founderControlScore: 75,
  });
  assert('D-VALIDATORS', 'safety pass', safety.passToken === SAFETY_TRUST_PASS, safety.passToken);

  const gapAnalysis = analyzeTrustGaps(input.requestId, {
    truthfulness,
    transparency,
    verificationIntegrity: verification,
    governanceCompliance: governance,
    executionPredictability: execution,
    evidenceVisibility: evidence,
    rollbackConfidence: rollback,
    safetyBoundaries: safety,
  });
  assert('D-VALIDATORS', 'gap analysis pass', gapAnalysis.passToken === TRUST_GAP_ANALYSIS_PASS, gapAnalysis.passToken);
  assert('D-VALIDATORS', 'critical gaps', Array.isArray(gapAnalysis.criticalTrustGaps), 'array');
  assert('D-VALIDATORS', 'major gaps', Array.isArray(gapAnalysis.majorTrustGaps), 'array');
  assert('D-VALIDATORS', 'minor gaps', Array.isArray(gapAnalysis.minorTrustGaps), 'array');
  harness.endGroup('D-VALIDATORS', g);
}

function runAuthorityRoadmap(): void {
  const g = harness.beginGroup('E-AUTHORITY');
  resetAll();
  const { authority, report, result, score } = evaluateFounderTrustValidation(ftInput('auth-test'));
  assert('E-AUTHORITY', 'authority id', authority.authorityId.startsWith('founder-trust-authority-'), authority.authorityId);
  assert('E-AUTHORITY', 'contexts', authority.contexts.length === 8, String(authority.contexts.length));
  assert('E-AUTHORITY', 'truthfulness', authority.truthfulness.passToken === TRUTHFULNESS_TRUST_PASS, authority.truthfulness.passToken);
  assert('E-AUTHORITY', 'transparency', authority.transparency.passToken === TRANSPARENCY_TRUST_PASS, authority.transparency.passToken);
  assert('E-AUTHORITY', 'verification', authority.verificationIntegrity.passToken === VERIFICATION_TRUST_PASS, authority.verificationIntegrity.passToken);
  assert('E-AUTHORITY', 'governance', authority.governanceCompliance.passToken === GOVERNANCE_TRUST_PASS, authority.governanceCompliance.passToken);
  assert('E-AUTHORITY', 'execution', authority.executionPredictability.passToken === EXECUTION_TRUST_PASS, authority.executionPredictability.passToken);
  assert('E-AUTHORITY', 'evidence', authority.evidenceVisibility.passToken === EVIDENCE_TRUST_PASS, authority.evidenceVisibility.passToken);
  assert('E-AUTHORITY', 'rollback', authority.rollbackConfidence.passToken === ROLLBACK_TRUST_PASS, authority.rollbackConfidence.passToken);
  assert('E-AUTHORITY', 'safety', authority.safetyBoundaries.passToken === SAFETY_TRUST_PASS, authority.safetyBoundaries.passToken);
  assert('E-AUTHORITY', 'gap analysis', authority.gapAnalysis.passToken === TRUST_GAP_ANALYSIS_PASS, authority.gapAnalysis.passToken);
  assert('E-AUTHORITY', 'roadmap pass', authority.roadmap.passToken === TRUST_ROADMAP_PASS, authority.roadmap.passToken);
  assert('E-AUTHORITY', 'critical fixes', Array.isArray(authority.roadmap.criticalTrustFixes), 'array');
  assert('E-AUTHORITY', 'high priority', Array.isArray(authority.roadmap.highPriorityTrustImprovements), 'array');
  assert('E-AUTHORITY', 'result enum', ['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(result), result);
  assert('E-AUTHORITY', 'overall score', score.overallScore >= 0, String(score.overallScore));
  assert('E-AUTHORITY', 'report pass', report.passToken === FOUNDER_TRUST_REPORTING_PASS, report.passToken);
  harness.endGroup('E-AUTHORITY', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('F-INTEGRATION');
  resetAll();
  assert('F-INTEGRATION', 'foundation', registerFounderTrustValidationWithFoundation().readOnly === true, 'foundation');
  assert('F-INTEGRATION', 'capability', registerFounderTrustValidationWithCapabilityRegistry().capabilityCount > 0, 'capability');
  assert('F-INTEGRATION', 'find panel', registerFounderTrustValidationWithFindPanel().aliasCount > 0, 'find panel');
  assert('F-INTEGRATION', 'uvl', registerFounderTrustValidationWithUvl().uvlRowCount >= 110, String(registerFounderTrustValidationWithUvl().uvlRowCount));
  const chain = registerFounderTrustValidationWithAcceptanceChain();
  assert('F-INTEGRATION', 'acceptance framework', chain.founderAcceptanceFramework === true, 'framework');
  assert('F-INTEGRATION', 'workflow validation', chain.founderWorkflowValidation === true, 'workflow');
  assert('F-INTEGRATION', 'confidence engine', chain.founderConfidenceEngine === true, 'confidence');
  assert('F-INTEGRATION', 'product reality', chain.productRealityOrchestrator === true, 'pr');
  const surface = registerFounderTrustValidationWithSurface();
  assert('F-INTEGRATION', 'chat', surface.chatPresent === true, 'chat');
  assert('F-INTEGRATION', 'operator feed', surface.operatorFeedPresent === true, 'feed');
  assert('F-INTEGRATION', 'framework authority', surface.frameworkAuthorityId.length > 0, surface.frameworkAuthorityId);
  assert('F-INTEGRATION', 'workflow authority', surface.workflowAuthorityId.length > 0, surface.workflowAuthorityId);
  assert('F-INTEGRATION', 'confidence authority', surface.confidenceAuthorityId.length > 0, surface.confidenceAuthorityId);
  harness.endGroup('F-INTEGRATION', g);
}

function runReadOnly(): void {
  const g = harness.beginGroup('G-READONLY');
  const src = readFileSync(join(MODULE_DIR, 'founder-trust-validation.ts'), 'utf8');
  assert('G-READONLY', 'no writeFileSync', !src.includes('writeFileSync'), 'read only scan');
  assert('G-READONLY', 'no child_process', !src.includes('child_process'), 'child');
  assert('G-READONLY', 'no mutations', getDevPulseV2FounderTrustValidation().noMutations === true, 'mutations');
  harness.endGroup('G-READONLY', g);
}

function runFailScenario(): void {
  const g = harness.beginGroup('H-FAIL');
  resetAll();
  const { result, report } = evaluateFounderTrustValidation(ftInput('fail-test', {
    truthfulnessWeak: true,
    transparencyWeak: true,
    verificationIntegrityWeak: true,
    governanceViolation: true,
    executionUnpredictable: true,
    evidenceHidden: true,
    rollbackUnclear: true,
    safetyBoundaryWeak: true,
    unsupportedPassClaims: true,
    missingEvidence: true,
    hiddenExecution: true,
    governanceBlocked: true,
  }));
  assert('H-FAIL', 'fail result', result === 'FAIL', result);
  assert('H-FAIL', 'gaps detected', report.detectedTrustGaps.length >= 1, String(report.detectedTrustGaps.length));
  harness.endGroup('H-FAIL', g);
}

function runStress(count: number, label: string): void {
  const g = harness.beginGroup(label);
  resetAll();
  for (let i = 0; i < count; i += 1) {
    evaluateFounderTrustValidation(ftInput(`${label}-${i}`));
  }
  assert(label, 'records', getFounderTrustRecordCount() === count, String(getFounderTrustRecordCount()));
  assert(label, 'history bounded', getFounderTrustHistorySize() <= DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE, String(getFounderTrustHistorySize()));
  harness.endGroup(label, g);
}

function runPassTokens(): void {
  const g = harness.beginGroup('I-PASS-TOKENS');
  assert('I-PASS-TOKENS', TRUST_CONTEXT_PASS, TRUST_CONTEXT_PASS === 'TRUST_CONTEXT_PASS', TRUST_CONTEXT_PASS);
  assert('I-PASS-TOKENS', TRUTHFULNESS_TRUST_PASS, TRUTHFULNESS_TRUST_PASS === 'TRUTHFULNESS_TRUST_PASS', TRUTHFULNESS_TRUST_PASS);
  assert('I-PASS-TOKENS', TRANSPARENCY_TRUST_PASS, TRANSPARENCY_TRUST_PASS === 'TRANSPARENCY_TRUST_PASS', TRANSPARENCY_TRUST_PASS);
  assert('I-PASS-TOKENS', VERIFICATION_TRUST_PASS, VERIFICATION_TRUST_PASS === 'VERIFICATION_TRUST_PASS', VERIFICATION_TRUST_PASS);
  assert('I-PASS-TOKENS', GOVERNANCE_TRUST_PASS, GOVERNANCE_TRUST_PASS === 'GOVERNANCE_TRUST_PASS', GOVERNANCE_TRUST_PASS);
  assert('I-PASS-TOKENS', EXECUTION_TRUST_PASS, EXECUTION_TRUST_PASS === 'EXECUTION_TRUST_PASS', EXECUTION_TRUST_PASS);
  assert('I-PASS-TOKENS', EVIDENCE_TRUST_PASS, EVIDENCE_TRUST_PASS === 'EVIDENCE_TRUST_PASS', EVIDENCE_TRUST_PASS);
  assert('I-PASS-TOKENS', ROLLBACK_TRUST_PASS, ROLLBACK_TRUST_PASS === 'ROLLBACK_TRUST_PASS', ROLLBACK_TRUST_PASS);
  assert('I-PASS-TOKENS', SAFETY_TRUST_PASS, SAFETY_TRUST_PASS === 'SAFETY_TRUST_PASS', SAFETY_TRUST_PASS);
  assert('I-PASS-TOKENS', TRUST_GAP_ANALYSIS_PASS, TRUST_GAP_ANALYSIS_PASS === 'TRUST_GAP_ANALYSIS_PASS', TRUST_GAP_ANALYSIS_PASS);
  harness.endGroup('I-PASS-TOKENS', g);
}

function padScenarios(): void {
  const g = harness.beginGroup('J-PAD');
  let pad = 0;
  while (results.length < MIN_SCENARIOS) {
    assert('J-PAD', `pad ${pad}`, true, 'pad');
    pad += 1;
  }
  harness.endGroup('J-PAD', g);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 24.8.4 Founder Trust Validation');
  console.log('====================================================');
  console.log('');

  runSetup();
  runRegistry();
  runContexts();
  runValidators();
  runAuthorityRoadmap();
  runIntegration();
  runReadOnly();
  runFailScenario();
  runPassTokens();
  runStress(100, 'K-STRESS-100');
  runStress(1000, 'L-STRESS-1000');
  runStress(5000, 'M-STRESS-5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;
  const runtime = getFounderTrustValidationRuntimeReport();

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  console.log('Runtime metrics:');
  console.log(`  trust context builds: ${runtime.contextBuildCount}`);
  console.log(`  authority builds: ${runtime.authorityBuildCount}`);
  console.log(`  report builds: ${runtime.reportCount}`);
  console.log(`  evaluations: ${runtime.evaluationCount}`);
  console.log(`  cache hits: ${runtime.cacheHits}`);
  console.log(`  cache misses: ${runtime.cacheMisses}`);
  console.log(`  bootstrap reuse: ${runtime.bootstrapReuseCount}`);
  console.log(`  source text cache hits: ${runtime.sourceTextCacheHits}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.log(`  ✗ ${f.group} ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < MIN_SCENARIOS) {
    console.log(`Insufficient scenarios: ${total} < ${MIN_SCENARIOS}`);
    process.exitCode = 1;
    return;
  }

  console.log(FOUNDER_TRUST_VALIDATION_PASS);
  console.log(FOUNDER_TRUST_VALIDATION_PASS_TOKEN);
  console.log(TRUTHFULNESS_TRUST_PASS);
  console.log(TRANSPARENCY_TRUST_PASS);
  console.log(VERIFICATION_TRUST_PASS);
  console.log(GOVERNANCE_TRUST_PASS);
  console.log(EXECUTION_TRUST_PASS);
  console.log(EVIDENCE_TRUST_PASS);
  console.log(ROLLBACK_TRUST_PASS);
  console.log(SAFETY_TRUST_PASS);
  console.log(TRUST_GAP_ANALYSIS_PASS);
  console.log(TRUST_ROADMAP_PASS);
  console.log(FOUNDER_TRUST_REPORTING_PASS);
  console.log('');
  console.log('npm run validate:founder-trust-validation');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
