/**
 * Traffic evidence analyzer — observed traffic only; no inferred users.
 */

import { FABRICATED_EVIDENCE_SOURCES } from './post-launch-reality-registry.js';
import type {
  PostLaunchTrafficEvidence,
  TrafficEvidenceAnalysis,
} from './post-launch-reality-types.js';

function isFabricated(source: string): boolean {
  return FABRICATED_EVIDENCE_SOURCES.some((s) => source.toUpperCase().includes(s));
}

function hasValidEvidence(evidence: PostLaunchTrafficEvidence | null, rejectFabricated: boolean): boolean {
  if (!evidence) return false;
  if (!evidence.evidenceSource || evidence.evidencePaths.length === 0) return false;
  if (rejectFabricated && isFabricated(evidence.evidenceSource)) return false;
  return true;
}

export function analyzeTrafficEvidence(input: {
  evidence: PostLaunchTrafficEvidence | null;
  launchObserved: boolean;
  runtimeProofOnly?: boolean;
  launchReadinessOnly?: boolean;
  rejectFabricated?: boolean;
}): TrafficEvidenceAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.launchReadinessOnly || input.runtimeProofOnly) {
    missingEvidence.push('Post-launch traffic evidence not available — launch readiness/runtime proof is not usage');
    riskSignals.push('Upstream launch/runtime proof cannot substitute for observed traffic');
    return {
      readOnly: true,
      trafficObserved: false,
      sessionsObserved: null,
      usersObserved: null,
      trend: 'UNKNOWN',
      trafficConfidence: 'UNKNOWN',
      trafficScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.launchObserved) {
    missingEvidence.push('Product not observed as launched — no post-launch traffic expected');
    return {
      readOnly: true,
      trafficObserved: false,
      sessionsObserved: null,
      usersObserved: null,
      trend: 'UNKNOWN',
      trafficConfidence: 'UNKNOWN',
      trafficScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No analytics or usage traffic report observed');
    return {
      readOnly: true,
      trafficObserved: false,
      sessionsObserved: null,
      usersObserved: null,
      trend: 'UNKNOWN',
      trafficConfidence: 'UNKNOWN',
      trafficScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Traffic metrics rejected — missing evidence paths or fabricated source');
    riskSignals.push('Fabricated or unverifiable traffic metrics rejected');
    return {
      readOnly: true,
      trafficObserved: false,
      sessionsObserved: null,
      usersObserved: null,
      trend: 'UNKNOWN',
      trafficConfidence: 'UNKNOWN',
      trafficScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  const sessions = input.evidence.sessionsObserved;
  const users = input.evidence.usersObserved;
  const trafficObserved = input.evidence.trafficObserved && ((sessions ?? 0) > 0 || (users ?? 0) > 0);

  let trafficScore = 0;
  if (trafficObserved) {
    trafficScore = 30;
    if ((sessions ?? 0) >= 10) trafficScore += 20;
    if ((users ?? 0) >= 5) trafficScore += 20;
    if (input.evidence.trend === 'UP') trafficScore += 15;
    if (input.evidence.trend === 'FLAT') trafficScore += 5;
  }

  let trafficConfidence: TrafficEvidenceAnalysis['trafficConfidence'] = 'LOW';
  if (input.evidence.evidencePaths.length >= 2) trafficConfidence = 'MEDIUM';
  if (input.evidence.evidencePaths.length >= 1 && trafficObserved && (sessions ?? 0) >= 10) {
    trafficConfidence = 'HIGH';
  }

  return {
    readOnly: true,
    trafficObserved,
    sessionsObserved: sessions,
    usersObserved: users,
    trend: input.evidence.trend,
    trafficConfidence,
    trafficScore: Math.min(100, trafficScore),
    missingEvidence,
    riskSignals,
  };
}
