/**
 * World 2 completion verifier founder-readable report.
 */

import type {
  VerifierResult,
  World2CompletionReport,
  World2CompletionVerifierState,
} from './types.js';
import { WORLD2_COMPLETION_VERIFIER_OWNER_MODULE } from './types.js';

export function buildWorld2CompletionReport(
  state: World2CompletionVerifierState,
  result: VerifierResult,
): World2CompletionReport {
  return {
    ownerModule: WORLD2_COMPLETION_VERIFIER_OWNER_MODULE,
    verificationId: result.verificationId,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    planId: result.planId,
    simulationId: result.simulationId,
    builderId: result.builderId,
    completionStatus: result.completionStatus,
    completionConfidence: result.completionConfidence,
    passedRequirementCount: result.passedRequirements.length,
    failedRequirementCount: result.failedRequirements.length,
    verificationResultCount: result.verificationResults.length,
    riskControlResultCount: result.riskControlResults.length,
    rollbackResultCount: result.rollbackResults.length,
    workspaceIntegrityResultCount: result.workspaceIntegrityResults.length,
    governanceResultCount: result.governanceResults.length,
    evidenceResultCount: result.evidenceResults.length,
    recommendationCount: result.recommendations.length,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'World 2 Completion Verifier Foundation V1 — verification only. No execution, file modification, or code generation.',
  };
}

export function formatWorld2CompletionReport(
  state: World2CompletionVerifierState,
  result: VerifierResult,
): string {
  const report = buildWorld2CompletionReport(state, result);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'World 2 Completion Verifier Foundation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Verifier ID: ${state.verifierId}`,
    `Verification ID: ${report.verificationId}`,
    `Workspace ID: ${report.workspaceId}`,
    `Project ID: ${report.projectId}`,
    `Plan ID: ${report.planId}`,
    `Simulation ID: ${report.simulationId}`,
    `Builder ID: ${report.builderId}`,
    `Completion status: ${report.completionStatus}`,
    `Completion confidence: ${report.completionConfidence}`,
    `Passed requirement count: ${report.passedRequirementCount}`,
    `Failed requirement count: ${report.failedRequirementCount}`,
    `Verification result count: ${report.verificationResultCount}`,
    `Risk control result count: ${report.riskControlResultCount}`,
    `Rollback result count: ${report.rollbackResultCount}`,
    `Workspace integrity result count: ${report.workspaceIntegrityResultCount}`,
    `Governance result count: ${report.governanceResultCount}`,
    `Evidence result count: ${report.evidenceResultCount}`,
    `Recommendation count: ${report.recommendationCount}`,
    '',
    'Verification-only confirmations:',
    '  Verification-only foundation: CONFIRMED',
    '  No execution performed: CONFIRMED',
    '  No files modified: CONFIRMED',
    '  No code generated: CONFIRMED',
    '  No commands executed: CONFIRMED',
    '',
    `Recommendation: ${report.recommendation}`,
    '═══════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}
