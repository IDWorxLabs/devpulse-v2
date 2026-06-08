/**
 * World 2 learning loop founder-readable report.
 */

import type {
  LearningResult,
  World2LearningLoopState,
  World2LearningReport,
} from './types.js';
import { WORLD2_LEARNING_LOOP_OWNER_MODULE } from './types.js';

export function buildWorld2LearningReport(
  state: World2LearningLoopState,
  result: LearningResult,
): World2LearningReport {
  return {
    ownerModule: WORLD2_LEARNING_LOOP_OWNER_MODULE,
    learningId: result.learningId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    planId: result.planId,
    lessonCount: result.lessonCount,
    successPatternCount: result.successPatterns.length,
    failurePatternCount: result.failurePatterns.length,
    warningPatternCount: result.warningPatterns.length,
    recommendationPatternCount: result.recommendationPatterns.length,
    verificationPatternCount: result.verificationPatterns.length,
    riskPatternCount: result.riskPatterns.length,
    rollbackPatternCount: result.rollbackPatterns.length,
    governancePatternCount: result.governancePatterns.length,
    workspacePatternCount: result.workspacePatterns.length,
    futureRecommendationCount: result.futureRecommendations.length,
    learningConfidence: result.learningConfidence,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'World 2 Learning Loop Foundation V1 — learning only. No execution, file modification, or code generation.',
  };
}

export function formatWorld2LearningReport(
  state: World2LearningLoopState,
  result: LearningResult,
): string {
  const report = buildWorld2LearningReport(state, result);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'World 2 Learning Loop Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Loop ID: ${state.loopId}`,
    `Learning ID: ${report.learningId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Plan ID: ${report.planId}`,
    `Lesson count: ${report.lessonCount}`,
    `Success pattern count: ${report.successPatternCount}`,
    `Failure pattern count: ${report.failurePatternCount}`,
    `Warning pattern count: ${report.warningPatternCount}`,
    `Recommendation pattern count: ${report.recommendationPatternCount}`,
    `Verification pattern count: ${report.verificationPatternCount}`,
    `Risk pattern count: ${report.riskPatternCount}`,
    `Rollback pattern count: ${report.rollbackPatternCount}`,
    `Governance pattern count: ${report.governancePatternCount}`,
    `Workspace pattern count: ${report.workspacePatternCount}`,
    `Future recommendation count: ${report.futureRecommendationCount}`,
    `Learning confidence: ${report.learningConfidence}`,
    '',
    'Learning-only confirmations:',
    '  Learning-only foundation: CONFIRMED',
    '  No execution performed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
