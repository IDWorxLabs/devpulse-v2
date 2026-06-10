/**
 * User Guides — reporting.
 */

import type {
  FeatureDiscoveryGuideAnalysis,
  OnboardingGuideAnalysis,
  ResultsInterpretationGuideAnalysis,
  SafetyGuideAnalysis,
  UserGuideRecord,
  UserGuidesEvaluation,
  UserGuidesReport,
  WorkflowGuideAnalysis,
} from './user-guides-types.js';
import { getUserGuidesCacheStats } from './user-guides-cache.js';
import { getUserGuidesHistorySize } from './user-guides-history.js';

let reportCount = 0;

export function generateUserGuidesReport(
  record: UserGuideRecord,
  evaluation: UserGuidesEvaluation,
  onboarding: OnboardingGuideAnalysis,
  workflow: WorkflowGuideAnalysis,
  feature: FeatureDiscoveryGuideAnalysis,
  safety: SafetyGuideAnalysis,
  interpretation: ResultsInterpretationGuideAnalysis,
  missingSignals: string[],
): UserGuidesReport {
  reportCount += 1;
  const cache = getUserGuidesCacheStats();
  const recommendations: string[] = [];

  const undocumentedAreas = [
    ...onboarding.undocumentedOnboardingAreas,
    ...workflow.undocumentedWorkflows,
    ...feature.undocumentedFeatures,
    ...safety.undocumentedSafetyAreas,
    ...interpretation.undocumentedResultAreas,
  ];

  if (onboarding.undocumentedOnboardingAreas.length > 0) {
    recommendations.push('Add onboarding guidance for first launch, projects, chat, and verification');
  }
  if (workflow.undocumentedWorkflows.length > 0) {
    recommendations.push('Document project, verification, notification, and mobile workflows');
  }
  if (feature.undocumentedFeatures.length > 0) {
    recommendations.push('Improve feature discovery via capabilities and find panel aliases');
  }
  if (safety.undocumentedSafetyAreas.length > 0) {
    recommendations.push('Clarify safe usage, trust, privacy, and mobile control awareness');
  }
  if (interpretation.undocumentedResultAreas.length > 0) {
    recommendations.push('Explain how to read trust scores, verification results, and checkpoints');
  }
  if (missingSignals.length > 0) {
    recommendations.push('Collect missing user guide signals before public rollout');
  }
  if (evaluation.state === 'READY' || evaluation.state === 'PARTIAL') {
    recommendations.push('Continue user guide coverage monitoring');
  } else {
    recommendations.push('Require user guide review before general user access');
  }

  return {
    userCoverageScore: record.userCoverageScore,
    onboardingCoverageScore: record.onboardingCoverageScore,
    workflowCoverageScore: record.workflowCoverageScore,
    featureCoverageScore: evaluation.featureCoverageScore,
    safetyCoverageScore: evaluation.safetyCoverageScore,
    interpretationCoverageScore: evaluation.interpretationCoverageScore,
    completenessLevel: record.completenessLevel,
    state: record.state,
    confidence: record.confidence,
    onboardingGuidance: [
      'Start by creating a project',
      'Use chat to ask questions about your project',
      'Check notifications for important updates',
      ...onboarding.onboardingWarnings,
    ],
    workflowGuidance: [
      'Create and manage projects through the project workflow',
      'Run verification to validate changes',
      'Use mobile control for remote operations',
      ...workflow.workflowWarnings,
    ],
    featureGuidance: [
      'Discover features through the find panel',
      'Explore capabilities by name or alias',
      ...feature.featureWarnings,
    ],
    safetyGuidance: [
      'Review trust and verification results before acting',
      'Respect privacy and security boundaries',
      ...safety.safetyWarnings,
    ],
    interpretationGuidance: [
      'Trust scores indicate overall system confidence',
      'Verification results show what passed or failed',
      'Hardening scores reflect product readiness',
      ...interpretation.interpretationWarnings,
    ],
    undocumentedAreas: [...new Set(undocumentedAreas)],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getUserGuidesHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetUserGuidesReportingForTests(): void {
  reportCount = 0;
}
