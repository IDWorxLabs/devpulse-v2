/**
 * Universal App Blueprint Visual Validation Authority V1 — integration bridges.
 */

import type { LaunchCouncilAuthorityResult, LaunchCouncilAuthorityStatus } from '../launch-council/launch-council-types.js';
import { getLastBlueprintVisualAssessment } from './universal-app-blueprint-visual-authority.js';

export function mapUniversalAppBlueprintVisualLaunchCouncilAuthority(): LaunchCouncilAuthorityResult {
  const assessment = getLastBlueprintVisualAssessment();
  if (!assessment) {
    return {
      authorityId: 'universal-app-blueprint-visual',
      authorityName: 'Universal App Blueprint Visual Validation',
      authorityCategory: 'PRODUCT_EXPERIENCE',
      score: 0,
      confidence: 0,
      status: 'NOT_RUN' as LaunchCouncilAuthorityStatus,
      launchBlocker: false,
      findings: ['Blueprint visual validation has not been run against Live Preview.'],
      recommendations: ['Run npm run validate:universal-app-blueprint-visual-v1 before launch.'],
    };
  }

  const status: LaunchCouncilAuthorityStatus = assessment.passed
    ? assessment.verdict === 'BLUEPRINT_NEEDS_IMPROVEMENT'
      ? 'WARNING'
      : 'PASS'
    : 'FAIL';

  return {
    authorityId: 'universal-app-blueprint-visual',
    authorityName: 'Universal App Blueprint Visual Validation',
    authorityCategory: 'PRODUCT_EXPERIENCE',
    score: assessment.scores.overallBlueprintScore,
    confidence: assessment.scores.userExperienceScore,
    status,
    launchBlocker: assessment.blocksLaunchReadiness,
    findings: assessment.failedChecks.slice(0, 6).map((check) => `${check.label}: ${check.detail}`),
    recommendations: assessment.passed
      ? ['Blueprint visual validation passed rendered-app checks.']
      : [
          assessment.blocksLaunchReadinessReason ?? 'Improve blueprint visual quality before launch.',
          'Re-run validate:universal-app-blueprint-visual-v1 after fixes.',
        ],
  };
}

export function resolveBlueprintVisualValidationReady(): {
  validationReady: boolean;
  validationReadyReason: string;
} {
  const assessment = getLastBlueprintVisualAssessment();
  if (!assessment) {
    return {
      validationReady: false,
      validationReadyReason: 'Blueprint visual validation not yet run against rendered application.',
    };
  }
  if (assessment.blocksLaunchReadiness) {
    return {
      validationReady: false,
      validationReadyReason:
        assessment.blocksLaunchReadinessReason ??
        `Blueprint visual verdict ${assessment.verdict} blocks validation readiness.`,
    };
  }
  return {
    validationReady: true,
    validationReadyReason: `Blueprint visual validation passed (${assessment.verdict}, score ${assessment.scores.overallBlueprintScore}/100).`,
  };
}
