/**
 * Autonomous Build Execution Proof — LAUNCH stage analyzer.
 */

import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
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
  founderTestAssessment: FounderTestAssessment,
  coreChainConnected: boolean,
): StageExecutionProof {
  const executionSummary = founderTestAssessment.executionProofSummary;
  const founderState = executionSummary?.founderExecutionState ?? 'INSUFFICIENT_EVIDENCE';
  const launchRec = executionSummary?.launchRecommendation ?? 'INSUFFICIENT_EVIDENCE';
  const overallProof = executionSummary?.overallFounderProofPercent ?? 0;

  const founderReality = founderTestAssessment.run.authorityResults.find(
    (r) => r.authorityId === 'FOUNDER_REALITY',
  );
  const acceptanceReady =
    founderTestAssessment.verdict === 'FOUNDER_READY' ||
    founderTestAssessment.verdict === 'FOUNDER_READY_WITH_WARNINGS';

  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (
    coreChainConnected &&
    founderState === 'FOUNDER_EXECUTION_PROVEN' &&
    launchRec === 'RECOMMEND_LAUNCH' &&
    acceptanceReady
  ) {
    proofLevel = 'PROVEN';
  } else if (
    founderState === 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS' ||
    launchRec === 'RECOMMEND_LAUNCH_WITH_WARNINGS' ||
    (overallProof >= 60 && acceptanceReady)
  ) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Founder execution proof state',
      founderState,
      founderState.startsWith('FOUNDER_EXECUTION_PROVEN'),
      'founder-execution-proof',
    ),
    entry(
      'Launch recommendation',
      launchRec,
      launchRec.startsWith('RECOMMEND_LAUNCH'),
      'founder-execution-proof',
    ),
    entry(
      'Overall founder proof percent',
      `${overallProof}%`,
      overallProof >= 80,
      'founder-execution-proof',
    ),
    entry(
      'Founder test verdict',
      founderTestAssessment.verdict,
      acceptanceReady,
      'founder-test-integration',
    ),
    entry(
      'Founder workflow reality',
      founderReality ? `${founderReality.normalizedScore}/100` : 'unavailable',
      (founderReality?.normalizedScore ?? 0) >= 70,
      'end-to-end-founder-workflow-reality',
    ),
    entry(
      'Core execution chain connected',
      String(coreChainConnected),
      coreChainConnected,
      'autonomous-build-execution-proof',
    ),
  ];

  const missingEvidence: string[] = [];
  if (!coreChainConnected) {
    missingEvidence.push('Core execution chain not connected — launch cannot be proven');
  }
  if (founderState === 'FOUNDER_EXECUTION_NOT_PROVEN' || founderState === 'FOUNDER_EXECUTION_BLOCKED') {
    missingEvidence.push(`Founder execution proof state: ${founderState}`);
  }
  if (launchRec === 'DO_NOT_RECOMMEND_LAUNCH' || launchRec === 'BLOCK_LAUNCH') {
    missingEvidence.push(`Launch recommendation: ${launchRec}`);
  }
  if (!acceptanceReady) {
    missingEvidence.push(`Founder test verdict ${founderTestAssessment.verdict} blocks launch proof`);
  }

  let recommendedFix = 'Prove connected execution chain before claiming idea-to-launch readiness.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Maintain founder execution proof and acceptance evidence through launch.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix = 'Resolve launch warning gaps — chain or acceptance not fully proven.';
  }

  return {
    readOnly: true,
    stage: 'LAUNCH',
    proofLevel,
    score: overallProof,
    sourceAuthority: 'founder-execution-proof',
    upstreamState: founderState,
    evidence,
    missingEvidence,
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
