/**
 * Security Hardening — orchestration and read-only integrations.
 * Hardens DevPulse security visibility. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listSecurityHardeningUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2UnifiedVerificationLabRuntime } from '../unified-verification-lab/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2ReliabilityHardening } from '../reliability-hardening/index.js';
import { getDevPulseV2PerformanceHardening } from '../performance-hardening/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2CloudRuntimeFoundation } from '../cloud-runtime/index.js';
import { EXECUTION_PASS_TOKEN } from '../execution-authority/index.js';
import { getDevPulseV2OperatorFeed } from '../operator-feed/index.js';
import { getDevPulseV2FounderInboxFoundation } from '../founder-inbox/index.js';
import { getDevPulseV2NotificationDeliveryFoundation } from '../notification-delivery/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { getDevPulseV2MobileCommandRuntimeFoundation } from '../mobile-command-runtime/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import type {
  SecurityHardeningInput,
  SecurityHardeningRecord,
  SecurityHardeningResult,
  SecurityHardeningRuntimeReport,
} from './security-hardening-types.js';
import {
  SECURITY_HARDENING_OWNER_MODULE,
  SECURITY_HARDENING_PASS_TOKEN,
} from './security-hardening-types.js';
import { analyzeSecurityBoundaries, getBoundaryAnalysisCount } from './security-boundary-analyzer.js';
import { analyzeSecretExposure, getExposureAnalysisCount } from './secret-exposure-analyzer.js';
import { detectUnsafeCapabilities, getUnsafeCapabilityDetectionCount } from './unsafe-capability-detector.js';
import { analyzeAccessControlReadiness, getAccessControlAnalysisCount } from './access-control-readiness-analyzer.js';
import { analyzeWorkspaceIsolation, getIsolationAnalysisCount } from './workspace-isolation-analyzer.js';
import { buildUnifiedSecurityHardeningAuthority, getAuthorityBuildCount } from './security-authority-builder.js';
import { evaluateSecurityHardening, getEvaluationCount } from './security-hardening-evaluator.js';
import {
  registerSecurityHardeningRecord,
  getSecurityHardeningRecordCount,
} from './security-hardening-registry.js';
import { recordSecurityHardeningHistory } from './security-hardening-history.js';
import { generateSecurityHardeningReport } from './security-hardening-reporting.js';
import { getSecurityHardeningCacheStats } from './security-hardening-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface SecurityHardeningSystemSnapshot {
  centralBrainSystems: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  unifiedTrustScoreToken: string;
  trustEngineCheckpointToken: string;
  uvlRuntimeToken: string;
  reliabilityHardeningToken: string;
  performanceHardeningToken: string;
  autonomousVerificationToken: string;
  autonomousCompletionToken: string;
  cloudWorkerRuntimeToken: string;
  executionAuthorityToken: string;
  operatorFeedToken: string;
  founderInboxToken: string;
  notificationDeliveryToken: string;
  world2Token: string;
  mobileCommandToken: string;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  registeredAt: number;
}

let cachedSnapshot: SecurityHardeningSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

function countValidationScripts(): number {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts?: Record<string, string> };
    return Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')).length;
  } catch {
    return 0;
  }
}

function enrichInput(input: SecurityHardeningInput, snapshot: SecurityHardeningSystemSnapshot): SecurityHardeningInput {
  return {
    ...input,
    futureUserAccountBoundaryMissing: input.futureUserAccountBoundaryMissing ?? true,
    futurePackagePlanBoundaryMissing: input.futurePackagePlanBoundaryMissing ?? true,
    missingUserIdentityBoundary: input.missingUserIdentityBoundary ?? true,
    missingPackageEntitlementModel: input.missingPackageEntitlementModel ?? true,
    futureUserTenantBoundaryMissing: input.futureUserTenantBoundaryMissing ?? true,
    reliabilityScore: input.reliabilityScore ?? 78,
    performanceScore: input.performanceScore ?? 76,
    trustScore: input.trustScore ?? (snapshot.foundationDomains > 0 ? 80 : 40),
    governanceBlocked: input.governanceBlocked ?? false,
  };
}

export function getDevPulseV2SecurityHardening(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: SECURITY_HARDENING_OWNER_MODULE,
    passToken: SECURITY_HARDENING_PASS_TOKEN,
    phase: 23.3,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerSecurityHardeningWithCentralBrain(): SecurityHardeningSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    validationScripts: countValidationScripts(),
    unifiedTrustScoreToken: getDevPulseV2UnifiedTrustScore().passToken,
    trustEngineCheckpointToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN,
    uvlRuntimeToken: getDevPulseV2UnifiedVerificationLabRuntime().passToken,
    reliabilityHardeningToken: getDevPulseV2ReliabilityHardening().passToken,
    performanceHardeningToken: getDevPulseV2PerformanceHardening().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    autonomousCompletionToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    cloudWorkerRuntimeToken: getDevPulseV2CloudRuntimeFoundation().passToken,
    executionAuthorityToken: EXECUTION_PASS_TOKEN,
    operatorFeedToken: getDevPulseV2OperatorFeed().passToken,
    founderInboxToken: getDevPulseV2FounderInboxFoundation().passToken,
    notificationDeliveryToken: getDevPulseV2NotificationDeliveryFoundation().passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    mobileCommandToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerSecurityHardeningWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerSecurityHardeningWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerSecurityHardeningWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerSecurityHardeningWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listSecurityHardeningUvlRows().length, readOnly: true };
}

export function registerSecurityHardeningWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerSecurityHardeningWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerSecurityHardeningWithUnifiedVerificationLab(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedVerificationLabRuntime().passToken, readOnly: true };
}

export function registerSecurityHardeningWithReliabilityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ReliabilityHardening().passToken, readOnly: true };
}

export function registerSecurityHardeningWithPerformanceHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PerformanceHardening().passToken, readOnly: true };
}

export function registerSecurityHardeningWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerSecurityHardeningWithAutonomousCompletion(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerSecurityHardeningWithCloudWorkerRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CloudRuntimeFoundation().passToken, readOnly: true };
}

export function registerSecurityHardeningWithExecutionAuthority(): { passToken: string; readOnly: true } {
  return { passToken: EXECUTION_PASS_TOKEN, readOnly: true };
}

export function registerSecurityHardeningWithOperatorFeed(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2OperatorFeed().passToken, readOnly: true };
}

export function registerSecurityHardeningWithNotificationVault(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderInboxFoundation().passToken, readOnly: true };
}

export function registerSecurityHardeningWithNotificationDelivery(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2NotificationDeliveryFoundation().passToken, readOnly: true };
}

export function registerSecurityHardeningWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerSecurityHardeningWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerSecurityHardeningWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerSecurityHardeningWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function evaluateSecurityHardeningEngine(input: SecurityHardeningInput): SecurityHardeningResult {
  const snapshot = registerSecurityHardeningWithCentralBrain();
  const enriched = enrichInput(input, snapshot);

  const boundaries = analyzeSecurityBoundaries(enriched);
  const exposure = analyzeSecretExposure(enriched);
  const unsafe = detectUnsafeCapabilities(enriched);
  const accessControl = analyzeAccessControlReadiness(enriched);
  const isolation = analyzeWorkspaceIsolation(enriched);
  const authority = buildUnifiedSecurityHardeningAuthority(
    input.requestId,
    boundaries,
    exposure,
    unsafe,
    accessControl,
    isolation,
    enriched,
  );
  const evaluation = evaluateSecurityHardening(authority);

  recordCounter += 1;
  const record: SecurityHardeningRecord = {
    securityId: `security-hardening-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    riskLevel: evaluation.riskLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    securityScore: evaluation.securityScore,
    boundaryScore: evaluation.boundaryScore,
    isolationScore: evaluation.isolationScore,
    exposureScore: evaluation.exposureScore,
    generatedAt: Date.now(),
  };

  registerSecurityHardeningRecord(record);
  recordSecurityHardeningHistory(record);

  const missingSignals = [
    ...boundaries.missingBoundaries,
    ...isolation.isolationGaps,
  ];

  const report = generateSecurityHardeningReport(
    record,
    evaluation,
    unsafe.unsafeCapabilities,
    boundaries.boundaryWarnings,
    isolation.isolationWarnings,
    exposure.redactedFindings,
    accessControl.accessControlGaps,
    missingSignals,
  );

  return { record, report };
}

export function getSecurityHardeningRuntimeReport(): SecurityHardeningRuntimeReport {
  const cache = getSecurityHardeningCacheStats();
  return {
    boundaryAnalysisCount: getBoundaryAnalysisCount(),
    exposureAnalysisCount: getExposureAnalysisCount(),
    unsafeCapabilityDetectionCount: getUnsafeCapabilityDetectionCount(),
    accessControlAnalysisCount: getAccessControlAnalysisCount(),
    isolationAnalysisCount: getIsolationAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getSecurityHardeningRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetSecurityHardeningOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
