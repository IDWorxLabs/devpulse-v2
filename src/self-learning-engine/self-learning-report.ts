/**
 * Self-learning report — founder-readable learning reports.
 * Reporting only. No execution.
 */

import type {
  LearningEventInput,
  SelfLearningEngineState,
  SelfLearningReport,
  SelfLearningReportOutput,
  SelfLearningResult,
} from './types.js';
import { SELF_LEARNING_ENGINE_OWNER_MODULE } from './types.js';

export function buildSelfLearningReportOutput(
  input: LearningEventInput,
  result: SelfLearningResult,
): SelfLearningReportOutput {
  return {
    selfLearningRecordId: result.selfLearningRecordId,
    learningEventId: result.learningEventId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    sourceSystem: result.sourceSystem,
    sourceId: result.sourceId,
    eventType: result.eventType,
    learningCategory: result.learningCategory,
    learningState: result.learningState,
    confidenceScore: result.confidenceScore,
    extractedPatternCount: result.extractedPatterns.length,
    futureGuidanceCount: result.futureGuidance.length,
    governanceGateCount: result.governanceGates.length,
    ownershipGateCount: result.ownershipGates.length,
    securityWarningCount: result.securityWarnings.length,
    recommendationCount: result.recommendations.length,
    confirmation: result.confirmation,
  };
}

export function buildSelfLearningReport(
  state: SelfLearningEngineState,
  result: SelfLearningResult,
  output: SelfLearningReportOutput,
): SelfLearningReport {
  return {
    ownerModule: SELF_LEARNING_ENGINE_OWNER_MODULE,
    reportId: `report-${result.selfLearningRecordId}`,
    selfLearningRecordId: output.selfLearningRecordId,
    learningEventId: output.learningEventId,
    workspaceId: output.workspaceId,
    projectId: output.projectId,
    sourceSystem: output.sourceSystem,
    sourceId: result.sourceId,
    eventType: output.eventType,
    learningCategory: output.learningCategory,
    learningState: output.learningState,
    confidenceScore: output.confidenceScore,
    extractedPatternCount: output.extractedPatternCount,
    futureGuidanceCount: output.futureGuidanceCount,
    governanceGateCount: output.governanceGateCount,
    ownershipGateCount: output.ownershipGateCount,
    securityWarningCount: output.securityWarningCount,
    recommendationCount: output.recommendationCount,
    confirmation: output.confirmation,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation: 'Self-learning foundation only — records lessons for future recommendations without automatic behavior change.',
  };
}

export function formatSelfLearningReport(
  state: SelfLearningEngineState,
  result: SelfLearningResult,
  input: LearningEventInput,
): string {
  const output = buildSelfLearningReportOutput(input, result);
  const lines = [
    '=== DevPulse V2 Self-Learning Engine Report ===',
    'Phase 9.3 — Self-Learning Engine Foundation V1',
    '',
    `Record ID: ${output.selfLearningRecordId}`,
    `Learning Event: ${output.learningEventId}`,
    `Workspace: ${output.workspaceId}`,
    `Project: ${output.projectId}`,
    `Source: ${output.sourceSystem} (${result.sourceId})`,
    `Event Type: ${output.eventType}`,
    `Category: ${output.learningCategory}`,
    `State: ${output.learningState}`,
    `Confidence: ${output.confidenceScore}`,
    '',
    `Patterns Extracted: ${output.extractedPatternCount}`,
    `Future Guidance: ${output.futureGuidanceCount}`,
    `Governance Gates: ${output.governanceGateCount}`,
    `Ownership Gates: ${output.ownershipGateCount}`,
    '',
    '--- Confirmations ---',
    `No execution performed: CONFIRMED`,
    `No commands executed: CONFIRMED`,
    `No files modified: CONFIRMED`,
    `No code generated: CONFIRMED`,
    `No deployment performed: CONFIRMED`,
    `No model training performed: CONFIRMED`,
    `No automatic behavior change performed: CONFIRMED`,
    `Self-learning foundation only: CONFIRMED`,
    '',
    `Lesson: ${result.lessonSummary.slice(0, 120)}...`,
    '',
    `Foundation ID: ${state.foundationId}`,
  ];
  return lines.join('\n');
}
