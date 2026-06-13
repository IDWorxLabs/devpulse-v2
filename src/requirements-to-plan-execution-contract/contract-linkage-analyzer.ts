/**
 * Contract Linkage Analyzer — verify idea → requirements → plan → build units → verification.
 */

import type {
  BuildReadyExecutionContract,
  ContractLinkageAnalysis,
  PlanContract,
  RequirementContract,
  UserIdeaContract,
} from './requirements-to-plan-contract-types.js';

export function analyzeContractLinkage(input: {
  idea: UserIdeaContract;
  requirementContract: RequirementContract | null;
  planContract: PlanContract | null;
  buildReadyContract: BuildReadyExecutionContract | null;
}): ContractLinkageAnalysis {
  const missingLinks: string[] = [];

  const ideaToRequirements =
    input.idea.status === 'CAPTURED' &&
    input.requirementContract !== null &&
    input.requirementContract.requirements.length > 0 &&
    input.requirementContract.requirements.every((r) => r.sourceIdeaId === input.idea.ideaId);

  if (!ideaToRequirements) {
    missingLinks.push(
      input.idea.status === 'INSUFFICIENT_INPUT'
        ? 'idea→requirements: insufficient user input'
        : 'idea→requirements: no extracted requirements linked to ideaId',
    );
  }

  let requirementsToPlanTasks = false;
  if (input.requirementContract && input.planContract) {
    const reqIds = new Set(input.requirementContract.requirements.map((r) => r.requirementId));
    const linkedReqIds = new Set(input.planContract.tasks.flatMap((t) => t.sourceRequirementIds));
    requirementsToPlanTasks =
      input.planContract.tasks.length > 0 &&
      input.planContract.tasks
        .filter((t) => t.layer !== 'DOCUMENTATION')
        .every((t) => t.sourceRequirementIds.length >= 1) &&
      [...reqIds].every((id) => linkedReqIds.has(id));

    if (!requirementsToPlanTasks) {
      const unlinked = [...reqIds].filter((id) => !linkedReqIds.has(id));
      missingLinks.push(
        unlinked.length
          ? `requirements→plan: unlinked requirement IDs: ${unlinked.join(', ')}`
          : 'requirements→plan: plan tasks missing requirement IDs',
      );
    }
  } else {
    missingLinks.push('requirements→plan: plan contract missing');
  }

  let planTasksToBuildUnits = false;
  if (input.planContract && input.buildReadyContract) {
    const taskIds = new Set(input.planContract.tasks.map((t) => t.taskId));
    const unitTaskIds = new Set(input.buildReadyContract.buildUnits.flatMap((u) => u.sourcePlanTaskIds));
    planTasksToBuildUnits =
      input.buildReadyContract.buildUnits.length > 0 &&
      input.planContract.tasks
        .filter((t) => t.layer !== 'DOCUMENTATION')
        .every((t) => unitTaskIds.has(t.taskId) || t.layer === 'VERIFICATION');

    if (!planTasksToBuildUnits) {
      missingLinks.push('plan→build units: not all plan tasks mapped to build units');
    }
  } else {
    missingLinks.push('plan→build units: build-ready contract missing');
  }

  let buildUnitsToVerification = false;
  if (input.buildReadyContract) {
    buildUnitsToVerification =
      input.buildReadyContract.buildUnits.length > 0 &&
      input.buildReadyContract.buildUnits.every((u) => u.verificationRequirements.length >= 1) &&
      input.buildReadyContract.verificationRequirements.length >= input.buildReadyContract.buildUnits.length;

    if (!buildUnitsToVerification) {
      missingLinks.push('build units→verification: missing verification criteria on build units');
    }
  } else {
    missingLinks.push('build units→verification: build-ready contract missing');
  }

  const linkageConnected =
    ideaToRequirements &&
    requirementsToPlanTasks &&
    planTasksToBuildUnits &&
    buildUnitsToVerification;

  let firstBrokenLink: string | null = null;
  if (!ideaToRequirements) firstBrokenLink = 'idea→requirements';
  else if (!requirementsToPlanTasks) firstBrokenLink = 'requirements→plan tasks';
  else if (!planTasksToBuildUnits) firstBrokenLink = 'plan tasks→build units';
  else if (!buildUnitsToVerification) firstBrokenLink = 'build units→verification';

  const components = [
    ideaToRequirements,
    requirementsToPlanTasks,
    planTasksToBuildUnits,
    buildUnitsToVerification,
  ];
  const traceabilityScore = Math.round((components.filter(Boolean).length / components.length) * 100);

  return {
    readOnly: true,
    linkageConnected,
    firstBrokenLink,
    missingLinks,
    traceabilityScore,
    ideaToRequirements,
    requirementsToPlanTasks,
    planTasksToBuildUnits,
    buildUnitsToVerification,
  };
}
