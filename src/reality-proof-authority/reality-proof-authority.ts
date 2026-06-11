/**
 * Reality-Proof Authority — deterministic reality versus assumption evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithCompetitiveReality } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  REALITY_PROOF_BLOCK_SCORE,
  REALITY_PROOF_CACHE_KEY_PREFIX,
  REALITY_PROOF_UNKNOWN_BLOCK_COUNT,
  MAX_REALITY_PROOF_RECOMMENDATIONS,
} from './reality-proof-bounds.js';
import { classifyRealityProofFindings, countRealityLevels } from './reality-proof-classifier.js';
import { recordRealityProofAssessment } from './reality-proof-history.js';
import { buildRealityProofReportMarkdown } from './reality-proof-report-builder.js';
import type { RealityProofAssessment, RealityProofReadinessState } from './reality-proof-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function deriveReadinessState(
  realityProofScore: number,
  blocksLaunchReadiness: boolean,
  assumedRealityCount: number,
  provenRealityCount: number,
): RealityProofReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (assumedRealityCount > provenRealityCount) return 'ASSUMPTION_HEAVY';
  if (realityProofScore >= 80) return 'REALITY_PROVEN';
  if (realityProofScore >= 70) return 'MOSTLY_PROVEN';
  if (realityProofScore >= REALITY_PROOF_BLOCK_SCORE) return 'PARTIALLY_PROVEN';
  return 'ASSUMPTION_HEAVY';
}

function buildRecommendations(assessment: Omit<RealityProofAssessment, 'recommendations' | 'cacheKey'>): string[] {
  const items: string[] = [];
  if (assessment.blocksLaunchReadiness) {
    items.push('Do not treat launch readiness as proven until reality proof clears blocking thresholds.');
  }
  if (assessment.assumedRealityCount > assessment.provenRealityCount) {
    items.push('Reduce assumed evidence — convert assumptions into observed or proven runtime checks.');
  }
  if (assessment.unknownRealityCount >= REALITY_PROOF_UNKNOWN_BLOCK_COUNT) {
    items.push('Resolve unknown evidence areas before external launch.');
  }
  if (assessment.inferredRealityCount > assessment.observedRealityCount) {
    items.push('Authority conclusions outpace observed reality — validate top claims with execution proof.');
  }
  if (assessment.realityProofScore < REALITY_PROOF_BLOCK_SCORE) {
    items.push(`Raise reality proof score from ${assessment.realityProofScore} toward ${REALITY_PROOF_BLOCK_SCORE}+.`);
  }
  if (!items.length) {
    items.push('Maintain runtime proof for every launch-critical claim.');
  }
  return items.slice(0, MAX_REALITY_PROOF_RECOMMENDATIONS);
}

function stableCacheKey(report: FounderTestV4ReportWithCompetitiveReality, score: number): string {
  const digest = createHash('sha256')
    .update(
      [
        report.generatedAt,
        report.repositoryTypecheckReality.readinessState,
        report.chatIntelligenceReality.scenariosRun,
        report.verificationResultsVisibility.state,
        report.durationMs,
        score,
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
  return `${REALITY_PROOF_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessRealityProofAuthority(
  report: FounderTestV4ReportWithCompetitiveReality,
): RealityProofAssessment {
  const findings = classifyRealityProofFindings(report);
  const counts = countRealityLevels(findings);
  const total = findings.length || 1;
  const realityBacked = counts.provenRealityCount + counts.observedRealityCount;
  const riskBacked = counts.assumedRealityCount + counts.unknownRealityCount;
  const realityProofScore = clamp((realityBacked / total) * 100);
  const realityRiskScore = clamp((riskBacked / total) * 100);
  const blocksLaunchReadiness =
    realityProofScore < REALITY_PROOF_BLOCK_SCORE ||
    counts.assumedRealityCount > counts.provenRealityCount ||
    counts.unknownRealityCount >= REALITY_PROOF_UNKNOWN_BLOCK_COUNT;
  const readinessState = deriveReadinessState(
    realityProofScore,
    blocksLaunchReadiness,
    counts.assumedRealityCount,
    counts.provenRealityCount,
  );

  const partial = {
    readOnly: true as const,
    advisoryOnly: true as const,
    realityProofScore,
    ...counts,
    realityRiskScore,
    blocksLaunchReadiness,
    readinessState,
    findings,
  };

  const assessment: RealityProofAssessment = {
    ...partial,
    recommendations: buildRecommendations(partial),
    cacheKey: stableCacheKey(report, realityProofScore),
  };

  recordRealityProofAssessment(assessment);
  return assessment;
}

export function buildRealityProofAuthorityArtifacts(
  report: FounderTestV4ReportWithCompetitiveReality,
): {
  realityProofAuthority: RealityProofAssessment;
  realityProofAuthorityReportMarkdown: string;
} {
  const realityProofAuthority = assessRealityProofAuthority(report);
  return {
    realityProofAuthority,
    realityProofAuthorityReportMarkdown: buildRealityProofReportMarkdown(
      realityProofAuthority,
      report.generatedAt,
    ),
  };
}
