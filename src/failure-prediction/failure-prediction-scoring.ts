/**
 * Shared prediction record factory and confidence scoring — no bridge imports.
 */

import type { PredictionConfidence, PredictionRecord, RiskLevel } from './types.js';

function createPredictionId(): string {
  return `prediction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPredictionRecord(
  input: Omit<PredictionRecord, 'predictionId' | 'createdAt' | 'status'> & {
    predictionId?: string;
    createdAt?: number;
    status?: PredictionRecord['status'];
  },
): PredictionRecord {
  return {
    predictionId: input.predictionId ?? createPredictionId(),
    createdAt: input.createdAt ?? Date.now(),
    sourceSystemId: input.sourceSystemId,
    title: input.title,
    description: input.description,
    riskLevel: input.riskLevel,
    confidence: input.confidence,
    status: input.status ?? 'ACTIVE',
    supportingEvidenceIds: [...input.supportingEvidenceIds],
    warnings: [...input.warnings],
    errors: [...input.errors],
  };
}

export function scoreConfidence(riskLevel: RiskLevel, signalCount: number): PredictionConfidence {
  if (signalCount >= 3 || riskLevel === 'CRITICAL') return 'HIGH';
  if (signalCount >= 2 || riskLevel === 'HIGH') return 'MEDIUM';
  return 'LOW';
}
