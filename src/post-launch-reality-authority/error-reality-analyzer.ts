/**
 * Error reality analyzer — crashes, support tickets, uptime from observed operational reports.
 */

import { FABRICATED_EVIDENCE_SOURCES } from './post-launch-reality-registry.js';
import type {
  ErrorRealityAnalysis,
  PostLaunchErrorEvidence,
} from './post-launch-reality-types.js';

function isFabricated(source: string): boolean {
  return FABRICATED_EVIDENCE_SOURCES.some((s) => source.toUpperCase().includes(s));
}

export function analyzeErrorReality(input: {
  evidence: PostLaunchErrorEvidence | null;
  launchObserved: boolean;
  rejectFabricated?: boolean;
}): ErrorRealityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (!input.launchObserved) {
    missingEvidence.push('Operational error evidence not applicable — product not launched');
    return {
      readOnly: true,
      runtimeErrors: false,
      crashEvidence: false,
      supportEvidence: false,
      operationalStability: false,
      uptimePercent: null,
      reliabilityScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No crash, error, uptime, or support ticket reports observed');
    return {
      readOnly: true,
      runtimeErrors: false,
      crashEvidence: false,
      supportEvidence: false,
      operationalStability: false,
      uptimePercent: null,
      reliabilityScore: 50,
      missingEvidence,
      riskSignals: ['Operational stability unknown — no error/uptime evidence'],
    };
  }

  if (
    !input.evidence.evidenceSource ||
    input.evidence.evidencePaths.length === 0 ||
    (input.rejectFabricated && isFabricated(input.evidence.evidenceSource))
  ) {
    missingEvidence.push('Operational metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated operational metrics rejected');
    return {
      readOnly: true,
      runtimeErrors: false,
      crashEvidence: false,
      supportEvidence: false,
      operationalStability: false,
      uptimePercent: null,
      reliabilityScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  let reliabilityScore = 70;
  if (input.evidence.operationalStabilityObserved) reliabilityScore += 15;
  if (input.evidence.uptimePercent !== null && input.evidence.uptimePercent >= 99) reliabilityScore += 15;
  else if (input.evidence.uptimePercent !== null && input.evidence.uptimePercent >= 95) reliabilityScore += 5;

  if (input.evidence.runtimeErrorsObserved) {
    reliabilityScore -= 20;
    riskSignals.push('Runtime errors observed in post-launch evidence');
  }
  if (input.evidence.crashEvidenceObserved) {
    reliabilityScore -= 25;
    riskSignals.push('Crash evidence observed post-launch');
  }
  if (input.evidence.supportTicketsObserved) {
    reliabilityScore -= 10;
    riskSignals.push('Support tickets indicate user friction post-launch');
  }

  reliabilityScore = Math.min(100, Math.max(0, reliabilityScore));

  return {
    readOnly: true,
    runtimeErrors: input.evidence.runtimeErrorsObserved,
    crashEvidence: input.evidence.crashEvidenceObserved,
    supportEvidence: input.evidence.supportTicketsObserved,
    operationalStability: input.evidence.operationalStabilityObserved,
    uptimePercent: input.evidence.uptimePercent,
    reliabilityScore,
    missingEvidence,
    riskSignals,
  };
}
