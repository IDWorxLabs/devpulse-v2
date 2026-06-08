/**
 * Evidence evaluation engine — evaluates evidence references for completion truth.
 * Verification only. No file modification.
 */

import type { EvidenceResult } from './types.js';

const REQUIRED_EVIDENCE_TYPES = [
  'plan-evidence',
  'simulation-evidence',
  'builder-evidence',
] as const;

export function evaluateEvidence(evidenceReferences: string[]): EvidenceResult[] {
  const results: EvidenceResult[] = [];

  for (const evidenceType of REQUIRED_EVIDENCE_TYPES) {
    const found = evidenceReferences.some((ref) => ref.includes(evidenceType));
    results.push({
      resultId: `world2-evidence-${evidenceType}`,
      evidenceId: evidenceType,
      result: found ? 'PASSED' : 'FAILED',
      description: found
        ? `Evidence present: ${evidenceType}`
        : `Required evidence missing: ${evidenceType}`,
    });
  }

  for (const ref of evidenceReferences) {
    if (REQUIRED_EVIDENCE_TYPES.some((t) => ref.includes(t))) continue;
    results.push({
      resultId: `world2-evidence-extra-${ref.length}`,
      evidenceId: ref,
      result: 'PASSED',
      description: `Supplementary evidence: ${ref}`,
    });
  }

  return results;
}

export function countMissingEvidence(results: EvidenceResult[]): number {
  return results.filter((r) => r.result === 'FAILED').length;
}

export function evidenceResultsKey(results: EvidenceResult[]): string {
  return results.map((r) => `${r.evidenceId}|${r.result}`).join(';');
}
