/**
 * Cross-system routing report — aggregated routing verification snapshot.
 */

import type { BrainClassification, BrainRequestCategory, OperatorFeedEventType } from '../../brain-types.js';
import type { CrossSystemAwarenessResult } from '../cross-system-awareness-engine.js';
import type { DependencyAnalysisResult } from '../dependency-analyzer.js';
import type { ImpactAnalysisResult } from '../impact-analyzer.js';
import { buildDependencyRouteTrace } from './dependency-route-trace.js';
import { buildImpactRouteTrace } from './impact-route-trace.js';
import { buildRelationshipRouteTrace } from './relationship-route-trace.js';

export const CROSS_SYSTEM_ROUTING_PASS_TOKEN =
  'DEVPULSE_V2_CROSS_SYSTEM_AWARENESS_RELATIONSHIP_VERIFICATION_AND_ROUTING_FIX_V1_PASS';

export type CrossSystemAnalyzerUsed =
  | 'relationship_engine'
  | 'dependency_analyzer'
  | 'impact_analyzer'
  | 'none';

export interface CrossSystemRoutingReport {
  classification: BrainRequestCategory;
  selectedAnalyzer: CrossSystemAnalyzerUsed;
  analyzerExecuted: boolean;
  responseSource: CrossSystemAnalyzerUsed | 'fallback';
  operatorFeedStages: OperatorFeedEventType[];
  routingResult: 'routed' | 'fallback_blocked';
  timestamp: number;
}

export function buildCrossSystemRoutingReport(input: {
  classification: BrainClassification;
  category: BrainRequestCategory;
  operatorFeedStages: OperatorFeedEventType[];
  crossSystemResult: CrossSystemAwarenessResult | null;
  dependencyAnalysis: DependencyAnalysisResult | null;
  impactAnalysis: ImpactAnalysisResult | null;
  responseText: string;
  timestamp: number;
}): CrossSystemRoutingReport {
  const { category, classification, operatorFeedStages, responseText, timestamp } = input;

  if (category === 'RELATIONSHIP') {
    const trace = buildRelationshipRouteTrace(classification, input.crossSystemResult, timestamp);
    return {
      classification: category,
      selectedAnalyzer: 'relationship_engine',
      analyzerExecuted: trace.analyzerExecuted,
      responseSource: trace.responseSource,
      operatorFeedStages,
      routingResult: input.crossSystemResult ? 'routed' : 'fallback_blocked',
      timestamp,
    };
  }

  if (category === 'DEPENDENCY') {
    const trace = buildDependencyRouteTrace(classification, input.dependencyAnalysis, responseText, timestamp);
    return {
      classification: category,
      selectedAnalyzer: 'dependency_analyzer',
      analyzerExecuted: trace.analyzerExecuted,
      responseSource: trace.responseSource,
      operatorFeedStages,
      routingResult: input.crossSystemResult ? 'routed' : 'fallback_blocked',
      timestamp,
    };
  }

  if (category === 'IMPACT') {
    const trace = buildImpactRouteTrace(classification, input.impactAnalysis, responseText, timestamp);
    return {
      classification: category,
      selectedAnalyzer: 'impact_analyzer',
      analyzerExecuted: trace.analyzerExecuted,
      responseSource: trace.responseSource,
      operatorFeedStages,
      routingResult: input.crossSystemResult ? 'routed' : 'fallback_blocked',
      timestamp,
    };
  }

  return {
    classification: category,
    selectedAnalyzer: 'none',
    analyzerExecuted: false,
    responseSource: 'none',
    operatorFeedStages,
    routingResult: 'fallback_blocked',
    timestamp,
  };
}

export function routingReportKey(report: CrossSystemRoutingReport): string {
  return [
    report.classification,
    report.selectedAnalyzer,
    report.routingResult,
    report.operatorFeedStages.join('→'),
  ].join('|');
}
