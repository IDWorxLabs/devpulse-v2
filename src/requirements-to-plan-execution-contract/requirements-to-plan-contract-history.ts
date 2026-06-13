/**
 * Requirements-to-Plan Execution Contract — bounded history.
 */

import { MAX_REQUIREMENTS_TO_PLAN_CONTRACT_HISTORY } from './requirements-to-plan-contract-registry.js';
import type {
  RequirementsToPlanContractAssessment,
  RequirementsToPlanContractHistoryEntry,
  RequirementsToPlanContractHistorySummary,
} from './requirements-to-plan-contract-types.js';

const history: RequirementsToPlanContractHistoryEntry[] = [];

export function resetRequirementsToPlanContractHistoryForTests(): void {
  history.length = 0;
}

export function recordRequirementsToPlanContractAssessment(
  assessment: RequirementsToPlanContractAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    proofLevel: report.proofLevel,
    readinessState: report.buildReadyContract?.readinessState ?? 'BLOCKED',
    linkageConnected: report.linkageAnalysis.linkageConnected,
  });
  if (history.length > MAX_REQUIREMENTS_TO_PLAN_CONTRACT_HISTORY) {
    history.length = MAX_REQUIREMENTS_TO_PLAN_CONTRACT_HISTORY;
  }
}

export function getRequirementsToPlanContractHistorySize(): number {
  return history.length;
}

export function buildRequirementsToPlanContractHistorySummary(
  entries: readonly RequirementsToPlanContractHistoryEntry[] = history,
): RequirementsToPlanContractHistorySummary {
  return {
    totalAssessments: entries.length,
    provenContracts: entries.filter((e) => e.proofLevel === 'PROVEN').length,
    partialContracts: entries.filter((e) => e.proofLevel === 'PARTIAL').length,
    notProvenContracts: entries.filter((e) => e.proofLevel === 'NOT_PROVEN').length,
  };
}
