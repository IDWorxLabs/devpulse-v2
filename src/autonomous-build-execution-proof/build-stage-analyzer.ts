/**
 * Autonomous Build Execution Proof — BUILD stage analyzer.
 */

import type { ConnectedBuildExecutionAssessment } from '../connected-build-execution-foundation/connected-build-execution-types.js';
import type { StageEvidenceEntry, StageExecutionProof } from './autonomous-build-execution-proof-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeBuildStage(
  buildAssessment: ConnectedBuildExecutionAssessment,
): StageExecutionProof {
  const report = buildAssessment.report;
  const manifest = report.buildOutputManifest;
  const answers = report.questionAnswers;
  const state = report.buildOutputState;

  const generatedFilesObserved =
    manifest.filesToCreate.length > 0 || manifest.expectedArtifacts.length > 0;
  const builderExists = report.inputSnapshot.executionPlannerAssessment.plan !== null;
  const outputVerified = state === 'BUILD_OUTPUT_PROVEN';

  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (outputVerified && generatedFilesObserved && answers.outputsTraceable) {
    proofLevel = 'PROVEN';
  } else if (
    builderExists &&
    (state === 'BUILD_OUTPUT_PARTIALLY_PROVEN' || generatedFilesObserved)
  ) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Execution plan linked',
      manifest.planId ?? 'no plan id',
      manifest.planId !== null,
      'autonomous-builder-execution-planner',
    ),
    entry(
      'Expected file outputs',
      `${manifest.filesToCreate.length} create / ${manifest.filesToModify.length} modify`,
      generatedFilesObserved,
      'connected-build-execution-foundation',
    ),
    entry(
      'Proof artifacts',
      `${manifest.proofArtifacts.length} artifact(s)`,
      manifest.proofArtifacts.length > 0,
      'connected-build-execution-foundation',
    ),
    entry(
      'Verification artifacts',
      `${manifest.verificationArtifacts.length} artifact(s)`,
      manifest.verificationArtifacts.length > 0,
      'connected-build-execution-foundation',
    ),
    entry(
      'Build output state',
      state,
      outputVerified,
      'connected-build-execution-foundation',
    ),
  ];

  const missingEvidence: string[] = [];
  if (!generatedFilesObserved) missingEvidence.push('No generated artifacts observed in build manifest');
  if (!answers.outputsTraceable) missingEvidence.push('Plan-to-output traceability missing');
  if (!answers.outputsVerifiable) missingEvidence.push('Build output verification coverage missing');
  if (state === 'BUILD_OUTPUT_NOT_PROVEN') {
    missingEvidence.push('Build output not proven — dry-run chain incomplete');
  }

  let recommendedFix = 'Complete connected build output proof with traceable generated artifacts.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Maintain build manifest linkage before any real execution phase.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix = 'Resolve partial build proof — verify generated outputs against execution plan.';
  }

  return {
    readOnly: true,
    stage: 'BUILD',
    proofLevel,
    score: report.buildOutputScore,
    sourceAuthority: 'connected-build-execution-foundation',
    upstreamState: state,
    evidence,
    missingEvidence,
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
