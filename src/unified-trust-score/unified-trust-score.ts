/**
 * Unified Trust Score — orchestration and read-only integrations.
 * Produces authoritative trust score. Scoring only — no execution, mutations, or deployment.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/index.js';
import { getDevPulseV2UnifiedTrustRuntime } from '../unified-trust-runtime/index.js';
import { getDevPulseV2EvidenceIntelligence } from '../evidence-intelligence/index.js';
import { getDevPulseV2RealityVerificationExpansion } from '../reality-verification-expansion/index.js';
import { getDevPulseV2CompletionTruthEngine } from '../completion-truth-engine/index.js';
import { getDevPulseV2PredictionTrustLayer } from '../prediction-trust-layer/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { listUnifiedTrustScoreUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import type {
  UnifiedTrustScoreInput,
  UnifiedTrustScoreRecord,
  UnifiedTrustScoreResult,
  UnifiedTrustScoreRuntimeReport,
} from './unified-trust-score-types.js';
import {
  UNIFIED_TRUST_SCORE_OWNER_MODULE,
  UNIFIED_TRUST_SCORE_PASS_TOKEN,
} from './unified-trust-score-types.js';
import { collectTrustScoreInputs, getInputCollectionCount } from './trust-score-input-collector.js';
import { normalizeTrustScores, getNormalizationCount } from './trust-score-normalizer.js';
import { computeTrustWeighting, getWeightingCount } from './trust-weighting-engine.js';
import { analyzeTrustScoreConsistency, getConsistencyAnalysisCount } from './trust-score-consistency-analyzer.js';
import { evaluateTrustConfidence, getConfidenceEvaluationCount } from './trust-confidence-evaluator.js';
import { buildUnifiedTrustScoreAuthority, getAuthorityBuildCount } from './trust-score-authority-builder.js';
import { evaluateUnifiedTrustScore, getEvaluationCount } from './unified-trust-score-evaluator.js';
import {
  registerUnifiedTrustScoreRecord,
  getUnifiedTrustScoreRecordCount,
} from './unified-trust-score-registry.js';
import { recordUnifiedTrustScoreHistory } from './unified-trust-score-history.js';
import { generateUnifiedTrustScoreReport } from './unified-trust-score-reporting.js';
import { getUnifiedTrustScoreCacheStats } from './unified-trust-score-cache.js';

export interface UnifiedTrustScoreSystemSnapshot {
  centralBrainSystems: number;
  trustEngineScore: number | null;
  unifiedTrustRuntimeToken: string;
  evidenceIntelligenceToken: string;
  realityVerificationToken: string;
  completionTruthToken: string;
  predictionTrustToken: string;
  autonomousVerificationToken: string;
  completionEngineToken: string;
  multiProjectVerificationToken: string;
  multiProjectMonitoringToken: string;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  world2Token: string;
  uvlRows: number;
  registeredAt: number;
}

let cachedSnapshot: UnifiedTrustScoreSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

export function getDevPulseV2UnifiedTrustScore(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: UNIFIED_TRUST_SCORE_OWNER_MODULE,
    passToken: UNIFIED_TRUST_SCORE_PASS_TOKEN,
    phase: 22.6,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerUnifiedTrustScoreWithCentralBrain(): UnifiedTrustScoreSystemSnapshot {
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
    completionTruthToken: getDevPulseV2CompletionTruthEngine().passToken,
    predictionTrustToken: getDevPulseV2PredictionTrustLayer().passToken,
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    uvlRows: listUnifiedTrustScoreUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerUnifiedTrustScoreWithUnifiedTrustRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustRuntime().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithEvidenceIntelligence(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2EvidenceIntelligence().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithRealityVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2RealityVerificationExpansion().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithCompletionTruth(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CompletionTruthEngine().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithPredictionTrust(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PredictionTrustLayer().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerUnifiedTrustScoreWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerUnifiedTrustScoreWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerUnifiedTrustScoreWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listUnifiedTrustScoreUvlRows().length, readOnly: true };
}

export function evaluateUnifiedTrustScoreEngine(input: UnifiedTrustScoreInput): UnifiedTrustScoreResult {
  registerUnifiedTrustScoreWithCentralBrain();

  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';

  const inputs = collectTrustScoreInputs(input);
  const normalized = normalizeTrustScores(inputs);
  const weighting = computeTrustWeighting(normalized);
  const consistency = analyzeTrustScoreConsistency(normalized, inputs.missingSignals);
  const confidence = evaluateTrustConfidence(inputs);
  const authority = buildUnifiedTrustScoreAuthority(
    input.requestId,
    normalized,
    weighting,
    consistency,
    confidence,
    input.governanceBlocked,
  );
  const evaluation = evaluateUnifiedTrustScore(authority, consistency);

  recordCounter += 1;
  const record: UnifiedTrustScoreRecord = {
    scoreId: `unified-trust-score-${recordCounter}`,
    projectId,
    workspaceId,
    trustScore: evaluation.finalTrustScore,
    trustLevel: evaluation.trustLevel,
    decision: evaluation.decision,
    confidence: authority.confidence,
    evidenceContribution: weighting.evidenceContribution,
    realityContribution: weighting.realityContribution,
    completionContribution: weighting.completionContribution,
    predictionContribution: weighting.predictionContribution,
    generatedAt: Date.now(),
  };

  registerUnifiedTrustScoreRecord(record);
  recordUnifiedTrustScoreHistory(record);
  const report = generateUnifiedTrustScoreReport(
    record,
    evaluation,
    weighting,
    consistency,
    inputs.missingSignals,
  );

  return { record, report };
}

export function getUnifiedTrustScoreRuntimeReport(): UnifiedTrustScoreRuntimeReport {
  const cache = getUnifiedTrustScoreCacheStats();
  return {
    inputCollectionCount: getInputCollectionCount(),
    normalizationCount: getNormalizationCount(),
    weightingCount: getWeightingCount(),
    consistencyAnalysisCount: getConsistencyAnalysisCount(),
    confidenceEvaluationCount: getConfidenceEvaluationCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getUnifiedTrustScoreRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetUnifiedTrustScoreOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
