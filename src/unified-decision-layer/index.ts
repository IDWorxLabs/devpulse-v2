/**
 * DevPulse V2 Phase 11.6 — Unified Decision Layer public API.
 */

import { resetDecisionOptionCounterForTests } from './decision-option-model.js';
import { answerDecisionQuestion, reasonOverDecision } from './unified-decision-layer.js';
import type { UnifiedDecisionLayerDiagnostics } from './decision-types.js';

export {
  UNIFIED_DECISION_LAYER_PASS_TOKEN,
  UNIFIED_DECISION_LAYER_OWNER_MODULE,
  UNIFIED_DECISION_LAYER_FEED_STAGES,
  DECISION_QUESTION_SIGNALS,
  isDecisionQuestion,
  type DecisionCategory,
  type DecisionIntent,
  type DecisionOption,
  type DecisionContext,
  type DecisionRecommendation,
  type DecisionAnswer,
  type DecisionConfidence,
  type UnifiedDecisionLayerDiagnostics,
} from './decision-types.js';

export { buildDecisionContext, decisionContextKey } from './decision-context-builder.js';
export { createDecisionOptions, resetDecisionOptionCounterForTests } from './decision-option-model.js';
export {
  rankDecisionOptions,
  selectHighestPriority,
  selectLowestPriority,
  selectBestRiskReward,
} from './decision-priority-ranker.js';
export {
  evaluateOptionRisk,
  evaluateRecommendationRisk,
  findRiskiestOption,
  findSafestOption,
  riskLevelLabel,
} from './decision-risk-evaluator.js';
export {
  detectOptionBlockers,
  analyzeBlockers,
  blockersForOption,
  type BlockerAnalysis,
} from './decision-blocker-detector.js';
export { generateDecisionRecommendation, summarizeRecommendation } from './decision-recommendation-engine.js';
export { composeDecisionAnswer } from './decision-answer-composer.js';
export { answerDecisionQuestion, reasonOverDecision, type DecisionTrace } from './unified-decision-layer.js';

let lastDecisionQuery: string | null = null;
let lastRecommendation: string | null = null;
let lastRiskLevel: string | null = null;
let lastConfidence: string | null = null;
let lastBlockerCount = 0;

import { publishOperatorFeedStage } from '../operator-feed/index.js';
import {
  buildActionCandidates,
  updateActionVisibilityDiagnostics,
} from '../action-visibility-engine/index.js';

export function processUnifiedDecisionLayerRequest(query: string): {
  responseText: string;
  recommendation: string;
  riskLevel: string;
  confidence: string;
  blockerCount: number;
} {
  publishOperatorFeedStage('Generating Recommendation', 'unified_decision_layer', { query });
  const trace = reasonOverDecision(query);
  lastDecisionQuery = query;
  lastRecommendation = trace.recommendation.recommendation;
  lastRiskLevel = trace.recommendation.riskLevel;
  lastConfidence = trace.recommendation.confidence;
  lastBlockerCount = trace.recommendation.blockers.length;

  const actionCandidates = buildActionCandidates(query);
  updateActionVisibilityDiagnostics(query, actionCandidates);

  return {
    responseText: trace.responseText,
    recommendation: lastRecommendation,
    riskLevel: lastRiskLevel,
    confidence: lastConfidence,
    blockerCount: lastBlockerCount,
  };
}

export function getUnifiedDecisionLayerDiagnostics(): UnifiedDecisionLayerDiagnostics {
  return {
    decisionLayerActive: true,
    lastDecisionQuestion: lastDecisionQuery,
    lastRecommendation,
    lastRiskLevel,
    lastConfidence,
    lastBlockerCount,
  };
}

export function resetUnifiedDecisionLayerForTests(): void {
  lastDecisionQuery = null;
  lastRecommendation = null;
  lastRiskLevel = null;
  lastConfidence = null;
  lastBlockerCount = 0;
  resetDecisionOptionCounterForTests();
}

export function unifiedDecisionLayerKey(): string {
  const d = getUnifiedDecisionLayerDiagnostics();
  return [
    d.decisionLayerActive ? 'active' : 'idle',
    d.lastRecommendation ?? 'none',
    d.lastRiskLevel ?? 'none',
    d.lastConfidence ?? 'none',
    String(d.lastBlockerCount),
  ].join('|');
}

export class DevPulseV2UnifiedDecisionLayer {
  static readonly ownerModule = 'devpulse_v2_unified_decision_layer';
  static readonly passToken = 'DEVPULSE_V2_UNIFIED_DECISION_LAYER_FOUNDATION_V1_PASS';

  answer(query: string): string {
    return answerDecisionQuestion(query);
  }
}

let singleton: DevPulseV2UnifiedDecisionLayer | null = null;

export function getDevPulseV2UnifiedDecisionLayer(): DevPulseV2UnifiedDecisionLayer {
  if (!singleton) singleton = new DevPulseV2UnifiedDecisionLayer();
  return singleton;
}
