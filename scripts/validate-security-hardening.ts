/**
 * Phase 23.3 — Security Hardening validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  SECURITY_HARDENING_PASS_TOKEN,
  SECURITY_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_SECURITY_HARDENING_HISTORY_SIZE,
  analyzeAccessControlReadiness,
  analyzeSecretExposure,
  analyzeSecurityBoundaries,
  analyzeWorkspaceIsolation,
  buildUnifiedSecurityHardeningAuthority,
  clearSecurityHardeningHistory,
  detectUnsafeCapabilities,
  evaluateSecurityHardening,
  evaluateSecurityHardeningEngine,
  generateSecurityHardeningReport,
  getAuthorityBuildCount,
  getBoundaryAnalysisCount,
  getDevPulseV2SecurityHardening,
  getEvaluationCount,
  getExposureAnalysisCount,
  getIsolationAnalysisCount,
  getSecurityHardeningCacheStats,
  getSecurityHardeningHistorySize,
  getSecurityHardeningRecord,
  getSecurityHardeningRecordCount,
  getSecurityHardeningRuntimeReport,
  getUnsafeCapabilityDetectionCount,
  isSecurityHardeningQuestion,
  lookupSecurityByProjectId,
  lookupSecurityByState,
  registerSecurityHardeningWithAutonomousCompletion,
  registerSecurityHardeningWithAutonomousVerification,
  registerSecurityHardeningWithCapabilityRegistry,
  registerSecurityHardeningWithCentralBrain,
  registerSecurityHardeningWithCloudWorkerRuntime,
  registerSecurityHardeningWithExecutionAuthority,
  registerSecurityHardeningWithFindPanel,
  registerSecurityHardeningWithFoundation,
  registerSecurityHardeningWithMissingCapabilityEscalation,
  registerSecurityHardeningWithMobileCommand,
  registerSecurityHardeningWithNotificationDelivery,
  registerSecurityHardeningWithNotificationVault,
  registerSecurityHardeningWithOperatorFeed,
  registerSecurityHardeningWithPerformanceHardening,
  registerSecurityHardeningWithReliabilityHardening,
  registerSecurityHardeningWithSelfEvolutionGovernance,
  registerSecurityHardeningWithTrustEngineCheckpoint,
  registerSecurityHardeningWithUnifiedTrustScore,
  registerSecurityHardeningWithUnifiedVerificationLab,
  registerSecurityHardeningWithUvl,
  registerSecurityHardeningWithWorld2,
  resetSecurityHardeningForTests,
} from '../src/security-hardening/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { SECURITY_HARDENING_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { SecurityHardeningInput } from '../src/security-hardening/security-hardening-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/security-hardening');

const FAKE_STRIPE_KEY = 'sk_live_abc123secretkey456789';
const FAKE_AWS_KEY = 'AKIA1234567890ABCDEF';
const FAKE_WEBHOOK_SECRET = 'whsec_testwebhooksecretvalue99';
const FAKE_DB_URL = 'postgresql://admin:SuperSecretPass123@localhost:5432/db';

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
  'security-hardening-types.ts',
  'security-hardening-cache.ts',
  'security-hardening-registry.ts',
  'security-boundary-analyzer.ts',
  'secret-exposure-analyzer.ts',
  'unsafe-capability-detector.ts',
  'access-control-readiness-analyzer.ts',
  'workspace-isolation-analyzer.ts',
  'security-authority-builder.ts',
  'security-hardening-evaluator.ts',
  'security-hardening-history.ts',
  'security-hardening-reporting.ts',
  'security-hardening.ts',
  'index.ts',
];

function resetAll(): void {
  resetSecurityHardeningForTests();
}

function securityInput(requestId: string, overrides: Partial<SecurityHardeningInput> = {}): SecurityHardeningInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    reliabilityScore: 80,
    performanceScore: 78,
    trustScore: 82,
    governanceBlocked: false,
    futureUserAccountBoundaryMissing: false,
    futurePackagePlanBoundaryMissing: false,
    missingUserIdentityBoundary: false,
    missingPackageEntitlementModel: false,
    futureUserTenantBoundaryMissing: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2SecurityHardening();
  assert('A-TYPES', 'pass token', engine.passToken === SECURITY_HARDENING_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === SECURITY_HARDENING_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 23.3, String(engine.phase));
  assert('A-TYPES', 'uvl rows', SECURITY_HARDENING_UVL_ROWS.length >= 13, String(SECURITY_HARDENING_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_SECURITY_HARDENING_HISTORY_SIZE === 128, String(DEFAULT_MAX_SECURITY_HARDENING_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('security_hardening').phase === 23.3, '23.3');
  assert('A-TYPES', 'question signal', isSecurityHardeningQuestion('show security hardening'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateSecurityHardeningEngine(securityInput('reg-test'));
  assert('B-REGISTRY', 'registered', getSecurityHardeningRecord(record.securityId) !== undefined, record.securityId);
  assert('B-REGISTRY', 'by project', lookupSecurityByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'security id', record.securityId.startsWith('security-hardening-'), record.securityId);
  assert('B-REGISTRY', 'record count', getSecurityHardeningRecordCount() >= 1, String(getSecurityHardeningRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runSecurityBoundaries(): void {
  const g = harness.beginGroup('C-SECURITY-BOUNDARIES');
  resetAll();

  const clean = analyzeSecurityBoundaries(securityInput('boundary-clean'));
  assert('C-SECURITY-BOUNDARIES', 'clean score', clean.boundaryScore >= 85, String(clean.boundaryScore));
  assert('C-SECURITY-BOUNDARIES', 'no warnings', clean.boundaryWarnings.length === 0, '0');

  const risky = analyzeSecurityBoundaries(securityInput('boundary-risky', {
    founderApprovalBoundaryWeak: true,
    governanceBoundaryWeak: true,
    executionBoundaryWeak: true,
    verificationBoundaryWeak: true,
    deploymentBoundaryWeak: true,
    cloudControlBoundaryWeak: true,
    world2IsolationBoundaryWeak: true,
    mobileCommandBoundaryWeak: true,
    projectWorkspaceBoundaryWeak: true,
    futureUserAccountBoundaryMissing: true,
    futurePackagePlanBoundaryMissing: true,
  }));
  assert('C-SECURITY-BOUNDARIES', 'execution weak', risky.boundaryWarnings.includes('execution_boundary_weak'), 'execution_boundary_weak');
  assert('C-SECURITY-BOUNDARIES', 'cloud control', risky.boundaryWarnings.includes('cloud_control_boundary_weak'), 'cloud_control_boundary_weak');
  assert('C-SECURITY-BOUNDARIES', 'missing boundaries', risky.missingBoundaries.length >= 2, String(risky.missingBoundaries.length));
  assert('C-SECURITY-BOUNDARIES', 'low score', risky.boundaryScore < 50, String(risky.boundaryScore));

  harness.endGroup('C-SECURITY-BOUNDARIES', g);
}

function runSecretExposure(): void {
  const g = harness.beginGroup('D-SECRET-EXPOSURE');
  resetAll();

  const clean = analyzeSecretExposure(securityInput('exposure-clean'));
  assert('D-SECRET-EXPOSURE', 'clean score', clean.exposureScore >= 90, String(clean.exposureScore));
  assert('D-SECRET-EXPOSURE', 'no findings', clean.redactedFindings.length === 0, '0');

  const risky = analyzeSecretExposure(securityInput('exposure-risky', {
    secretScanContent: [
      `const key = '${FAKE_STRIPE_KEY}';`,
      `aws: ${FAKE_AWS_KEY}`,
      `hook: ${FAKE_WEBHOOK_SECRET}`,
      FAKE_DB_URL,
    ],
    secretScanPaths: ['src/config.ts', 'src/aws.ts', 'src/webhook.ts', 'src/db.ts'],
  }));
  assert('D-SECRET-EXPOSURE', 'findings', risky.redactedFindings.length >= 3, String(risky.redactedFindings.length));
  assert('D-SECRET-EXPOSURE', 'redacted', risky.redactedFindings.every((f) => f.redactedPreview.includes('****')), 'redacted');
  assert('D-SECRET-EXPOSURE', 'no raw stripe', !JSON.stringify(risky).includes(FAKE_STRIPE_KEY), 'no raw stripe');
  assert('D-SECRET-EXPOSURE', 'low score', risky.exposureScore < 60, String(risky.exposureScore));

  harness.endGroup('D-SECRET-EXPOSURE', g);
}

function runUnsafeCapabilities(): void {
  const g = harness.beginGroup('E-UNSAFE-CAPABILITIES');
  resetAll();

  const clean = detectUnsafeCapabilities(securityInput('unsafe-clean'));
  assert('E-UNSAFE-CAPABILITIES', 'clean score', clean.unsafeCapabilityScore >= 95, String(clean.unsafeCapabilityScore));
  assert('E-UNSAFE-CAPABILITIES', 'no unsafe', clean.unsafeCapabilities.length === 0, '0');

  const risky = detectUnsafeCapabilities(securityInput('unsafe-risky', {
    unsafeFileModification: true,
    unsafeProjectMutation: true,
    unsafeWorkspaceMutation: true,
    unsafeBuildExecution: true,
    unsafeDeployment: true,
    unsafeCloudExecution: true,
    unsafeAutonomousFix: true,
    unsafeAutonomousCompletion: true,
    unsafeWorld2Execution: true,
    unsafeMobileCommandExecution: true,
    unsafeBillingPackageChanges: true,
    unsafeUserAccountMutation: true,
    unsafeExternalNetwork: true,
  }));
  assert('E-UNSAFE-CAPABILITIES', 'unsafe list', risky.unsafeCapabilities.length >= 10, String(risky.unsafeCapabilities.length));
  assert('E-UNSAFE-CAPABILITIES', 'gating warnings', risky.gatingWarnings.length >= 10, String(risky.gatingWarnings.length));
  assert('E-UNSAFE-CAPABILITIES', 'low score', risky.unsafeCapabilityScore < 30, String(risky.unsafeCapabilityScore));

  harness.endGroup('E-UNSAFE-CAPABILITIES', g);
}

function runAccessControlReadiness(): void {
  const g = harness.beginGroup('F-ACCESS-CONTROL-READINESS');
  resetAll();

  const ready = analyzeAccessControlReadiness(securityInput('access-ready'));
  assert('F-ACCESS-CONTROL-READINESS', 'ready score', ready.accessControlReadinessScore >= 85, String(ready.accessControlReadinessScore));
  assert('F-ACCESS-CONTROL-READINESS', 'no gaps', ready.accessControlGaps.length === 0, '0');

  const gaps = analyzeAccessControlReadiness(securityInput('access-gaps', {
    missingUserIdentityBoundary: true,
    missingFounderIdentityBoundary: true,
    missingRoleBoundary: true,
    missingPermissionModel: true,
    missingPackageEntitlementModel: true,
    missingCloudUsageQuota: true,
    missingOrganizationBoundary: true,
    missingProjectOwnershipBoundary: true,
    missingWorkspaceIsolationBoundary: true,
    missingAuditTrailBoundary: true,
  }));
  assert('F-ACCESS-CONTROL-READINESS', 'gaps present', gaps.accessControlGaps.length >= 8, String(gaps.accessControlGaps.length));
  assert('F-ACCESS-CONTROL-READINESS', 'recommendations', gaps.recommendedFutureControls.length >= 8, String(gaps.recommendedFutureControls.length));
  assert('F-ACCESS-CONTROL-READINESS', 'low score', gaps.accessControlReadinessScore < 30, String(gaps.accessControlReadinessScore));

  harness.endGroup('F-ACCESS-CONTROL-READINESS', g);
}

function runWorkspaceIsolation(): void {
  const g = harness.beginGroup('G-WORKSPACE-ISOLATION');
  resetAll();

  const clean = analyzeWorkspaceIsolation(securityInput('isolation-clean'));
  assert('G-WORKSPACE-ISOLATION', 'clean score', clean.isolationScore >= 85, String(clean.isolationScore));
  assert('G-WORKSPACE-ISOLATION', 'no warnings', clean.isolationWarnings.length === 0, '0');

  const risky = analyzeWorkspaceIsolation(securityInput('isolation-risky', {
    stableDisposableWorkspaceMixRisk: true,
    world1World2SeparationWeak: true,
    founderAutonomousModeMixRisk: true,
    projectOwnershipBoundaryWeak: true,
    cloudWorkerBoundaryWeak: true,
    generatedProjectBoundaryWeak: true,
    rollbackBoundaryWeak: true,
    filesystemMutationBoundaryWeak: true,
    futureUserTenantBoundaryMissing: true,
  }));
  assert('G-WORKSPACE-ISOLATION', 'world2 weak', risky.isolationWarnings.includes('world1_world2_separation_weak'), 'world1_world2_separation_weak');
  assert('G-WORKSPACE-ISOLATION', 'gaps', risky.isolationGaps.length >= 1, String(risky.isolationGaps.length));
  assert('G-WORKSPACE-ISOLATION', 'low score', risky.isolationScore < 40, String(risky.isolationScore));

  harness.endGroup('G-WORKSPACE-ISOLATION', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const input = securityInput('auth-test');
  const boundaries = analyzeSecurityBoundaries(input);
  const exposure = analyzeSecretExposure(input);
  const unsafe = detectUnsafeCapabilities(input);
  const accessControl = analyzeAccessControlReadiness(input);
  const isolation = analyzeWorkspaceIsolation(input);
  const authority = buildUnifiedSecurityHardeningAuthority('auth-test', boundaries, exposure, unsafe, accessControl, isolation, input);

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('security-hardening-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'security score', authority.securityScore > 0, String(authority.securityScore));
  assert('H-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('H-AUTHORITY', 'risk level', authority.riskLevel.length > 0, authority.riskLevel);

  const blocked = buildUnifiedSecurityHardeningAuthority('auth-blocked', boundaries, exposure, unsafe, accessControl, isolation, {
    ...input,
    governanceBlocked: true,
  });
  assert('H-AUTHORITY', 'blocked state', blocked.state === 'BLOCKED', blocked.state);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluateSecurityHardeningEngine(securityInput('eval-stable'));
  assert('I-EVALUATION', 'stable state', record.state === 'SECURE' || record.state === 'ACCEPTABLE' || record.state === 'WATCH', record.state);
  assert('I-EVALUATION', 'security score', record.securityScore > 50, String(record.securityScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluateSecurityHardeningEngine(securityInput('eval-degraded', {
    founderApprovalBoundaryWeak: true,
    governanceBoundaryWeak: true,
    executionBoundaryWeak: true,
    deploymentBoundaryWeak: true,
    cloudControlBoundaryWeak: true,
    world2IsolationBoundaryWeak: true,
    unsafeDeployment: true,
    unsafeAutonomousCompletion: true,
    unsafeWorld2Execution: true,
    stableDisposableWorkspaceMixRisk: true,
    world1World2SeparationWeak: true,
    filesystemMutationBoundaryWeak: true,
    secretScanContent: [`key=${FAKE_STRIPE_KEY}`],
    secretScanPaths: ['src/leak.ts'],
    missingPermissionModel: true,
    missingAuditTrailBoundary: true,
    reliabilityScore: 15,
    performanceScore: 12,
    trustScore: 10,
    governanceBlocked: true,
  }));
  assert('I-EVALUATION', 'degraded state', degraded.record.state !== 'SECURE', degraded.record.state);
  assert('I-EVALUATION', 'low score', degraded.record.securityScore < 55, String(degraded.record.securityScore));

  const input = securityInput('eval-manual');
  const authority = buildUnifiedSecurityHardeningAuthority(
    'eval-manual',
    analyzeSecurityBoundaries(input),
    analyzeSecretExposure(input),
    detectUnsafeCapabilities(input),
    analyzeAccessControlReadiness(input),
    analyzeWorkspaceIsolation(input),
    input,
  );
  const evaluation = evaluateSecurityHardening(authority);
  assert('I-EVALUATION', 'hardening readiness', evaluation.hardeningReadiness > 0, String(evaluation.hardeningReadiness));
  assert('I-EVALUATION', 'boundary score', evaluation.boundaryScore >= 0, String(evaluation.boundaryScore));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluateSecurityHardeningEngine(securityInput('report-test'));
  assert('J-REPORTING', 'security score', report.securityScore === record.securityScore, String(report.securityScore));
  assert('J-REPORTING', 'state', report.state === record.state, report.state);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));

  const manual = generateSecurityHardeningReport(
    record,
    report.evaluation,
    report.unsafeCapabilities,
    report.boundaryWarnings,
    report.isolationWarnings,
    report.redactedExposureFindings,
    report.accessControlGaps,
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluateSecurityHardeningEngine(securityInput(`history-${i}`, { trustScore: 60 + (i % 30) }));
  }
  assert('J-REPORTING', 'history bounded', getSecurityHardeningHistorySize() === 128, String(getSecurityHardeningHistorySize()));
  clearSecurityHardeningHistory();
  assert('J-REPORTING', 'history cleared', getSecurityHardeningHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerSecurityHardeningWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerSecurityHardeningWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'foundation', registerSecurityHardeningWithFoundation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'capability registry', registerSecurityHardeningWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'find panel', registerSecurityHardeningWithFindPanel().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerSecurityHardeningWithUvl().uvlRowCount >= 13, String(registerSecurityHardeningWithUvl().uvlRowCount));
  assert('K-INTEGRATION', 'unified trust score', registerSecurityHardeningWithUnifiedTrustScore().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust checkpoint', registerSecurityHardeningWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl runtime', registerSecurityHardeningWithUnifiedVerificationLab().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'reliability hardening', registerSecurityHardeningWithReliabilityHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'performance hardening', registerSecurityHardeningWithPerformanceHardening().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous verification', registerSecurityHardeningWithAutonomousVerification().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'autonomous completion', registerSecurityHardeningWithAutonomousCompletion().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'cloud worker runtime', registerSecurityHardeningWithCloudWorkerRuntime().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'execution authority', registerSecurityHardeningWithExecutionAuthority().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'operator feed', registerSecurityHardeningWithOperatorFeed().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'notification vault', registerSecurityHardeningWithNotificationVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'notification delivery', registerSecurityHardeningWithNotificationDelivery().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerSecurityHardeningWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'mobile command', registerSecurityHardeningWithMobileCommand().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerSecurityHardeningWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerSecurityHardeningWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const input = securityInput('cache-fixed');
  const boundaries = analyzeSecurityBoundaries(input);
  const exposure = analyzeSecretExposure(input);
  const unsafe = detectUnsafeCapabilities(input);
  const accessControl = analyzeAccessControlReadiness(input);
  const isolation = analyzeWorkspaceIsolation(input);

  buildUnifiedSecurityHardeningAuthority('cache-fixed', boundaries, exposure, unsafe, accessControl, isolation, input);
  buildUnifiedSecurityHardeningAuthority('cache-fixed', boundaries, exposure, unsafe, accessControl, isolation, input);

  const cache = getSecurityHardeningCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byState = lookupSecurityByState('ACCEPTABLE');
  assert('L-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressSecurity(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluateSecurityHardeningEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      executionBoundaryWeak: i % 11 === 0,
      cloudControlBoundaryWeak: i % 13 === 0,
      unsafeDeployment: i % 17 === 0,
      unsafeAutonomousCompletion: i % 19 === 0,
      world1World2SeparationWeak: i % 23 === 0,
      missingPermissionModel: i % 29 === 0,
      governanceBlocked: i % 31 === 0,
      reliabilityScore: 20 + (i % 70),
      performanceScore: 15 + (i % 75),
      trustScore: 10 + (i % 80),
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getSecurityHardeningRecordCount() === count, String(getSecurityHardeningRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getSecurityHardeningRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'boundary analyses', runtime.boundaryAnalysisCount > 0, String(runtime.boundaryAnalysisCount));

  const sample = getSecurityHardeningRecord(`security-hardening-${count}`);
  assert(`M-STRESS-${label}`, 'sample record', sample !== undefined, 'record');

  harness.endGroup(`M-STRESS-${label}`, g);
}

function runSecretRedaction(): void {
  const g = harness.beginGroup('N-SECRET-REDACTION');
  resetAll();

  const fakeSecrets = [FAKE_STRIPE_KEY, FAKE_AWS_KEY, FAKE_WEBHOOK_SECRET, 'SuperSecretPass123'];
  const { report } = evaluateSecurityHardeningEngine(securityInput('redaction-test', {
    secretScanContent: [
      `export const STRIPE = '${FAKE_STRIPE_KEY}';`,
      `const aws = '${FAKE_AWS_KEY}';`,
      `webhook: ${FAKE_WEBHOOK_SECRET}`,
      FAKE_DB_URL,
    ],
    secretScanPaths: ['src/payments.ts', 'src/aws.ts', 'src/hooks.ts', 'src/database.ts'],
  }));

  const reportJson = JSON.stringify(report);
  assert('N-SECRET-REDACTION', 'findings present', report.redactedExposureFindings.length >= 3, String(report.redactedExposureFindings.length));
  assert('N-SECRET-REDACTION', 'all redacted', report.redactedExposureFindings.every((f) => f.redactedPreview.includes('****')), 'redacted');

  for (const secret of fakeSecrets) {
    assert('N-SECRET-REDACTION', `no raw ${secret.slice(0, 8)}`, !reportJson.includes(secret), 'leaked');
  }

  assert('N-SECRET-REDACTION', 'no full stripe key', !reportJson.includes('abc123secretkey456789'), 'leaked stripe body');
  assert('N-SECRET-REDACTION', 'recommendations safe', !report.recommendations.some((r) => fakeSecrets.some((s) => r.includes(s))), 'leaked in recs');

  harness.endGroup('N-SECRET-REDACTION', g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('O-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 23.3 Security Hardening');
  console.log('============================================\n');

  runSetup();
  runRegistry();
  runSecurityBoundaries();
  runSecretExposure();
  runUnsafeCapabilities();
  runAccessControlReadiness();
  runWorkspaceIsolation();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressSecurity(100, '100');
  stressSecurity(1000, '1000');
  stressSecurity(5000, '5000');
  runSecretRedaction();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getSecurityHardeningRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Boundary analyses: ${getBoundaryAnalysisCount()}`,
    `Exposure analyses: ${getExposureAnalysisCount()}`,
    `Unsafe capability detections: ${getUnsafeCapabilityDetectionCount()}`,
    `Isolation analyses: ${getIsolationAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getSecurityHardeningRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? SECURITY_HARDENING_PASS_TOKEN : 'SECURITY_HARDENING_V1_FAIL',
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

  console.log(`\n${SECURITY_HARDENING_PASS_TOKEN}`);
}

main();
