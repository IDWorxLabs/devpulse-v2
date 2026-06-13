/**
 * Autonomous Build Execution Proof — BUILD stage analyzer.
 * Consumes Connected Build Execution materialization authority (Phase 26.8).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
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
  connectedBuildExecution: ConnectedBuildExecutionReport | null,
): StageExecutionProof {
  if (!connectedBuildExecution) {
    return {
      readOnly: true,
      stage: 'BUILD',
      proofLevel: 'NOT_PROVEN',
      score: 0,
      sourceAuthority: 'connected-build-execution',
      upstreamState: 'NO_ASSESSMENT',
      evidence: [
        entry('Connected build execution', 'not assessed', false, 'connected-build-execution'),
      ],
      missingEvidence: ['Connected build execution assessment not run'],
      recommendedFix: 'Run connected build execution materialization assessment.',
      downstreamBlocked: true,
    };
  }

  const report = connectedBuildExecution;
  let proofLevel: StageExecutionProof['proofLevel'] = 'NOT_PROVEN';
  if (
    report.proofLevel === 'PROVEN' &&
    report.linkageAnalysis.linkageConnected &&
    report.artifactEvidence.artifactEvidenceLevel === 'PROVEN' &&
    report.workspaceMaterialization.workspaceExists
  ) {
    proofLevel = 'PROVEN';
  } else if (report.proofLevel === 'PARTIAL' || report.generatedFileEvidence.fileCount > 0) {
    proofLevel = 'PARTIAL';
  }

  const evidence: StageEvidenceEntry[] = [
    entry(
      'Materialization state',
      report.buildMaterialization.materializationState,
      report.buildMaterialization.materializationState === 'MATERIALIZED',
      'connected-build-execution',
    ),
    entry(
      'Generated files observed',
      `${report.generatedFileEvidence.fileCount}/${report.buildMaterialization.expectedArtifacts.length}`,
      report.generatedFileEvidence.fileCount > 0,
      'connected-build-execution',
    ),
    entry(
      'Artifact evidence',
      report.artifactEvidence.artifactEvidenceLevel,
      report.artifactEvidence.artifactEvidenceLevel === 'PROVEN',
      'connected-build-execution',
    ),
    entry(
      'Workspace exists',
      String(report.workspaceMaterialization.workspaceExists),
      report.workspaceMaterialization.workspaceExists,
      'connected-build-execution',
    ),
    entry(
      'Build output linkage',
      String(report.linkageAnalysis.linkageConnected),
      report.linkageAnalysis.linkageConnected,
      'connected-build-execution',
    ),
    entry(
      'Manifest traceability',
      `${report.buildManifest.traceabilityScore}/100`,
      report.buildManifest.traceabilityScore >= 90,
      'connected-build-execution',
    ),
  ];

  const missingEvidence = [...report.missingEvidence];
  if (report.linkageAnalysis.firstBrokenLink) {
    missingEvidence.unshift(`First broken link: ${report.linkageAnalysis.firstBrokenLink}`);
  }
  if (report.generatedFileEvidence.missingPaths.length > 0) {
    missingEvidence.push(
      ...report.generatedFileEvidence.missingPaths.slice(0, 4).map((p) => `Missing artifact: ${p}`),
    );
  }

  let recommendedFix = report.recommendedFix;
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Build materialization proven — proceed to RUNTIME execution proof.';
  }

  return {
    readOnly: true,
    stage: 'BUILD',
    proofLevel,
    score: report.linkageAnalysis.traceabilityScore,
    sourceAuthority: 'connected-build-execution',
    upstreamState: report.buildMaterialization.materializationState,
    evidence,
    missingEvidence: missingEvidence.slice(0, 10),
    recommendedFix,
    downstreamBlocked: proofLevel !== 'PROVEN',
  };
}
