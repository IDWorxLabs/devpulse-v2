/**
 * BUILD stage analyzer — generated files, materialization, execution proof.
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
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

export function analyzeBuildStage(input: {
  buildMaterialization: ConnectedBuildExecutionReport | null;
  executionProof: AutonomousBuildExecutionProofReport | null;
  planningConfirmed: boolean;
}): StageAnalysis {
  const evidence: StageEvidenceEntry[] = [];
  const missingEvidence: string[] = [];
  const weakEvidence: string[] = [];
  const sources: string[] = [];
  let score = 0;

  if (!input.planningConfirmed) {
    missingEvidence.push('PLANNING stage not confirmed — build cannot be proven');
  }

  if (input.buildMaterialization) {
    sources.push('connected-build-execution');
    const report = input.buildMaterialization;
    evidence.push(
      entry(
        'Build proof level',
        report.proofLevel,
        report.proofLevel === 'PROVEN',
        'connected-build-execution',
      ),
      entry(
        'Materialized files',
        `${report.generatedFileEvidence.fileCount} file(s)`,
        report.generatedFileEvidence.fileCount > 0,
        'connected-build-execution',
      ),
      entry(
        'Workspace materialization',
        report.buildMaterialization.materializationState,
        report.buildMaterialization.materializationState === 'MATERIALIZED',
        'connected-build-execution',
      ),
    );
    if (report.proofLevel === 'PROVEN') score += 50;
    else if (report.proofLevel === 'PARTIAL') score += 30;
    else missingEvidence.push('Build materialization not proven');
    if (report.generatedFileEvidence.fileCount > 0) score += 25;
    else missingEvidence.push('No materialized files observed');
    missingEvidence.push(...report.missingEvidence.slice(0, 3));
  } else {
    missingEvidence.push('Connected build execution report not available');
    weakEvidence.push('Source code presence alone does not confirm build');
  }

  const buildProof = input.executionProof?.stageProofs.find((s) => s.stage === 'BUILD');
  if (buildProof) {
    sources.push('autonomous-build-execution-proof');
    evidence.push(
      entry('Execution proof BUILD stage', buildProof.proofLevel, buildProof.proofLevel === 'PROVEN', 'autonomous-build-execution-proof'),
    );
    if (buildProof.proofLevel === 'PROVEN') score = Math.max(score, 95);
    else if (buildProof.proofLevel === 'PARTIAL') score = Math.max(score, 55);
  }

  score = Math.min(100, score);
  let evidenceLevel: StageEvidenceLevel = 'MISSING';
  if (!input.planningConfirmed) evidenceLevel = 'BLOCKED';
  else if (score >= STAGE_CONFIRM_THRESHOLD) evidenceLevel = 'CONFIRMED';
  else if (score >= STAGE_PARTIAL_THRESHOLD) evidenceLevel = 'PARTIAL';

  const confirmed =
    evidenceLevel === 'CONFIRMED' &&
    input.buildMaterialization?.proofLevel === 'PROVEN' &&
    (input.buildMaterialization?.generatedFileEvidence.fileCount ?? 0) > 0;

  return {
    readOnly: true,
    stage: 'BUILD',
    evidenceLevel,
    confirmed,
    score,
    sourceAuthorities: [...new Set(sources)],
    evidence,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 8),
    weakEvidence: [...new Set(weakEvidence)].slice(0, 6),
    recommendedFix: confirmed
      ? 'Build materialization confirmed — proceed to validation proof.'
      : 'Prove connected build materialization with observed file evidence.',
  };
}
