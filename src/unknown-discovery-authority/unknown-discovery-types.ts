/**
 * Unknown Discovery Authority — assessment types.
 */

export type UnknownDiscoveryCategory =
  | 'UNTESTED_USER_BEHAVIOR'
  | 'EDGE_CASE'
  | 'CONTRADICTION'
  | 'COVERAGE_GAP'
  | 'ASSUMPTION_RISK'
  | 'LAUNCH_BLIND_SPOT';

export type UnknownDiscoverySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UnknownDiscoveryReadinessState =
  | 'LOW_UNKNOWN_RISK'
  | 'MODERATE_UNKNOWN_RISK'
  | 'HIGH_UNKNOWN_RISK'
  | 'BLOCKED';

export interface UnknownDiscoveryCategoryDefinition {
  id: string;
  category: UnknownDiscoveryCategory;
  question: string;
}

export interface UnknownDiscoveryFinding {
  id: string;
  category: UnknownDiscoveryCategory;
  title: string;
  description: string;
  severity: UnknownDiscoverySeverity;
  evidence: string[];
  whyItMayBeMissed: string;
  recommendedTest: string;
}

export interface UnknownDiscoveryAssessment {
  readOnly: true;
  advisoryOnly: true;
  unknownDiscoveryScore: number;
  findingCount: number;
  criticalFindingCount: number;
  highFindingCount: number;
  blocksLaunchReadiness: boolean;
  readinessState: UnknownDiscoveryReadinessState;
  findings: UnknownDiscoveryFinding[];
  recommendedTests: string[];
  recommendations: string[];
  cacheKey: string;
}
