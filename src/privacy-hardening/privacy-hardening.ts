/**
 * Privacy Hardening — orchestration and read-only integrations.
 * Hardens DevPulse privacy visibility. Read-only — no execution, mutations, or legal claims.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listPrivacyHardeningUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2UnifiedVerificationLabRuntime } from '../unified-verification-lab/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2ReliabilityHardening } from '../reliability-hardening/index.js';
import { getDevPulseV2PerformanceHardening } from '../performance-hardening/index.js';
import { getDevPulseV2SecurityHardening } from '../security-hardening/index.js';
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
  PrivacyHardeningInput,
  PrivacyHardeningRecord,
  PrivacyHardeningResult,
  PrivacyHardeningRuntimeReport,
} from './privacy-hardening-types.js';
import {
  PRIVACY_HARDENING_OWNER_MODULE,
  PRIVACY_HARDENING_PASS_TOKEN,
} from './privacy-hardening-types.js';
import { analyzePersonalDataSurfaces, getPersonalDataSurfaceAnalysisCount } from './personal-data-surface-analyzer.js';
import { analyzeProjectDataBoundaries, getDataBoundaryAnalysisCount } from './project-data-boundary-analyzer.js';
import { analyzeRetentionRisk, getRetentionAnalysisCount } from './retention-risk-analyzer.js';
import { analyzeDisclosureRisk, getDisclosureAnalysisCount } from './disclosure-risk-analyzer.js';
import { analyzeRedactionReadiness, getRedactionReadinessAnalysisCount } from './privacy-redaction-readiness-analyzer.js';
import { analyzeComplianceReadiness, getComplianceReadinessAnalysisCount } from './privacy-compliance-readiness-analyzer.js';
import { buildUnifiedPrivacyHardeningAuthority, getAuthorityBuildCount } from './privacy-authority-builder.js';
import { evaluatePrivacyHardening, getEvaluationCount } from './privacy-hardening-evaluator.js';
import {
  registerPrivacyHardeningRecord,
  getPrivacyHardeningRecordCount,
} from './privacy-hardening-registry.js';
import { recordPrivacyHardeningHistory } from './privacy-hardening-history.js';
import { generatePrivacyHardeningReport } from './privacy-hardening-reporting.js';
import { getPrivacyHardeningCacheStats } from './privacy-hardening-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface PrivacyHardeningSystemSnapshot {
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

let cachedSnapshot: PrivacyHardeningSystemSnapshot | null = null;
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

function enrichInput(input: PrivacyHardeningInput, snapshot: PrivacyHardeningSystemSnapshot): PrivacyHardeningInput {
  return {
    ...input,
    futureTenantDataBoundaryMissing: input.futureTenantDataBoundaryMissing ?? true,
    futureOrganizationBoundaryMissing: input.futureOrganizationBoundaryMissing ?? true,
    missingPrivacyPolicyReadiness: input.missingPrivacyPolicyReadiness ?? true,
    missingUserConsentModel: input.missingUserConsentModel ?? true,
    missingAppStorePrivacyLabels: input.missingAppStorePrivacyLabels ?? true,
    reliabilityScore: input.reliabilityScore ?? 78,
    performanceScore: input.performanceScore ?? 76,
    securityScore: input.securityScore ?? 74,
    trustScore: input.trustScore ?? (snapshot.foundationDomains > 0 ? 80 : 40),
    governanceBlocked: input.governanceBlocked ?? false,
  };
}

export function getDevPulseV2PrivacyHardening(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: PRIVACY_HARDENING_OWNER_MODULE,
    passToken: PRIVACY_HARDENING_PASS_TOKEN,
    phase: 23.4,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerPrivacyHardeningWithCentralBrain(): PrivacyHardeningSystemSnapshot {
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

export function registerPrivacyHardeningWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerPrivacyHardeningWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerPrivacyHardeningWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerPrivacyHardeningWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listPrivacyHardeningUvlRows().length, readOnly: true };
}

export function registerPrivacyHardeningWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerPrivacyHardeningWithUnifiedVerificationLab(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedVerificationLabRuntime().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithReliabilityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ReliabilityHardening().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithPerformanceHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PerformanceHardening().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithSecurityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SecurityHardening().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithCloudWorkerRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CloudRuntimeFoundation().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithExecutionAuthority(): { passToken: string; readOnly: true } {
  return { passToken: EXECUTION_PASS_TOKEN, readOnly: true };
}

export function registerPrivacyHardeningWithOperatorFeed(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2OperatorFeed().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithNotificationVault(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderInboxFoundation().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithNotificationDelivery(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2NotificationDeliveryFoundation().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerPrivacyHardeningWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerPrivacyHardeningWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function evaluatePrivacyHardeningEngine(input: PrivacyHardeningInput): PrivacyHardeningResult {
  const snapshot = registerPrivacyHardeningWithCentralBrain();
  const enriched = enrichInput(input, snapshot);

  const surfaces = analyzePersonalDataSurfaces(enriched);
  const boundaries = analyzeProjectDataBoundaries(enriched);
  const retention = analyzeRetentionRisk(enriched);
  const disclosure = analyzeDisclosureRisk(enriched);
  const redaction = analyzeRedactionReadiness(enriched);
  const compliance = analyzeComplianceReadiness(enriched);
  const authority = buildUnifiedPrivacyHardeningAuthority(
    input.requestId,
    surfaces,
    boundaries,
    retention,
    disclosure,
    redaction,
    compliance,
    enriched,
  );
  const evaluation = evaluatePrivacyHardening(authority);

  recordCounter += 1;
  const record: PrivacyHardeningRecord = {
    privacyId: `privacy-hardening-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    riskLevel: evaluation.riskLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    privacyScore: evaluation.privacyScore,
    dataBoundaryScore: evaluation.dataBoundaryScore,
    retentionScore: evaluation.retentionScore,
    disclosureRiskScore: evaluation.disclosureRiskScore,
    generatedAt: Date.now(),
  };

  registerPrivacyHardeningRecord(record);
  recordPrivacyHardeningHistory(record);

  const missingSignals = [
    ...surfaces.missingSignals,
    ...boundaries.dataBoundaryGaps,
  ];

  const report = generatePrivacyHardeningReport(
    record,
    evaluation,
    surfaces.personalDataSurfaces,
    boundaries.dataBoundaryGaps,
    retention.retentionGaps,
    disclosure.disclosureWarnings,
    redaction.redactionGaps,
    compliance.complianceGaps,
    disclosure.redactedDisclosureFindings,
    missingSignals,
  );

  return { record, report };
}

export function getPrivacyHardeningRuntimeReport(): PrivacyHardeningRuntimeReport {
  const cache = getPrivacyHardeningCacheStats();
  return {
    personalDataSurfaceAnalysisCount: getPersonalDataSurfaceAnalysisCount(),
    dataBoundaryAnalysisCount: getDataBoundaryAnalysisCount(),
    retentionAnalysisCount: getRetentionAnalysisCount(),
    disclosureAnalysisCount: getDisclosureAnalysisCount(),
    redactionReadinessAnalysisCount: getRedactionReadinessAnalysisCount(),
    complianceReadinessAnalysisCount: getComplianceReadinessAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getPrivacyHardeningRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetPrivacyHardeningOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
