/**
 * Feature Reality Validation Authority V1 — integration bridges.
 */

import type { LaunchCouncilAuthorityResult, LaunchCouncilAuthorityStatus } from '../launch-council/launch-council-types.js';
import { getLastFeatureRealityAssessment } from './feature-reality-validation-authority.js';

export function mapFeatureRealityLaunchCouncilAuthority(): LaunchCouncilAuthorityResult {
  const assessment = getLastFeatureRealityAssessment();
  if (!assessment) {
    return {
      authorityId: 'feature-reality-validation',
      authorityName: 'Feature Reality Validation',
      authorityCategory: 'PRODUCT_EXPERIENCE',
      score: 0,
      confidence: 0,
      status: 'NOT_RUN' as LaunchCouncilAuthorityStatus,
      launchBlocker: false,
      findings: ['Feature Reality Validation has not been run against Live Preview.'],
      recommendations: ['Run npm run validate:feature-reality-v1 before launch.'],
    };
  }

  const status: LaunchCouncilAuthorityStatus = assessment.passed
    ? assessment.verdict === 'FEATURE_NEEDS_IMPROVEMENT'
      ? 'WARNING'
      : 'PASS'
    : 'FAIL';

  return {
    authorityId: 'feature-reality-validation',
    authorityName: 'Feature Reality Validation',
    authorityCategory: 'PRODUCT_EXPERIENCE',
    score: assessment.scores.overallFeatureScore,
    confidence: assessment.scores.featureExecutionScore,
    status,
    launchBlocker: assessment.blocksLaunchReadiness,
    findings: assessment.failedChecks.slice(0, 6).map((check) => `${check.label}: ${check.detail}`),
    recommendations: assessment.passed
      ? ['Feature Reality Validation passed rendered runtime checks.']
      : [
          assessment.blocksLaunchReadinessReason ?? 'Improve core feature behavior before launch.',
          'Re-run validate:feature-reality-v1 after fixes.',
        ],
  };
}
