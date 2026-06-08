/**
 * Shared attribution record factory and confidence scoring.
 */

import type { AttributionConfidence, AttributionRecord, CauseCategory } from './types.js';

function createAttributionId(): string {
  return `attribution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAttributionRecord(
  input: Omit<AttributionRecord, 'attributionId' | 'createdAt'> & {
    attributionId?: string;
    createdAt?: number;
  },
): AttributionRecord {
  return {
    attributionId: input.attributionId ?? createAttributionId(),
    createdAt: input.createdAt ?? Date.now(),
    title: input.title,
    description: input.description,
    category: input.category,
    confidence: input.confidence,
    supportingEvidenceIds: [...input.supportingEvidenceIds],
    supportingPredictionIds: [...input.supportingPredictionIds],
    warnings: [...input.warnings],
    errors: [...input.errors],
  };
}

export function scoreAttributionConfidence(
  signalCount: number,
  hasHighPrediction: boolean,
  hasFailEvidence: boolean,
): AttributionConfidence {
  if (signalCount >= 3 && hasHighPrediction && hasFailEvidence) return 'HIGH';
  if (signalCount >= 2 && (hasHighPrediction || hasFailEvidence)) return 'HIGH';
  if (signalCount >= 2) return 'MEDIUM';
  if (signalCount >= 1) return 'LOW';
  return 'LOW';
}

export function createCauseCandidateId(category: CauseCategory): string {
  return `cause-candidate-${category.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
