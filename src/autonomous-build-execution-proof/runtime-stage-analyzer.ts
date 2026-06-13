/**
 * Autonomous Build Execution Proof — RUNTIME stage analyzer.
 * Consumes Connected Runtime Activation Proof authority (Phase 26.9).
 */

import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import type { StageEvidenceEntry, StageExecutionProof } from './autonomous-build-execution-proof-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeRuntimeStage(
  runtimeActivationProof: RuntimeActivationProofReport | null,
): StageExecutionProof {
  if (!runtimeActivationProof) {
    return {
      readOnly: true,
      stage: 'RUNTIME',
      proofLevel: 'NOT_PROVEN',
      score: 0,
      sourceAuthority: 'connected-runtime-activation-proof',
      upstreamState: 'NO_ASSESSMENT',
      evidence: [
        entry('Connected runtime activation proof', 'not assessed', false, 'connected-runtime-activation-proof'),
      ],
      missingEvidence: ['Connected runtime activation proof assessment not run'],
      recommendedFix: 'Run connected runtime activation proof assessment.',
      downstreamBlocked: true,
    };
  }

  const report = runtimeActivationProof;
  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (
    report.runtimeProofLevel === 'PROVEN' &&
    report.linkage.runtimeLinkageConnected &&
    report.buildMaterializationProven &&
    report.process.processState === 'STARTED' &&
    report.port.reachable
  ) {
    proofLevel = 'PROVEN';
  } else if (report.runtimeProofLevel === 'PARTIAL' || report.command.runtimeCommandFound) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Build materialization proven',
      String(report.buildMaterializationProven),
      report.buildMaterializationProven,
      'connected-runtime-activation-proof',
    ),
    entry(
      'Runtime command',
      report.command.command ?? 'none',
      report.command.runtimeCommandFound,
      'connected-runtime-activation-proof',
    ),
    entry(
      'Runtime process',
      report.process.processState,
      report.process.processState === 'STARTED',
      'connected-runtime-activation-proof',
    ),
    entry(
      'Runtime port reachable',
      report.port.url ?? 'none',
      report.port.reachable,
      'connected-runtime-activation-proof',
    ),
    entry(
      'Runtime health',
      report.health.healthState,
      report.health.healthState === 'HEALTHY' || report.health.healthState === 'PARTIAL',
      'connected-runtime-activation-proof',
    ),
    entry(
      'Runtime linkage',
      String(report.linkage.runtimeLinkageConnected),
      report.linkage.runtimeLinkageConnected,
      'connected-runtime-activation-proof',
    ),
  ];

  const missingEvidence = [...report.missingEvidence];
  if (report.linkage.firstBrokenRuntimeLink) {
    missingEvidence.unshift(`First broken runtime link: ${report.linkage.firstBrokenRuntimeLink}`);
  }

  let recommendedFix = report.recommendedFix;
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Runtime activation proven — proceed to PREVIEW execution proof.';
  }

  return {
    readOnly: true,
    stage: 'RUNTIME',
    proofLevel,
    score: report.linkage.traceabilityScore,
    sourceAuthority: 'connected-runtime-activation-proof',
    upstreamState: report.runtimeActivationState,
    evidence,
    missingEvidence: missingEvidence.slice(0, 10),
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
