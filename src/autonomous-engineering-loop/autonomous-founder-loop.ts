/**
 * Autonomous Founder Loop (AFL) — founder simulation as an improvement loop.
 */

import {
  buildBuildRealityEvidenceFromWorkspace,
  collectFounderLaunchEvidence,
} from '../autonomous-founder-launch-authority/founder-evidence-collector.js';
import {
  buildFounderLaunchScores,
  deriveFounderLaunchVerdict,
} from '../autonomous-founder-launch-authority/founder-verdict-engine.js';
import { runFounderReviewerPanel } from '../autonomous-founder-launch-authority/founder-reviewer-engine.js';
import { buildFounderRemediationPlan } from '../autonomous-founder-launch-authority/founder-remediation-plan.js';
import type { AelDecision, FounderLoopCycleReport } from './ael-types.js';
import { AEL_MAX_FOUNDER_LOOP_CYCLES } from './ael-types.js';
import type { ProductRealityReport } from './ael-types.js';

export interface AutonomousFounderLoopInput {
  rawPrompt: string;
  workspaceDir: string;
  projectId: string;
  productRealityReport: ProductRealityReport;
  npmBuildOk: boolean;
  previewOk: boolean;
  cycleBudget?: number;
}

export interface AutonomousFounderLoopResult {
  readOnly: true;
  cycles: readonly FounderLoopCycleReport[];
  finalVerdict: FounderLoopCycleReport['verdict'];
  routedDecision: AelDecision | null;
  launchReady: boolean;
  humanReviewRequired: boolean;
  safetyReviewRequired: boolean;
}

function routeFounderFinding(input: {
  verdict: FounderLoopCycleReport['verdict'];
  blockers: readonly string[];
  productReality: ProductRealityReport;
  npmBuildOk: boolean;
  previewOk: boolean;
}): AelDecision | null {
  if (input.verdict === 'LAUNCH_READY') return 'DECLARE_LAUNCH_READY';
  if (input.verdict === 'HUMAN_REVIEW') return 'REQUEST_HUMAN_REVIEW';
  if (input.verdict === 'SAFETY_REVIEW') return 'REQUEST_HUMAN_REVIEW';

  const blockerText = input.blockers.join(' ').toLowerCase();
  if (!input.npmBuildOk || /compile|build error|syntax|type error/i.test(blockerText)) {
    return 'RUN_AUTOFIX';
  }
  if (
    input.productReality.missingCapabilities.length > 0 ||
    input.productReality.genericFallbackDetected ||
    input.verdict === 'NEEDS_CAPABILITY'
  ) {
    return 'RUN_CAPABILITY_EVOLUTION';
  }
  if (!input.previewOk || input.verdict === 'NEEDS_PREVIEW') {
    return 'RUN_PREVIEW_RECOVERY';
  }
  return 'CONTINUE_LOOP';
}

export function runAutonomousFounderLoop(input: AutonomousFounderLoopInput): AutonomousFounderLoopResult {
  const budget = input.cycleBudget ?? AEL_MAX_FOUNDER_LOOP_CYCLES;
  const cycles: FounderLoopCycleReport[] = [];
  let finalVerdict: FounderLoopCycleReport['verdict'] = 'NEEDS_REPAIR';
  let routedDecision: AelDecision | null = null;

  for (let cycle = 1; cycle <= budget; cycle++) {
    const buildReality = buildBuildRealityEvidenceFromWorkspace({
      npmInstallOk: true,
      npmBuildOk: input.npmBuildOk,
      devServerOk: input.previewOk,
      workspacePresent: true,
    });
    const evidence = collectFounderLaunchEvidence({
      workspaceDir: input.workspaceDir,
      buildReality,
      productPrompt: input.rawPrompt,
      requiredModuleIds: [...input.productRealityReport.missingCapabilities],
    });
    const reviewers = runFounderReviewerPanel(evidence);
    const remediation = buildFounderRemediationPlan({ evidence, reviewers });
    const scores = buildFounderLaunchScores(reviewers);
    const verdict = deriveFounderLaunchVerdict({
      evidence,
      scores,
      reviewers,
      remediationPlan: remediation,
    });

    const launchBlockers = [
      ...input.productRealityReport.launchReadinessBlockers,
      ...remediation.issues.map((i) => i.summary),
    ].filter(Boolean);

    const missingWorkflows = input.productRealityReport.missingCapabilities.map(
      (c) => `Missing workflow capability: ${c}`,
    );
    const trustIssues = reviewers
      .flatMap((r) => r.risks)
      .filter((r) => /trust|honest|placeholder|misleading/i.test(r));
    const safetyGaps = reviewers
      .flatMap((r) => r.risks)
      .filter((r) => /safety|security|privacy|payment|medical/i.test(r));

    let cycleVerdict: FounderLoopCycleReport['verdict'];
    if (
      (verdict === 'LAUNCH_READY' || verdict === 'LAUNCH_READY_WITH_WARNINGS') &&
      input.productRealityReport.productRealityScore >= 70
    ) {
      cycleVerdict = 'LAUNCH_READY';
    } else if (safetyGaps.length > 0 && /unsafe|real payment|live integration/i.test(safetyGaps.join(' '))) {
      cycleVerdict = 'SAFETY_REVIEW';
    } else if (verdict === 'NEEDS_HUMAN_REVIEW') {
      cycleVerdict = 'HUMAN_REVIEW';
    } else if (missingWorkflows.length > 0 || input.productRealityReport.genericFallbackDetected) {
      cycleVerdict = 'NEEDS_CAPABILITY';
    } else if (!input.previewOk) {
      cycleVerdict = 'NEEDS_PREVIEW';
    } else if (!input.npmBuildOk || verdict === 'NEEDS_AUTOFIX') {
      cycleVerdict = 'NEEDS_REPAIR';
    } else {
      cycleVerdict = 'NEEDS_REPAIR';
    }

    const routedTo = routeFounderFinding({
      verdict: cycleVerdict,
      blockers: launchBlockers,
      productReality: input.productRealityReport,
      npmBuildOk: input.npmBuildOk,
      previewOk: input.previewOk,
    });

    cycles.push({
      readOnly: true,
      cycle,
      verdict: cycleVerdict,
      launchBlockers,
      missingWorkflows,
      trustIssues,
      safetyGaps,
      routedTo,
    });

    finalVerdict = cycleVerdict;
    routedDecision = routedTo;

    if (cycleVerdict === 'LAUNCH_READY') break;
    if (cycleVerdict === 'HUMAN_REVIEW' || cycleVerdict === 'SAFETY_REVIEW') break;
  }

  return {
    readOnly: true,
    cycles,
    finalVerdict,
    routedDecision,
    launchReady: finalVerdict === 'LAUNCH_READY',
    humanReviewRequired: finalVerdict === 'HUMAN_REVIEW',
    safetyReviewRequired: finalVerdict === 'SAFETY_REVIEW',
  };
}
