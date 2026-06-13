/**
 * Data advantage analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type { DataAdvantageAnalysis, DataAdvantageEvidence } from './strategic-defensibility-types.js';

function empty(missingEvidence: string[], riskSignals: string[]): DataAdvantageAnalysis {
  return {
    readOnly: true,
    uniqueDataAssets: false,
    learningAdvantages: false,
    dataFlywheelSignals: false,
    dataDependency: false,
    dataAdvantageScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}

export function analyzeDataAdvantage(input: {
  evidence: DataAdvantageEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  marketExpansionOnly?: boolean;
  rejectFabricated?: boolean;
}): DataAdvantageAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly || input.marketExpansionOnly) {
    missingEvidence.push('Upstream metrics alone are not data advantage evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No data advantage report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Data advantage metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated moat evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.uniqueDataAssetsObserved) score += 30;
  if (input.evidence.learningAdvantagesObserved) score += 25;
  if (input.evidence.dataFlywheelSignalsObserved) score += 25;
  if (input.evidence.dataDependencyObserved) score += 20;

  let confidence: DataAdvantageAnalysis['confidence'] = 'LOW';
  if (input.evidence.uniqueDataAssetsObserved && input.evidence.dataFlywheelSignalsObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.learningAdvantagesObserved && input.evidence.dataDependencyObserved) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    uniqueDataAssets: input.evidence.uniqueDataAssetsObserved,
    learningAdvantages: input.evidence.learningAdvantagesObserved,
    dataFlywheelSignals: input.evidence.dataFlywheelSignalsObserved,
    dataDependency: input.evidence.dataDependencyObserved,
    dataAdvantageScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
