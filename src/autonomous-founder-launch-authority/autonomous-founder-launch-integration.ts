/**
 * Autonomous Founder Launch Authority V1 — Launch Council integration.
 */

import type { LaunchCouncilAuthorityResult, LaunchCouncilAuthorityStatus } from '../launch-council/launch-council-types.js';
import { getLastAutonomousFounderLaunchAssessment } from './autonomous-founder-launch-orchestrator.js';

export function mapAutonomousFounderLaunchCouncilAuthority(): LaunchCouncilAuthorityResult {
  const assessment = getLastAutonomousFounderLaunchAssessment();
  if (!assessment) {
    return {
      authorityId: 'autonomous-founder-launch-authority',
      authorityName: 'Autonomous Founder Launch Authority',
      authorityCategory: 'FOUNDER_LAUNCH_AUTHORITY',
      score: 0,
      confidence: 0,
      status: 'NOT_RUN' as LaunchCouncilAuthorityStatus,
      launchBlocker: false,
      findings: ['Autonomous Founder Launch Authority has not been run.'],
      recommendations: ['Run npm run validate:autonomous-founder-launch-authority-v1 before launch.'],
    };
  }

  const status: LaunchCouncilAuthorityStatus = assessment.passed
    ? assessment.verdict === 'LAUNCH_READY_WITH_WARNINGS'
      ? 'WARNING'
      : 'PASS'
    : 'FAIL';

  const founderReviewer = assessment.reviewers.find((reviewer) => reviewer.role === 'founder');

  return {
    authorityId: 'autonomous-founder-launch-authority',
    authorityName: 'Autonomous Founder Launch Authority',
    authorityCategory: 'FOUNDER_LAUNCH_AUTHORITY',
    score: assessment.scores.overallFounderScore,
    confidence: founderReviewer?.founderConfidence ?? assessment.scores.founderScore,
    status,
    launchBlocker: assessment.blocksLaunch,
    findings: assessment.reviewers
      .flatMap((reviewer) => reviewer.risks.slice(0, 1))
      .slice(0, 5),
    recommendations: assessment.passed
      ? [`Founder verdict: ${assessment.verdict}`]
      : [
          assessment.blocksLaunchReason ?? 'Founder launch review did not approve release.',
          'Re-run validate:autonomous-founder-launch-authority-v1 after remediation.',
        ],
  };
}
