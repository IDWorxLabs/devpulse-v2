/**
 * Relationship route trace — records relationship analyzer routing.
 */

import type { BrainClassification } from '../../brain-types.js';
import type { CrossSystemAwarenessResult } from '../cross-system-awareness-engine.js';

export interface RelationshipRouteTrace {
  classification: string;
  selectedAnalyzer: 'relationship_engine';
  analyzerExecuted: boolean;
  responseSource: 'relationship_engine' | 'fallback';
  timestamp: number;
}

export function buildRelationshipRouteTrace(
  classification: BrainClassification,
  result: CrossSystemAwarenessResult | null,
  timestamp: number,
): RelationshipRouteTrace {
  const routed = Boolean(result?.analyzerUsed === 'relationship_engine');
  return {
    classification: classification.category,
    selectedAnalyzer: 'relationship_engine',
    analyzerExecuted: routed,
    responseSource: routed ? 'relationship_engine' : 'fallback',
    timestamp,
  };
}
