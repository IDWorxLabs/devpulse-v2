/**
 * Impact route trace — records impact analyzer routing.
 */

import type { BrainClassification } from '../../brain-types.js';
import type { ImpactAnalysisResult } from '../impact-analyzer.js';

export interface ImpactRouteTrace {
  classification: string;
  selectedAnalyzer: 'impact_analyzer';
  analyzerExecuted: boolean;
  responseSource: 'impact_analyzer' | 'fallback';
  severity: string | null;
  timestamp: number;
}

export function buildImpactRouteTrace(
  classification: BrainClassification,
  analysis: ImpactAnalysisResult | null,
  responseText: string,
  timestamp: number,
): ImpactRouteTrace {
  return {
    classification: classification.category,
    selectedAnalyzer: 'impact_analyzer',
    analyzerExecuted: Boolean(analysis),
    responseSource: responseText.includes('Severity:') ? 'impact_analyzer' : 'fallback',
    severity: analysis?.severity ?? null,
    timestamp,
  };
}
