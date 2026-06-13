/**
 * PLANNING stage analyzer — plans, tasks, roadmap, architecture decisions.
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { RequirementsToPlanContractReport } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import { STAGE_CONFIRM_THRESHOLD, STAGE_PARTIAL_THRESHOLD } from './live-idea-to-launch-execution-runner-registry.js';
import type {
  StageAnalysis,
  StageEvidenceEntry,
  StageEvidenceLevel,
} from './live-idea-to-launch-execution-runner-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzePlanningStage(input: {
  contract: RequirementsToPlanContractReport | null;
  executionProof: AutonomousBuildExecutionProofReport | null;
  ideaConfirmed: boolean;
}): StageAnalysis {
  const evidence: StageEvidenceEntry[] = [];
  const missingEvidence: string[] = [];
  const weakEvidence: string[] = [];
  const sources: string[] = [];
  let score = 0;

  if (!input.ideaConfirmed) {
    missingEvidence.push('IDEA stage not confirmed — planning cannot be proven');
  }

  if (input.contract) {
    sources.push('requirements-to-plan-execution-contract');
    const plan = input.contract.planContract;
    const buildReady = input.contract.buildReadyContract;
    evidence.push(
      entry(
        'Plan tasks generated',
        `${plan?.tasks.length ?? 0} task(s)`,
        (plan?.tasks.length ?? 0) > 0,
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Tasks link to requirements',
        String(input.contract.linkageAnalysis.requirementsToPlanTasks),
        input.contract.linkageAnalysis.requirementsToPlanTasks,
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Build-ready contract',
        buildReady?.readinessState ?? 'none',
        buildReady?.readinessState === 'BUILD_READY',
        'requirements-to-plan-execution-contract',
      ),
    );
    if ((plan?.tasks.length ?? 0) > 0) score += 35;
    else missingEvidence.push('No plan tasks generated');
    if (input.contract.linkageAnalysis.requirementsToPlanTasks) score += 35;
    else missingEvidence.push('Plan tasks not linked to requirement IDs');
    if (buildReady?.readinessState === 'BUILD_READY') score += 20;
    else weakEvidence.push(`Build-ready state: ${buildReady?.readinessState ?? 'none'}`);
  } else {
    missingEvidence.push('Plan contract not available');
  }

  const planProof = input.executionProof?.stageProofs.find((s) => s.stage === 'PLAN');
  if (planProof) {
    sources.push('autonomous-build-execution-proof');
    evidence.push(
      entry('Execution proof PLAN stage', planProof.proofLevel, planProof.proofLevel === 'PROVEN', 'autonomous-build-execution-proof'),
    );
    if (planProof.proofLevel === 'PROVEN') score = Math.max(score, 90);
    else if (planProof.proofLevel === 'PARTIAL') score = Math.max(score, 60);
    missingEvidence.push(...planProof.missingEvidence.slice(0, 2));
  }

  score = Math.min(100, score);
  let evidenceLevel: StageEvidenceLevel = 'MISSING';
  if (!input.ideaConfirmed) evidenceLevel = 'BLOCKED';
  else if (score >= STAGE_CONFIRM_THRESHOLD) evidenceLevel = 'CONFIRMED';
  else if (score >= STAGE_PARTIAL_THRESHOLD) evidenceLevel = 'PARTIAL';

  const confirmed =
    (evidenceLevel === 'CONFIRMED' ||
      (input.contract?.proofLevel === 'PROVEN' &&
        input.contract.linkageAnalysis.requirementsToPlanTasks)) &&
    input.contract?.linkageAnalysis.requirementsToPlanTasks === true &&
    (input.contract?.planContract?.tasks.length ?? 0) > 0;

  return {
    readOnly: true,
    stage: 'PLANNING',
    evidenceLevel,
    confirmed,
    score,
    sourceAuthorities: [...new Set(sources)],
    evidence,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 8),
    weakEvidence: [...new Set(weakEvidence)].slice(0, 6),
    recommendedFix: confirmed
      ? 'Planning confirmed — proceed to build materialization proof.'
      : 'Produce executable plan linked to requirements before build claims.',
  };
}
