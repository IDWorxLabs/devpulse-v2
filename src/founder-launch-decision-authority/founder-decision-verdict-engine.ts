/**
 * Founder decision verdict engine — apply strict LAUNCH gates.
 */

import {
  LAUNCH_CONFIDENCE_THRESHOLD,
  FOUNDER_LAUNCH_DECISION_CORE_QUESTION,
} from './founder-launch-decision-authority-registry.js';
import type {
  BlockerPriorityAnalysis,
  FounderDecisionVerdict,
  FounderLaunchDecision,
  LaunchRiskSignalAnalysis,
  ProofChainSignalAnalysis,
} from './founder-launch-decision-authority-types.js';

export function computeFounderDecisionVerdict(input: {
  proofSignals: ProofChainSignalAnalysis;
  riskSignals: LaunchRiskSignalAnalysis;
  blockers: BlockerPriorityAnalysis;
  sourceCodeOnlyFixture?: boolean;
}): FounderDecisionVerdict {
  const blockingIssues: string[] = [];
  const recommendedNextActions: string[] = [];
  const { proofSignals, riskSignals, blockers } = input;

  const executionLaunchReady = proofSignals.executionState === 'LAUNCH_READY';
  const runtimeConfirmed = proofSignals.runtimeProven;
  const launchReadinessConfirmed = proofSignals.launchReadinessProven;
  const hasCriticalBlockers = blockers.criticalCount > 0 || proofSignals.criticalBlockerCount > 0;
  const missingCount = proofSignals.missingEvidence.length;
  const partiallyProven =
    proofSignals.executionVerdict === 'PARTIAL' ||
    proofSignals.buildMaterializationProven ||
    proofSignals.validationProven;

  let founderLaunchDecision: FounderLaunchDecision = 'WAIT';
  let reason = 'Evidence is promising but founder review or observation is still needed.';
  let canLaunchNow = false;

  if (input.sourceCodeOnlyFixture) {
    return {
      readOnly: true,
      founderLaunchDecision: 'RUN_MORE_PROOF',
      decisionConfidence: 25,
      canLaunchNow: false,
      reason: 'Source code alone is not launch evidence — run full proof chain before deciding.',
      blockingIssues: ['Launch cannot be recommended from source code only'],
      recommendedNextActions: [
        'Run connected build materialization proof',
        'Confirm runtime activation proof',
        'Assess connected launch readiness proof',
      ],
      decisionSummary: `${FOUNDER_LAUNCH_DECISION_CORE_QUESTION} → RUN_MORE_PROOF (source code insufficient).`,
    };
  }

  if (hasCriticalBlockers && !runtimeConfirmed) {
    founderLaunchDecision = 'REJECT_LAUNCH';
    reason = 'Critical blockers and missing runtime proof make launch unsafe.';
    blockingIssues.push(...blockers.actionableBlockers.map((b) => b.message));
    if (!runtimeConfirmed) blockingIssues.push('Runtime activation not proven');
    recommendedNextActions.push('Do not launch until critical blockers are resolved and runtime is proven');
  } else if (hasCriticalBlockers) {
    founderLaunchDecision = 'FIX_BLOCKERS';
    reason = 'Launch may be possible after resolving critical blockers.';
    blockingIssues.push(...blockers.actionableBlockers.map((b) => b.message));
    recommendedNextActions.push(...blockers.actionableBlockers.slice(0, 3).map((b) => b.recommendedFix));
  } else if (!runtimeConfirmed && !launchReadinessConfirmed && missingCount >= 3 && hasCriticalBlockers) {
    founderLaunchDecision = 'REJECT_LAUNCH';
    reason = 'Runtime and launch readiness are unproven with critical blockers and substantial missing evidence.';
    blockingIssues.push('Runtime activation not proven', 'Launch readiness not proven');
    blockingIssues.push(...proofSignals.missingEvidence.slice(0, 4));
    recommendedNextActions.push('Complete runtime activation proof', 'Complete launch readiness proof');
  } else if (missingCount >= 2 || proofSignals.executionVerdict === 'NOT_PROVEN' || proofSignals.executionVerdict === 'UNKNOWN') {
    founderLaunchDecision = 'RUN_MORE_PROOF';
    reason = 'Missing or weak evidence prevents a safe launch decision.';
    blockingIssues.push(...proofSignals.missingEvidence.slice(0, 5));
    recommendedNextActions.push('Run live idea-to-launch execution runner', 'Fill proof chain gaps before deciding');
  } else if (
    executionLaunchReady &&
    runtimeConfirmed &&
    launchReadinessConfirmed &&
    !hasCriticalBlockers &&
    riskSignals.riskLevel !== 'CRITICAL' &&
    riskSignals.riskLevel !== 'HIGH'
  ) {
    founderLaunchDecision = 'LAUNCH';
    reason = 'Execution chain is LAUNCH_READY with runtime and launch readiness confirmed and no critical blockers.';
    canLaunchNow = true;
    recommendedNextActions.push('Founder may proceed to launch when ready', 'Monitor post-launch signals');
  } else if (partiallyProven && blockers.highCount > 0) {
    founderLaunchDecision = 'FIX_BLOCKERS';
    reason = 'Partial proof exists but high-priority blockers remain.';
    blockingIssues.push(...blockers.blockers.filter((b) => b.severity === 'HIGH').map((b) => b.message));
    recommendedNextActions.push(...blockers.actionableBlockers.slice(0, 3).map((b) => b.recommendedFix));
  } else if (!runtimeConfirmed) {
    founderLaunchDecision = 'RUN_MORE_PROOF';
    reason = 'Runtime proof is missing — LAUNCH cannot be recommended.';
    blockingIssues.push('Runtime activation not proven');
    recommendedNextActions.push('Run connected runtime activation proof');
  } else if (!launchReadinessConfirmed) {
    founderLaunchDecision = 'RUN_MORE_PROOF';
    reason = 'Launch readiness proof is missing — LAUNCH cannot be recommended.';
    blockingIssues.push('Launch readiness not proven');
    recommendedNextActions.push('Run connected launch readiness proof');
  } else if (!executionLaunchReady) {
    founderLaunchDecision = 'WAIT';
    reason = 'Evidence is incomplete — execution chain has not reached LAUNCH_READY.';
    blockingIssues.push(`Execution state: ${proofSignals.executionState}`);
    recommendedNextActions.push('Continue proof chain until LAUNCH_READY', 'Review founder test results');
  } else {
    founderLaunchDecision = 'WAIT';
    reason = 'Evidence is promising but confidence is not yet high enough for launch.';
    recommendedNextActions.push('Review proof signals with founder', 'Re-run assessment after additional proof');
  }

  if (founderLaunchDecision === 'LAUNCH') {
    if (!runtimeConfirmed) {
      founderLaunchDecision = 'RUN_MORE_PROOF';
      canLaunchNow = false;
      reason = 'LAUNCH blocked: runtime proof required.';
    } else if (hasCriticalBlockers) {
      founderLaunchDecision = 'FIX_BLOCKERS';
      canLaunchNow = false;
      reason = 'LAUNCH blocked: critical blockers present.';
    } else if (!launchReadinessConfirmed) {
      founderLaunchDecision = 'RUN_MORE_PROOF';
      canLaunchNow = false;
      reason = 'LAUNCH blocked: launch readiness not confirmed.';
    }
  }

  const baseConfidence = Math.round(
    (proofSignals.proofChainScore * 0.35 +
      riskSignals.launchReadinessScore * 0.25 +
      riskSignals.runtimeConfidenceScore * 0.25 +
      (100 - riskSignals.riskScore) * 0.15),
  );
  let decisionConfidence = Math.min(100, Math.max(0, baseConfidence));
  if (founderLaunchDecision === 'LAUNCH' && decisionConfidence < LAUNCH_CONFIDENCE_THRESHOLD) {
    founderLaunchDecision = 'WAIT';
    canLaunchNow = false;
    reason = 'Overall confidence below launch threshold despite partial proof.';
    recommendedNextActions.unshift('Increase proof chain confidence before launch');
  }
  if (founderLaunchDecision === 'REJECT_LAUNCH') decisionConfidence = Math.max(60, decisionConfidence);
  if (founderLaunchDecision === 'RUN_MORE_PROOF') decisionConfidence = Math.min(decisionConfidence, 70);

  const decisionSummary = `${FOUNDER_LAUNCH_DECISION_CORE_QUESTION} → ${founderLaunchDecision}. ${reason}`;

  return {
    readOnly: true,
    founderLaunchDecision,
    decisionConfidence,
    canLaunchNow,
    reason,
    blockingIssues: [...new Set(blockingIssues)].slice(0, 10),
    recommendedNextActions: [...new Set(recommendedNextActions)].slice(0, 8),
    decisionSummary,
  };
}
