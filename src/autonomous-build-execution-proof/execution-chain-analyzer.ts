/**
 * Autonomous Build Execution Proof — requirements/plan analysis and chain linkage.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { ConnectedLivePreviewAssessment } from '../connected-live-preview-foundation/connected-live-preview-types.js';
import type { ConnectedRuntimeActivationAssessment } from '../connected-runtime-activation-foundation/connected-runtime-activation-types.js';
import type { ConnectedVerificationAssessment } from '../connected-verification-foundation/connected-verification-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { RequirementsToPlanContractReport } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import { CORE_CHAIN_STAGES, EXECUTION_CHAIN_STAGE_ORDER } from './autonomous-build-execution-proof-registry.js';
import type {
  ChainLinkEvidence,
  ExecutionChainAnalysis,
  ExecutionStageId,
  StageEvidenceEntry,
  StageExecutionProof,
} from './autonomous-build-execution-proof-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeRequirementsStage(
  contractReport: RequirementsToPlanContractReport | null,
  founderTestAssessment?: FounderTestAssessment,
): StageExecutionProof {
  if (contractReport) {
    const idea = contractReport.userIdea;
    const reqs = contractReport.requirementContract;
    let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
    if (contractReport.proofLevel === 'PROVEN') proofLevel = 'PROVEN';
    else if (contractReport.proofLevel === 'PARTIAL') proofLevel = 'PARTIAL';

    const evidence: StageEvidenceEntry[] = [
      entry('User idea captured', idea.ideaId, idea.status === 'CAPTURED', 'requirements-to-plan-execution-contract'),
      entry(
        'Requirements extracted',
        `${reqs?.requirements.length ?? 0} requirement(s)`,
        (reqs?.requirements.length ?? 0) > 0,
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Idea-to-requirement linkage',
        String(contractReport.linkageAnalysis.ideaToRequirements),
        contractReport.linkageAnalysis.ideaToRequirements,
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Contract proof level',
        contractReport.proofLevel,
        contractReport.proofLevel !== 'NOT_PROVEN',
        'requirements-to-plan-execution-contract',
      ),
    ];

    const missingEvidence = [...contractReport.missingEvidence];
    if (idea.status === 'INSUFFICIENT_INPUT') {
      missingEvidence.push('User idea INSUFFICIENT_INPUT — vague prompt');
    }
    if ((reqs?.requirements.length ?? 0) === 0) {
      missingEvidence.push('No requirements extracted from user idea');
    }

    return {
      readOnly: true,
      stage: 'REQUIREMENTS',
      proofLevel,
      score: contractReport.linkageAnalysis.traceabilityScore,
      sourceAuthority: 'requirements-to-plan-execution-contract',
      upstreamState: idea.status,
      evidence,
      missingEvidence: missingEvidence.slice(0, 8),
      recommendedFix: contractReport.recommendedFix,
      downstreamBlocked: proofLevel !== 'PROVEN',
    };
  }

  const founder = founderTestAssessment!;
  const requirement = founder.run.authorityResults.find(
    (r) => r.authorityId === 'REQUIREMENT_REALITY',
  );
  const founderReality = founder.run.authorityResults.find(
    (r) => r.authorityId === 'FOUNDER_REALITY',
  );

  const score = requirement?.normalizedScore ?? 0;
  const available = requirement?.available ?? false;
  const criticalBlockers = requirement?.criticalBlockerCount ?? 0;
  const executionConnected =
    founder.executionProofSummary?.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN' ||
    founder.executionProofSummary?.founderExecutionState ===
      'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS';

  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (available && score >= 80 && criticalBlockers === 0 && requirement!.blockers.length === 0) {
    proofLevel = 'PROVEN';
  } else if (available && score >= 55) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Requirement Reality authority',
      available ? `${score}/100` : 'unavailable',
      available,
      'autonomous-builder-reality',
    ),
    entry(
      'Critical blockers',
      String(criticalBlockers),
      criticalBlockers === 0,
      'founder-test-integration',
    ),
    entry(
      'Founder workflow reality',
      founderReality ? `${founderReality.normalizedScore}/100` : 'unavailable',
      (founderReality?.normalizedScore ?? 0) >= 60,
      'end-to-end-founder-workflow-reality',
    ),
    entry(
      'Execution connected signal',
      executionConnected ? 'connected' : 'not connected',
      executionConnected,
      'founder-execution-proof',
    ),
  ];

  const missingEvidence: string[] = [];
  if (!available) missingEvidence.push('Requirement Reality authority unavailable');
  if (score < 80) missingEvidence.push(`Requirement score ${score}/100 below proof threshold`);
  if (criticalBlockers > 0) missingEvidence.push(`${criticalBlockers} critical requirement blocker(s)`);
  if ((requirement?.blockers.length ?? 0) > 0) {
    missingEvidence.push(requirement!.blockers[0] ?? 'Requirement blocker present');
  }

  let recommendedFix = 'Improve requirement extraction and clarity before planning/build claims.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Maintain requirement clarity through planning and build stages.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix = 'Strengthen requirement guidance — new users still hit confusion or dead ends.';
  }

  return {
    readOnly: true,
    stage: 'REQUIREMENTS',
    proofLevel,
    score,
    sourceAuthority: 'autonomous-builder-reality',
    upstreamState: available ? `SCORE_${score}` : 'UNAVAILABLE',
    evidence,
    missingEvidence,
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}

export function analyzePlanStage(
  contractReport: RequirementsToPlanContractReport | null,
  buildAssessment: ConnectedBuildExecutionAssessment,
): StageExecutionProof {
  if (contractReport) {
    const plan = contractReport.planContract;
    const buildReady = contractReport.buildReadyContract;
    let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
    if (
      contractReport.proofLevel === 'PROVEN' &&
      buildReady?.readinessState === 'BUILD_READY' &&
      contractReport.linkageAnalysis.requirementsToPlanTasks
    ) {
      proofLevel = 'PROVEN';
    } else if (contractReport.proofLevel === 'PARTIAL') {
      proofLevel = 'NOT_PROVEN';
    } else if (plan && plan.tasks.length > 0 && contractReport.linkageAnalysis.requirementsToPlanTasks) {
      proofLevel = 'PARTIAL';
    }

    const evidence: StageEvidenceEntry[] = [
      entry(
        'Plan tasks generated',
        `${plan?.tasks.length ?? 0} task(s)`,
        (plan?.tasks.length ?? 0) > 0,
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Tasks link to requirements',
        String(contractReport.linkageAnalysis.requirementsToPlanTasks),
        contractReport.linkageAnalysis.requirementsToPlanTasks,
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Build-ready contract',
        buildReady?.readinessState ?? 'none',
        buildReady?.readinessState === 'BUILD_READY',
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Execution order defined',
        `${buildReady?.executionOrder.length ?? 0} unit(s)`,
        (buildReady?.executionOrder.length ?? 0) > 0,
        'requirements-to-plan-execution-contract',
      ),
    ];

    const missingEvidence: string[] = [];
    if (!contractReport.linkageAnalysis.requirementsToPlanTasks) {
      missingEvidence.push('Plan tasks not fully linked to requirement IDs');
    }
    if (buildReady?.readinessState === 'NEEDS_CLARIFICATION') {
      missingEvidence.push('Build-ready contract needs clarification before plan is proven');
    }
    missingEvidence.push(...contractReport.linkageAnalysis.missingLinks.filter((l) => l.includes('plan')));

    let recommendedFix = contractReport.recommendedFix;
    if (proofLevel === 'PROVEN') {
      recommendedFix = 'Plan contract connected — proceed to BUILD execution proof.';
    }

    return {
      readOnly: true,
      stage: 'PLAN',
      proofLevel,
      score: buildReady?.confidence ?? contractReport.linkageAnalysis.traceabilityScore,
      sourceAuthority: 'requirements-to-plan-execution-contract',
      upstreamState: buildReady?.readinessState ?? 'NO_CONTRACT',
      evidence,
      missingEvidence,
      recommendedFix,
      downstreamBlocked: proofLevel !== 'PROVEN',
    };
  }

  const report = buildAssessment.report;
  const planner = report.inputSnapshot.executionPlannerAssessment;
  const plan = planner.plan;
  const answers = report.questionAnswers;

  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (
    plan !== null &&
    planner.planExecutable &&
    answers.executionPlanExists &&
    answers.validChangeSetExists
  ) {
    proofLevel = 'PROVEN';
  } else if (plan !== null && (answers.executionPlanExists || answers.validChangeSetExists)) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Execution plan exists',
      plan?.planId ?? 'none',
      plan !== null,
      'autonomous-builder-execution-planner',
    ),
    entry(
      'Plan executable',
      String(planner.planExecutable),
      planner.planExecutable,
      'autonomous-builder-execution-planner',
    ),
    entry(
      'Valid change set',
      String(answers.validChangeSetExists),
      answers.validChangeSetExists,
      'world2-change-set-authority',
    ),
    entry(
      'Dry-run package ready',
      report.inputSnapshot.dryRunComposerAssessment.packageState,
      report.inputSnapshot.dryRunComposerAssessment.packageState === 'DRY_RUN_PACKAGE_READY',
      'world2-dry-run-execution-composer',
    ),
  ];

  const missingEvidence: string[] = [];
  if (!plan) missingEvidence.push('No approved execution plan observed');
  if (!planner.planExecutable) missingEvidence.push('Execution plan not executable');
  if (!answers.validChangeSetExists) missingEvidence.push('Valid change set missing for plan');
  if (!answers.validWorkspaceBlueprintExists) missingEvidence.push('Workspace blueprint not validated');

  let recommendedFix = 'Produce executable plan linked to requirements and change set before build.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Keep plan-to-change-set linkage before build execution.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix = 'Complete plan executability and change set validation.';
  }

  return {
    readOnly: true,
    stage: 'PLAN',
    proofLevel,
    score: plan ? (planner.planExecutable ? 85 : 55) : 15,
    sourceAuthority: 'autonomous-builder-execution-planner',
    upstreamState: plan?.planType ?? 'NO_PLAN',
    evidence,
    missingEvidence,
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}

export function buildChainLinks(input: {
  requirements: StageExecutionProof;
  plan: StageExecutionProof;
  build: StageExecutionProof;
  runtime: StageExecutionProof;
  preview: StageExecutionProof;
  verify: StageExecutionProof;
  launch?: StageExecutionProof;
  buildAssessment: ConnectedBuildExecutionAssessment;
  runtimeAssessment: ConnectedRuntimeActivationAssessment;
  previewAssessment: ConnectedLivePreviewAssessment;
  verificationAssessment: ConnectedVerificationAssessment;
  contractReport?: RequirementsToPlanContractReport | null;
}): ChainLinkEvidence[] {
  const buildManifest = input.buildAssessment.report.buildOutputManifest;
  const runtimeCandidate = input.runtimeAssessment.report.runtimeActivationCandidate;
  const previewCandidate = input.previewAssessment.report.previewCandidate;
  const verifyCandidate = input.verificationAssessment.report.verificationCandidate;
  const planId = buildManifest.planId;
  const contract = input.contractReport;

  const links: ChainLinkEvidence[] = [
    {
      readOnly: true,
      fromStage: 'REQUIREMENTS',
      toStage: 'PLAN',
      connected: contract
        ? contract.linkageAnalysis.ideaToRequirements &&
          contract.linkageAnalysis.requirementsToPlanTasks &&
          input.requirements.proofLevel === 'PROVEN' &&
          input.plan.proofLevel === 'PROVEN'
        : input.requirements.proofLevel !== 'NOT_PROVEN' &&
          input.plan.proofLevel !== 'NOT_PROVEN' &&
          planId !== null,
      detail: contract
        ? `Contract linkage: idea→req=${contract.linkageAnalysis.ideaToRequirements}, req→plan=${contract.linkageAnalysis.requirementsToPlanTasks}`
        : planId !== null
          ? `Requirements feed plan ${planId}`
          : 'No plan id linking requirements to planning output',
    },
    {
      readOnly: true,
      fromStage: 'PLAN',
      toStage: 'BUILD',
      connected:
        input.plan.proofLevel === 'PROVEN' &&
        input.build.proofLevel !== 'NOT_PROVEN' &&
        planId !== null &&
        buildManifest.filesToCreate.length + buildManifest.expectedArtifacts.length > 0,
      detail:
        planId !== null
          ? `Plan ${planId} → build manifest ${buildManifest.manifestId}`
          : 'Plan not linked to build manifest',
    },
    {
      readOnly: true,
      fromStage: 'BUILD',
      toStage: 'RUNTIME',
      connected: runtimeCandidate.buildOutputManifestId === buildManifest.manifestId,
      detail: `${buildManifest.manifestId} → ${runtimeCandidate.buildOutputManifestId}`,
    },
    {
      readOnly: true,
      fromStage: 'RUNTIME',
      toStage: 'PREVIEW',
      connected:
        previewCandidate.runtimeActivationContractId ===
        input.runtimeAssessment.report.runtimeActivationContract.contractId,
      detail: `${input.runtimeAssessment.report.runtimeActivationContract.contractId} → ${previewCandidate.runtimeActivationContractId}`,
    },
    {
      readOnly: true,
      fromStage: 'PREVIEW',
      toStage: 'VERIFY',
      connected:
        verifyCandidate.previewReadinessContractId ===
        input.previewAssessment.report.previewReadinessContract.contractId,
      detail: `${input.previewAssessment.report.previewReadinessContract.contractId} → ${verifyCandidate.previewReadinessContractId}`,
    },
  ];

  if (input.launch) {
    links.push({
      readOnly: true,
      fromStage: 'VERIFY',
      toStage: 'LAUNCH',
      connected:
        input.verify.proofLevel === 'PROVEN' && input.launch.proofLevel === 'PROVEN',
      detail:
        input.launch.proofLevel === 'PROVEN'
          ? `Verification proven → launch proof ${input.launch.proofLevel}`
          : 'Verification not linked to proven launch readiness',
    });
  }

  return links;
}

export function analyzeExecutionChain(input: {
  stageProofs: StageExecutionProof[];
  chainLinks: ChainLinkEvidence[];
  chainMode?: 'core' | 'full';
}): ExecutionChainAnalysis {
  const chainMode = input.chainMode ?? 'core';
  const stagesToValidate =
    chainMode === 'full' ? EXECUTION_CHAIN_STAGE_ORDER : CORE_CHAIN_STAGES;

  const stageMap = new Map(input.stageProofs.map((s) => [s.stage, s]));
  const missingLinks = input.chainLinks.filter((l) => !l.connected).map((l) => `${l.fromStage}→${l.toStage}: ${l.detail}`);

  let firstBrokenStage: ExecutionStageId | null = null;
  for (const stage of stagesToValidate) {
    const proof = stageMap.get(stage);
    if (!proof || proof.proofLevel !== 'PROVEN') {
      firstBrokenStage = stage;
      break;
    }
  }

  if (!firstBrokenStage) {
    const brokenLink = input.chainLinks.find((l) => !l.connected);
    if (brokenLink) {
      firstBrokenStage = brokenLink.toStage;
    }
  }

  const allStagesProven = stagesToValidate.every(
    (stage) => stageMap.get(stage)?.proofLevel === 'PROVEN',
  );

  if (!firstBrokenStage && chainMode === 'core') {
    const allCoreProven = CORE_CHAIN_STAGES.every(
      (stage) => stageMap.get(stage)?.proofLevel === 'PROVEN',
    );
    const allCoreLinksConnected = input.chainLinks
      .filter((l) => l.toStage !== 'LAUNCH')
      .every((l) => l.connected);
    if (allCoreProven && allCoreLinksConnected) {
      firstBrokenStage = 'LAUNCH';
    }
  }

  const allLinksConnected = input.chainLinks.every((l) => l.connected);
  const chainConnected =
    chainMode === 'full' ? allStagesProven && allLinksConnected : false;

  return {
    readOnly: true,
    chainConnected,
    firstBrokenStage: chainMode === 'full' && chainConnected ? null : firstBrokenStage,
    chainLinks: input.chainLinks,
    missingLinks,
    downstreamBlockedFrom: firstBrokenStage,
  };
}

export function applyDownstreamBlocking(stageProofs: StageExecutionProof[]): StageExecutionProof[] {
  const order = CORE_CHAIN_STAGES;
  const firstBrokenIdx = order.findIndex(
    (stage) => stageProofs.find((s) => s.stage === stage)?.proofLevel !== 'PROVEN',
  );

  if (firstBrokenIdx < 0) return stageProofs;

  const blockedStages = new Set(order.slice(firstBrokenIdx + 1));

  return stageProofs.map((proof) => {
    if (!blockedStages.has(proof.stage)) return proof;
    if (proof.proofLevel === 'PROVEN') return proof;
    return {
      ...proof,
      downstreamBlocked: true,
      missingEvidence: dedupe([
        ...proof.missingEvidence,
        `Blocked downstream of ${order[firstBrokenIdx]} — prior stage not proven`,
      ]),
    };
  });
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}
