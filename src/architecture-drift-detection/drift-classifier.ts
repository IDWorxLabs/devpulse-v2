/**
 * Drift classifier — classifies drift findings by type.
 * Classification only. No remediation.
 */

import type { DriftAnalysisSource, DriftFinding, DriftType } from './types.js';
import { KNOWN_DRIFT_TYPES } from './types.js';

export interface DriftClassificationResult {
  primaryDriftType: DriftType;
  classifiedFindings: DriftFinding[];
  unclassifiedCount: number;
}

export function driftClassificationKey(driftType: DriftType, source: DriftAnalysisSource): string {
  return `${driftType}|${source}`;
}

export function isKnownDriftType(driftType: DriftType): boolean {
  return KNOWN_DRIFT_TYPES.includes(driftType as (typeof KNOWN_DRIFT_TYPES)[number]);
}

export function classifyDriftFindings(
  findings: DriftFinding[],
  analysisSource: DriftAnalysisSource,
  cleanScan: boolean,
): DriftClassificationResult {
  if (cleanScan || findings.length === 0) {
    return { primaryDriftType: 'UNKNOWN', classifiedFindings: [], unclassifiedCount: 0 };
  }

  const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const sorted = [...findings].sort(
    (a, b) => severityOrder[b.driftSeverity] - severityOrder[a.driftSeverity],
  );

  const sourceTypeMap: Partial<Record<DriftAnalysisSource, DriftType>> = {
    OWNERSHIP_REGISTRY_REVIEW: 'DUPLICATE_OWNERSHIP_DRIFT',
    SOURCE_OF_TRUTH_REVIEW: 'DUPLICATE_SOURCE_OF_TRUTH_DRIFT',
    PHASE_ORDER_REVIEW: 'PHASE_ORDER_DRIFT',
    DEPENDENCY_REVIEW: 'DEPENDENCY_DRIFT',
    GOVERNANCE_REVIEW: 'GOVERNANCE_BYPASS_DRIFT',
    WORLD_BOUNDARY_REVIEW: 'WORLD_BOUNDARY_DRIFT',
    MOBILE_STACK_REVIEW: 'MOBILE_STACK_DRIFT',
    SELF_EVOLUTION_REVIEW: 'SELF_EVOLUTION_DRIFT',
    EXECUTION_AUTHORITY_REVIEW: 'EXECUTION_AUTHORITY_DRIFT',
  };

  const sourcePreferred = sourceTypeMap[analysisSource];
  const primaryFromSource = sourcePreferred
    ? sorted.find((f) => f.driftType === sourcePreferred)
    : undefined;

  const primaryDriftType = primaryFromSource?.driftType ?? sorted[0]?.driftType ?? 'UNKNOWN';
  const unclassifiedCount = sorted.filter((f) => !isKnownDriftType(f.driftType)).length;

  return { primaryDriftType, classifiedFindings: sorted, unclassifiedCount };
}

export function isDuplicateOwnershipDrift(type: DriftType): boolean {
  return type === 'DUPLICATE_OWNERSHIP_DRIFT';
}

export function isDuplicateSourceOfTruthDrift(type: DriftType): boolean {
  return type === 'DUPLICATE_SOURCE_OF_TRUTH_DRIFT';
}

export function isPhaseOrderDrift(type: DriftType): boolean {
  return type === 'PHASE_ORDER_DRIFT';
}

export function isDependencyDrift(type: DriftType): boolean {
  return type === 'DEPENDENCY_DRIFT';
}

export function isGovernanceBypassDrift(type: DriftType): boolean {
  return type === 'GOVERNANCE_BYPASS_DRIFT';
}

export function isWorldBoundaryDrift(type: DriftType): boolean {
  return type === 'WORLD_BOUNDARY_DRIFT';
}

export function isMobileStackDrift(type: DriftType): boolean {
  return type === 'MOBILE_STACK_DRIFT';
}

export function isSelfEvolutionDrift(type: DriftType): boolean {
  return type === 'SELF_EVOLUTION_DRIFT';
}

export function isCapabilityAcquisitionDrift(type: DriftType): boolean {
  return type === 'CAPABILITY_ACQUISITION_DRIFT';
}

export function isLearningOverlapDrift(type: DriftType): boolean {
  return type === 'LEARNING_OVERLAP_DRIFT';
}

export function isExecutionAuthorityDrift(type: DriftType): boolean {
  return type === 'EXECUTION_AUTHORITY_DRIFT';
}
