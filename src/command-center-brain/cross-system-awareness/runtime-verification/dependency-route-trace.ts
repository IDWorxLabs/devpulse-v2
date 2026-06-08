/**
 * Dependency route trace — records dependency analyzer routing.
 */

import type { BrainClassification } from '../../brain-types.js';
import type { DependencyAnalysisResult } from '../dependency-analyzer.js';

export interface DependencyRouteTrace {
  classification: string;
  selectedAnalyzer: 'dependency_analyzer';
  analyzerExecuted: boolean;
  responseSource: 'dependency_analyzer' | 'fallback';
  dependencyCount: number;
  timestamp: number;
}

export function buildDependencyRouteTrace(
  classification: BrainClassification,
  analysis: DependencyAnalysisResult | null,
  responseText: string,
  timestamp: number,
): DependencyRouteTrace {
  return {
    classification: classification.category,
    selectedAnalyzer: 'dependency_analyzer',
    analyzerExecuted: Boolean(analysis),
    responseSource: responseText.includes('Dependents:') ? 'dependency_analyzer' : 'fallback',
    dependencyCount: analysis?.dependencyCount ?? 0,
    timestamp,
  };
}
