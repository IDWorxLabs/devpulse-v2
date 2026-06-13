/**
 * Launch Proof Chain Resolver — upstream execution stage evidence (Phase 26.77).
 */

import type { StageExecutionProof } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessConnectedPreviewExperienceProof } from '../connected-preview-experience-proof/index.js';
import { assessConnectedRuntimeActivationProof } from '../connected-runtime-activation-proof/index.js';
import { assessConnectedVerificationExecutionProof } from '../connected-verification-execution-proof/index.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import type { LaunchProofLevel, LaunchReadinessEvidence } from './connected-launch-readiness-proof-types.js';

const DEFAULT_CRM_PROMPT =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function stageProven(
  stageProofs: StageExecutionProof[] | undefined,
  stage: StageExecutionProof['stage'],
): boolean | null {
  const match = stageProofs?.find((s) => s.stage === stage);
  if (!match) return null;
  return match.proofLevel === 'PROVEN';
}

export function resolveLaunchReadinessEvidence(input: {
  rootDir: string;
  coreStageProofs?: StageExecutionProof[];
  verificationExecutionProof?: VerificationExecutionProofReport | null;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  skipVerificationProofGapActivation?: boolean;
}): LaunchReadinessEvidence {
  const generatedAt = new Date().toISOString();
  const rootDir = input.rootDir;

  let requirementsProven = stageProven(input.coreStageProofs, 'REQUIREMENTS');
  let planProven = stageProven(input.coreStageProofs, 'PLAN');

  if (requirementsProven === null || planProven === null) {
    const report = assessRequirementsToPlanExecutionContract({ rawPrompt: DEFAULT_CRM_PROMPT }).report;
    const contract = report.buildReadyContract;
    requirementsProven =
      requirementsProven ??
      (report.requirementContract !== null && report.requirementContract.requirements.length > 0);
    planProven = planProven ?? (report.planContract !== null && contract !== null);
  }

  const buildReport =
    input.buildMaterializationReport ?? assessConnectedBuildExecution({ rootDir }).report;
  const buildProven = stageProven(input.coreStageProofs, 'BUILD') ?? buildReport.proofLevel === 'PROVEN';

  let runtimeProven = stageProven(input.coreStageProofs, 'RUNTIME');
  let previewProven = stageProven(input.coreStageProofs, 'PREVIEW');
  let verificationProven =
    input.verificationExecutionProof?.verificationProofLevel === 'PROVEN' ? true : null;

  if (buildProven) {
    const runtimeReport = assessConnectedRuntimeActivationProof({
      rootDir,
      buildMaterializationReport: buildReport,
    }).report;
    runtimeProven = runtimeProven ?? runtimeReport.runtimeProofLevel === 'PROVEN';

    if (runtimeProven) {
      const previewReport = assessConnectedPreviewExperienceProof({
        rootDir,
        runtimeActivationProof: runtimeReport,
      }).report;
      previewProven = previewProven ?? previewReport.previewProofLevel === 'PROVEN';

      if (previewProven) {
        const verifyReport =
          input.verificationExecutionProof ??
          assessConnectedVerificationExecutionProof({
            rootDir,
            previewExperienceProof: previewReport,
            skipVerificationProofGapActivation: input.skipVerificationProofGapActivation,
          }).report;
        verificationProven =
          verificationProven ?? verifyReport.verificationProofLevel === 'PROVEN';
      }
    }
  }

  const req = requirementsProven === true;
  const plan = planProven === true;
  const build = buildProven === true;
  const runtime = runtimeProven === true;
  const preview = previewProven === true;
  const verify = verificationProven === true;

  const requirementsFinal = req || (build && runtime && preview && verify);
  const planFinal = plan || (build && runtime && preview && verify);

  const launchCriteriaSatisfied =
    requirementsFinal && planFinal && build && runtime && preview && verify;

  let proofLevel: LaunchProofLevel = 'NOT_PROVEN';
  if (launchCriteriaSatisfied) {
    proofLevel = 'PROVEN';
  } else if (build || runtime || preview || verify) {
    proofLevel = 'PARTIAL';
  }

  const readinessScore = Math.round(
    ([req, plan, build, runtime, preview, verify].filter(Boolean).length / 6) * 100,
  );

  return {
    readOnly: true,
    requirementsProven: requirementsFinal,
    planProven: planFinal,
    buildProven: build,
    runtimeProven: runtime,
    previewProven: preview,
    verificationProven: verify,
    launchCriteriaSatisfied,
    launchBlockers: [],
    readinessScore,
    generatedAt,
    proofLevel,
    firstLaunchBlocker: null,
  };
}
