/**
 * Reality Verification Expansion — orchestration and read-only integrations.
 * Validates claims against evidence, trust, and observable reality. No execution.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/index.js';
import { getDevPulseV2UnifiedTrustRuntime } from '../unified-trust-runtime/index.js';
import { getDevPulseV2EvidenceIntelligence } from '../evidence-intelligence/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { listRealityVerificationExpansionUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import type {
  RealityVerificationInput,
  RealityVerificationRecord,
  RealityVerificationResult,
  RealityVerificationRuntimeReport,
} from './reality-verification-types.js';
import {
  REALITY_VERIFICATION_EXPANSION_OWNER_MODULE,
  REALITY_VERIFICATION_EXPANSION_PASS_TOKEN,
} from './reality-verification-types.js';
import { listRealitySources, getRealitySourceCount } from './reality-source-registry.js';
import { registerRealityRecords, getRealityRecordCount } from './reality-record-registry.js';
import { validateClaims, getClaimValidationCount } from './claim-validator.js';
import { matchRecordsToEvidence, getMatchingCount } from './evidence-reality-matcher.js';
import { getConsistencyAnalysisCount } from './reality-consistency-analyzer.js';
import { getConflictDetectionCount } from './reality-conflict-detector.js';
import { getGapAnalysisCount } from './reality-gap-analyzer.js';
import { buildUnifiedRealityAuthority, getAuthorityBuildCount } from './reality-authority-builder.js';
import { evaluateRealityVerification, getEvaluationCount } from './reality-verification-evaluator.js';
import { recordRealityVerificationHistory } from './reality-verification-history.js';
import { generateRealityVerificationReport } from './reality-verification-reporting.js';
import { getRealityVerificationCacheStats } from './reality-verification-cache.js';

export interface RealityVerificationExpansionSystemSnapshot {
  centralBrainSystems: number;
  trustEngineScore: number | null;
  unifiedTrustRuntimeToken: string;
  evidenceIntelligenceToken: string;
  realitySourceCount: number;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectVerificationToken: string;
  multiProjectMonitoringToken: string;
  selfEvolutionGovernanceToken: string;
  world2Token: string;
  uvlRows: number;
  registeredAt: number;
}

const intelligenceRecords = new Map<string, RealityVerificationRecord>();

let cachedSnapshot: RealityVerificationExpansionSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

export function getDevPulseV2RealityVerificationExpansion(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: REALITY_VERIFICATION_EXPANSION_OWNER_MODULE,
    passToken: REALITY_VERIFICATION_EXPANSION_PASS_TOKEN,
    phase: 22.3,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerRealityVerificationExpansionWithCentralBrain(): RealityVerificationExpansionSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const trustResult = getDevPulseV2TrustEngineAuthority().getLastResult();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    trustEngineScore: trustResult?.trustScore ?? null,
    unifiedTrustRuntimeToken: getDevPulseV2UnifiedTrustRuntime().passToken,
    evidenceIntelligenceToken: getDevPulseV2EvidenceIntelligence().passToken,
    realitySourceCount: getRealitySourceCount(),
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    uvlRows: listRealityVerificationExpansionUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerRealityVerificationExpansionWithEvidenceIntelligence(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2EvidenceIntelligence().passToken, readOnly: true };
}

export function registerRealityVerificationExpansionWithUnifiedTrustRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustRuntime().passToken, readOnly: true };
}

export function registerRealityVerificationExpansionWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerRealityVerificationExpansionWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerRealityVerificationExpansionWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerRealityVerificationExpansionWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerRealityVerificationExpansionWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerRealityVerificationExpansionWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerRealityVerificationExpansionWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerRealityVerificationExpansionWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listRealityVerificationExpansionUvlRows().length, readOnly: true };
}

export function getRealityVerificationRecord(recordId: string): RealityVerificationRecord | undefined {
  return intelligenceRecords.get(recordId);
}

export function listRealityVerificationRecords(): RealityVerificationRecord[] {
  return [...intelligenceRecords.values()];
}

export function getRealityVerificationRecordCount(): number {
  return intelligenceRecords.size;
}

export function runRealityVerificationExpansion(input: RealityVerificationInput): RealityVerificationResult {
  registerRealityVerificationExpansionWithCentralBrain();
  listRealitySources();

  const records = registerRealityRecords(input.claims, {
    project: input.project,
    workspace: input.workspace,
  });

  const evidence = input.evidence ?? [];
  matchRecordsToEvidence(records, evidence);

  const claimValidations = validateClaims(input.claims, evidence);
  const { authority, consistency, conflicts, gaps } = buildUnifiedRealityAuthority(
    input.requestId,
    records,
    claimValidations,
  );
  const evaluation = evaluateRealityVerification(authority, conflicts);

  recordCounter += 1;
  const record: RealityVerificationRecord = {
    recordId: `reality-verification-${recordCounter}`,
    authority,
    evaluation,
    claimValidations,
    conflicts,
    gaps,
    createdAt: Date.now(),
  };

  intelligenceRecords.set(record.recordId, record);
  recordRealityVerificationHistory(record);
  const report = generateRealityVerificationReport(
    record,
    consistency,
    evaluation,
    claimValidations,
    conflicts,
    gaps,
  );

  return { record, report };
}

export function getRealityVerificationExpansionRuntimeReport(): RealityVerificationRuntimeReport {
  const cache = getRealityVerificationCacheStats();
  return {
    claimValidationCount: getClaimValidationCount(),
    matchingCount: getMatchingCount(),
    consistencyAnalysisCount: getConsistencyAnalysisCount(),
    conflictDetectionCount: getConflictDetectionCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getRealityVerificationRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    bootstrapReuseCount,
  };
}

export function resetRealityVerificationExpansionForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
  intelligenceRecords.clear();
}
