/**
 * Evidence evaluation engine — evaluates evidence references for learning events.
 * Recording only. No execution or file modification.
 */

import type { GateRecord, LearningEventInput } from './types.js';

export interface EvidenceEvaluationResult {
  valid: boolean;
  blocked: boolean;
  reason: string;
  gates: GateRecord[];
  evaluatedEvidence: string[];
  evidenceScore: number;
}

export function evidenceEvaluationKey(evidenceRefs: string[]): string {
  return evidenceRefs.slice().sort().join('|') || 'no-evidence';
}

export function evaluateLearningEvidence(input: LearningEventInput): EvidenceEvaluationResult {
  const gates: GateRecord[] = [];
  const refs = input.evidenceRefs ?? [];
  const evaluatedEvidence: string[] = [];

  if (refs.length === 0) {
    gates.push({
      gateId: 'evd-none-0001',
      gateType: 'EVIDENCE_OPTIONAL',
      status: 'OPEN',
      description: 'No evidence refs provided — learning proceeds with event summary only',
    });
    return {
      valid: true,
      blocked: false,
      reason: 'No evidence refs — summary-only learning',
      gates,
      evaluatedEvidence,
      evidenceScore: 0.25,
    };
  }

  for (const ref of refs) {
    if (!ref?.trim()) continue;
    evaluatedEvidence.push(ref.trim());
  }

  if (evaluatedEvidence.length === 0) {
    gates.push({
      gateId: 'evd-empty-0001',
      gateType: 'EVIDENCE_EMPTY',
      status: 'CLOSED',
      description: 'Evidence refs provided but all empty',
    });
    return {
      valid: false,
      blocked: true,
      reason: 'Evidence refs empty',
      gates,
      evaluatedEvidence,
      evidenceScore: 0,
    };
  }

  gates.push({
    gateId: 'evd-eval-0001',
    gateType: 'EVIDENCE_EVALUATED',
    status: 'OPEN',
    description: `${evaluatedEvidence.length} evidence reference(s) evaluated`,
  });

  const evidenceScore = Math.min(1, 0.4 + evaluatedEvidence.length * 0.15);

  return {
    valid: true,
    blocked: false,
    reason: 'Evidence evaluated',
    gates,
    evaluatedEvidence,
    evidenceScore,
  };
}
