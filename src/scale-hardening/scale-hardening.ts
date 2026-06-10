/**
 * Scale Hardening — orchestration and read-only integrations.
 * Hardens DevPulse scale visibility. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listScaleHardeningUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2UnifiedVerificationLabRuntime } from '../unified-verification-lab/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2ReliabilityHardening } from '../reliability-hardening/index.js';
import { getDevPulseV2PerformanceHardening } from '../performance-hardening/index.js';
import { getDevPulseV2SecurityHardening } from '../security-hardening/index.js';
import { getDevPulseV2PrivacyHardening } from '../privacy-hardening/index.js';
import { getDevPulseV2RecoveryHardening } from '../recovery-hardening/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import { DevPulseV2ProjectVaultIntelligence } from '../project-vault-intelligence/index.js';
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
  ScaleHardeningInput,
  ScaleHardeningRecord,
  ScaleHardeningResult,
  ScaleHardeningRuntimeReport,
} from './scale-hardening-types.js';
import {
  SCALE_HARDENING_OWNER_MODULE,
  SCALE_HARDENING_PASS_TOKEN,
} from './scale-hardening-types.js';
import { analyzeCapacityReadiness, getCapacityAnalysisCount } from './capacity-readiness-analyzer.js';
import { analyzeConcurrencyRisk, getConcurrencyAnalysisCount } from './concurrency-risk-analyzer.js';
import { analyzeCloudUsageReadiness, getCloudUsageAnalysisCount } from './cloud-usage-readiness-analyzer.js';
import { analyzeQueueLoad, getQueueLoadAnalysisCount } from './queue-load-analyzer.js';
import { analyzeMultiProjectScale, getMultiProjectAnalysisCount } from './multi-project-scale-analyzer.js';
import { buildUnifiedScaleHardeningAuthority, getAuthorityBuildCount } from './scale-authority-builder.js';
import { evaluateScaleHardening, getEvaluationCount } from './scale-hardening-evaluator.js';
import {
  registerScaleHardeningRecord,
  getScaleHardeningRecordCount,
} from './scale-hardening-registry.js';
import { recordScaleHardeningHistory } from './scale-hardening-history.js';
import { generateScaleHardeningReport } from './scale-hardening-reporting.js';
import { getScaleHardeningCacheStats } from './scale-hardening-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface ScaleHardeningSystemSnapshot {
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
  recoveryHardeningToken: string;
  autonomousVerificationToken: string;
  autonomousCompletionToken: string;
  multiProjectVerificationToken: string;
  multiProjectMonitoringToken: string;
  projectVaultToken: string;
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

let cachedSnapshot: ScaleHardeningSystemSnapshot | null = null;
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

function enrichInput(input: ScaleHardeningInput, snapshot: ScaleHardeningSystemSnapshot): ScaleHardeningInput {
  return {
    ...input,
    reliabilityScore: input.reliabilityScore ?? 78,
    performanceScore: input.performanceScore ?? 76,
    securityScore: input.securityScore ?? 74,
    privacyScore: input.privacyScore ?? 72,
    recoveryScore: input.recoveryScore ?? 70,
    trustScore: input.trustScore ?? (snapshot.foundationDomains > 0 ? 80 : 40),
    governanceBlocked: input.governanceBlocked ?? false,
  };
}

export function getDevPulseV2ScaleHardening(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: SCALE_HARDENING_OWNER_MODULE,
    passToken: SCALE_HARDENING_PASS_TOKEN,
    phase: 23.6,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerScaleHardeningWithCentralBrain(): ScaleHardeningSystemSnapshot {
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
    recoveryHardeningToken: getDevPulseV2RecoveryHardening().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    autonomousCompletionToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    projectVaultToken: DevPulseV2ProjectVaultIntelligence.passToken,
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

export function registerScaleHardeningWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerScaleHardeningWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerScaleHardeningWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerScaleHardeningWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listScaleHardeningUvlRows().length, readOnly: true };
}

export function registerScaleHardeningWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerScaleHardeningWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerScaleHardeningWithUnifiedVerificationLab(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedVerificationLabRuntime().passToken, readOnly: true };
}

export function registerScaleHardeningWithReliabilityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ReliabilityHardening().passToken, readOnly: true };
}

export function registerScaleHardeningWithPerformanceHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PerformanceHardening().passToken, readOnly: true };
}

export function registerScaleHardeningWithSecurityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SecurityHardening().passToken, readOnly: true };
}

export function registerScaleHardeningWithPrivacyHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PrivacyHardening().passToken, readOnly: true };
}

export function registerScaleHardeningWithRecoveryHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2RecoveryHardening().passToken, readOnly: true };
}

export function registerScaleHardeningWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerScaleHardeningWithAutonomousCompletion(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerScaleHardeningWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerScaleHardeningWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerScaleHardeningWithProjectVault(): { passToken: string; readOnly: true } {
  return { passToken: DevPulseV2ProjectVaultIntelligence.passToken, readOnly: true };
}

export function registerScaleHardeningWithCloudWorkerRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CloudRuntimeFoundation().passToken, readOnly: true };
}

export function registerScaleHardeningWithExecutionAuthority(): { passToken: string; readOnly: true } {
  return { passToken: EXECUTION_PASS_TOKEN, readOnly: true };
}

export function registerScaleHardeningWithOperatorFeed(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2OperatorFeed().passToken, readOnly: true };
}

export function registerScaleHardeningWithNotificationVault(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderInboxFoundation().passToken, readOnly: true };
}

export function registerScaleHardeningWithNotificationDelivery(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2NotificationDeliveryFoundation().passToken, readOnly: true };
}

export function registerScaleHardeningWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerScaleHardeningWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerScaleHardeningWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerScaleHardeningWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function evaluateScaleHardeningEngine(input: ScaleHardeningInput): ScaleHardeningResult {
  const snapshot = registerScaleHardeningWithCentralBrain();
  const enriched = enrichInput(input, snapshot);

  const capacity = analyzeCapacityReadiness(enriched);
  const concurrency = analyzeConcurrencyRisk(enriched);
  const cloudUsage = analyzeCloudUsageReadiness(enriched);
  const queueLoad = analyzeQueueLoad(enriched);
  const multiProject = analyzeMultiProjectScale(enriched);
  const authority = buildUnifiedScaleHardeningAuthority(
    input.requestId,
    capacity,
    concurrency,
    cloudUsage,
    queueLoad,
    multiProject,
    enriched,
  );
  const evaluation = evaluateScaleHardening(authority);

  recordCounter += 1;
  const record: ScaleHardeningRecord = {
    scaleId: `scale-hardening-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    riskLevel: evaluation.riskLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    scaleScore: evaluation.scaleScore,
    capacityScore: evaluation.capacityScore,
    concurrencyScore: evaluation.concurrencyScore,
    cloudUsageReadinessScore: evaluation.cloudUsageReadinessScore,
    generatedAt: Date.now(),
  };

  registerScaleHardeningRecord(record);
  recordScaleHardeningHistory(record);

  const missingSignals: string[] = [];

  const report = generateScaleHardeningReport(
    record,
    evaluation,
    capacity.capacityGaps,
    concurrency.concurrencyGaps,
    cloudUsage.cloudUsageGaps,
    queueLoad.queueGaps,
    multiProject.multiProjectGaps,
    missingSignals,
  );

  return { record, report };
}

export function getScaleHardeningRuntimeReport(): ScaleHardeningRuntimeReport {
  const cache = getScaleHardeningCacheStats();
  return {
    capacityAnalysisCount: getCapacityAnalysisCount(),
    concurrencyAnalysisCount: getConcurrencyAnalysisCount(),
    cloudUsageAnalysisCount: getCloudUsageAnalysisCount(),
    queueLoadAnalysisCount: getQueueLoadAnalysisCount(),
    multiProjectAnalysisCount: getMultiProjectAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getScaleHardeningRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetScaleHardeningOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
