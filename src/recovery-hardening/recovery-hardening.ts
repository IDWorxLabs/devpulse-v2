/**
 * Recovery Hardening — orchestration and read-only integrations.
 * Hardens DevPulse recovery visibility. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listRecoveryHardeningUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2UnifiedVerificationLabRuntime } from '../unified-verification-lab/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2ReliabilityHardening } from '../reliability-hardening/index.js';
import { getDevPulseV2PerformanceHardening } from '../performance-hardening/index.js';
import { getDevPulseV2SecurityHardening } from '../security-hardening/index.js';
import { getDevPulseV2PrivacyHardening } from '../privacy-hardening/index.js';
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
  RecoveryHardeningInput,
  RecoveryHardeningRecord,
  RecoveryHardeningResult,
  RecoveryHardeningRuntimeReport,
} from './recovery-hardening-types.js';
import {
  RECOVERY_HARDENING_OWNER_MODULE,
  RECOVERY_HARDENING_PASS_TOKEN,
} from './recovery-hardening-types.js';
import { analyzeRollbackReadiness, getRollbackAnalysisCount } from './rollback-readiness-analyzer.js';
import { analyzeFailureContainment, getContainmentAnalysisCount } from './failure-containment-analyzer.js';
import { analyzeResetReadiness, getResetAnalysisCount } from './reset-readiness-analyzer.js';
import { analyzeEscalationReadiness, getEscalationAnalysisCount } from './escalation-readiness-analyzer.js';
import { analyzeDisasterRecoveryReadiness, getDisasterRecoveryAnalysisCount } from './disaster-recovery-readiness-analyzer.js';
import { buildUnifiedRecoveryHardeningAuthority, getAuthorityBuildCount } from './recovery-authority-builder.js';
import { evaluateRecoveryHardening, getEvaluationCount } from './recovery-hardening-evaluator.js';
import {
  registerRecoveryHardeningRecord,
  getRecoveryHardeningRecordCount,
} from './recovery-hardening-registry.js';
import { recordRecoveryHardeningHistory } from './recovery-hardening-history.js';
import { generateRecoveryHardeningReport } from './recovery-hardening-reporting.js';
import { getRecoveryHardeningCacheStats } from './recovery-hardening-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface RecoveryHardeningSystemSnapshot {
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
  securityHardeningToken: string;
  privacyHardeningToken: string;
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

let cachedSnapshot: RecoveryHardeningSystemSnapshot | null = null;
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

function enrichInput(input: RecoveryHardeningInput, snapshot: RecoveryHardeningSystemSnapshot): RecoveryHardeningInput {
  return {
    ...input,
    reliabilityScore: input.reliabilityScore ?? 78,
    performanceScore: input.performanceScore ?? 76,
    securityScore: input.securityScore ?? 74,
    privacyScore: input.privacyScore ?? 72,
    trustScore: input.trustScore ?? (snapshot.foundationDomains > 0 ? 80 : 40),
    governanceBlocked: input.governanceBlocked ?? false,
  };
}

export function getDevPulseV2RecoveryHardening(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: RECOVERY_HARDENING_OWNER_MODULE,
    passToken: RECOVERY_HARDENING_PASS_TOKEN,
    phase: 23.5,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerRecoveryHardeningWithCentralBrain(): RecoveryHardeningSystemSnapshot {
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
    securityHardeningToken: getDevPulseV2SecurityHardening().passToken,
    privacyHardeningToken: getDevPulseV2PrivacyHardening().passToken,
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

export function registerRecoveryHardeningWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerRecoveryHardeningWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerRecoveryHardeningWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerRecoveryHardeningWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listRecoveryHardeningUvlRows().length, readOnly: true };
}

export function registerRecoveryHardeningWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerRecoveryHardeningWithUnifiedVerificationLab(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedVerificationLabRuntime().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithReliabilityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ReliabilityHardening().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithPerformanceHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PerformanceHardening().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithSecurityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SecurityHardening().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithPrivacyHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PrivacyHardening().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithAutonomousCompletion(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithCloudWorkerRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CloudRuntimeFoundation().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithExecutionAuthority(): { passToken: string; readOnly: true } {
  return { passToken: EXECUTION_PASS_TOKEN, readOnly: true };
}

export function registerRecoveryHardeningWithOperatorFeed(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2OperatorFeed().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithNotificationVault(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderInboxFoundation().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithNotificationDelivery(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2NotificationDeliveryFoundation().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerRecoveryHardeningWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerRecoveryHardeningWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function evaluateRecoveryHardeningEngine(input: RecoveryHardeningInput): RecoveryHardeningResult {
  const snapshot = registerRecoveryHardeningWithCentralBrain();
  const enriched = enrichInput(input, snapshot);

  const rollback = analyzeRollbackReadiness(enriched);
  const containment = analyzeFailureContainment(enriched);
  const reset = analyzeResetReadiness(enriched);
  const escalation = analyzeEscalationReadiness(enriched);
  const disaster = analyzeDisasterRecoveryReadiness(enriched);
  const authority = buildUnifiedRecoveryHardeningAuthority(
    input.requestId,
    rollback,
    containment,
    reset,
    escalation,
    disaster,
    enriched,
  );
  const evaluation = evaluateRecoveryHardening(authority);

  recordCounter += 1;
  const record: RecoveryHardeningRecord = {
    recoveryId: `recovery-hardening-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    riskLevel: evaluation.riskLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    recoveryScore: evaluation.recoveryScore,
    rollbackReadinessScore: evaluation.rollbackReadinessScore,
    containmentScore: evaluation.containmentScore,
    escalationReadinessScore: evaluation.escalationReadinessScore,
    generatedAt: Date.now(),
  };

  registerRecoveryHardeningRecord(record);
  recordRecoveryHardeningHistory(record);

  const missingSignals: string[] = [];

  const report = generateRecoveryHardeningReport(
    record,
    evaluation,
    rollback.rollbackGaps,
    containment.containmentGaps,
    reset.resetGaps,
    escalation.escalationGaps,
    disaster.disasterRecoveryGaps,
    missingSignals,
  );

  return { record, report };
}

export function getRecoveryHardeningRuntimeReport(): RecoveryHardeningRuntimeReport {
  const cache = getRecoveryHardeningCacheStats();
  return {
    rollbackAnalysisCount: getRollbackAnalysisCount(),
    containmentAnalysisCount: getContainmentAnalysisCount(),
    resetAnalysisCount: getResetAnalysisCount(),
    escalationAnalysisCount: getEscalationAnalysisCount(),
    disasterRecoveryAnalysisCount: getDisasterRecoveryAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getRecoveryHardeningRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetRecoveryHardeningOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
