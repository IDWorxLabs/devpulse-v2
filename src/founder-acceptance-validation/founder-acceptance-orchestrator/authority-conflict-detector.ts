/**
 * Founder Acceptance Orchestrator — authority conflict detector.
 */

import type { AuthorityConflictAnalysis, AuthorityConflict } from './founder-acceptance-orchestrator-types.js';
import { AUTHORITY_CONFLICT_PASS } from './founder-acceptance-orchestrator-types.js';
import { getCachedAuthorityConflictAnalysis, setCachedAuthorityConflictAnalysis } from './founder-acceptance-cache.js';

export interface AuthorityConflictUpstream {
  workflowScore: number;
  confidenceScore: number;
  trustScore: number;
  productivityScore: number;
  frictionScore: number;
  readinessScore: number;
  overallAcceptanceScore: number;
}

let detectCount = 0;
let conflictCounter = 0;

function createConflict(params: {
  conflictCode: string;
  conflictReason: string;
  conflictSeverity: AuthorityConflict['conflictSeverity'];
}): AuthorityConflict {
  conflictCounter += 1;
  return {
    conflictId: `acceptance-conflict-${conflictCounter}`,
    conflictCode: params.conflictCode,
    conflictReason: params.conflictReason,
    conflictSeverity: params.conflictSeverity,
    sourceDetector: 'authority-conflict-detector',
  };
}

export function detectAuthorityConflicts(
  requestId: string,
  upstream: AuthorityConflictUpstream,
): AuthorityConflictAnalysis {
  const cacheKey = [requestId, upstream.workflowScore, upstream.trustScore, upstream.overallAcceptanceScore].join('|');
  const cached = getCachedAuthorityConflictAnalysis(cacheKey);
  if (cached) return cached;

  detectCount += 1;
  const conflicts: AuthorityConflict[] = [];

  if (upstream.workflowScore >= 75 && upstream.trustScore < 65) {
    conflicts.push(createConflict({
      conflictCode: 'ACCEPTANCE_CONFLICT',
      conflictReason: 'Workflow ready but trust weak — founder may not accept despite workflow operability',
      conflictSeverity: 'HIGH',
    }));
  }

  if (upstream.confidenceScore >= 75 && upstream.readinessScore < 65) {
    conflicts.push(createConflict({
      conflictCode: 'ACCEPTANCE_CONFLICT',
      conflictReason: 'Confidence high but readiness low — founder confidence does not translate to operational readiness',
      conflictSeverity: 'HIGH',
    }));
  }

  if (upstream.productivityScore >= 75 && upstream.frictionScore < 60) {
    conflicts.push(createConflict({
      conflictCode: 'ACCEPTANCE_CONFLICT',
      conflictReason: 'Productivity high but friction excessive — productivity gains undermined by friction',
      conflictSeverity: 'MEDIUM',
    }));
  }

  if (upstream.trustScore >= 75 && upstream.overallAcceptanceScore < 65) {
    conflicts.push(createConflict({
      conflictCode: 'ACCEPTANCE_CONFLICT',
      conflictReason: 'Trust high but acceptance low — trust alone insufficient for founder acceptance',
      conflictSeverity: 'HIGH',
    }));
  }

  const result: AuthorityConflictAnalysis = {
    conflicts: conflicts.slice(0, 8),
    passToken: AUTHORITY_CONFLICT_PASS,
  };
  setCachedAuthorityConflictAnalysis(cacheKey, result);
  return result;
}

export function getConflictDetectCount(): number {
  return detectCount;
}

export function resetAuthorityConflictDetectorForTests(): void {
  detectCount = 0;
  conflictCounter = 0;
}
