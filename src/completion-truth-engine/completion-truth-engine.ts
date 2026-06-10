/**
 * Completion Truth Engine — orchestration and read-only integrations.
 * Determines whether work is genuinely complete. No execution, mutations, or deployment.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/index.js';
import { getDevPulseV2UnifiedTrustRuntime } from '../unified-trust-runtime/index.js';
import { getDevPulseV2EvidenceIntelligence } from '../evidence-intelligence/index.js';
import { getDevPulseV2RealityVerificationExpansion } from '../reality-verification-expansion/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { listCompletionTruthEngineUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import type {
  CompletionTruthInput,
  CompletionTruthRecord,
  CompletionTruthResult,
  CompletionTruthRuntimeReport,
} from './completion-truth-types.js';
import {
  COMPLETION_TRUTH_ENGINE_OWNER_MODULE,
  COMPLETION_TRUTH_ENGINE_PASS_TOKEN,
} from './completion-truth-types.js';
import { analyzeCompletionClaims, getClaimAnalysisCount } from './completion-claim-analyzer.js';
import { validateCompletionEvidence, getEvidenceValidationCount } from './completion-evidence-validator.js';
import { validateCompletionReality, getRealityValidationCount } from './completion-reality-validator.js';
import { detectFalseCompletion, getFalseCompletionDetectionCount } from './false-completion-detector.js';
import { analyzeCompletionConsistency, getConsistencyAnalysisCount } from './completion-consistency-analyzer.js';
import { analyzeCompletionGaps, getGapAnalysisCount } from './completion-gap-analyzer.js';
import { buildUnifiedCompletionTruthAuthority, getAuthorityBuildCount } from './completion-truth-authority-builder.js';
import { evaluateCompletionTruth, getEvaluationCount } from './completion-truth-evaluator.js';
import {
  registerCompletionTruthRecord,
  getCompletionTruthRecordCount,
} from './completion-truth-registry.js';
import { recordCompletionTruthHistory } from './completion-truth-history.js';
import { generateCompletionTruthReport } from './completion-truth-reporting.js';
import { getCompletionTruthCacheStats } from './completion-truth-cache.js';

export interface CompletionTruthEngineSystemSnapshot {
  centralBrainSystems: number;
  trustEngineScore: number | null;
  unifiedTrustRuntimeToken: string;
  evidenceIntelligenceToken: string;
  realityVerificationToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectVerificationToken: string;
  multiProjectMonitoringToken: string;
  selfEvolutionGovernanceToken: string;
  world2Token: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: CompletionTruthEngineSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

export function getDevPulseV2CompletionTruthEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: COMPLETION_TRUTH_ENGINE_OWNER_MODULE,
    passToken: COMPLETION_TRUTH_ENGINE_PASS_TOKEN,
    phase: 22.4,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerCompletionTruthEngineWithCentralBrain(): CompletionTruthEngineSystemSnapshot {
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
    realityVerificationToken: getDevPulseV2RealityVerificationExpansion().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    uvlRows: listCompletionTruthEngineUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerCompletionTruthEngineWithUnifiedTrustRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustRuntime().passToken, readOnly: true };
}

export function registerCompletionTruthEngineWithEvidenceIntelligence(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2EvidenceIntelligence().passToken, readOnly: true };
}

export function registerCompletionTruthEngineWithRealityVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2RealityVerificationExpansion().passToken, readOnly: true };
}

export function registerCompletionTruthEngineWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerCompletionTruthEngineWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerCompletionTruthEngineWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerCompletionTruthEngineWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerCompletionTruthEngineWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerCompletionTruthEngineWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerCompletionTruthEngineWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerCompletionTruthEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listCompletionTruthEngineUvlRows().length, readOnly: true };
}

export function evaluateCompletionTruthEngine(input: CompletionTruthInput): CompletionTruthResult {
  registerCompletionTruthEngineWithCentralBrain();

  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';

  const claimAnalyses = analyzeCompletionClaims(input.completionClaims);
  const evidenceValidation = validateCompletionEvidence(input.evidenceSignals);
  const realityValidation = validateCompletionReality(input.completionClaims, input.realitySignals);
  const consistency = analyzeCompletionConsistency(claimAnalyses, evidenceValidation, realityValidation);
  const gaps = analyzeCompletionGaps(
    input.completionClaims,
    evidenceValidation,
    realityValidation,
    input.realitySignals,
  );
  const falseCompletion = detectFalseCompletion(
    input.completionClaims,
    claimAnalyses,
    evidenceValidation,
    realityValidation,
  );

  const authority = buildUnifiedCompletionTruthAuthority(
    input.requestId,
    claimAnalyses,
    evidenceValidation,
    realityValidation,
    consistency,
    falseCompletion,
    gaps,
  );

  const evaluation = evaluateCompletionTruth(authority, consistency, falseCompletion);

  recordCounter += 1;
  const blockers = input.completionClaims
    .filter((c) => (c.blockersRemaining ?? 0) > 0)
    .map((c) => `Blockers remaining for ${c.claimType}: ${c.blockersRemaining}`);

  const record: CompletionTruthRecord = {
    recordId: `completion-truth-${recordCounter}`,
    authority,
    evaluation,
    claimAnalyses,
    evidenceValidation,
    realityValidation,
    falseCompletion,
    consistency,
    gaps,
    createdAt: Date.now(),
  };

  registerCompletionTruthRecord(record, projectId, workspaceId);
  recordCompletionTruthHistory(record);
  const report = generateCompletionTruthReport(record, evaluation, blockers);

  return { record, report };
}

export function getCompletionTruthEngineRuntimeReport(): CompletionTruthRuntimeReport {
  const cache = getCompletionTruthCacheStats();
  return {
    claimAnalysisCount: getClaimAnalysisCount(),
    evidenceValidationCount: getEvidenceValidationCount(),
    realityValidationCount: getRealityValidationCount(),
    falseCompletionDetectionCount: getFalseCompletionDetectionCount(),
    consistencyAnalysisCount: getConsistencyAnalysisCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getCompletionTruthRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetCompletionTruthEngineForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
