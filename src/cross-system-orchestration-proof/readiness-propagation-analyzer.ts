/**
 * Readiness Propagation Analyzer — detects readiness inflation across chain (V1).
 */

import type { PlanningGateDecision } from '../planning-gate-authority/planning-gate-types.js';
import {
  gateDecisionToAuthorityKind,
  getMaxAllowedReadiness,
  isReadinessEscalation,
} from '../planning-gate-authority/readiness-permission-matrix.js';
import type {
  AuthorityProjectSnapshot,
  PropagationIssueItem,
  ReadinessPropagationAnalysis,
} from './orchestration-proof-types.js';

let issueCounter = 0;

export function resetReadinessPropagationCountersForTests(): void {
  issueCounter = 0;
}

const READINESS_LEVELS: Record<string, number> = {
  NOT_READY: 0,
  HIGH_RISK: 1,
  NEEDS_CLARIFICATION: 1,
  INSUFFICIENT: 1,
  DRAFT_READY: 2,
  ALLOW_LIMITED_PLANNING: 2,
  READY_WITH_GAPS: 2,
  READY_WITH_ACTIONS: 3,
  PLANNING_READY: 3,
  READY_FOR_PLANNING: 3,
  HIGH_CONFIDENCE_UNDERSTANDING: 3,
  ARCHITECTURE_DRAFT_READY: 4,
  ARCHITECTURE_READY: 4,
  READY_FOR_ARCHITECTURE: 4,
  DRAFT_BUILD_PLAN: 4,
  READY_FOR_BUILD_PLAN: 5,
  READY_FOR_EXECUTION_PLANNING: 5,
  READY_FOR_EXECUTION: 5,
  READY_FOR_EXECUTION_GATE: 5,
};

function readinessLevel(readiness: string | null): number {
  if (!readiness) return 0;
  const upper = readiness.toUpperCase();
  if (READINESS_LEVELS[upper] != null) return READINESS_LEVELS[upper];
  for (const [key, level] of Object.entries(READINESS_LEVELS)) {
    if (upper.includes(key)) return level;
  }
  return 0;
}

function pushGateEscalationIssue(input: {
  gateDecision: PlanningGateDecision;
  snapshot: AuthorityProjectSnapshot;
}): PropagationIssueItem {
  const authorityKind = gateDecisionToAuthorityKind(input.snapshot.authorityId)!;
  issueCounter += 1;
  return {
    readOnly: true,
    issueId: `readiness-issue-${issueCounter}`,
    issueType: 'READINESS_ESCALATION',
    authorityId: input.snapshot.authorityId,
    description: `READINESS_ESCALATION: ${input.gateDecision} does not permit ${input.snapshot.readiness} at ${input.snapshot.authorityId}. Max allowed: ${getMaxAllowedReadiness(input.gateDecision, authorityKind)}.`,
    severity: 'CRITICAL',
    evidence: [
      `GATE_${input.gateDecision}`,
      `CURRENT_${input.snapshot.readiness}`,
      `MAX_${getMaxAllowedReadiness(input.gateDecision, authorityKind)}`,
    ],
  };
}

export function analyzeReadinessPropagation(
  snapshots: readonly AuthorityProjectSnapshot[],
  gateDecision?: PlanningGateDecision | null,
): ReadinessPropagationAnalysis {
  const issues: PropagationIssueItem[] = [];
  const steps: import('./orchestration-proof-types.js').ReadinessPropagationStep[] = [];

  let inflationAuthority: import('./orchestration-proof-types.js').AuthorityId | null = null;
  let previousLevel = 0;
  let previousReadiness = '';

  for (const snap of snapshots) {
    if (!snap.reached || !snap.readiness) continue;

    const level = readinessLevel(snap.readiness);
    steps.push({
      readOnly: true,
      authorityId: snap.authorityId,
      readiness: snap.readiness,
      readinessLevel: level,
    });

    if (gateDecision) {
      const authorityKind = gateDecisionToAuthorityKind(snap.authorityId);
      if (authorityKind && isReadinessEscalation(gateDecision, authorityKind, snap.readiness)) {
        inflationAuthority = snap.authorityId;
        issues.push(pushGateEscalationIssue({ gateDecision, snapshot: snap }));
      }
    }

    if (previousReadiness && level >= previousLevel + 3) {
      issueCounter += 1;
      inflationAuthority = snap.authorityId;
      issues.push({
        readOnly: true,
        issueId: `readiness-issue-${issueCounter}`,
        issueType: 'READINESS_INFLATION',
        authorityId: snap.authorityId,
        description: `Readiness inflated from ${previousReadiness} (level ${previousLevel}) to ${snap.readiness} (level ${level}) at ${snap.authorityId}.`,
        severity: level >= 5 && previousLevel <= 1 ? 'CRITICAL' : 'HIGH',
        evidence: [`PREVIOUS_${previousReadiness}`, `CURRENT_${snap.readiness}`],
      });
    } else if (
      previousReadiness &&
      previousLevel <= 1 &&
      level >= 4 &&
      snap.authorityId !== 'UNIFIED_INTAKE_INTELLIGENCE'
    ) {
      issueCounter += 1;
      inflationAuthority = snap.authorityId;
      issues.push({
        readOnly: true,
        issueId: `readiness-issue-${issueCounter}`,
        issueType: 'READINESS_INFLATION',
        authorityId: snap.authorityId,
        description: `Invalid readiness jump: ${previousReadiness} → ${snap.readiness} without intermediate gate approval.`,
        severity: 'CRITICAL',
        evidence: [`PREVIOUS_${previousReadiness}`, `CURRENT_${snap.readiness}`, 'INVALID_JUMP'],
      });
    }

    previousLevel = level;
    previousReadiness = snap.readiness;
  }

  return {
    readOnly: true,
    steps,
    inflationDetected: inflationAuthority != null,
    inflationAuthority,
    issues,
  };
}
