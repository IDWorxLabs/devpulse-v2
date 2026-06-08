/**
 * Completion decision engine — determines completion truth from all evaluations.
 * Verification only. No execution.
 */

import type { ProtectionCheck } from '../world2-autonomous-builder/types.js';
import type {
  CompletionConfidence,
  CompletionStatus,
  EvidenceResult,
  GovernanceResult,
  IntegrityResult,
  RequirementEvaluation,
  RiskControlResult,
  RollbackResult,
  VerificationResultItem,
} from './types.js';
import type { ConfidenceLevel } from '../world2-simulation-runtime/types.js';
import { countMissingEvidence } from './evidence-evaluation-engine.js';
import { countCriticalRiskFailures } from './risk-control-evaluation-engine.js';
import { countFailedRollbackProtections } from './rollback-evaluation-engine.js';
import { countFailedVerifications } from './verification-evaluation-engine.js';
import { workspaceIntegrityFailed } from './workspace-integrity-engine.js';

export function evaluateGovernance(
  world1Checks: ProtectionCheck[],
  ownershipValid: boolean,
): GovernanceResult[] {
  const results: GovernanceResult[] = [];

  results.push({
    resultId: 'gov-0001',
    checkType: 'OWNERSHIP',
    result: ownershipValid ? 'PASSED' : 'FAILED',
    description: ownershipValid ? 'Ownership validated' : 'Ownership validation failed',
  });

  for (const check of world1Checks) {
    results.push({
      resultId: `gov-w1-${check.checkId}`,
      checkType: check.checkType,
      result: check.status === 'PROTECTED' ? 'PASSED' : 'FAILED',
      description: `World 1 protection ${check.checkType}: ${check.description}`,
    });
  }

  results.push({
    resultId: 'gov-governance-stack',
    checkType: 'GOVERNANCE_STACK',
    result: 'PASSED',
    description: 'Phase 6 governance stack referenced — no bypass attempted',
  });

  return results;
}

export function governanceFailed(results: GovernanceResult[]): boolean {
  return results.some((r) => r.result === 'FAILED');
}

export function governanceResultsKey(results: GovernanceResult[]): string {
  return results.map((r) => `${r.checkType}|${r.result}`).join(';');
}

export interface CompletionDecisionInput {
  ownershipValid: boolean;
  criteriaPassed: RequirementEvaluation[];
  criteriaFailed: RequirementEvaluation[];
  verificationResults: VerificationResultItem[];
  riskControlResults: RiskControlResult[];
  rollbackResults: RollbackResult[];
  workspaceIntegrityResults: IntegrityResult[];
  governanceResults: GovernanceResult[];
  evidenceResults: EvidenceResult[];
  confidenceScore: ConfidenceLevel;
  warningCount: number;
}

export function determineCompletionConfidence(
  status: CompletionStatus,
  confidenceScore: ConfidenceLevel,
  failedCount: number,
): CompletionConfidence {
  if (status === 'REJECTED' || status === 'NOT_STARTED' || status === 'INCOMPLETE') {
    return 'LOW';
  }
  if (status === 'COMPLETE' && confidenceScore === 'HIGH' && failedCount === 0) {
    return 'HIGH';
  }
  if (status === 'COMPLETE' || status === 'COMPLETE_WITH_WARNINGS') {
    return confidenceScore === 'HIGH' ? 'HIGH' : 'MEDIUM';
  }
  return 'LOW';
}

export function decideCompletionStatus(input: CompletionDecisionInput): {
  status: CompletionStatus;
  reasons: string[];
  recommendations: string[];
} {
  const reasons: string[] = [];
  const recommendations: string[] = [
    'World 2 Completion Verifier Foundation V1 — verification only. No execution performed.',
  ];

  if (!input.ownershipValid) {
    reasons.push('Ownership validation failed');
    recommendations.push('Resolve workspace/project/plan/simulation/builder ownership before completion.');
    return { status: 'REJECTED', reasons, recommendations };
  }

  if (governanceFailed(input.governanceResults)) {
    reasons.push('Governance validation failed');
    recommendations.push('Governance stack must be satisfied before completion classification.');
    return { status: 'REJECTED', reasons, recommendations };
  }

  if (workspaceIntegrityFailed(input.workspaceIntegrityResults)) {
    reasons.push('Workspace integrity failed');
    recommendations.push('Restore workspace isolation before completion classification.');
    return { status: 'REJECTED', reasons, recommendations };
  }

  const world1Failed = input.governanceResults.some(
    (g) => g.checkType.startsWith('WORLD1_') && g.result === 'FAILED',
  );
  if (world1Failed) {
    reasons.push('World 1 protection failed');
    recommendations.push('World 1 protection must pass before any completion claim.');
    return { status: 'REJECTED', reasons, recommendations };
  }

  if (input.criteriaFailed.length > 0) {
    reasons.push('Completion criteria not satisfied');
    return {
      status: 'INCOMPLETE',
      reasons,
      recommendations: [...recommendations, 'Satisfy all completion criteria before claiming complete.'],
    };
  }

  const failedVerifications = countFailedVerifications(input.verificationResults);
  if (failedVerifications > 0) {
    reasons.push(`${failedVerifications} verification requirement(s) failed`);
    return {
      status: 'INCOMPLETE',
      reasons,
      recommendations: [...recommendations, 'Resolve failed verification requirements.'],
    };
  }

  const missingEvidence = countMissingEvidence(input.evidenceResults);
  if (missingEvidence > 0) {
    reasons.push(`${missingEvidence} required evidence reference(s) missing`);
    return {
      status: 'INCOMPLETE',
      reasons,
      recommendations: [...recommendations, 'Provide plan, simulation, and builder evidence references.'],
    };
  }

  const criticalRisks = countCriticalRiskFailures(input.riskControlResults);
  if (criticalRisks > 0) {
    reasons.push(`${criticalRisks} critical risk control(s) failed`);
    return {
      status: 'INCOMPLETE',
      reasons,
      recommendations: [...recommendations, 'Mitigate critical risks before completion.'],
    };
  }

  const failedRollback = countFailedRollbackProtections(input.rollbackResults);
  if (failedRollback > 0) {
    reasons.push(`${failedRollback} required rollback protection(s) failed`);
    return {
      status: 'INCOMPLETE',
      reasons,
      recommendations: [...recommendations, 'Establish required rollback protections.'],
    };
  }

  const partialSignals =
    input.verificationResults.some((v) => v.result === 'WARNING') ||
    input.riskControlResults.some((r) => r.result === 'WARNING') ||
    input.rollbackResults.some((r) => r.result === 'WARNING');

  if (input.criteriaPassed.length === 0 && input.verificationResults.length === 0) {
    reasons.push('No completion evaluations performed');
    return { status: 'NOT_STARTED', reasons, recommendations };
  }

  if (partialSignals && input.warningCount > 0) {
    reasons.push('All mandatory checks passed with non-critical warnings');
    recommendations.push('Review warnings before future gated execution.');
    return { status: 'COMPLETE_WITH_WARNINGS', reasons, recommendations };
  }

  if (input.warningCount > 0) {
    reasons.push('Mandatory checks passed — warnings remain');
    recommendations.push('Address non-critical warnings when convenient.');
    return { status: 'COMPLETE_WITH_WARNINGS', reasons, recommendations };
  }

  reasons.push('All completion truth requirements satisfied');
  recommendations.push('Completion truth verified — still no execution in this phase.');
  return { status: 'COMPLETE', reasons, recommendations };
}

export function completionDecisionKey(
  status: CompletionStatus,
  confidence: CompletionConfidence,
  reasonCount: number,
): string {
  return `${status}|${confidence}|${reasonCount}`;
}
