/**
 * Autonomous Build Execution Proof — LAUNCH stage analyzer.
 * Consumes Connected Launch Readiness Proof authority (Phase 26.12).
 */

import type { LaunchReadinessProofReport } from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';
import type { StageEvidenceEntry, StageExecutionProof } from './autonomous-build-execution-proof-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeLaunchStage(
  launchReadinessProof: LaunchReadinessProofReport | null,
): StageExecutionProof {
  if (!launchReadinessProof) {
    return {
      readOnly: true,
      stage: 'LAUNCH',
      proofLevel: 'NOT_PROVEN',
      score: 0,
      sourceAuthority: 'connected-launch-readiness-proof',
      upstreamState: 'NO_ASSESSMENT',
      evidence: [
        entry(
          'Connected launch readiness proof',
          'not assessed',
          false,
          'connected-launch-readiness-proof',
        ),
      ],
      missingEvidence: ['Connected launch readiness proof assessment not run'],
      recommendedFix: 'Run connected launch readiness proof assessment.',
      downstreamBlocked: true,
    };
  }

  const report = launchReadinessProof;
  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (report.launchProofLevel === 'PROVEN') {
    proofLevel = 'PROVEN';
  } else if (report.launchProofLevel === 'PARTIAL') {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Launch proof level',
      report.launchProofLevel,
      report.launchProofLevel !== 'NOT_PROVEN',
      'connected-launch-readiness-proof',
    ),
    entry(
      'Launch state',
      report.launchState,
      report.launchState === 'READY' || report.launchState === 'READY_WITH_WARNINGS',
      'connected-launch-readiness-proof',
    ),
    entry(
      'Launch execution connected',
      String(report.launchExecutionConnected),
      report.launchExecutionConnected,
      'connected-launch-readiness-proof',
    ),
    entry(
      'Launch criteria satisfied',
      String(report.launchCriteriaSatisfied),
      report.launchCriteriaSatisfied,
      'connected-launch-readiness-proof',
    ),
    entry(
      'Verification proven',
      String(report.verificationProven),
      report.verificationProven,
      'connected-launch-readiness-proof',
    ),
    entry(
      'Launch linkage connected',
      String(report.linkage.launchLinkageConnected),
      report.linkage.launchLinkageConnected,
      'connected-launch-readiness-proof',
    ),
    entry(
      'Acceptance state',
      report.acceptance.acceptanceState,
      report.acceptance.acceptanceState !== 'REJECTED',
      'connected-launch-readiness-proof',
    ),
    entry(
      'Critical blockers',
      String(report.blockers.criticalCount),
      report.blockers.criticalCount === 0,
      'connected-launch-readiness-proof',
    ),
    entry(
      'Claim-reality critical violations',
      String(report.claimReality.criticalViolations),
      report.claimReality.criticalViolations === 0,
      'connected-launch-readiness-proof',
    ),
  ];

  const missingEvidence = [...report.missingEvidence];
  if (report.linkage.firstBrokenLaunchLink) {
    missingEvidence.unshift(
      `First broken launch link: ${report.linkage.firstBrokenLaunchLink}`,
    );
  }

  let recommendedFix = report.recommendedFix;
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Launch readiness proven — maintain connected evidence through release.';
  }

  return {
    readOnly: true,
    stage: 'LAUNCH',
    proofLevel,
    score: report.readiness.readinessScore,
    sourceAuthority: 'connected-launch-readiness-proof',
    upstreamState: report.launchState,
    evidence,
    missingEvidence: missingEvidence.slice(0, 10),
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
