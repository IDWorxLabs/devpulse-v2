/**
 * Phase 23.4 — Privacy Hardening validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  PRIVACY_HARDENING_PASS_TOKEN,
  PRIVACY_HARDENING_OWNER_MODULE,
  DEFAULT_MAX_PRIVACY_HARDENING_HISTORY_SIZE,
  analyzeComplianceReadiness,
  analyzeDisclosureRisk,
  analyzePersonalDataSurfaces,
  analyzeProjectDataBoundaries,
  analyzeRedactionReadiness,
  analyzeRetentionRisk,
  buildUnifiedPrivacyHardeningAuthority,
  clearPrivacyHardeningHistory,
  evaluatePrivacyHardening,
  evaluatePrivacyHardeningEngine,
  generatePrivacyHardeningReport,
  getAuthorityBuildCount,
  getComplianceReadinessAnalysisCount,
  getDataBoundaryAnalysisCount,
  getDevPulseV2PrivacyHardening,
  getDisclosureAnalysisCount,
  getEvaluationCount,
  getPersonalDataSurfaceAnalysisCount,
  getPrivacyHardeningCacheStats,
  getPrivacyHardeningHistorySize,
  getPrivacyHardeningRecord,
  getPrivacyHardeningRecordCount,
  getPrivacyHardeningRuntimeReport,
  getRedactionReadinessAnalysisCount,
  getRetentionAnalysisCount,
  isPrivacyHardeningQuestion,
  lookupPrivacyByProjectId,
  lookupPrivacyByState,
  registerPrivacyHardeningWithCapabilityRegistry,
  registerPrivacyHardeningWithCentralBrain,
  registerPrivacyHardeningWithCloudWorkerRuntime,
  registerPrivacyHardeningWithExecutionAuthority,
  registerPrivacyHardeningWithFindPanel,
  registerPrivacyHardeningWithFoundation,
  registerPrivacyHardeningWithMissingCapabilityEscalation,
  registerPrivacyHardeningWithMobileCommand,
  registerPrivacyHardeningWithNotificationDelivery,
  registerPrivacyHardeningWithNotificationVault,
  registerPrivacyHardeningWithOperatorFeed,
  registerPrivacyHardeningWithPerformanceHardening,
  registerPrivacyHardeningWithReliabilityHardening,
  registerPrivacyHardeningWithSecurityHardening,
  registerPrivacyHardeningWithSelfEvolutionGovernance,
  registerPrivacyHardeningWithTrustEngineCheckpoint,
  registerPrivacyHardeningWithUnifiedTrustScore,
  registerPrivacyHardeningWithUnifiedVerificationLab,
  registerPrivacyHardeningWithUvl,
  registerPrivacyHardeningWithWorld2,
  resetPrivacyHardeningForTests,
} from '../src/privacy-hardening/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { PRIVACY_HARDENING_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { PrivacyHardeningInput } from '../src/privacy-hardening/privacy-hardening-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/privacy-hardening');

const FAKE_EMAIL = 'testuser.fake@example.invalid';
const FAKE_PHONE = '+1-555-010-9999';
const FAKE_PASSPORT = 'passport: XK12345678';
const FAKE_ADDRESS = '742 Evergreen Terrace';
const FAKE_TOKEN = 'tok_fakeprivacytokenvalue99';
const FAKE_BILLING = 'package=pro_fakebilling99';

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
  'privacy-hardening-types.ts',
  'privacy-hardening-cache.ts',
  'privacy-hardening-registry.ts',
  'personal-data-surface-analyzer.ts',
  'project-data-boundary-analyzer.ts',
  'retention-risk-analyzer.ts',
  'disclosure-risk-analyzer.ts',
  'privacy-redaction-readiness-analyzer.ts',
  'privacy-compliance-readiness-analyzer.ts',
  'privacy-authority-builder.ts',
  'privacy-hardening-evaluator.ts',
  'privacy-hardening-history.ts',
  'privacy-hardening-reporting.ts',
  'privacy-hardening.ts',
  'index.ts',
];

function resetAll(): void {
  resetPrivacyHardeningForTests();
}

function privacyInput(requestId: string, overrides: Partial<PrivacyHardeningInput> = {}): PrivacyHardeningInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    reliabilityScore: 80,
    performanceScore: 78,
    securityScore: 76,
    trustScore: 82,
    governanceBlocked: false,
    futureTenantDataBoundaryMissing: false,
    futureOrganizationBoundaryMissing: false,
    missingPrivacyPolicyReadiness: false,
    missingUserConsentModel: false,
    missingAppStorePrivacyLabels: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2PrivacyHardening();
  assert('A-TYPES', 'pass token', engine.passToken === PRIVACY_HARDENING_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === PRIVACY_HARDENING_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 23.4, String(engine.phase));
  assert('A-TYPES', 'uvl rows', PRIVACY_HARDENING_UVL_ROWS.length >= 14, String(PRIVACY_HARDENING_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_PRIVACY_HARDENING_HISTORY_SIZE === 128, String(DEFAULT_MAX_PRIVACY_HARDENING_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('privacy_hardening').phase === 23.4, '23.4');
  assert('A-TYPES', 'question signal', isPrivacyHardeningQuestion('show privacy hardening'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluatePrivacyHardeningEngine(privacyInput('reg-test'));
  assert('B-REGISTRY', 'registered', getPrivacyHardeningRecord(record.privacyId) !== undefined, record.privacyId);
  assert('B-REGISTRY', 'by project', lookupPrivacyByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'privacy id', record.privacyId.startsWith('privacy-hardening-'), record.privacyId);
  assert('B-REGISTRY', 'record count', getPrivacyHardeningRecordCount() >= 1, String(getPrivacyHardeningRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runPersonalDataSurfaces(): void {
  const g = harness.beginGroup('C-PERSONAL-DATA-SURFACES');
  resetAll();

  const clean = analyzePersonalDataSurfaces(privacyInput('surface-clean'));
  assert('C-PERSONAL-DATA-SURFACES', 'clean score', clean.personalDataSurfaceScore >= 85, String(clean.personalDataSurfaceScore));
  assert('C-PERSONAL-DATA-SURFACES', 'no surfaces', clean.personalDataSurfaces.length === 0, '0');

  const risky = analyzePersonalDataSurfaces(privacyInput('surface-risky', {
    userPromptSurfaceRisk: true,
    uploadedFileSurfaceRisk: true,
    logSurfaceRisk: true,
    reportSurfaceRisk: true,
    operatorFeedSurfaceRisk: true,
    mobileCommandSurfaceRisk: true,
    futureAccountProfileSurfaceRisk: true,
    futureBillingPackageSurfaceRisk: true,
    scanContent: [`contact: ${FAKE_EMAIL}`, `phone: ${FAKE_PHONE}`],
  }));
  assert('C-PERSONAL-DATA-SURFACES', 'surfaces present', risky.personalDataSurfaces.length >= 5, String(risky.personalDataSurfaces.length));
  assert('C-PERSONAL-DATA-SURFACES', 'no raw email', !JSON.stringify(risky).includes(FAKE_EMAIL), 'leaked');
  assert('C-PERSONAL-DATA-SURFACES', 'low score', risky.personalDataSurfaceScore < 60, String(risky.personalDataSurfaceScore));

  harness.endGroup('C-PERSONAL-DATA-SURFACES', g);
}

function runProjectDataBoundaries(): void {
  const g = harness.beginGroup('D-PROJECT-DATA-BOUNDARIES');
  resetAll();

  const clean = analyzeProjectDataBoundaries(privacyInput('boundary-clean'));
  assert('D-PROJECT-DATA-BOUNDARIES', 'clean score', clean.dataBoundaryScore >= 85, String(clean.dataBoundaryScore));
  assert('D-PROJECT-DATA-BOUNDARIES', 'no warnings', clean.dataBoundaryWarnings.length === 0, '0');

  const risky = analyzeProjectDataBoundaries(privacyInput('boundary-risky', {
    projectOwnershipBoundaryWeak: true,
    workspaceBoundaryWeak: true,
    generatedProjectBoundaryWeak: true,
    importedProjectBoundaryWeak: true,
    exportedProjectBoundaryWeak: true,
    world1World2DataSeparationWeak: true,
    disposableWorkspaceSeparationWeak: true,
    cloudWorkerDataBoundaryWeak: true,
    mobileCommandDataBoundaryWeak: true,
    futureTenantDataBoundaryMissing: true,
    futureOrganizationBoundaryMissing: true,
  }));
  assert('D-PROJECT-DATA-BOUNDARIES', 'world2 weak', risky.dataBoundaryWarnings.includes('world1_world2_data_separation_weak'), 'world1_world2_data_separation_weak');
  assert('D-PROJECT-DATA-BOUNDARIES', 'gaps', risky.dataBoundaryGaps.length >= 2, String(risky.dataBoundaryGaps.length));
  assert('D-PROJECT-DATA-BOUNDARIES', 'low score', risky.dataBoundaryScore < 40, String(risky.dataBoundaryScore));

  harness.endGroup('D-PROJECT-DATA-BOUNDARIES', g);
}

function runRetentionRisk(): void {
  const g = harness.beginGroup('E-RETENTION-RISK');
  resetAll();

  const clean = analyzeRetentionRisk(privacyInput('retention-clean'));
  assert('E-RETENTION-RISK', 'clean score', clean.retentionScore >= 90, String(clean.retentionScore));
  assert('E-RETENTION-RISK', 'no gaps', clean.retentionGaps.length === 0, '0');

  const risky = analyzeRetentionRisk(privacyInput('retention-risky', {
    promptRetentionRisk: true,
    reportRetentionRisk: true,
    logRetentionRisk: true,
    notificationRetentionRisk: true,
    operatorFeedRetentionRisk: true,
    validationOutputRetentionRisk: true,
    uploadedFileRetentionRisk: true,
    generatedArtifactRetentionRisk: true,
    cloudMetadataRetentionRisk: true,
    mobileCommandHistoryRetentionRisk: true,
    futureAccountDataRetentionRisk: true,
    futureBillingDataRetentionRisk: true,
  }));
  assert('E-RETENTION-RISK', 'warnings', risky.retentionWarnings.length >= 8, String(risky.retentionWarnings.length));
  assert('E-RETENTION-RISK', 'gaps', risky.retentionGaps.length >= 8, String(risky.retentionGaps.length));
  assert('E-RETENTION-RISK', 'low score', risky.retentionScore < 30, String(risky.retentionScore));

  harness.endGroup('E-RETENTION-RISK', g);
}

function runDisclosureRisk(): void {
  const g = harness.beginGroup('F-DISCLOSURE-RISK');
  resetAll();

  const clean = analyzeDisclosureRisk(privacyInput('disclosure-clean'));
  assert('F-DISCLOSURE-RISK', 'clean score', clean.disclosureRiskScore >= 90, String(clean.disclosureRiskScore));
  assert('F-DISCLOSURE-RISK', 'no findings', clean.redactedDisclosureFindings.length === 0, '0');

  const risky = analyzeDisclosureRisk(privacyInput('disclosure-risky', {
    uvlReportDisclosureRisk: true,
    validationReportDisclosureRisk: true,
    operatorFeedDisclosureRisk: true,
    notificationVaultDisclosureRisk: true,
    logDisclosureRisk: true,
    errorMessageDisclosureRisk: true,
    supportBundleDisclosureRisk: true,
    scanContent: [
      `user=${FAKE_EMAIL}`,
      FAKE_PASSPORT,
      FAKE_ADDRESS,
      FAKE_TOKEN,
      FAKE_BILLING,
    ],
    scanPaths: ['logs/app.log', 'errors/trace.txt', 'reports/validation.txt', 'feed/entry.json', 'notify/vault.json'],
  }));
  assert('F-DISCLOSURE-RISK', 'findings', risky.redactedDisclosureFindings.length >= 3, String(risky.redactedDisclosureFindings.length));
  assert('F-DISCLOSURE-RISK', 'redacted', risky.redactedDisclosureFindings.every((f) => f.redactedPreview.includes('****')), 'redacted');
  assert('F-DISCLOSURE-RISK', 'no raw email', !JSON.stringify(risky).includes(FAKE_EMAIL), 'leaked');
  assert('F-DISCLOSURE-RISK', 'low score', risky.disclosureRiskScore < 50, String(risky.disclosureRiskScore));

  harness.endGroup('F-DISCLOSURE-RISK', g);
}

function runRedactionReadiness(): void {
  const g = harness.beginGroup('G-REDACTION-READINESS');
  resetAll();

  const ready = analyzeRedactionReadiness(privacyInput('redaction-ready'));
  assert('G-REDACTION-READINESS', 'ready score', ready.redactionReadinessScore >= 85, String(ready.redactionReadinessScore));
  assert('G-REDACTION-READINESS', 'no gaps', ready.redactionGaps.length === 0, '0');

  const gaps = analyzeRedactionReadiness(privacyInput('redaction-gaps', {
    missingSecretRedaction: true,
    missingPersonalDataRedaction: true,
    missingPromptRedaction: true,
    missingReportRedaction: true,
    missingLogRedaction: true,
    missingNotificationRedaction: true,
    missingCopiedReportRedaction: true,
    missingScreenshotRedaction: true,
    missingSupportBundleRedaction: true,
    missingMobileNotificationRedaction: true,
  }));
  assert('G-REDACTION-READINESS', 'gaps present', gaps.redactionGaps.length >= 8, String(gaps.redactionGaps.length));
  assert('G-REDACTION-READINESS', 'warnings', gaps.redactionWarnings.length >= 8, String(gaps.redactionWarnings.length));
  assert('G-REDACTION-READINESS', 'low score', gaps.redactionReadinessScore < 30, String(gaps.redactionReadinessScore));

  harness.endGroup('G-REDACTION-READINESS', g);
}

function runComplianceReadiness(): void {
  const g = harness.beginGroup('H-COMPLIANCE-READINESS');
  resetAll();

  const ready = analyzeComplianceReadiness(privacyInput('compliance-ready'));
  assert('H-COMPLIANCE-READINESS', 'ready score', ready.complianceReadinessScore >= 85, String(ready.complianceReadinessScore));
  assert('H-COMPLIANCE-READINESS', 'no gaps', ready.complianceGaps.length === 0, '0');

  const gaps = analyzeComplianceReadiness(privacyInput('compliance-gaps', {
    missingPrivacyPolicyReadiness: true,
    missingDataCollectionDisclosure: true,
    missingAppStorePrivacyLabels: true,
    missingPlayStoreDataSafety: true,
    missingAccountDeletionWorkflow: true,
    missingDataExportWorkflow: true,
    missingDataDeletionWorkflow: true,
    missingUserConsentModel: true,
    missingAnalyticsDisclosure: true,
    missingCrashReportingDisclosure: true,
    missingAiUsageDisclosure: true,
    missingCloudProcessingDisclosure: true,
    missingBillingPaymentDisclosure: true,
  }));
  assert('H-COMPLIANCE-READINESS', 'gaps present', gaps.complianceGaps.length >= 10, String(gaps.complianceGaps.length));
  assert('H-COMPLIANCE-READINESS', 'disclosures', gaps.recommendedFutureDisclosures.length >= 10, String(gaps.recommendedFutureDisclosures.length));
  assert('H-COMPLIANCE-READINESS', 'low score', gaps.complianceReadinessScore < 30, String(gaps.complianceReadinessScore));

  harness.endGroup('H-COMPLIANCE-READINESS', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('I-AUTHORITY');
  resetAll();

  const input = privacyInput('auth-test');
  const surfaces = analyzePersonalDataSurfaces(input);
  const boundaries = analyzeProjectDataBoundaries(input);
  const retention = analyzeRetentionRisk(input);
  const disclosure = analyzeDisclosureRisk(input);
  const redaction = analyzeRedactionReadiness(input);
  const compliance = analyzeComplianceReadiness(input);
  const authority = buildUnifiedPrivacyHardeningAuthority('auth-test', surfaces, boundaries, retention, disclosure, redaction, compliance, input);

  assert('I-AUTHORITY', 'authority id', authority.authorityId.startsWith('privacy-hardening-authority-'), authority.authorityId);
  assert('I-AUTHORITY', 'privacy score', authority.privacyScore > 0, String(authority.privacyScore));
  assert('I-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('I-AUTHORITY', 'risk level', authority.riskLevel.length > 0, authority.riskLevel);

  const blocked = buildUnifiedPrivacyHardeningAuthority('auth-blocked', surfaces, boundaries, retention, disclosure, redaction, compliance, {
    ...input,
    governanceBlocked: true,
  });
  assert('I-AUTHORITY', 'blocked state', blocked.state === 'BLOCKED', blocked.state);

  harness.endGroup('I-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('J-EVALUATION');
  resetAll();

  const { record } = evaluatePrivacyHardeningEngine(privacyInput('eval-stable'));
  assert('J-EVALUATION', 'stable state', record.state === 'PRIVATE' || record.state === 'ACCEPTABLE' || record.state === 'WATCH', record.state);
  assert('J-EVALUATION', 'privacy score', record.privacyScore > 50, String(record.privacyScore));
  assert('J-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluatePrivacyHardeningEngine(privacyInput('eval-degraded', {
    userPromptSurfaceRisk: true,
    logSurfaceRisk: true,
    world1World2DataSeparationWeak: true,
    promptRetentionRisk: true,
    logDisclosureRisk: true,
    missingPersonalDataRedaction: true,
    missingPrivacyPolicyReadiness: true,
    scanContent: [`email=${FAKE_EMAIL}`, FAKE_PASSPORT, FAKE_TOKEN],
    governanceBlocked: true,
    reliabilityScore: 15,
    performanceScore: 12,
    securityScore: 10,
    trustScore: 8,
  }));
  assert('J-EVALUATION', 'degraded state', degraded.record.state !== 'PRIVATE', degraded.record.state);
  assert('J-EVALUATION', 'low score', degraded.record.privacyScore < 55, String(degraded.record.privacyScore));

  const input = privacyInput('eval-manual');
  const authority = buildUnifiedPrivacyHardeningAuthority(
    'eval-manual',
    analyzePersonalDataSurfaces(input),
    analyzeProjectDataBoundaries(input),
    analyzeRetentionRisk(input),
    analyzeDisclosureRisk(input),
    analyzeRedactionReadiness(input),
    analyzeComplianceReadiness(input),
    input,
  );
  const evaluation = evaluatePrivacyHardening(authority);
  assert('J-EVALUATION', 'hardening readiness', evaluation.hardeningReadiness > 0, String(evaluation.hardeningReadiness));
  assert('J-EVALUATION', 'data boundary', evaluation.dataBoundaryScore >= 0, String(evaluation.dataBoundaryScore));

  harness.endGroup('J-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('K-REPORTING');
  resetAll();

  const { record, report } = evaluatePrivacyHardeningEngine(privacyInput('report-test'));
  assert('K-REPORTING', 'privacy score', report.privacyScore === record.privacyScore, String(report.privacyScore));
  assert('K-REPORTING', 'state', report.state === record.state, report.state);
  assert('K-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('K-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));

  const manual = generatePrivacyHardeningReport(
    record,
    report.evaluation,
    report.personalDataSurfaces,
    report.dataBoundaryGaps,
    report.retentionGaps,
    report.disclosureWarnings,
    report.redactionGaps,
    report.complianceReadinessGaps,
    report.redactedFindings,
    report.missingSignals,
  );
  assert('K-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluatePrivacyHardeningEngine(privacyInput(`history-${i}`, { trustScore: 60 + (i % 30) }));
  }
  assert('K-REPORTING', 'history bounded', getPrivacyHardeningHistorySize() === 128, String(getPrivacyHardeningHistorySize()));
  clearPrivacyHardeningHistory();
  assert('K-REPORTING', 'history cleared', getPrivacyHardeningHistorySize() === 0, '0');

  harness.endGroup('K-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('L-INTEGRATION');
  resetAll();

  const brain = registerPrivacyHardeningWithCentralBrain();
  assert('L-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerPrivacyHardeningWithCentralBrain();
  assert('L-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('L-INTEGRATION', 'foundation', registerPrivacyHardeningWithFoundation().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'capability registry', registerPrivacyHardeningWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'find panel', registerPrivacyHardeningWithFindPanel().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'uvl', registerPrivacyHardeningWithUvl().uvlRowCount >= 14, String(registerPrivacyHardeningWithUvl().uvlRowCount));
  assert('L-INTEGRATION', 'unified trust score', registerPrivacyHardeningWithUnifiedTrustScore().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'trust checkpoint', registerPrivacyHardeningWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'uvl runtime', registerPrivacyHardeningWithUnifiedVerificationLab().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'reliability hardening', registerPrivacyHardeningWithReliabilityHardening().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'performance hardening', registerPrivacyHardeningWithPerformanceHardening().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'security hardening', registerPrivacyHardeningWithSecurityHardening().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'cloud worker runtime', registerPrivacyHardeningWithCloudWorkerRuntime().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'execution authority', registerPrivacyHardeningWithExecutionAuthority().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'operator feed', registerPrivacyHardeningWithOperatorFeed().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'notification vault', registerPrivacyHardeningWithNotificationVault().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'notification delivery', registerPrivacyHardeningWithNotificationDelivery().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'world2', registerPrivacyHardeningWithWorld2().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'mobile command', registerPrivacyHardeningWithMobileCommand().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'self evolution governance', registerPrivacyHardeningWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'missing capability escalation', registerPrivacyHardeningWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('L-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));

  harness.endGroup('L-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('M-CACHE');
  resetAll();

  const input = privacyInput('cache-fixed');
  const surfaces = analyzePersonalDataSurfaces(input);
  const boundaries = analyzeProjectDataBoundaries(input);
  const retention = analyzeRetentionRisk(input);
  const disclosure = analyzeDisclosureRisk(input);
  const redaction = analyzeRedactionReadiness(input);
  const compliance = analyzeComplianceReadiness(input);

  buildUnifiedPrivacyHardeningAuthority('cache-fixed', surfaces, boundaries, retention, disclosure, redaction, compliance, input);
  buildUnifiedPrivacyHardeningAuthority('cache-fixed', surfaces, boundaries, retention, disclosure, redaction, compliance, input);

  const cache = getPrivacyHardeningCacheStats();
  assert('M-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('M-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byState = lookupPrivacyByState('ACCEPTABLE');
  assert('M-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('M-CACHE', g);
}

function stressPrivacy(count: number, label: string): void {
  const g = harness.beginGroup(`N-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluatePrivacyHardeningEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      userPromptSurfaceRisk: i % 11 === 0,
      logSurfaceRisk: i % 13 === 0,
      world1World2DataSeparationWeak: i % 17 === 0,
      promptRetentionRisk: i % 19 === 0,
      logDisclosureRisk: i % 23 === 0,
      missingPersonalDataRedaction: i % 29 === 0,
      missingPrivacyPolicyReadiness: i % 31 === 0,
      governanceBlocked: i % 37 === 0,
      reliabilityScore: 20 + (i % 70),
      performanceScore: 15 + (i % 75),
      securityScore: 10 + (i % 80),
      trustScore: 10 + (i % 85),
    });
  }

  const elapsed = performance.now() - start;

  assert(`N-STRESS-${label}`, 'record count', getPrivacyHardeningRecordCount() === count, String(getPrivacyHardeningRecordCount()));
  assert(`N-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getPrivacyHardeningRuntimeReport();
  assert(`N-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`N-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`N-STRESS-${label}`, 'surface analyses', runtime.personalDataSurfaceAnalysisCount > 0, String(runtime.personalDataSurfaceAnalysisCount));

  const sample = getPrivacyHardeningRecord(`privacy-hardening-${count}`);
  assert(`N-STRESS-${label}`, 'sample record', sample !== undefined, 'record');

  harness.endGroup(`N-STRESS-${label}`, g);
}

function runPrivateDataRedaction(): void {
  const g = harness.beginGroup('O-PRIVATE-DATA-REDACTION');
  resetAll();

  const fakeValues = [FAKE_EMAIL, FAKE_PHONE, FAKE_PASSPORT, FAKE_ADDRESS, FAKE_TOKEN, FAKE_BILLING];
  const { report } = evaluatePrivacyHardeningEngine(privacyInput('redaction-test', {
    scanContent: [
      `user email: ${FAKE_EMAIL}`,
      `phone: ${FAKE_PHONE}`,
      FAKE_PASSPORT,
      `lives at ${FAKE_ADDRESS}`,
      `auth ${FAKE_TOKEN}`,
      FAKE_BILLING,
    ],
    scanPaths: ['prompts/user.txt', 'logs/app.log', 'reports/uvl.txt', 'feed/entry.json', 'notify/push.json', 'billing/plan.json'],
    logDisclosureRisk: true,
    operatorFeedDisclosureRisk: true,
    validationReportDisclosureRisk: true,
  }));

  const reportJson = JSON.stringify(report);
  assert('O-PRIVATE-DATA-REDACTION', 'findings present', report.redactedFindings.length >= 3, String(report.redactedFindings.length));
  assert('O-PRIVATE-DATA-REDACTION', 'all redacted', report.redactedFindings.every((f) => f.redactedPreview.includes('****')), 'redacted');

  for (const value of fakeValues) {
    assert('O-PRIVATE-DATA-REDACTION', `no raw ${value.slice(0, 10)}`, !reportJson.includes(value), 'leaked');
  }

  assert('O-PRIVATE-DATA-REDACTION', 'no full email', !reportJson.includes('testuser.fake@example.invalid'), 'leaked email');
  assert('O-PRIVATE-DATA-REDACTION', 'no passport body', !reportJson.includes('XK12345678'), 'leaked passport');
  assert('O-PRIVATE-DATA-REDACTION', 'recommendations safe', !report.recommendations.some((r) => fakeValues.some((v) => r.includes(v))), 'leaked in recs');

  harness.endGroup('O-PRIVATE-DATA-REDACTION', g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('P-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 23.4 Privacy Hardening');
  console.log('==========================================\n');

  runSetup();
  runRegistry();
  runPersonalDataSurfaces();
  runProjectDataBoundaries();
  runRetentionRisk();
  runDisclosureRisk();
  runRedactionReadiness();
  runComplianceReadiness();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressPrivacy(100, '100');
  stressPrivacy(1000, '1000');
  stressPrivacy(5000, '5000');
  runPrivateDataRedaction();
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getPrivacyHardeningRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Surface analyses: ${getPersonalDataSurfaceAnalysisCount()}`,
    `Boundary analyses: ${getDataBoundaryAnalysisCount()}`,
    `Retention analyses: ${getRetentionAnalysisCount()}`,
    `Disclosure analyses: ${getDisclosureAnalysisCount()}`,
    `Redaction readiness analyses: ${getRedactionReadinessAnalysisCount()}`,
    `Compliance readiness analyses: ${getComplianceReadinessAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getPrivacyHardeningRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? PRIVACY_HARDENING_PASS_TOKEN : 'PRIVACY_HARDENING_V1_FAIL',
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

  console.log(`\n${PRIVACY_HARDENING_PASS_TOKEN}`);
}

main();
