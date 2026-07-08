/**
 * Requirements-to-Plan Execution Contract — main authority.
 */

import { createHash } from 'node:crypto';
import { analyzeClarifyingGaps } from './clarifying-gap-analyzer.js';
import { buildBuildReadyExecutionContract } from './build-ready-contract-builder.js';
import { analyzeContractLinkage } from './contract-linkage-analyzer.js';
import { buildPlanContract } from './plan-contract-builder.js';
import {
  REQUIREMENTS_TO_PLAN_CONTRACT_CACHE_KEY_PREFIX,
  REQUIREMENTS_TO_PLAN_CONTRACT_CORE_QUESTION,
  REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN,
} from './requirements-to-plan-contract-registry.js';
import { recordRequirementsToPlanContractAssessment } from './requirements-to-plan-contract-history.js';
import { buildRequirementsToPlanContractReportMarkdown } from './requirements-to-plan-contract-report-builder.js';
import { buildRequirementContract } from './requirement-contract-builder.js';
import type {
  AssessRequirementsToPlanContractInput,
  RequirementsToPlanContractArtifacts,
  RequirementsToPlanContractAssessment,
  RequirementsToPlanContractReport,
  RequirementsToPlanProofLevel,
  StoredBuildReadyContract,
} from './requirements-to-plan-contract-types.js';
import { buildUserIdeaContract, resetUserIdeaContractCounterForTests } from './user-idea-contract-builder.js';
import { resetRequirementContractCounterForTests } from './requirement-contract-builder.js';
import { resetPlanContractCounterForTests } from './plan-contract-builder.js';
import { resetSimpleUtilityPlanningRepairCounterForTests } from '../simple-utility-app/simple-utility-planning-repair.js';
import { resetSimpleUtilityRequirementCounterForTests } from '../simple-utility-app/simple-utility-requirement-contract.js';
import { isSimpleUtilityAppPrompt } from '../simple-utility-app/simple-utility-app-registry.js';
import { repairSimpleUtilityPlanningAssessment } from '../simple-utility-app/simple-utility-planning-repair.js';

let assessmentCounter = 0;
let lastStoredContract: StoredBuildReadyContract | null = null;

export function resetRequirementsToPlanContractCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetStoredBuildReadyContractForTests(): void {
  lastStoredContract = null;
}

export function getLastStoredBuildReadyContract(): StoredBuildReadyContract | null {
  return lastStoredContract;
}

export function storeBuildReadyContractFromPrompt(rawPrompt: string): StoredBuildReadyContract {
  const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt });
  const stored: StoredBuildReadyContract = {
    storedAt: new Date().toISOString(),
    rawPrompt,
    report: assessment.report,
  };
  lastStoredContract = stored;
  return stored;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `req-plan-contract-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, proofLevel: RequirementsToPlanProofLevel): string {
  const digest = createHash('sha256')
    .update([REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN, assessmentId, proofLevel].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${REQUIREMENTS_TO_PLAN_CONTRACT_CACHE_KEY_PREFIX}:${digest}`;
}

function deriveProofLevel(input: {
  ideaCaptured: boolean;
  readinessState: string | null;
  linkageConnected: boolean;
  clarifyingNeeds: boolean;
}): RequirementsToPlanProofLevel {
  if (!input.ideaCaptured) return 'NOT_PROVEN';
  if (
    input.readinessState === 'BUILD_READY' &&
    input.linkageConnected
  ) {
    return 'PROVEN';
  }
  if (input.clarifyingNeeds || input.readinessState === 'NEEDS_CLARIFICATION') {
    return 'PARTIAL';
  }
  if (input.readinessState === 'BUILD_READY' && !input.linkageConnected) {
    return 'PARTIAL';
  }
  return 'NOT_PROVEN';
}

export function assessRequirementsToPlanExecutionContract(
  input: AssessRequirementsToPlanContractInput,
): RequirementsToPlanContractAssessment {
  const repaired = repairSimpleUtilityPlanningAssessment(input.rawPrompt);
  if (repaired?.report.buildReadyContract?.readinessState === 'BUILD_READY') {
    return repaired;
  }

  const userIdea = buildUserIdeaContract(input.rawPrompt, input.ideaId);
  const requirementContract = buildRequirementContract(userIdea);
  const clarifyingGaps = analyzeClarifyingGaps(userIdea, requirementContract);
  const planContract = requirementContract ? buildPlanContract(requirementContract) : null;
  const buildReadyContract = buildBuildReadyExecutionContract({
    idea: userIdea,
    requirementContract,
    planContract,
    clarifyingGaps,
  });
  const linkageAnalysis = analyzeContractLinkage({
    idea: userIdea,
    requirementContract,
    planContract,
    buildReadyContract,
  });

  const missingEvidence: string[] = [...linkageAnalysis.missingLinks];
  if (userIdea.status === 'INSUFFICIENT_INPUT') {
    missingEvidence.push('User idea too vague — INSUFFICIENT_INPUT');
  }
  if (clarifyingGaps.criticalGaps.length > 0) {
    missingEvidence.push(...clarifyingGaps.criticalGaps.map((g) => g.question));
  }
  if (buildReadyContract?.blockers.length) {
    missingEvidence.push(...buildReadyContract.blockers);
  }

  const proofLevel = deriveProofLevel({
    ideaCaptured: userIdea.status === 'CAPTURED',
    readinessState: buildReadyContract?.readinessState ?? clarifyingGaps.contractReadiness,
    linkageConnected: linkageAnalysis.linkageConnected,
    clarifyingNeeds: clarifyingGaps.contractReadiness === 'NEEDS_CLARIFICATION',
  });

  let recommendedFix = 'Capture clear user intent and extract traceable requirements before planning.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Proceed to BUILD stage — requirements and plan contracts are connected.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix =
      clarifyingGaps.clarifyingQuestions[0] ??
      'Resolve clarifying gaps before claiming build-ready contract.';
  }

  const recommendedNextActions: string[] = [];
  if (proofLevel !== 'PROVEN') {
    recommendedNextActions.push(recommendedFix);
    recommendedNextActions.push(...clarifyingGaps.clarifyingQuestions.slice(0, 4));
  } else {
    recommendedNextActions.push('Hand build-ready contract to autonomous builder execution proof BUILD stage.');
  }

  const assessmentId = nextAssessmentId();
  const report: RequirementsToPlanContractReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    proofLevel,
    userIdea,
    requirementContract,
    clarifyingGaps,
    planContract,
    buildReadyContract,
    linkageAnalysis,
    missingEvidence,
    recommendedFix,
    recommendedNextActions,
    cacheKey: stableCacheKey(assessmentId, proofLevel),
  };

  const assessment: RequirementsToPlanContractAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'CONTRACT_COMPLETE',
    report,
  };

  recordRequirementsToPlanContractAssessment(assessment);
  if (
    (!buildReadyContract || buildReadyContract.readinessState !== 'BUILD_READY') &&
    isSimpleUtilityAppPrompt(input.rawPrompt)
  ) {
    const repaired = repairSimpleUtilityPlanningAssessment(input.rawPrompt);
    if (repaired) return repaired;
  }
  return assessment;
}

export function buildRequirementsToPlanExecutionContractArtifacts(
  input: AssessRequirementsToPlanContractInput,
): RequirementsToPlanContractArtifacts {
  const requirementsToPlanContractAssessment = assessRequirementsToPlanExecutionContract(input);
  return {
    requirementsToPlanContractAssessment,
    requirementsToPlanContractReportMarkdown: buildRequirementsToPlanContractReportMarkdown(
      requirementsToPlanContractAssessment.report,
    ),
  };
}

export function resetRequirementsToPlanContractModuleForTests(): void {
  resetRequirementsToPlanContractCounterForTests();
  resetUserIdeaContractCounterForTests();
  resetRequirementContractCounterForTests();
  resetPlanContractCounterForTests();
  resetSimpleUtilityPlanningRepairCounterForTests();
  resetSimpleUtilityRequirementCounterForTests();
  resetStoredBuildReadyContractForTests();
}
