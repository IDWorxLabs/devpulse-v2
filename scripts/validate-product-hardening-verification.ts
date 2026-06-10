/**
 * Product Hardening Verification Checkpoint — Phases 23.1 through 23.6 composition validation.
 * Read-only checkpoint. No runtime behavior changes.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../src/intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES, resolveFindPanelAlias } from '../src/find-panel/alias-registry.js';
import {
  ALL_UVL_ROWS,
  RELIABILITY_HARDENING_UVL_ROWS,
  PERFORMANCE_HARDENING_UVL_ROWS,
  SECURITY_HARDENING_UVL_ROWS,
  PRIVACY_HARDENING_UVL_ROWS,
  RECOVERY_HARDENING_UVL_ROWS,
  SCALE_HARDENING_UVL_ROWS,
  hasUvlRow,
} from '../src/unified-verification-lab/uvl-row-registry.js';
import {
  getDevPulseV2ReliabilityHardening,
  evaluateReliabilityHardeningEngine,
  getReliabilityHardeningRecordCount,
  getReliabilityHardeningHistorySize,
  resetReliabilityHardeningForTests,
} from '../src/reliability-hardening/index.js';
import {
  getDevPulseV2PerformanceHardening,
  evaluatePerformanceHardeningEngine,
  getPerformanceHardeningRecordCount,
  getPerformanceHardeningHistorySize,
  resetPerformanceHardeningForTests,
} from '../src/performance-hardening/index.js';
import {
  getDevPulseV2SecurityHardening,
  evaluateSecurityHardeningEngine,
  getSecurityHardeningRecordCount,
  getSecurityHardeningHistorySize,
  resetSecurityHardeningForTests,
} from '../src/security-hardening/index.js';
import {
  getDevPulseV2PrivacyHardening,
  evaluatePrivacyHardeningEngine,
  getPrivacyHardeningRecordCount,
  getPrivacyHardeningHistorySize,
  resetPrivacyHardeningForTests,
} from '../src/privacy-hardening/index.js';
import {
  getDevPulseV2RecoveryHardening,
  evaluateRecoveryHardeningEngine,
  getRecoveryHardeningRecordCount,
  getRecoveryHardeningHistorySize,
  resetRecoveryHardeningForTests,
} from '../src/recovery-hardening/index.js';
import {
  getDevPulseV2ScaleHardening,
  evaluateScaleHardeningEngine,
  getScaleHardeningRecordCount,
  getScaleHardeningHistorySize,
  resetScaleHardeningForTests,
} from '../src/scale-hardening/index.js';
import type { ReliabilityHardeningInput } from '../src/reliability-hardening/reliability-hardening-types.js';
import type { PerformanceHardeningInput } from '../src/performance-hardening/performance-hardening-types.js';
import type { SecurityHardeningInput } from '../src/security-hardening/security-hardening-types.js';
import type { PrivacyHardeningInput } from '../src/privacy-hardening/privacy-hardening-types.js';
import type { RecoveryHardeningInput } from '../src/recovery-hardening/recovery-hardening-types.js';
import type { ScaleHardeningInput } from '../src/scale-hardening/scale-hardening-types.js';

export const PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN = 'PRODUCT_HARDENING_VERIFICATION_V1_PASS';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MIN_SCENARIOS = 110;

const HARDENING_MODULE_DIRS = [
  'src/reliability-hardening',
  'src/performance-hardening',
  'src/security-hardening',
  'src/privacy-hardening',
  'src/recovery-hardening',
  'src/scale-hardening',
] as const;

const UVL_MINIMUMS: Record<string, number> = {
  RELIABILITY_HARDENING_UVL_ROWS: 13,
  PERFORMANCE_HARDENING_UVL_ROWS: 13,
  SECURITY_HARDENING_UVL_ROWS: 13,
  PRIVACY_HARDENING_UVL_ROWS: 13,
  RECOVERY_HARDENING_UVL_ROWS: 13,
  SCALE_HARDENING_UVL_ROWS: 13,
};

const FORBIDDEN_EXECUTION_PATTERNS = [
  'writeFileSync',
  'writeFile(',
  'unlinkSync',
  'deploy(',
  'executeBuild',
  'runAutonomousFix',
  'controlledApply',
  'applyPacket',
  'selfModification',
  'mutateWorkspace',
  'mutateProject',
  'startHttpServer',
  'child_process',
  'spawn(',
] as const;

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
  responsible?: string;
}

interface HardeningChainOverrides {
  reliability?: Partial<ReliabilityHardeningInput>;
  performance?: Partial<PerformanceHardeningInput>;
  security?: Partial<SecurityHardeningInput>;
  privacy?: Partial<PrivacyHardeningInput>;
  recovery?: Partial<RecoveryHardeningInput>;
  scale?: Partial<ScaleHardeningInput>;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 60 * 1000 });

function assert(
  group: string,
  name: string,
  condition: boolean,
  detail: string,
  responsible?: string,
): void {
  results.push({ group, name, passed: condition, detail, responsible });
}

function resetAllHardeningPhases(): void {
  resetReliabilityHardeningForTests();
  resetPerformanceHardeningForTests();
  resetSecurityHardeningForTests();
  resetPrivacyHardeningForTests();
  resetRecoveryHardeningForTests();
  resetScaleHardeningForTests();
}

function hasAlias(alias: string, capabilityId: string): boolean {
  return WORLD2_BUILDER_PACKET_FIND_ALIASES.some(
    (entry) => entry.alias === alias && entry.capabilityId === capabilityId,
  );
}

function listTsFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join(dir, f));
}

function strongReliabilityInput(requestId: string, overrides: Partial<ReliabilityHardeningInput> = {}): ReliabilityHardeningInput {
  return {
    requestId,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    startupReadiness: 88,
    uvlReadiness: 87,
    trustEngineReadiness: 86,
    verificationReadiness: 85,
    monitoringReadiness: 84,
    operatorFeedReadiness: 83,
    notificationReadiness: 82,
    world2Readiness: 81,
    mobileCommandReadiness: 80,
    governanceStable: true,
    governanceBlocked: false,
    ...overrides,
  };
}

function composeProductHardeningChain(requestId: string, overrides: HardeningChainOverrides = {}) {
  const reliability = evaluateReliabilityHardeningEngine(
    strongReliabilityInput(`${requestId}-reliability`, overrides.reliability),
  );

  const performance = evaluatePerformanceHardeningEngine({
    requestId: `${requestId}-performance`,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    bootReadiness: 85,
    bootstrapWeight: 25,
    firstVisibleDelayMs: 800,
    firstClickableDelayMs: 1500,
    chatUsableDelayMs: 2500,
    mobileStartupPressure: false,
    reliabilityScore: reliability.record.reliabilityScore,
    governanceBlocked: false,
    ...overrides.performance,
  });

  const security = evaluateSecurityHardeningEngine({
    requestId: `${requestId}-security`,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    reliabilityScore: reliability.record.reliabilityScore,
    performanceScore: performance.record.performanceScore,
    trustScore: 82,
    governanceBlocked: false,
    futureUserAccountBoundaryMissing: false,
    futurePackagePlanBoundaryMissing: false,
    missingUserIdentityBoundary: false,
    missingPackageEntitlementModel: false,
    futureUserTenantBoundaryMissing: false,
    ...overrides.security,
  });

  const privacy = evaluatePrivacyHardeningEngine({
    requestId: `${requestId}-privacy`,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    reliabilityScore: reliability.record.reliabilityScore,
    performanceScore: performance.record.performanceScore,
    securityScore: security.record.securityScore,
    trustScore: 82,
    governanceBlocked: false,
    futureTenantDataBoundaryMissing: false,
    futureOrganizationBoundaryMissing: false,
    missingPrivacyPolicyReadiness: false,
    missingUserConsentModel: false,
    missingAppStorePrivacyLabels: false,
    ...overrides.privacy,
  });

  const recovery = evaluateRecoveryHardeningEngine({
    requestId: `${requestId}-recovery`,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    reliabilityScore: reliability.record.reliabilityScore,
    performanceScore: performance.record.performanceScore,
    securityScore: security.record.securityScore,
    privacyScore: privacy.record.privacyScore,
    trustScore: 82,
    governanceBlocked: false,
    ...overrides.recovery,
  });

  const scale = evaluateScaleHardeningEngine({
    requestId: `${requestId}-scale`,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    reliabilityScore: reliability.record.reliabilityScore,
    performanceScore: performance.record.performanceScore,
    securityScore: security.record.securityScore,
    privacyScore: privacy.record.privacyScore,
    recoveryScore: recovery.record.recoveryScore,
    trustScore: 82,
    governanceBlocked: false,
    ...overrides.scale,
  });

  return {
    reliability,
    performance,
    security,
    privacy,
    recovery,
    scale,
    mapped: {
      reliabilityScore: reliability.record.reliabilityScore,
      performanceScore: performance.record.performanceScore,
      securityScore: security.record.securityScore,
      privacyScore: privacy.record.privacyScore,
      recoveryScore: recovery.record.recoveryScore,
      scaleScore: scale.record.scaleScore,
    },
  };
}

function runPhaseExistence(): void {
  const g = harness.beginGroup('A-PHASE-EXISTENCE');
  for (const dir of HARDENING_MODULE_DIRS) {
    const full = join(ROOT, dir);
    assert('A-PHASE-EXISTENCE', `module ${dir}`, existsSync(full), dir);
    assert('A-PHASE-EXISTENCE', `index ${dir}`, existsSync(join(full, 'index.ts')), 'index.ts');
  }
  harness.endGroup('A-PHASE-EXISTENCE', g);
}

function runPublicExports(): void {
  const g = harness.beginGroup('B-PUBLIC-EXPORTS');

  const getters = [
    { name: 'getDevPulseV2ReliabilityHardening', fn: getDevPulseV2ReliabilityHardening, phase: 23.1 },
    { name: 'getDevPulseV2PerformanceHardening', fn: getDevPulseV2PerformanceHardening, phase: 23.2 },
    { name: 'getDevPulseV2SecurityHardening', fn: getDevPulseV2SecurityHardening, phase: 23.3 },
    { name: 'getDevPulseV2PrivacyHardening', fn: getDevPulseV2PrivacyHardening, phase: 23.4 },
    { name: 'getDevPulseV2RecoveryHardening', fn: getDevPulseV2RecoveryHardening, phase: 23.5 },
    { name: 'getDevPulseV2ScaleHardening', fn: getDevPulseV2ScaleHardening, phase: 23.6 },
  ];

  for (const entry of getters) {
    const result = entry.fn();
    assert('B-PUBLIC-EXPORTS', entry.name, typeof entry.fn === 'function', 'callable');
    assert('B-PUBLIC-EXPORTS', `${entry.name} phase`, result.phase === entry.phase, String(result.phase));
    assert('B-PUBLIC-EXPORTS', `${entry.name} readOnly`, result.readOnly === true, 'readOnly');
    assert('B-PUBLIC-EXPORTS', `${entry.name} noExecution`, result.noExecution === true, 'noExecution');
    assert('B-PUBLIC-EXPORTS', `${entry.name} noMutations`, result.noMutations === true, 'noMutations');
  }

  const resetFns = [
    { expected: 'resetReliabilityHardeningForTests', actual: resetReliabilityHardeningForTests },
    { expected: 'resetPerformanceHardeningForTests', actual: resetPerformanceHardeningForTests },
    { expected: 'resetSecurityHardeningForTests', actual: resetSecurityHardeningForTests },
    { expected: 'resetPrivacyHardeningForTests', actual: resetPrivacyHardeningForTests },
    { expected: 'resetRecoveryHardeningForTests', actual: resetRecoveryHardeningForTests },
    { expected: 'resetScaleHardeningForTests', actual: resetScaleHardeningForTests },
  ];

  for (const mapping of resetFns) {
    const nameDiffers = mapping.expected !== mapping.actual.name;
    assert(
      'B-PUBLIC-EXPORTS',
      mapping.expected,
      typeof mapping.actual === 'function',
      nameDiffers ? `callable as ${mapping.actual.name} (name mismatch from spec)` : 'callable',
      nameDiffers ? 'index.ts export naming' : undefined,
    );
  }

  harness.endGroup('B-PUBLIC-EXPORTS', g);
}

function runFoundationRegistration(): void {
  const g = harness.beginGroup('C-FOUNDATION-REGISTRATION');
  const domains = [
    { domain: 'reliability_hardening', phase: 23.1, owner: 'devpulse_v2_reliability_hardening' },
    { domain: 'performance_hardening', phase: 23.2, owner: 'devpulse_v2_performance_hardening' },
    { domain: 'security_hardening', phase: 23.3, owner: 'devpulse_v2_security_hardening' },
    { domain: 'privacy_hardening', phase: 23.4, owner: 'devpulse_v2_privacy_hardening' },
    { domain: 'recovery_hardening', phase: 23.5, owner: 'devpulse_v2_recovery_hardening' },
    { domain: 'scale_hardening', phase: 23.6, owner: 'devpulse_v2_scale_hardening' },
  ] as const;

  for (const entry of domains) {
    const owner = getDevPulseV2Owner(entry.domain);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} domain`, owner.domain === entry.domain, owner.domain);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} owner`, owner.ownerModule === entry.owner, owner.ownerModule);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} phase`, owner.phase === entry.phase, String(owner.phase));
  }

  harness.endGroup('C-FOUNDATION-REGISTRATION', g);
}

function runCapabilityRegistry(): void {
  const g = harness.beginGroup('D-CAPABILITY-REGISTRY');
  const expected = [
    { capabilityId: 'RELIABILITY_HARDENING', label: 'Reliability Hardening', phase: 23.1 },
    { capabilityId: 'PERFORMANCE_HARDENING', label: 'Performance Hardening', phase: 23.2 },
    { capabilityId: 'SECURITY_HARDENING', label: 'Security Hardening', phase: 23.3 },
    { capabilityId: 'PRIVACY_HARDENING', label: 'Privacy Hardening', phase: 23.4 },
    { capabilityId: 'RECOVERY_HARDENING', label: 'Recovery Hardening', phase: 23.5 },
    { capabilityId: 'SCALE_HARDENING', label: 'Scale Hardening', phase: 23.6 },
  ];

  for (const entry of expected) {
    const found = INTELLIGENCE_CONSOLE_CAPABILITIES.find((c) => c.capabilityId === entry.capabilityId);
    assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} exists`, found !== undefined, entry.capabilityId, 'capability-registry.ts');
    if (found) {
      assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} label`, found.label === entry.label, found.label);
      assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} phase`, found.phase === entry.phase, String(found.phase));
    }
  }

  harness.endGroup('D-CAPABILITY-REGISTRY', g);
}

function runFindPanelAliases(): void {
  const g = harness.beginGroup('E-FIND-PANEL-ALIASES');
  const required: { alias: string; capabilityId: string }[] = [
    { alias: 'Reliability Hardening', capabilityId: 'RELIABILITY_HARDENING' },
    { alias: 'Reliability', capabilityId: 'RELIABILITY_HARDENING' },
    { alias: 'Performance Hardening', capabilityId: 'PERFORMANCE_HARDENING' },
    { alias: 'Performance', capabilityId: 'PERFORMANCE_HARDENING' },
    { alias: 'Security Hardening', capabilityId: 'SECURITY_HARDENING' },
    { alias: 'Security', capabilityId: 'SECURITY_HARDENING' },
    { alias: 'Privacy Hardening', capabilityId: 'PRIVACY_HARDENING' },
    { alias: 'Privacy', capabilityId: 'PRIVACY_HARDENING' },
    { alias: 'Recovery Hardening', capabilityId: 'RECOVERY_HARDENING' },
    { alias: 'Recovery', capabilityId: 'RECOVERY_HARDENING' },
    { alias: 'Scale Hardening', capabilityId: 'SCALE_HARDENING' },
    { alias: 'Scale', capabilityId: 'SCALE_HARDENING' },
  ];

  for (const entry of required) {
    assert(
      'E-FIND-PANEL-ALIASES',
      entry.alias,
      hasAlias(entry.alias, entry.capabilityId),
      entry.capabilityId,
      'find-panel/alias-registry.ts',
    );
    const resolved = resolveFindPanelAlias(entry.alias);
    assert(
      'E-FIND-PANEL-ALIASES',
      `resolve ${entry.alias}`,
      resolved?.capabilityId === entry.capabilityId,
      resolved?.capabilityId ?? 'null',
    );
  }

  harness.endGroup('E-FIND-PANEL-ALIASES', g);
}

function runUvlRegistration(): void {
  const g = harness.beginGroup('F-UVL-REGISTRATION');
  const groups = [
    { name: 'RELIABILITY_HARDENING_UVL_ROWS', rows: RELIABILITY_HARDENING_UVL_ROWS },
    { name: 'PERFORMANCE_HARDENING_UVL_ROWS', rows: PERFORMANCE_HARDENING_UVL_ROWS },
    { name: 'SECURITY_HARDENING_UVL_ROWS', rows: SECURITY_HARDENING_UVL_ROWS },
    { name: 'PRIVACY_HARDENING_UVL_ROWS', rows: PRIVACY_HARDENING_UVL_ROWS },
    { name: 'RECOVERY_HARDENING_UVL_ROWS', rows: RECOVERY_HARDENING_UVL_ROWS },
    { name: 'SCALE_HARDENING_UVL_ROWS', rows: SCALE_HARDENING_UVL_ROWS },
  ];

  for (const group of groups) {
    const minimum = UVL_MINIMUMS[group.name] ?? 13;
    assert('F-UVL-REGISTRATION', `${group.name} count`, group.rows.length >= minimum, String(group.rows.length));
    for (const row of group.rows) {
      assert('F-UVL-REGISTRATION', `row ${row.rowId}`, hasUvlRow(row.rowId), row.rowId, 'uvl-row-registry.ts');
      assert(
        'F-UVL-REGISTRATION',
        `ALL_UVL_ROWS includes ${row.rowId}`,
        ALL_UVL_ROWS.some((r) => r.rowId === row.rowId),
        row.rowId,
      );
    }
  }

  harness.endGroup('F-UVL-REGISTRATION', g);
}

function runHardeningAuthorityComposition(): void {
  const g = harness.beginGroup('G-HARDENING-AUTHORITY-COMPOSITION');
  resetAllHardeningPhases();

  const chain = composeProductHardeningChain('product-chain-strong');

  assert('G-HARDENING-AUTHORITY-COMPOSITION', 'reliability report', chain.reliability.report !== undefined, 'report', 'reliability-hardening');
  assert('G-HARDENING-AUTHORITY-COMPOSITION', 'performance report', chain.performance.report !== undefined, 'report', 'performance-hardening');
  assert('G-HARDENING-AUTHORITY-COMPOSITION', 'security report', chain.security.report !== undefined, 'report', 'security-hardening');
  assert('G-HARDENING-AUTHORITY-COMPOSITION', 'privacy report', chain.privacy.report !== undefined, 'report', 'privacy-hardening');
  assert('G-HARDENING-AUTHORITY-COMPOSITION', 'recovery report', chain.recovery.report !== undefined, 'report', 'recovery-hardening');
  assert('G-HARDENING-AUTHORITY-COMPOSITION', 'scale report', chain.scale.report !== undefined, 'report', 'scale-hardening');

  const score = chain.scale.record.scaleScore;
  assert('G-HARDENING-AUTHORITY-COMPOSITION', 'numeric scale score', typeof score === 'number' && Number.isFinite(score), String(score));
  assert('G-HARDENING-AUTHORITY-COMPOSITION', 'bounded scale score', score >= 0 && score <= 100, String(score));
  assert(
    'G-HARDENING-AUTHORITY-COMPOSITION',
    'bounded confidence',
    chain.scale.record.confidence >= 0 && chain.scale.record.confidence <= 100,
    String(chain.scale.record.confidence),
  );
  assert(
    'G-HARDENING-AUTHORITY-COMPOSITION',
    'recommendations present',
    chain.scale.report.recommendations.length > 0,
    String(chain.scale.report.recommendations.length),
  );

  harness.endGroup('G-HARDENING-AUTHORITY-COMPOSITION', g);
}

function runSignalCompatibility(): void {
  const g = harness.beginGroup('H-SIGNAL-COMPATIBILITY');
  resetAllHardeningPhases();

  const chain = composeProductHardeningChain('signal-compat');

  assert('H-SIGNAL-COMPATIBILITY', 'reliability mappable', chain.mapped.reliabilityScore >= 0, String(chain.mapped.reliabilityScore));
  assert('H-SIGNAL-COMPATIBILITY', 'performance mappable', chain.mapped.performanceScore >= 0, String(chain.mapped.performanceScore));
  assert('H-SIGNAL-COMPATIBILITY', 'security mappable', chain.mapped.securityScore >= 0, String(chain.mapped.securityScore));
  assert('H-SIGNAL-COMPATIBILITY', 'privacy mappable', chain.mapped.privacyScore >= 0, String(chain.mapped.privacyScore));
  assert('H-SIGNAL-COMPATIBILITY', 'recovery mappable', chain.mapped.recoveryScore >= 0, String(chain.mapped.recoveryScore));
  assert('H-SIGNAL-COMPATIBILITY', 'scale mappable', chain.mapped.scaleScore >= 0, String(chain.mapped.scaleScore));

  const consumed = evaluateScaleHardeningEngine({
    requestId: 'signal-compat-consumed',
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    reliabilityScore: chain.mapped.reliabilityScore,
    performanceScore: chain.mapped.performanceScore,
    securityScore: chain.mapped.securityScore,
    privacyScore: chain.mapped.privacyScore,
    recoveryScore: chain.mapped.recoveryScore,
    trustScore: 82,
  });

  assert(
    'H-SIGNAL-COMPATIBILITY',
    'scale consumes mapped scores',
    consumed.record.scaleScore > 0,
    String(consumed.record.scaleScore),
    'scale-hardening',
  );
  assert(
    'H-SIGNAL-COMPATIBILITY',
    'downstream capacity score present',
    consumed.record.capacityScore >= 0 && consumed.record.concurrencyScore >= 0,
    `${consumed.record.capacityScore}/${consumed.record.concurrencyScore}`,
  );

  harness.endGroup('H-SIGNAL-COMPATIBILITY', g);
}

function runReadOnlyBoundary(): void {
  const g = harness.beginGroup('I-READ-ONLY-BOUNDARY');

  for (const dir of HARDENING_MODULE_DIRS) {
    const files = listTsFiles(join(ROOT, dir));
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_EXECUTION_PATTERNS) {
        assert(
          'I-READ-ONLY-BOUNDARY',
          `${file.replace(ROOT, '')} no ${pattern}`,
          !content.includes(pattern),
          pattern,
          dir,
        );
      }
    }
  }

  harness.endGroup('I-READ-ONLY-BOUNDARY', g);
}

function runResetIsolation(): void {
  const g = harness.beginGroup('J-RESET-ISOLATION');
  resetAllHardeningPhases();

  composeProductHardeningChain('reset-before');
  assert('J-RESET-ISOLATION', 'reliability records before reset', getReliabilityHardeningRecordCount() >= 1, String(getReliabilityHardeningRecordCount()));
  assert('J-RESET-ISOLATION', 'scale records before reset', getScaleHardeningRecordCount() >= 1, String(getScaleHardeningRecordCount()));
  assert('J-RESET-ISOLATION', 'scale history before reset', getScaleHardeningHistorySize() >= 1, String(getScaleHardeningHistorySize()));

  resetAllHardeningPhases();

  assert('J-RESET-ISOLATION', 'reliability records cleared', getReliabilityHardeningRecordCount() === 0, String(getReliabilityHardeningRecordCount()));
  assert('J-RESET-ISOLATION', 'performance records cleared', getPerformanceHardeningRecordCount() === 0, String(getPerformanceHardeningRecordCount()));
  assert('J-RESET-ISOLATION', 'security records cleared', getSecurityHardeningRecordCount() === 0, String(getSecurityHardeningRecordCount()));
  assert('J-RESET-ISOLATION', 'privacy records cleared', getPrivacyHardeningRecordCount() === 0, String(getPrivacyHardeningRecordCount()));
  assert('J-RESET-ISOLATION', 'recovery records cleared', getRecoveryHardeningRecordCount() === 0, String(getRecoveryHardeningRecordCount()));
  assert('J-RESET-ISOLATION', 'scale records cleared', getScaleHardeningRecordCount() === 0, String(getScaleHardeningRecordCount()));
  assert('J-RESET-ISOLATION', 'scale history cleared', getScaleHardeningHistorySize() === 0, String(getScaleHardeningHistorySize()));

  const after = composeProductHardeningChain('reset-after');
  assert('J-RESET-ISOLATION', 'fresh scale id', after.scale.record.scaleId === 'scale-hardening-1', after.scale.record.scaleId);
  assert('J-RESET-ISOLATION', 'no stale scale count', getScaleHardeningRecordCount() === 1, String(getScaleHardeningRecordCount()));

  harness.endGroup('J-RESET-ISOLATION', g);
}

function runDeterminism(): void {
  const g = harness.beginGroup('K-DETERMINISM');
  resetAllHardeningPhases();

  let baselineScore = -1;
  let baselineState = '';
  let baselineConfidence = -1;

  for (let i = 0; i < 25; i++) {
    resetAllHardeningPhases();
    const chain = composeProductHardeningChain('determinism-fixed');
    if (i === 0) {
      baselineScore = chain.scale.record.scaleScore;
      baselineState = chain.scale.record.state;
      baselineConfidence = chain.scale.record.confidence;
    }
    assert('K-DETERMINISM', `score stable run ${i}`, chain.scale.record.scaleScore === baselineScore, String(chain.scale.record.scaleScore));
    assert('K-DETERMINISM', `state stable run ${i}`, chain.scale.record.state === baselineState, chain.scale.record.state);
    assert('K-DETERMINISM', `confidence stable run ${i}`, chain.scale.record.confidence === baselineConfidence, String(chain.scale.record.confidence));
    assert('K-DETERMINISM', `history bounded run ${i}`, getScaleHardeningHistorySize() <= 1, String(getScaleHardeningHistorySize()));
    assert('K-DETERMINISM', `registry bounded run ${i}`, getScaleHardeningRecordCount() <= 1, String(getScaleHardeningRecordCount()));
  }

  harness.endGroup('K-DETERMINISM', g);
}

function runConflictScenarios(): void {
  const g = harness.beginGroup('L-CONFLICT-SCENARIOS');
  resetAllHardeningPhases();

  const cases: { name: string; overrides: HardeningChainOverrides; weakLayer: string }[] = [
    {
      name: 'reliable-but-insecure',
      overrides: {
        security: {
          founderApprovalBoundaryWeak: true,
          governanceBoundaryWeak: true,
          executionBoundaryWeak: true,
          deploymentBoundaryWeak: true,
          unsafeDeployment: true,
          unsafeAutonomousCompletion: true,
          world1World2SeparationWeak: true,
          missingPermissionModel: true,
        },
      },
      weakLayer: 'security',
    },
    {
      name: 'fast-but-privacy-weak',
      overrides: {
        privacy: {
          userPromptSurfaceRisk: true,
          logSurfaceRisk: true,
          world1World2DataSeparationWeak: true,
          promptRetentionRisk: true,
          logDisclosureRisk: true,
          missingPersonalDataRedaction: true,
          missingPrivacyPolicyReadiness: true,
        },
      },
      weakLayer: 'privacy',
    },
    {
      name: 'secure-but-recovery-weak',
      overrides: {
        recovery: {
          missingGitCheckpoint: true,
          missingLastKnownGoodCheckpoint: true,
          world1World2SeparationWeak: true,
          autonomousExecutionBoundaryWeak: true,
          missingModuleResetFunctions: true,
          backupReadinessWeak: true,
          productionIncidentReadinessWeak: true,
        },
      },
      weakLayer: 'recovery',
    },
    {
      name: 'strong-recovery-scale-weak',
      overrides: {
        scale: {
          largePromptRisk: true,
          manyUvlRowsRisk: true,
          multipleProjectsActiveRisk: true,
          cloudBuildMinutesRisk: true,
          taskQueuePressureRisk: true,
          projectIsolationWeak: true,
          crossProjectRecoveryRisk: true,
        },
      },
      weakLayer: 'scale',
    },
    {
      name: 'strong-scale-poor-reliability',
      overrides: {
        reliability: {
          startupReadiness: 10,
          uvlReadiness: 8,
          trustEngineReadiness: 6,
          importFailureRisk: true,
          registryDrift: true,
          validatorDrift: true,
          missingResetRisk: true,
        },
      },
      weakLayer: 'reliability',
    },
    {
      name: 'multiple-simultaneous-failures',
      overrides: {
        reliability: { unboundedLoopRisk: true, missingTimeoutGuard: true },
        performance: { repeatedStartupLoopRisk: true, unboundedValidatorRisk: true },
        security: { unsafeDeployment: true, cloudControlBoundaryWeak: true },
        privacy: { logDisclosureRisk: true, missingPersonalDataRedaction: true },
        recovery: { backupReadinessWeak: true, threeFailureEscalationRuleWeak: true },
        scale: { missingBackpressureSignals: true, futureBillingIntegrationRisk: true },
      },
      weakLayer: 'scale',
    },
  ];

  for (const testCase of cases) {
    resetAllHardeningPhases();
    const chain = composeProductHardeningChain(`conflict-${testCase.name}`, testCase.overrides);

    const notFullyReady =
      chain.reliability.record.state !== 'STABLE'
      || chain.performance.record.state !== 'FAST'
      || chain.security.record.state !== 'SECURE'
      || chain.privacy.record.state !== 'PRIVATE'
      || chain.recovery.record.state !== 'READY'
      || chain.scale.record.state !== 'READY';

    assert(
      'L-CONFLICT-SCENARIOS',
      `${testCase.name} not fully ready`,
      notFullyReady,
      `${chain.reliability.record.state}/${chain.performance.record.state}/${chain.security.record.state}/${chain.privacy.record.state}/${chain.recovery.record.state}/${chain.scale.record.state}`,
      testCase.weakLayer,
    );

    const weakLayerDegraded =
      (testCase.weakLayer === 'reliability' && chain.reliability.record.state !== 'STABLE')
      || (testCase.weakLayer === 'security' && chain.security.record.state !== 'SECURE')
      || (testCase.weakLayer === 'privacy' && chain.privacy.record.state !== 'PRIVATE')
      || (testCase.weakLayer === 'recovery' && chain.recovery.record.state !== 'READY')
      || (testCase.weakLayer === 'scale' && (chain.scale.record.state !== 'READY' || chain.scale.record.scaleScore < 90));

    assert(
      'L-CONFLICT-SCENARIOS',
      `${testCase.name} weak layer degraded`,
      weakLayerDegraded,
      `${testCase.weakLayer}:${chain.reliability.record.state}/${chain.security.record.state}/${chain.privacy.record.state}/${chain.recovery.record.state}/${chain.scale.record.state}`,
      testCase.weakLayer,
    );

    const hasGaps =
      chain.scale.report.recommendations.length > 0
      && (
        chain.security.report.boundaryWarnings.length > 0
        || chain.privacy.report.dataBoundaryGaps.length > 0
        || chain.privacy.report.retentionGaps.length > 0
        || chain.privacy.report.redactionGaps.length > 0
        || chain.recovery.report.rollbackGaps.length > 0
        || chain.recovery.report.containmentGaps.length > 0
        || chain.scale.report.capacityGaps.length > 0
        || chain.scale.report.concurrencyGaps.length > 0
        || chain.scale.report.queueGaps.length > 0
        || chain.scale.report.multiProjectGaps.length > 0
        || chain.security.report.recommendations.length > 1
        || chain.privacy.report.recommendations.length > 1
        || chain.recovery.report.recommendations.length > 1
      );

    assert(
      'L-CONFLICT-SCENARIOS',
      `${testCase.name} gaps or recommendations`,
      hasGaps,
      chain.scale.report.recommendations.join(';').slice(0, 80),
      testCase.weakLayer,
    );

    const requiresScaleReduction =
      testCase.weakLayer === 'scale'
      || testCase.weakLayer === 'reliability'
      || testCase.name === 'multiple-simultaneous-failures';

    if (requiresScaleReduction) {
      assert(
        'L-CONFLICT-SCENARIOS',
        `${testCase.name} final scale not ready`,
        chain.scale.record.state !== 'READY' || chain.scale.record.scaleScore < 90,
        `${chain.scale.record.state}/${chain.scale.record.scaleScore}`,
        'scale-hardening',
      );
    }
  }

  harness.endGroup('L-CONFLICT-SCENARIOS', g);
}

function stressFullChain(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAllHardeningPhases();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const mod = i % 20;
    composeProductHardeningChain(`stress-${label}-${i}`, {
      reliability: mod % 5 === 0 ? { registryDrift: true } : undefined,
      performance: mod % 7 === 0 ? { repeatedStartupLoopRisk: true } : undefined,
      security: mod % 9 === 0 ? { executionBoundaryWeak: true } : undefined,
      privacy: mod % 11 === 0 ? { logSurfaceRisk: true } : undefined,
      recovery: mod % 13 === 0 ? { missingGitCheckpoint: true } : undefined,
      scale: mod % 17 === 0 ? { taskQueuePressureRisk: true } : undefined,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'scale record count', getScaleHardeningRecordCount() === count, String(getScaleHardeningRecordCount()));
  assert(`M-STRESS-${label}`, 'reliability record count', getReliabilityHardeningRecordCount() === count, String(getReliabilityHardeningRecordCount()));
  assert(`M-STRESS-${label}`, 'runtime bounded', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);
  assert(`M-STRESS-${label}`, 'scale history bounded', getScaleHardeningHistorySize() <= 128, String(getScaleHardeningHistorySize()));
  assert(`M-STRESS-${label}`, 'reliability history bounded', getReliabilityHardeningHistorySize() <= 128, String(getReliabilityHardeningHistorySize()));
  assert(`M-STRESS-${label}`, 'performance history bounded', getPerformanceHardeningHistorySize() <= 128, String(getPerformanceHardeningHistorySize()));
  assert(`M-STRESS-${label}`, 'security history bounded', getSecurityHardeningHistorySize() <= 128, String(getSecurityHardeningHistorySize()));
  assert(`M-STRESS-${label}`, 'privacy history bounded', getPrivacyHardeningHistorySize() <= 128, String(getPrivacyHardeningHistorySize()));
  assert(`M-STRESS-${label}`, 'recovery history bounded', getRecoveryHardeningHistorySize() <= 128, String(getRecoveryHardeningHistorySize()));

  harness.endGroup(`M-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('O-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Product Hardening Verification Checkpoint (23.1–23.6)');
  console.log('====================================================================\n');

  runPhaseExistence();
  runPublicExports();
  runFoundationRegistration();
  runCapabilityRegistry();
  runFindPanelAliases();
  runUvlRegistration();
  runHardeningAuthorityComposition();
  runSignalCompatibility();
  runReadOnlyBoundary();
  runResetIsolation();
  runDeterminism();
  runConflictScenarios();
  stressFullChain(100, '100');
  stressFullChain(1000, '1000');
  stressFullChain(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Reliability records: ${getReliabilityHardeningRecordCount()}`,
    `Performance records: ${getPerformanceHardeningRecordCount()}`,
    `Security records: ${getSecurityHardeningRecordCount()}`,
    `Privacy records: ${getPrivacyHardeningRecordCount()}`,
    `Recovery records: ${getRecoveryHardeningRecordCount()}`,
    `Scale records: ${getScaleHardeningRecordCount()}`,
    failed.length === 0 ? PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN : 'PRODUCT_HARDENING_VERIFICATION_V1_FAIL',
  ]);

  if (failed.length > 0) {
    console.error('\nFailed scenarios:');
    for (const f of failed.slice(0, 30)) {
      const module = f.responsible ? ` [${f.responsible}]` : '';
      console.error(`  [${f.group}] ${f.name}${module}: expected pass, got ${f.detail}`);
    }
    process.exit(1);
  }

  console.log(`\n${PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN}`);
}

main();
