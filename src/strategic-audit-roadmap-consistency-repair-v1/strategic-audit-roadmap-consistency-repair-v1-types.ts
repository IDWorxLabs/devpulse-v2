/**
 * Strategic Audit Roadmap Consistency Repair V1 — types.
 */

export type RoadmapConsistencyStatus = 'CONSISTENT' | 'STALE' | 'DUPLICATE' | 'CONFLICTING';

export interface RoadmapConsistencyItem {
  readOnly: true;
  capability: string;
  evidenceSource: string;
  passToken: string | null;
  roadmapAction: string;
  capabilityAuditAction: string;
  consistencyStatus: RoadmapConsistencyStatus;
  detail: string;
}

export interface RoadmapConflict {
  readOnly: true;
  conflictId: string;
  capability: string;
  strategicAuditAction: string;
  capabilityAuditAction: string;
  resolution: string;
}

export interface StrategicAuditRoadmapConsistencyRepairAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Strategic Audit Roadmap Consistency Repair V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  consistencyProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  auditsAgree: boolean;
  completedCapabilitiesCannotReappear: boolean;
  evidenceDrivenRoadmapProven: boolean;
  conflictingItems: number;
  staleItems: number;
  duplicateItems: number;
  consistentItems: number;
  generalPurposeV1CompleteInRoadmap: boolean;
  generalPurposeV1NotTopGap: boolean;
  consistencyAnalysis: readonly RoadmapConsistencyItem[];
  roadmapConflicts: readonly RoadmapConflict[];
  resolvedPriorities: readonly {
    readOnly: true;
    rank: number;
    phase: string;
    action: string;
    evidenceBasis: string;
  }[];
}
