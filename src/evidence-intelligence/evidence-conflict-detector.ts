/**
 * Evidence Intelligence — evidence conflict detector.
 */

import type { EvidenceConflict, EvidenceRecord } from './evidence-intelligence-types.js';

let conflictDetectionCount = 0;

export function detectEvidenceConflicts(records: EvidenceRecord[]): EvidenceConflict[] {
  conflictDetectionCount += 1;
  const conflicts: EvidenceConflict[] = [];

  const claims = new Map<string, EvidenceRecord[]>();
  for (const record of records) {
    if (!record.claim) continue;
    const key = record.claim.toLowerCase().trim();
    if (!claims.has(key)) claims.set(key, []);
    claims.get(key)!.push(record);
  }

  for (const [claim, group] of claims) {
    if (group.length < 2) continue;
    const strengths = group.map((r) => r.strength);
    const min = Math.min(...strengths);
    const max = Math.max(...strengths);
    if (max - min > 40) {
      conflicts.push({
        conflictType: 'contradictory',
        sources: [...new Set(group.map((r) => r.source))],
        description: `Contradictory evidence for claim: ${claim}`,
      });
    }
  }

  const trustHigh = records.filter((r) => r.trustworthiness >= 80);
  const trustLow = records.filter((r) => r.trustworthiness <= 30);
  if (trustHigh.length > 0 && trustLow.length > 0) {
    conflicts.push({
      conflictType: 'trust',
      sources: [...new Set([...trustHigh, ...trustLow].map((r) => r.source))],
      description: 'Trust conflict between high and low trustworthiness evidence',
    });
  }

  const verification = records.filter((r) => r.category === 'VERIFICATION');
  const verified = verification.filter((r) => r.status === 'ACTIVE');
  const unverified = verification.filter((r) => r.status === 'UNVERIFIED');
  if (verified.length > 0 && unverified.length > 0) {
    conflicts.push({
      conflictType: 'verification',
      sources: [...new Set([...verified, ...unverified].map((r) => r.source))],
      description: 'Verification conflict between verified and unverified evidence',
    });
  }

  const completion = records.filter((r) => r.category === 'COMPLETION');
  const complete = completion.filter((r) => r.strength >= 70);
  const incomplete = completion.filter((r) => r.strength < 40);
  if (complete.length > 0 && incomplete.length > 0) {
    conflicts.push({
      conflictType: 'completion',
      sources: [...new Set([...complete, ...incomplete].map((r) => r.source))],
      description: 'Completion conflict between strong and weak completion evidence',
    });
  }

  const governance = records.filter((r) => r.category === 'GOVERNANCE');
  const approved = governance.filter((r) => r.status === 'ACTIVE');
  const blocked = governance.filter((r) => r.status === 'BLOCKED');
  if (approved.length > 0 && blocked.length > 0) {
    conflicts.push({
      conflictType: 'governance',
      sources: [...new Set([...approved, ...blocked].map((r) => r.source))],
      description: 'Governance conflict between approved and blocked evidence',
    });
  }

  const bySource = new Map<string, number[]>();
  for (const record of records) {
    if (!bySource.has(record.source)) bySource.set(record.source, []);
    bySource.get(record.source)!.push(record.strength);
  }
  const sourceAvgs = [...bySource.entries()].map(([source, vals]) => ({
    source,
    avg: vals.reduce((s, v) => s + v, 0) / vals.length,
  }));
  if (sourceAvgs.length >= 2) {
    const avgs = sourceAvgs.map((s) => s.avg);
    const spread = Math.max(...avgs) - Math.min(...avgs);
    if (spread > 35) {
      conflicts.push({
        conflictType: 'source_disagreement',
        sources: sourceAvgs.map((s) => s.source as EvidenceConflict['sources'][number]),
        description: 'Source disagreement on evidence strength',
      });
    }
  }

  return conflicts;
}

export function getConflictDetectionCount(): number {
  return conflictDetectionCount;
}

export function resetEvidenceConflictDetectorForTests(): void {
  conflictDetectionCount = 0;
}
