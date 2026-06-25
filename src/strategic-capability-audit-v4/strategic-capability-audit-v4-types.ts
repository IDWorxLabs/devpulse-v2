/**
 * Strategic Capability Audit V4 — types.
 */

import type { STRATEGIC_GAP_CATEGORIES } from './strategic-capability-audit-v4-bounds.js';

export type StrategicGapCategory = (typeof STRATEGIC_GAP_CATEGORIES)[number];

export type StrategicQuestionAnswer = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export interface StrategicCapabilityQuestion {
  question: string;
  answer: StrategicQuestionAnswer;
  evidence: string;
  score: number;
}

export interface StrategicGapEntry {
  readOnly: true;
  gapId: string;
  category: StrategicGapCategory;
  capability: string;
  severity: 'BLOCKING' | 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
  evidenceBasis: string;
  strategicValueScore: number;
}

export interface RoadmapV4Priority {
  readOnly: true;
  rank: number;
  phase: string;
  action: 'BUILD' | 'EXTEND' | 'REGISTER' | 'MAINTAIN' | 'RESEARCH' | 'COMPLETE';
  rationale: string;
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies: readonly string[];
  evidenceBasis: string;
}

export interface FactoryReadinessDimension {
  dimension: string;
  score: number;
  status: 'PROVEN' | 'PARTIAL' | 'MISSING';
  evidence: string;
}

export interface FactoryReadinessAssessment {
  readOnly: true;
  generatedAt: string;
  overallScore: number;
  softwareFactoryReady: boolean;
  dimensions: readonly FactoryReadinessDimension[];
}

export interface AutonomyReadinessAssessment {
  readOnly: true;
  generatedAt: string;
  overallScore: number;
  continuousOperationReady: boolean;
  canEvolveAutonomously: boolean;
  dimensions: readonly FactoryReadinessDimension[];
}

export interface CommercializationReadinessAssessment {
  readOnly: true;
  generatedAt: string;
  overallScore: number;
  deploymentReady: boolean;
  commercializationReady: boolean;
  dimensions: readonly FactoryReadinessDimension[];
}

export interface StrategicCapabilityAuditV4Assessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Strategic Capability Audit V4';
  passToken: string;
  version: 'V4';
  generatedAt: string;
  evidenceSourcesConsumed: number;
  strategicDimensionsAssessed: number;
  auditProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  capabilityQuestions: readonly StrategicCapabilityQuestion[];
  remainingGaps: readonly StrategicGapEntry[];
  highestValueNextCapability: string;
  noMajorGapsConclusion: boolean;
  factoryReadiness: FactoryReadinessAssessment;
  autonomyReadiness: AutonomyReadinessAssessment;
  commercializationReadiness: CommercializationReadinessAssessment;
  roadmapV4: readonly RoadmapV4Priority[];
  priorPhasesComplete: readonly string[];
}
