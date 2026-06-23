/**
 * Phase 26.92 — Capability boundary analyzer (V1).
 */

import type { OperationalEvidenceSnapshot } from '../chat-operational-self-knowledge/chat-operational-self-knowledge-types.js';

export function analyzeCapabilityBoundaries(
  answer: string,
  snapshot: OperationalEvidenceSnapshot,
): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 60;

  const hasProvenLabel = /\bPROVEN\b/.test(answer);
  const hasPartialLabel = /\bPARTIAL\b/.test(answer);
  const hasPlannedLabel = /\bPLANNED\b/.test(answer);
  const hasBoundarySection =
    /\b(proven|partial|planned|not proven|unproven)\b/i.test(answer) &&
    (hasProvenLabel || hasPartialLabel || hasPlannedLabel || /\bby proof level\b/i.test(answer));

  if (hasBoundarySection) score += 25;
  else issues.push('Missing PROVEN/PARTIAL/PLANNED boundary separation');

  if (snapshot.capabilityTruth.provenCount > 0 && !/\bproven\b/i.test(answer)) {
    issues.push('Did not reference proven capabilities from truth registry');
    score -= 10;
  } else if (snapshot.capabilityTruth.provenCount > 0) {
    score += 10;
  }

  if (snapshot.capabilityTruth.notProvenCount > 0 && !/\b(not proven|unproven|partial)\b/i.test(answer)) {
    issues.push('Did not acknowledge unproven capabilities');
    score -= 10;
  } else {
    score += 5;
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

export function analyzeIdentityClarity(answer: string, expectsFounder: boolean): number {
  let score = 50;
  if (/\baidevengine\b/i.test(answer)) score += 20;
  if (/\basgard dynamics\b/i.test(answer)) score += 15;
  if (expectsFounder && /\blungelo\b/i.test(answer) && /\bzungu\b/i.test(answer)) score += 15;
  if (!/\bdevpulse\b/i.test(answer) || /\b(legacy|historical|renamed|previous)\b/i.test(answer)) {
    score += 10;
  } else {
    score -= 20;
  }
  return Math.max(0, Math.min(100, score));
}

export function analyzeCapabilityAccuracy(answer: string): number {
  let score = 60;
  const concreteTerms = [
    'planning',
    'architecture',
    'validation',
    'execution',
    'founder test',
    'launch readiness',
    'typecheck',
    'workspace',
    'proof',
  ];
  const hits = concreteTerms.filter((term) => answer.toLowerCase().includes(term)).length;
  score += Math.min(40, hits * 5);
  return Math.max(0, Math.min(100, score));
}
