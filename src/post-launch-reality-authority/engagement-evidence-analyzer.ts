/**
 * Engagement evidence analyzer — feature usage and session quality from observed reports.
 */

import { FABRICATED_EVIDENCE_SOURCES } from './post-launch-reality-registry.js';
import type {
  EngagementEvidenceAnalysis,
  PostLaunchEngagementEvidence,
} from './post-launch-reality-types.js';

function isFabricated(source: string): boolean {
  return FABRICATED_EVIDENCE_SOURCES.some((s) => source.toUpperCase().includes(s));
}

export function analyzeEngagementEvidence(input: {
  evidence: PostLaunchEngagementEvidence | null;
  trafficObserved: boolean;
  runtimeProofOnly?: boolean;
  launchReadinessOnly?: boolean;
  rejectFabricated?: boolean;
}): EngagementEvidenceAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.launchReadinessOnly || input.runtimeProofOnly) {
    missingEvidence.push('Engagement evidence not available from launch readiness or runtime proof alone');
    return {
      readOnly: true,
      activeUsage: false,
      featureUsage: false,
      sessionQuality: null,
      userReturnSignals: false,
      engagementConfidence: 'UNKNOWN',
      engagementScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No engagement or feature usage report observed');
    return {
      readOnly: true,
      activeUsage: false,
      featureUsage: false,
      sessionQuality: null,
      userReturnSignals: false,
      engagementConfidence: 'UNKNOWN',
      engagementScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (
    !input.evidence.evidenceSource ||
    input.evidence.evidencePaths.length === 0 ||
    (input.rejectFabricated && isFabricated(input.evidence.evidenceSource))
  ) {
    missingEvidence.push('Engagement metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated engagement metrics rejected');
    return {
      readOnly: true,
      activeUsage: false,
      featureUsage: false,
      sessionQuality: null,
      userReturnSignals: false,
      engagementConfidence: 'UNKNOWN',
      engagementScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.trafficObserved) {
    riskSignals.push('Engagement reported without observed traffic — confidence reduced');
  }

  let engagementScore = 0;
  if (input.evidence.activeUsageObserved) engagementScore += 35;
  if (input.evidence.featureUsageObserved) engagementScore += 25;
  if (input.evidence.userReturnSignalsObserved) engagementScore += 20;
  if (input.evidence.sessionQualityScore !== null) {
    engagementScore += Math.round(input.evidence.sessionQualityScore * 0.2);
  }

  let engagementConfidence: EngagementEvidenceAnalysis['engagementConfidence'] = 'LOW';
  if (input.evidence.activeUsageObserved && input.evidence.featureUsageObserved) {
    engagementConfidence = 'MEDIUM';
  }
  if (input.trafficObserved && input.evidence.activeUsageObserved && input.evidence.evidencePaths.length >= 1) {
    engagementConfidence = 'HIGH';
  }

  return {
    readOnly: true,
    activeUsage: input.evidence.activeUsageObserved,
    featureUsage: input.evidence.featureUsageObserved,
    sessionQuality: input.evidence.sessionQualityScore,
    userReturnSignals: input.evidence.userReturnSignalsObserved,
    engagementConfidence,
    engagementScore: Math.min(100, engagementScore),
    missingEvidence,
    riskSignals,
  };
}
