/**
 * Reality Verification Expansion — reality conflict detector.
 */

import type { ClaimValidation, RealityConflict, RealityRecord } from './reality-verification-types.js';

let conflictDetectionCount = 0;

export function detectRealityConflicts(
  records: RealityRecord[],
  validations: ClaimValidation[],
): RealityConflict[] {
  conflictDetectionCount += 1;
  const conflicts: RealityConflict[] = [];

  const contradicted = validations.filter((v) => v.supportStatus === 'CONTRADICTED');
  if (contradicted.length > 0) {
    conflicts.push({
      conflictType: 'claim',
      sources: [...new Set(records.filter((r) =>
        contradicted.some((v) => v.claimType === r.claimType),
      ).map((r) => r.source))],
      description: 'Claim contradicted by reality validation',
    });
  }

  const trustHigh = records.filter((r) => r.trustLevel >= 80);
  const trustLow = records.filter((r) => r.trustLevel <= 25);
  if (trustHigh.length > 0 && trustLow.length > 0) {
    conflicts.push({
      conflictType: 'trust',
      sources: [...new Set([...trustHigh, ...trustLow].map((r) => r.source))],
      description: 'Trust level conflict across reality records',
    });
  }

  const verified = records.filter((r) => r.verificationState === 'VERIFIED');
  const unverified = records.filter((r) => r.verificationState === 'UNVERIFIED');
  if (verified.length > 0 && unverified.length > 0) {
    conflicts.push({
      conflictType: 'evidence',
      sources: [...new Set([...verified, ...unverified].map((r) => r.source))],
      description: 'Verification state conflict in reality records',
    });
  }

  const complete = records.filter((r) => r.category === 'COMPLETION' && r.strength >= 75);
  const incomplete = records.filter((r) => r.category === 'COMPLETION' && r.strength < 35);
  if (complete.length > 0 && incomplete.length > 0) {
    conflicts.push({
      conflictType: 'completion',
      sources: [...new Set([...complete, ...incomplete].map((r) => r.source))],
      description: 'Completion reality conflict detected',
    });
  }

  const governed = records.filter((r) => r.category === 'GOVERNANCE' && r.strength >= 70);
  const blocked = records.filter((r) => r.category === 'GOVERNANCE' && r.strength < 30);
  if (governed.length > 0 && blocked.length > 0) {
    conflicts.push({
      conflictType: 'governance',
      sources: [...new Set([...governed, ...blocked].map((r) => r.source))],
      description: 'Governance reality conflict detected',
    });
  }

  const monitoring = records.filter((r) => r.category === 'MONITORING');
  if (monitoring.length >= 2) {
    const strengths = monitoring.map((r) => r.strength);
    if (Math.max(...strengths) - Math.min(...strengths) > 40) {
      conflicts.push({
        conflictType: 'monitoring',
        sources: monitoring.map((r) => r.source),
        description: 'Monitoring state disagreement',
      });
    }
  }

  const claimGroups = new Map<string, ClaimValidation[]>();
  for (const v of validations) {
    if (!claimGroups.has(v.claimType)) claimGroups.set(v.claimType, []);
    claimGroups.get(v.claimType)!.push(v);
  }
  for (const [, group] of claimGroups) {
    if (group.length < 2) continue;
    const statuses = new Set(group.map((v) => v.supportStatus));
    if (statuses.size > 1 && statuses.has('SUPPORTED') && statuses.has('UNSUPPORTED')) {
      conflicts.push({
        conflictType: 'claim',
        sources: records.filter((r) => group.some((v) => v.claimType === r.claimType)).map((r) => r.source),
        description: 'Conflicting claim support statuses',
      });
    }
  }

  return conflicts;
}

export function getConflictDetectionCount(): number {
  return conflictDetectionCount;
}

export function resetRealityConflictDetectorForTests(): void {
  conflictDetectionCount = 0;
}
