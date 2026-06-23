/**
 * Universal Feature Contract Intelligence V1 — Launch Council integration.
 */

import type { LaunchCouncilAuthorityResult, LaunchCouncilAuthorityStatus } from '../launch-council/launch-council-types.js';
import { getLastUniversalFeatureContractAssessment } from './universal-feature-contract-authority.js';

export function mapUniversalFeatureContractLaunchCouncilAuthority(): LaunchCouncilAuthorityResult {
  const assessment = getLastUniversalFeatureContractAssessment();
  if (!assessment) {
    return {
      authorityId: 'universal-feature-contract-intelligence',
      authorityName: 'Universal Feature Contract Intelligence',
      authorityCategory: 'PRODUCT_EXPERIENCE',
      score: 0,
      confidence: 0,
      status: 'NOT_RUN' as LaunchCouncilAuthorityStatus,
      launchBlocker: false,
      findings: ['Universal Feature Contract Intelligence has not been run against Live Preview.'],
      recommendations: ['Run npm run validate:universal-feature-contract-intelligence-v1 before launch.'],
    };
  }

  const status: LaunchCouncilAuthorityStatus = assessment.passed
    ? assessment.verdict === 'FEATURE_REALITY_NEEDS_IMPROVEMENT'
      ? 'WARNING'
      : 'PASS'
    : 'FAIL';

  return {
    authorityId: 'universal-feature-contract-intelligence',
    authorityName: 'Universal Feature Contract Intelligence',
    authorityCategory: 'PRODUCT_EXPERIENCE',
    score: assessment.scores.overallFeatureRealityScore,
    confidence: assessment.scores.executionScore,
    status,
    launchBlocker: assessment.blocksLaunchReadiness,
    findings: assessment.failedChecks.slice(0, 6).map((check) => `${check.label}: ${check.detail}`),
    recommendations: assessment.passed
      ? ['Universal Feature Contract Intelligence passed rendered runtime checks.']
      : [
          assessment.blocksLaunchReadinessReason ??
            'Improve universal feature contract behavior before launch.',
          'Re-run validate:universal-feature-contract-intelligence-v1 after fixes.',
        ],
  };
}
