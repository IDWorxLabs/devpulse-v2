/**
 * Prediction Trust Layer — orchestration and read-only integrations.
 * Predicts future trust risk before failure happens. Prediction only — no execution, mutations, or deployment.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2TrustEngineAuthority } from '../trust-engine/index.js';
import { getDevPulseV2UnifiedTrustRuntime } from '../unified-trust-runtime/index.js';
import { getDevPulseV2EvidenceIntelligence } from '../evidence-intelligence/index.js';
import { getDevPulseV2RealityVerificationExpansion } from '../reality-verification-expansion/index.js';
import { getDevPulseV2CompletionTruthEngine } from '../completion-truth-engine/index.js';
import { getDevPulseV2AutonomousVerification } from '../autonomous-verification/index.js';
import { getDevPulseV2AutonomousCompletionEngine } from '../autonomous-completion-engine/index.js';
import { getDevPulseV2MultiProjectVerification } from '../multi-project-verification/index.js';
import { getDevPulseV2MultiProjectMonitoring } from '../multi-project-monitoring/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { listPredictionTrustLayerUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import type {
  PredictionTrustInput,
  PredictionTrustRecord,
  PredictionTrustResult,
  PredictionTrustRuntimeReport,
} from './prediction-trust-types.js';
import {
  PREDICTION_TRUST_LAYER_OWNER_MODULE,
  PREDICTION_TRUST_LAYER_PASS_TOKEN,
} from './prediction-trust-types.js';
import { analyzeTrustTrend, getTrendAnalysisCount } from './trust-trend-analyzer.js';
import { predictTrustRisk, getRiskPredictionCount } from './trust-risk-predictor.js';
import { predictTrustFailures, getFailurePredictionCount } from './trust-failure-predictor.js';
import { analyzeTrustVolatility, getVolatilityAnalysisCount } from './trust-volatility-analyzer.js';
import { recommendTrustRecovery, getRecoveryRecommendationCount } from './trust-recovery-recommender.js';
import { buildUnifiedPredictionTrustAuthority, getAuthorityBuildCount } from './trust-prediction-authority-builder.js';
import { evaluateTrustPrediction, getEvaluationCount } from './trust-prediction-evaluator.js';
import {
  registerPredictionTrustRecord,
  getPredictionTrustRecordCount,
} from './prediction-trust-registry.js';
import { recordPredictionTrustHistory } from './prediction-trust-history.js';
import { generatePredictionTrustReport } from './prediction-trust-reporting.js';
import { getPredictionTrustCacheStats } from './prediction-trust-cache.js';

export interface PredictionTrustLayerSystemSnapshot {
  centralBrainSystems: number;
  trustEngineScore: number | null;
  unifiedTrustRuntimeToken: string;
  evidenceIntelligenceToken: string;
  realityVerificationToken: string;
  completionTruthToken: string;
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

let cachedSnapshot: PredictionTrustLayerSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

export function getDevPulseV2PredictionTrustLayer(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: PREDICTION_TRUST_LAYER_OWNER_MODULE,
    passToken: PREDICTION_TRUST_LAYER_PASS_TOKEN,
    phase: 22.5,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerPredictionTrustLayerWithCentralBrain(): PredictionTrustLayerSystemSnapshot {
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
    autonomousVerificationToken: getDevPulseV2AutonomousVerification().passToken,
    completionEngineToken: getDevPulseV2AutonomousCompletionEngine().passToken,
    multiProjectVerificationToken: getDevPulseV2MultiProjectVerification().passToken,
    multiProjectMonitoringToken: getDevPulseV2MultiProjectMonitoring().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    uvlRows: listPredictionTrustLayerUvlRows().length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerPredictionTrustLayerWithUnifiedTrustRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustRuntime().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithEvidenceIntelligence(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2EvidenceIntelligence().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithRealityVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2RealityVerificationExpansion().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithCompletionTruth(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CompletionTruthEngine().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithTrustEngine(): { trustScore: number | null; readOnly: true } {
  const result = getDevPulseV2TrustEngineAuthority().getLastResult();
  return { trustScore: result?.trustScore ?? null, readOnly: true };
}

export function registerPredictionTrustLayerWithAutonomousVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousVerification().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithCompletionEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AutonomousCompletionEngine().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithMultiProjectVerification(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectVerification().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithMultiProjectMonitoring(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MultiProjectMonitoring().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerPredictionTrustLayerWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerPredictionTrustLayerWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listPredictionTrustLayerUvlRows().length, readOnly: true };
}

function collectMissingSignals(input: PredictionTrustInput): string[] {
  const missing: string[] = [];
  if (input.trustScore === undefined) missing.push('trust_score');
  if (input.evidenceQuality === undefined) missing.push('evidence_quality');
  if (input.realityConfidence === undefined) missing.push('reality_confidence');
  if (input.completionTruthScore === undefined) missing.push('completion_truth_score');
  if (input.governanceStable === undefined) missing.push('governance_state');
  if (input.monitoringHealthy === undefined) missing.push('monitoring_state');
  return missing;
}

export function evaluatePredictionTrustLayer(input: PredictionTrustInput): PredictionTrustResult {
  registerPredictionTrustLayerWithCentralBrain();

  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const trustScore = input.trustScore ?? 50;

  const trend = analyzeTrustTrend(input);
  const risk = predictTrustRisk(input);
  const failures = predictTrustFailures(input, trend, risk);
  const volatility = analyzeTrustVolatility(input, trend);
  const recovery = recommendTrustRecovery(trend, risk, failures);
  const authority = buildUnifiedPredictionTrustAuthority(
    input.requestId,
    trend,
    risk,
    failures,
    volatility,
    recovery,
    trustScore,
  );
  const evaluation = evaluateTrustPrediction(authority, volatility);
  const missingSignals = collectMissingSignals(input);

  recordCounter += 1;
  const record: PredictionTrustRecord = {
    predictionId: `prediction-trust-${recordCounter}`,
    projectId,
    workspaceId,
    riskLevel: authority.riskLevel,
    decision: evaluation.decision,
    confidence: evaluation.predictionConfidence,
    predictedTrustScore: evaluation.predictedTrustScore,
    predictedRiskScore: evaluation.predictedRiskScore,
    generatedAt: Date.now(),
  };

  registerPredictionTrustRecord(record);
  recordPredictionTrustHistory(record);
  const report = generatePredictionTrustReport(
    record,
    evaluation,
    failures.likelyFailures,
    recovery.recommendations,
    volatility.volatilityScore,
    volatility.stabilityScore,
    missingSignals,
  );

  return { record, report };
}

export function getPredictionTrustLayerRuntimeReport(): PredictionTrustRuntimeReport {
  const cache = getPredictionTrustCacheStats();
  return {
    trendAnalysisCount: getTrendAnalysisCount(),
    riskPredictionCount: getRiskPredictionCount(),
    failurePredictionCount: getFailurePredictionCount(),
    volatilityAnalysisCount: getVolatilityAnalysisCount(),
    recoveryRecommendationCount: getRecoveryRecommendationCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getPredictionTrustRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetPredictionTrustLayerForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
