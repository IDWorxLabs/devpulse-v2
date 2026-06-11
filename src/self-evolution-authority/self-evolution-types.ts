/**
 * Self-Evolution Authority — assessment types.
 */

export type SelfEvolutionPatternCategory =
  | 'CHAT_INTELLIGENCE'
  | 'TRUST'
  | 'USER_SUCCESS'
  | 'PROMISE_FULFILLMENT'
  | 'GAP_DETECTION'
  | 'REPOSITORY_INTEGRITY'
  | 'LAUNCH_READINESS'
  | 'SELF_AWARENESS';

export type SelfEvolutionPatternStatus = 'MONITOR' | 'ESCALATE' | 'EVOLUTION_REQUIRED' | 'BLOCKED';

export type SelfEvolutionPatternSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SelfEvolutionReadinessState = 'STABLE' | 'MONITORING' | 'EVOLUTION_REQUIRED' | 'BLOCKED';

export interface SelfEvolutionPatternDefinition {
  id: string;
  category: SelfEvolutionPatternCategory;
  question: string;
  recommendedEvolutions: readonly string[];
}

export interface SelfEvolutionPattern {
  id: string;
  category: SelfEvolutionPatternCategory;
  failureSignal: string;
  repeatCount: number;
  severity: SelfEvolutionPatternSeverity;
  missingCapability: string;
  recommendedEvolution: string;
  evidence: string[];
  status: SelfEvolutionPatternStatus;
}

export interface SelfEvolutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  selfEvolutionScore: number;
  repeatedFailureCount: number;
  evolutionRequiredCount: number;
  blockedEvolutionCount: number;
  blocksLaunchReadiness: boolean;
  readinessState: SelfEvolutionReadinessState;
  patterns: SelfEvolutionPattern[];
  requiredEvolutions: string[];
  recommendations: string[];
  cacheKey: string;
}
