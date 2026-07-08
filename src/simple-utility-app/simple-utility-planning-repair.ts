/**
 * Auto-repair incomplete planning output for simple utility app prompts.
 */

import { analyzeClarifyingGaps } from '../requirements-to-plan-execution-contract/clarifying-gap-analyzer.js';
import { buildBuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/build-ready-contract-builder.js';
import { analyzeContractLinkage } from '../requirements-to-plan-execution-contract/contract-linkage-analyzer.js';
import { buildPlanContract } from '../requirements-to-plan-execution-contract/plan-contract-builder.js';
import {
  buildSimpleUtilityRequirementContract,
  buildSimpleUtilityUserIdeaContract,
} from './simple-utility-requirement-contract.js';
import type {
  RequirementsToPlanContractAssessment,
  RequirementsToPlanContractReport,
  RequirementsToPlanProofLevel,
} from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import { recordRequirementsToPlanContractAssessment } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-history.js';
import {
  REQUIREMENTS_TO_PLAN_CONTRACT_CACHE_KEY_PREFIX,
  REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN,
} from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-registry.js';
import { createHash } from 'node:crypto';
import { detectSimpleUtilityAppKind } from './simple-utility-app-registry.js';

let repairCounter = 0;

export function resetSimpleUtilityPlanningRepairCounterForTests(): void {
  repairCounter = 0;
}

function nextRepairAssessmentId(): string {
  repairCounter += 1;
  return `req-plan-simple-utility-repair-${repairCounter}`;
}

function stableCacheKey(assessmentId: string, proofLevel: RequirementsToPlanProofLevel): string {
  const digest = createHash('sha256')
    .update([REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN, assessmentId, proofLevel, 'simple-utility-repair'].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${REQUIREMENTS_TO_PLAN_CONTRACT_CACHE_KEY_PREFIX}:${digest}`;
}

export function repairSimpleUtilityPlanningAssessment(
  rawPrompt: string,
): RequirementsToPlanContractAssessment | null {
  const kind = detectSimpleUtilityAppKind(rawPrompt);
  if (!kind) return null;

  const userIdea = buildSimpleUtilityUserIdeaContract(rawPrompt, kind, `idea-simple-${kind}`);
  const requirementContract = buildSimpleUtilityRequirementContract(userIdea, kind);
  const clarifyingGaps = analyzeClarifyingGaps(userIdea, requirementContract);
  const planContract = requirementContract ? buildPlanContract(requirementContract) : null;
  const buildReadyContract = buildBuildReadyExecutionContract({
    idea: userIdea,
    requirementContract,
    planContract,
    clarifyingGaps,
  });

  if (!buildReadyContract || buildReadyContract.readinessState !== 'BUILD_READY') {
    return null;
  }

  const linkageAnalysis = analyzeContractLinkage({
    idea: userIdea,
    requirementContract,
    planContract,
    buildReadyContract,
  });

  const assessmentId = nextRepairAssessmentId();
  const report: RequirementsToPlanContractReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    proofLevel: linkageAnalysis.linkageConnected ? 'PROVEN' : 'PARTIAL',
    userIdea,
    requirementContract,
    clarifyingGaps,
    planContract,
    buildReadyContract,
    linkageAnalysis,
    missingEvidence: [],
    recommendedFix: 'Proceed to BUILD stage — simple utility app contract repaired.',
    recommendedNextActions: [
      'Hand build-ready simple utility contract to autonomous builder execution proof BUILD stage.',
    ],
    cacheKey: stableCacheKey(assessmentId, linkageAnalysis.linkageConnected ? 'PROVEN' : 'PARTIAL'),
  };

  const assessment: RequirementsToPlanContractAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'CONTRACT_COMPLETE',
    report,
  };

  recordRequirementsToPlanContractAssessment(assessment);
  return assessment;
}
