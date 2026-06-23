/**
 * Engineering Reality Authority V1 — Launch Council integration.
 */

import type { LaunchCouncilAuthorityResult, LaunchCouncilAuthorityStatus } from '../launch-council/launch-council-types.js';
import { getLastEngineeringRealityAssessment } from './engineering-reality-authority.js';

export function mapEngineeringRealityLaunchCouncilAuthority(): LaunchCouncilAuthorityResult {
  const assessment = getLastEngineeringRealityAssessment();
  if (!assessment) {
    return {
      authorityId: 'engineering-reality-authority',
      authorityName: 'Engineering Reality Authority',
      authorityCategory: 'ENGINEERING_REALITY',
      score: 0,
      confidence: 0,
      status: 'NOT_RUN' as LaunchCouncilAuthorityStatus,
      launchBlocker: false,
      findings: ['Engineering Reality Authority has not been run against Live Preview.'],
      recommendations: ['Run npm run validate:engineering-reality-v1 before launch.'],
    };
  }

  const status: LaunchCouncilAuthorityStatus = assessment.passed
    ? assessment.verdict === 'ENGINEERING_NEEDS_IMPROVEMENT'
      ? 'WARNING'
      : 'PASS'
    : 'FAIL';

  return {
    authorityId: 'engineering-reality-authority',
    authorityName: 'Engineering Reality Authority',
    authorityCategory: 'ENGINEERING_REALITY',
    score: assessment.scores.overallEngineeringScore,
    confidence: assessment.scores.securityScore,
    status,
    launchBlocker: assessment.blocksLaunchReadiness,
    findings: [
      ...assessment.security.criticalFindings.slice(0, 2),
      ...assessment.failedChecks.slice(0, 3).map((check) => `${check.label}: ${check.detail}`),
    ],
    recommendations: assessment.passed
      ? ['Engineering Reality Authority passed security, performance, and accessibility checks.']
      : [
          assessment.blocksLaunchReadinessReason ?? 'Improve engineering readiness before launch.',
          'Re-run validate:engineering-reality-v1 after fixes.',
        ],
  };
}
