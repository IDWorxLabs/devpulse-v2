/**
 * DevPulse V2 Phase 11.6 — Unified Decision Layer types.
 * Intelligence only — advisory decisions, no execution.
 */

import type { RiskLevel } from '../foundation/types.js';

export const UNIFIED_DECISION_LAYER_PASS_TOKEN =
  'DEVPULSE_V2_UNIFIED_DECISION_LAYER_FOUNDATION_V1_PASS';
export const UNIFIED_DECISION_LAYER_OWNER_MODULE = 'devpulse_v2_unified_decision_layer';

export type DecisionCategory =
  | 'BUILD_NEXT'
  | 'DEFER'
  | 'BLOCKED'
  | 'RISK_WARNING'
  | 'VALIDATE_FIRST'
  | 'DO_NOT_BUILD_YET'
  | 'SAFE_FOUNDATION'
  | 'ROADMAP_STEP';

export type DecisionIntent =
  | 'BUILD_NEXT'
  | 'DO_NOT_BUILD'
  | 'SAFE_MOVE'
  | 'RISKY_MOVE'
  | 'BLOCKED_ITEMS'
  | 'VALIDATE_FIRST'
  | 'DEFER_ITEMS'
  | 'EXECUTION_NOW'
  | 'CLOUD_RUNTIME_NOW'
  | 'DEVELOPMENT_REASONING_NOW'
  | 'HIGHEST_PRIORITY'
  | 'LOWEST_PRIORITY'
  | 'RISK_REWARD'
  | 'FOUNDER_APPROVE'
  | 'GENERAL_DECISION';

export type DecisionConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DecisionOption {
  decisionId: string;
  title: string;
  description: string;
  category: DecisionCategory;
  priority: number;
  riskLevel: RiskLevel;
  confidence: DecisionConfidence;
  recommendedAction: string;
  blocked: boolean;
  blockers: string[];
  supportingFacts: string[];
  relatedSystems: string[];
  timelineDependency: string;
}

export interface DecisionContext {
  query: string;
  intent: DecisionIntent;
  currentPhase: string;
  nextPhase: string;
  roadmapNextStep: string;
  missingCapabilities: string[];
  blockedItems: string[];
  riskFacts: string[];
  supportingFacts: string[];
  relatedSystems: string[];
  timelineBlockers: string[];
  timelineNextSteps: string[];
  ownershipDomains: number;
  memoryFactCount: number;
  crossSystemEdgeCount: number;
  dependencyBlockers: string[];
  dependencyRisks: string[];
  dependencyPaths: string[];
  dependencyConfidence: string;
  dependencyCount: number;
  blockedDependencyCount: number;
  workspaceRisks: string[];
  workspaceOwnershipConfidence: string;
  workspaceMismatchCount: number;
  contextIsolationWarnings: string[];
  recentChanges: string[];
  majorMilestones: string[];
  historyConfidence: string;
  rollbackCount: number;
  phaseTransitionCount: number;
  latestExecutiveSummary: string;
  latestProjectHealth: string;
  latestMilestoneSummary: string;
  latestRiskSummary: string;
  portfolioHealth: string;
  portfolioRisks: string[];
  portfolioPriorities: string[];
  portfolioSummary: string;
}

export interface DecisionRecommendation {
  primaryOption: DecisionOption;
  rankedOptions: DecisionOption[];
  recommendation: string;
  why: string;
  riskLevel: RiskLevel;
  confidence: DecisionConfidence;
  blockers: string[];
  supportingFacts: string[];
  nextSafeAction: string;
}

export interface DecisionAnswer {
  query: string;
  intent: DecisionIntent;
  recommendation: DecisionRecommendation;
  responseText: string;
}

export interface UnifiedDecisionLayerDiagnostics {
  decisionLayerActive: boolean;
  lastDecisionQuestion: string | null;
  lastRecommendation: string | null;
  lastRiskLevel: string | null;
  lastConfidence: string | null;
  lastBlockerCount: number;
}

export const UNIFIED_DECISION_LAYER_FEED_STAGES = [
  'Loading Decision Context',
  'Evaluating Options',
  'Checking Risks',
  'Checking Blockers',
  'Ranking Priorities',
  'Generating Recommendation',
  'Response Ready',
] as const;

export const DECISION_QUESTION_SIGNALS = [
  'what should we build',
  'what should we not build',
  'should we build',
  'build now',
  'build execution',
  'not yet',
  'not build yet',
  'safest next',
  'safest move',
  'riskiest next',
  'riskiest move',
  'what is blocked',
  'what should we defer',
  'should we defer',
  'validate first',
  'what should be validated',
  'what should we validate',
  'highest priority',
  'lowest priority',
  'best risk',
  'risk/reward',
  'risk reward',
  'best next move',
  'worst move',
  'founder approve',
  'should we build cloud',
  'cloud runtime now',
  'development reasoning',
  'should we build development',
  'approve next',
  'what should the founder',
  'do not build',
  "don't build",
  'defer',
  'what is highest priority',
  'what is lowest priority',
  'what has the best',
  'what should happen next',
  'what should we focus',
  'focus on before',
  'holding back',
  'most important',
  'execution now',
  'cloud runtime',
  'autonomous building now',
] as const;

export function isDecisionQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return DECISION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
