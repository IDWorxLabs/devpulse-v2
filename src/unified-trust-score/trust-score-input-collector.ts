/**
 * Unified Trust Score — trust score input collector.
 */

import { evaluateUnifiedTrustRuntime } from '../unified-trust-runtime/index.js';
import { runEvidenceIntelligence } from '../evidence-intelligence/index.js';
import { runRealityVerificationExpansion } from '../reality-verification-expansion/index.js';
import { evaluateCompletionTruthEngine } from '../completion-truth-engine/index.js';
import { evaluatePredictionTrustLayer } from '../prediction-trust-layer/index.js';
import type { UnifiedTrustScoreInput, UnifiedTrustScoreInputs } from './unified-trust-score-types.js';
import { getCachedTrustScoreInputs, setCachedTrustScoreInputs } from './unified-trust-score-cache.js';

let inputCollectionCount = 0;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function collectTrustScoreInputs(input: UnifiedTrustScoreInput): UnifiedTrustScoreInputs {
  const cacheKey = [
    input.requestId,
    input.trustRuntimeScore ?? '',
    input.evidenceScore ?? '',
    input.realityScore ?? '',
    input.completionScore ?? '',
    input.predictionScore ?? '',
  ].join('|');

  const cached = getCachedTrustScoreInputs(cacheKey);
  if (cached) return cached;

  inputCollectionCount += 1;
  const missingSignals: string[] = [];

  let trustRuntimeScore = input.trustRuntimeScore;
  let trustRuntimeConfidence = 50;
  if (trustRuntimeScore === undefined) {
    if (input.trustSignals && input.trustSignals.length > 0) {
      const result = evaluateUnifiedTrustRuntime({
        requestId: `${input.requestId}-trust-runtime`,
        signals: input.trustSignals.map((s) => ({
          source: s.source,
          trustContribution: s.trustContribution ?? 70,
          confidence: s.confidence ?? 70,
          risk: s.risk ?? 10,
        })),
      });
      trustRuntimeScore = result.record.evaluation.overallTrustLevel;
      trustRuntimeConfidence = result.record.evaluation.trustConfidence;
    } else {
      trustRuntimeScore = 50;
      missingSignals.push('trust_runtime');
    }
  } else {
    trustRuntimeConfidence = clampScore(trustRuntimeScore);
  }

  let evidenceScore = input.evidenceScore;
  let evidenceConfidence = 50;
  if (evidenceScore === undefined) {
    if (input.evidenceSignals && input.evidenceSignals.length > 0) {
      const result = runEvidenceIntelligence({
        requestId: `${input.requestId}-evidence`,
        project: input.projectId,
        workspace: input.workspaceId,
        evidence: input.evidenceSignals.map((e) => ({
          source: e.source,
          strength: e.strength ?? 70,
          trustworthiness: e.trustworthiness ?? e.strength ?? 70,
          reliability: e.reliability ?? 70,
          freshness: e.freshness ?? 80,
        })),
      });
      evidenceScore = result.record.authority.quality.qualityScore;
      evidenceConfidence = result.record.evaluation.evidenceConfidence;
    } else {
      evidenceScore = 50;
      missingSignals.push('evidence_intelligence');
    }
  } else {
    evidenceConfidence = clampScore(evidenceScore);
  }

  let realityScore = input.realityScore;
  let realityConfidence = 50;
  if (realityScore === undefined) {
    if (input.realitySignals && input.realitySignals.length > 0) {
      const result = runRealityVerificationExpansion({
        requestId: `${input.requestId}-reality`,
        project: input.projectId,
        workspace: input.workspaceId,
        claims: input.realitySignals.map((r) => ({
          claimType: r.claimType,
          claim: r.claimType,
          strength: r.strength ?? 70,
          verificationState: r.verificationState ?? 'VERIFIED',
          trustLevel: r.trustLevel ?? 70,
        })),
      });
      realityScore = result.record.evaluation.realityConfidence;
      realityConfidence = result.record.evaluation.realityConfidence;
    } else {
      realityScore = 50;
      missingSignals.push('reality_verification');
    }
  } else {
    realityConfidence = clampScore(realityScore);
  }

  let completionScore = input.completionScore;
  let completionConfidence = 50;
  if (completionScore === undefined) {
    if (input.completionSignals && input.completionSignals.length > 0) {
      const result = evaluateCompletionTruthEngine({
        requestId: `${input.requestId}-completion`,
        projectId: input.projectId,
        workspaceId: input.workspaceId,
        completionClaims: input.completionSignals.map((c) => ({
          claimType: c.claimType,
          reportedComplete: c.reportedComplete,
          strength: c.strength ?? 70,
        })),
      });
      completionScore = result.record.authority.completionTruthScore;
      completionConfidence = result.record.evaluation.completionConfidence;
    } else {
      completionScore = 50;
      missingSignals.push('completion_truth');
    }
  } else {
    completionConfidence = clampScore(completionScore);
  }

  let predictionScore = input.predictionScore;
  let predictionConfidence = 50;
  if (predictionScore === undefined) {
    const predictionInput = {
      requestId: `${input.requestId}-prediction`,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      trustScore: input.predictionSignals?.trustScore ?? trustRuntimeScore,
      evidenceQuality: input.predictionSignals?.evidenceQuality ?? evidenceScore,
      realityConfidence: input.predictionSignals?.realityConfidence ?? realityScore,
      completionTruthScore: input.predictionSignals?.completionTruthScore ?? completionScore,
      governanceStable: input.predictionSignals?.governanceStable ?? input.governanceBlocked !== true,
    };
    const result = evaluatePredictionTrustLayer(predictionInput);
    predictionScore = result.record.predictedTrustScore;
    predictionConfidence = result.record.confidence;
  } else {
    predictionConfidence = clampScore(predictionScore);
  }

  const result: UnifiedTrustScoreInputs = {
    trustRuntimeScore: clampScore(trustRuntimeScore),
    evidenceScore: clampScore(evidenceScore),
    realityScore: clampScore(realityScore),
    completionScore: clampScore(completionScore),
    predictionScore: clampScore(predictionScore),
    trustRuntimeConfidence: clampScore(trustRuntimeConfidence),
    evidenceConfidence: clampScore(evidenceConfidence),
    realityConfidence: clampScore(realityConfidence),
    completionConfidence: clampScore(completionConfidence),
    predictionConfidence: clampScore(predictionConfidence),
    missingSignals,
  };

  setCachedTrustScoreInputs(cacheKey, result);
  return result;
}

export function getInputCollectionCount(): number {
  return inputCollectionCount;
}

export function resetTrustScoreInputCollectorForTests(): void {
  inputCollectionCount = 0;
}
