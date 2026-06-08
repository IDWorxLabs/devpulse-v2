/**
 * Failure Prediction engine — rule-based pattern detection and risk scoring.
 * No AI, LLM, execution, repair, or root cause analysis.
 */

import type { PredictionRecord, PredictionSummary } from './types.js';
import {
  BROWSER_VERIFICATION_WARNS_TITLE,
  REPEATED_MISSING_UI_TITLE,
  REPEATED_VALIDATION_FAILURES_TITLE,
} from './types.js';
import { scoreConfidence } from './failure-prediction-scoring.js';
import { analyzeObservationPatterns as analyzeObservationBridgePatterns } from './prediction-self-vision-bridge.js';
import { analyzeRealityReplayPatterns as analyzeRealityBridgePatterns } from './prediction-reality-replay-bridge.js';
import { analyzeSessionReplayPatterns as analyzeSessionBridgePatterns } from './prediction-session-replay-bridge.js';
import { analyzeVerificationPatterns as analyzeVerificationBridgePatterns } from './prediction-verification-bridge.js';

export { createPredictionRecord, scoreConfidence } from './failure-prediction-scoring.js';

export function analyzeVerificationPatterns(): PredictionRecord[] {
  return analyzeVerificationBridgePatterns();
}

export function analyzeObservationPatterns(): PredictionRecord[] {
  return analyzeObservationBridgePatterns();
}

export function analyzeReplayPatterns(): PredictionRecord[] {
  return [...analyzeSessionBridgePatterns(), ...analyzeRealityBridgePatterns()];
}

export function analyzeFailurePatterns(): PredictionRecord[] {
  const patterns = [
    ...analyzeVerificationPatterns(),
    ...analyzeObservationPatterns(),
    ...analyzeReplayPatterns(),
  ];

  const merged = new Map<string, PredictionRecord>();
  for (const record of patterns) {
    const existing = merged.get(record.title);
    if (!existing) {
      merged.set(record.title, record);
      continue;
    }
    merged.set(record.title, {
      ...existing,
      supportingEvidenceIds: [
        ...new Set([...existing.supportingEvidenceIds, ...record.supportingEvidenceIds]),
      ],
      warnings: [...existing.warnings, ...record.warnings],
      errors: [...existing.errors, ...record.errors],
      confidence: scoreConfidence(
        existing.riskLevel,
        existing.supportingEvidenceIds.length + record.supportingEvidenceIds.length,
      ),
    });
  }

  return [...merged.values()];
}

export function generatePredictionRecords(): PredictionRecord[] {
  return analyzeFailurePatterns();
}

export function summarizePredictions(records: PredictionRecord[]): PredictionSummary {
  return {
    totalPredictions: records.length,
    lowRiskCount: records.filter((r) => r.riskLevel === 'LOW').length,
    mediumRiskCount: records.filter((r) => r.riskLevel === 'MEDIUM').length,
    highRiskCount: records.filter((r) => r.riskLevel === 'HIGH').length,
    criticalRiskCount: records.filter((r) => r.riskLevel === 'CRITICAL').length,
    warnings: records.flatMap((r) => r.warnings),
    errors: records.flatMap((r) => r.errors),
  };
}

export {
  REPEATED_VALIDATION_FAILURES_TITLE,
  REPEATED_MISSING_UI_TITLE,
  BROWSER_VERIFICATION_WARNS_TITLE,
};
