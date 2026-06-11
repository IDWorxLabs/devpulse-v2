/**
 * Competitive Reality Authority — assessment types.
 */

export type CompetitiveComparisonCategory =
  | 'GENERAL_AI_COMPARISON'
  | 'CODING_ASSISTANT_COMPARISON'
  | 'APP_BUILDER_COMPARISON'
  | 'AUTONOMOUS_AGENT_COMPARISON'
  | 'MANUAL_WORKFLOW_COMPARISON';

export type CompetitiveCompetitorType =
  | 'GENERAL_AI'
  | 'AI_CODING_ASSISTANT'
  | 'APP_BUILDER'
  | 'AUTONOMOUS_AGENT'
  | 'MANUAL_WORKFLOW';

export type CompetitiveDifferentiationLevel = 'NONE' | 'WEAK' | 'MODERATE' | 'STRONG' | 'UNIQUE';

export type CompetitiveReadinessState =
  | 'STRONGLY_DIFFERENTIATED'
  | 'DIFFERENTIATED'
  | 'WEAKLY_DIFFERENTIATED'
  | 'COMMODITIZED'
  | 'BLOCKED';

export interface CompetitiveComparisonDefinition {
  id: string;
  category: CompetitiveComparisonCategory;
  competitorType: CompetitiveCompetitorType;
  question: string;
}

export interface CompetitiveRealityFinding {
  id: string;
  category: CompetitiveComparisonCategory;
  competitorType: CompetitiveCompetitorType;
  finding: string;
  evidence: string[];
  differentiationLevel: CompetitiveDifferentiationLevel;
  risk: string;
  recommendation: string;
}

export interface CompetitiveRealityAssessment {
  readOnly: true;
  advisoryOnly: true;
  competitiveRealityScore: number;
  differentiationScore: number;
  competitiveRiskScore: number;
  uniqueAdvantageCount: number;
  weakDifferentiationCount: number;
  blocksLaunchReadiness: boolean;
  readinessState: CompetitiveReadinessState;
  findings: CompetitiveRealityFinding[];
  uniqueAdvantages: string[];
  competitiveRisks: string[];
  recommendations: string[];
  cacheKey: string;
}
