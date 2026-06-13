/**
 * Readiness Alignment Check — gate vs downstream readiness verification (V1).
 */

import {
  gateDecisionToAuthorityKind,
  getMaxAllowedReadiness,
  isReadinessEscalation,
  readinessRank,
} from '../planning-gate-authority/readiness-permission-matrix.js';
import type { PlanningGateDecision } from '../planning-gate-authority/planning-gate-types.js';
import type { AuthorityProjectSnapshot } from './orchestration-proof-types.js';

export interface ReadinessEscalationFinding {
  readOnly: true;
  findingId: string;
  gateDecision: PlanningGateDecision;
  downstreamAuthority: string;
  downstreamReadiness: string;
  maxAllowedReadiness: string;
  description: string;
  evidence: readonly string[];
}

export interface ClarificationPreservationFinding {
  readOnly: true;
  findingId: string;
  preserved: boolean;
  clarificationCount: number;
  description: string;
  evidence: readonly string[];
}

export interface ReadinessAlignmentCheck {
  readOnly: true;
  gateDecision: PlanningGateDecision | null;
  escalations: readonly ReadinessEscalationFinding[];
  clarificationPreservation: ClarificationPreservationFinding | null;
  aligned: boolean;
}

let findingCounter = 0;

export function resetReadinessAlignmentCountersForTests(): void {
  findingCounter = 0;
}

function nextFindingId(prefix: string): string {
  findingCounter += 1;
  return `${prefix}-${findingCounter}`;
}

export function checkReadinessAlignment(input: {
  gateDecision: PlanningGateDecision | null;
  snapshots: readonly AuthorityProjectSnapshot[];
  clarificationGapCount?: number;
}): ReadinessAlignmentCheck {
  const escalations: ReadinessEscalationFinding[] = [];

  if (!input.gateDecision) {
    return {
      readOnly: true,
      gateDecision: null,
      escalations,
      clarificationPreservation: null,
      aligned: true,
    };
  }

  for (const snapshot of input.snapshots) {
    if (!snapshot.reached || !snapshot.readiness) continue;
    const authorityKind = gateDecisionToAuthorityKind(snapshot.authorityId);
    if (!authorityKind) continue;

    if (isReadinessEscalation(input.gateDecision, authorityKind, snapshot.readiness)) {
      escalations.push({
        readOnly: true,
        findingId: nextFindingId('readiness-escalation'),
        gateDecision: input.gateDecision,
        downstreamAuthority: snapshot.authorityId,
        downstreamReadiness: snapshot.readiness,
        maxAllowedReadiness: getMaxAllowedReadiness(input.gateDecision, authorityKind),
        description: `READINESS_ESCALATION: ${input.gateDecision} does not permit ${snapshot.readiness} at ${snapshot.authorityId}.`,
        evidence: [
          `GATE_${input.gateDecision}`,
          `DOWNSTREAM_${snapshot.readiness}`,
          `MAX_${getMaxAllowedReadiness(input.gateDecision, authorityKind)}`,
        ],
      });
    }
  }

  let clarificationPreservation: ClarificationPreservationFinding | null = null;
  if (input.gateDecision === 'REQUEST_CLARIFICATION') {
    const count = input.clarificationGapCount ?? 0;
    clarificationPreservation = {
      readOnly: true,
      findingId: nextFindingId('clarification-preservation'),
      preserved: count > 0,
      clarificationCount: count,
      description:
        count > 0
          ? `${count} clarification request(s) preserved downstream.`
          : 'No clarification requests preserved downstream — potential information loss.',
      evidence: [`CLARIFICATION_GAPS_${count}`],
    };
  }

  return {
    readOnly: true,
    gateDecision: input.gateDecision,
    escalations,
    clarificationPreservation,
    aligned: escalations.length === 0,
  };
}

export function compareReadinessInconsistencyCount(input: {
  gateDecision: PlanningGateDecision | null;
  snapshots: readonly AuthorityProjectSnapshot[];
}): number {
  return checkReadinessAlignment({ gateDecision: input.gateDecision, snapshots: input.snapshots }).escalations
    .length;
}

export function gateReadinessLevel(gateDecision: PlanningGateDecision): number {
  switch (gateDecision) {
    case 'REJECT_PLANNING':
      return 0;
    case 'REQUEST_CLARIFICATION':
      return 1;
    case 'ALLOW_LIMITED_PLANNING':
      return 2;
    case 'ALLOW_FULL_PLANNING':
      return 5;
    default:
      return 0;
  }
}

export function exceedsGatePermission(
  gateDecision: PlanningGateDecision,
  downstreamReadiness: string,
  authorityId: string,
): boolean {
  const kind = gateDecisionToAuthorityKind(authorityId);
  if (!kind) return false;
  return readinessRank(downstreamReadiness) > readinessRank(getMaxAllowedReadiness(gateDecision, kind));
}
