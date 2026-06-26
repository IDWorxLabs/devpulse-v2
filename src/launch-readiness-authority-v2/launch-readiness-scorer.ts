/**
 * Launch Readiness Authority V2 — engineering readiness scoring.
 */

import type {
  LaunchBlockerRecord,
  LaunchEvidenceCollectionResult,
  LaunchReadinessCategory,
  LaunchReadinessCategoryScore,
  LaunchReadinessScoreResult,
} from './launch-readiness-types.js';

const CATEGORY_SOURCES: Record<LaunchReadinessCategory, LaunchEvidenceCollectionResult['sources'][number]['sourceId'][]> =
  {
    INTENT_QUALITY: ['INTENT_UNDERSTANDING'],
    PROMPT_FAITHFULNESS: ['PROMPT_FAITHFULNESS'],
    CAPABILITY_READINESS: ['CAPABILITY_PLANNING', 'MISSING_CAPABILITY_EVOLUTION'],
    FEATURE_STABILITY: ['FEATURE_REALITY', 'INCREMENTAL_BUILD'],
    BEHAVIOR_READINESS: ['BEHAVIOR_SIMULATION'],
    USER_READINESS: ['VIRTUAL_USER'],
    DEVICE_READINESS: ['VIRTUAL_DEVICE'],
    INTERACTION_READINESS: ['INTERACTION_PROOF'],
    DEBUGGING_READINESS: ['AUTONOMOUS_DEBUGGING'],
    IMPROVEMENT_READINESS: ['CONTINUOUS_IMPROVEMENT'],
    SECURITY_READINESS: ['SECURITY_VALIDATION'],
    ACCESSIBILITY_READINESS: ['ACCESSIBILITY_VALIDATION'],
    PERFORMANCE_READINESS: ['PERFORMANCE_VALIDATION'],
    EXECUTION_READINESS: ['EXECUTION_TRACE', 'BUILD_REALITY'],
    MATERIALIZATION_READINESS: ['MATERIALIZATION_REALITY', 'WORKSPACE_REALITY'],
  };

function scoreSource(status: LaunchEvidenceCollectionResult['sources'][number]['status'], confidence: number): number {
  if (status === 'PASS') return confidence;
  if (status === 'WARNING') return Math.max(35, confidence - 20);
  if (status === 'FAIL') return Math.max(0, confidence - 40);
  return 0;
}

export function scoreLaunchReadiness(input: {
  evidence: LaunchEvidenceCollectionResult;
  blockers: readonly LaunchBlockerRecord[];
}): LaunchReadinessScoreResult {
  const categories: LaunchReadinessCategoryScore[] = [];

  for (const [category, sourceIds] of Object.entries(CATEGORY_SOURCES) as [
    LaunchReadinessCategory,
    LaunchEvidenceCollectionResult['sources'][number]['sourceId'][],
  ][]) {
    const related = input.evidence.sources.filter((s) => sourceIds.includes(s.sourceId));
    const evidenceCount = related.length;
    const score =
      evidenceCount === 0
        ? 0
        : Math.round(related.reduce((sum, s) => sum + scoreSource(s.status, s.confidence), 0) / evidenceCount);
    const warnings = related.flatMap((s) => s.warnings);
    const residualRisk = related.flatMap((s) => s.residualRisk);
    const blocking = related.some((s) => s.status === 'FAIL' || s.status === 'UNAVAILABLE') ||
      input.blockers.some((b) => sourceIds.includes(b.sourceId));

    categories.push({
      readOnly: true,
      category,
      score,
      evidenceCount,
      warnings,
      residualRisk,
      blocking,
    });
  }

  const overallScore = Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / Math.max(categories.length, 1),
  );
  const blockingCategories = categories.filter((c) => c.blocking).map((c) => c.category);

  return {
    readOnly: true,
    categories,
    overallScore,
    blockingCategories,
  };
}
