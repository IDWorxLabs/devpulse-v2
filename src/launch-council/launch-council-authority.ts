/**
 * Launch Council Authority — read-only advisory orchestration for launch authorities.
 */

import { createHash } from 'node:crypto';
import {
  LAUNCH_COUNCIL_CACHE_KEY_PREFIX,
  MAX_COUNCIL_FINDINGS,
  MAX_COUNCIL_RECOMMENDATIONS,
} from './launch-council-bounds.js';
import { recordLaunchCouncilAssessment } from './launch-council-history.js';
import {
  buildLaunchCouncilReport,
  buildLaunchCouncilReportMarkdown,
} from './launch-council-report-builder.js';
import { getLaunchCouncilAuthority, validateLaunchCouncilAuthorityIds } from './launch-council-registry.js';
import {
  buildLaunchCouncilCacheKey,
  calculateLaunchCouncilConfidenceScore,
  calculateLaunchCouncilOverallScore,
  countLaunchCouncilBlockers,
  deriveLaunchCouncilReadinessState,
} from './launch-council-score-builder.js';
import type {
  AssessLaunchCouncilInput,
  LaunchCouncilAssessment,
  LaunchCouncilAuthorityResult,
  LaunchCouncilReport,
} from './launch-council-types.js';

function stableCacheKey(authorityResults: LaunchCouncilAuthorityResult[]): string {
  const digest = createHash('sha256').update(buildLaunchCouncilCacheKey(authorityResults)).digest('hex').slice(0, 16);
  return `${LAUNCH_COUNCIL_CACHE_KEY_PREFIX}:${digest}`;
}

function sortAuthorityResults(results: LaunchCouncilAuthorityResult[]): LaunchCouncilAuthorityResult[] {
  return [...results].sort((left, right) => {
    const leftOrder = getLaunchCouncilAuthority(left.authorityId)?.registrationOrder ?? 999;
    const rightOrder = getLaunchCouncilAuthority(right.authorityId)?.registrationOrder ?? 999;
    return leftOrder - rightOrder;
  });
}

function aggregateFindings(results: LaunchCouncilAuthorityResult[]): string[] {
  return [...new Set(results.flatMap((result) => result.findings))].slice(0, MAX_COUNCIL_FINDINGS);
}

function aggregateRecommendations(results: LaunchCouncilAuthorityResult[]): string[] {
  return [...new Set(results.flatMap((result) => result.recommendations))].slice(0, MAX_COUNCIL_RECOMMENDATIONS);
}

export function assessLaunchCouncil(input: AssessLaunchCouncilInput): LaunchCouncilAssessment {
  const validation = validateLaunchCouncilAuthorityIds(input.authorityResults.map((result) => result.authorityId));
  if (!validation.valid) {
    throw new Error(
      `Launch Council received unregistered authority IDs: ${validation.unknownIds.join(', ') || 'none'}`,
    );
  }

  const authorityResults = sortAuthorityResults(input.authorityResults);
  const participatingAuthorities = authorityResults.filter((result) => result.status !== 'NOT_RUN').length;
  const overallScore = calculateLaunchCouncilOverallScore(authorityResults);
  const confidenceScore = calculateLaunchCouncilConfidenceScore(authorityResults);
  const launchBlockerCount = countLaunchCouncilBlockers(authorityResults);
  const readinessState = deriveLaunchCouncilReadinessState(authorityResults);

  const assessment: LaunchCouncilAssessment = {
    readOnly: true,
    advisoryOnly: true,
    overallScore,
    confidenceScore,
    launchBlockerCount,
    participatingAuthorities,
    readinessState,
    authorityResults,
    findings: aggregateFindings(authorityResults),
    recommendations: aggregateRecommendations(authorityResults),
    cacheKey: stableCacheKey(authorityResults),
  };

  recordLaunchCouncilAssessment(assessment);
  return assessment;
}

export function buildLaunchCouncilArtifacts(
  assessment: LaunchCouncilAssessment,
  generatedAt: number,
): { report: LaunchCouncilReport; reportMarkdown: string } {
  const report = buildLaunchCouncilReport(assessment, generatedAt);
  const reportMarkdown = buildLaunchCouncilReportMarkdown(assessment, report);
  return { report, reportMarkdown };
}
