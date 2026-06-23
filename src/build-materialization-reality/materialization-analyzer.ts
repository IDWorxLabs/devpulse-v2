/**
 * Materialization Verdict Analyzer — single primary root cause (Phase 26.74).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type {
  ArtifactRealityScanSummary,
  BuildMaterializationVerdict,
  MaterializationChainStep,
  MaterializationGapKind,
  MaterializationVerdictAnalysis,
} from './build-materialization-reality-types.js';
import { findFirstMissingExpectedFile } from './artifact-scanner.js';
import { resolveFirstBrokenChainLink } from './chain-linker.js';

export function analyzeMaterializationVerdict(input: {
  artifactScan: ArtifactRealityScanSummary;
  materializationChain: readonly MaterializationChainStep[];
  connectedBuildReport: ConnectedBuildExecutionReport | null;
  contractId: string | null;
}): MaterializationVerdictAnalysis {
  const firstBrokenLink =
    input.connectedBuildReport?.linkageAnalysis.firstBrokenLink ??
    resolveFirstBrokenChainLink(input.materializationChain);

  const firstBrokenFile =
    findFirstMissingExpectedFile(input.artifactScan, input.contractId) ??
    input.connectedBuildReport?.generatedFileEvidence.missingPaths[0] ??
    input.materializationChain.find((s) => s.stage === 'artifact files')?.missingEvidence[0] ??
    null;

  const diskHasFiles = input.artifactScan.totalExistingArtifacts > 0;
  const expectedMissing = input.artifactScan.totalMissingArtifacts > 0;
  const proofSeesFiles =
    (input.connectedBuildReport?.generatedFileEvidence.fileCount ?? 0) > 0;
  const proofLinked = input.connectedBuildReport?.linkageAnalysis.linkageConnected === true;
  const manifestLinked = input.artifactScan.workspaces.some((w) => w.linkedToManifest);
  const executionProofLinked = input.artifactScan.workspaces.some((w) => w.linkedToExecutionProof);

  const diskFull =
    input.artifactScan.totalExpectedArtifacts > 0 &&
    input.artifactScan.totalExistingArtifacts >= input.artifactScan.totalExpectedArtifacts;
  const proofFull =
    input.connectedBuildReport?.generatedFileEvidence.proofLevel === 'PROVEN' &&
    proofLinked;

  const propagationFailure =
    diskHasFiles &&
    proofSeesFiles &&
    diskFull !== proofFull &&
    (diskFull && !proofFull);

  const candidates: Array<{ verdict: BuildMaterializationVerdict; priority: number; reason: string }> =
    [];

  if (
    input.artifactScan.totalExpectedArtifacts > 0 &&
    input.artifactScan.totalExistingArtifacts >= input.artifactScan.totalExpectedArtifacts &&
    proofFull &&
    input.materializationChain.every((s) => s.proven)
  ) {
    return {
      readOnly: true,
      primaryVerdict: 'BUILD_MATERIALIZATION_PROVEN',
      gapKind: 'NONE',
      firstBrokenLink: null,
      firstBrokenFile: null,
      lostEvidenceAuthority: null,
      verdictReason: 'All expected artifact files exist on disk with full proof linkage.',
      supportingVerdicts: [],
    };
  }

  if (!diskHasFiles || input.artifactScan.totalExistingArtifacts === 0) {
    candidates.push({
      verdict: 'ARTIFACTS_NOT_GENERATED',
      priority: 1,
      reason: 'No non-empty artifact files observed on disk under .generated-builder-workspaces/.',
    });
  }

  if (diskHasFiles && expectedMissing) {
    candidates.push({
      verdict: 'ARTIFACTS_NOT_GENERATED',
      priority: 2,
      reason: `${input.artifactScan.totalMissingArtifacts} expected artifact file(s) missing on disk.`,
    });
  }

  if (diskHasFiles && !expectedMissing && !manifestLinked) {
    candidates.push({
      verdict: 'ARTIFACTS_GENERATED_NOT_LINKED',
      priority: 3,
      reason: 'Files exist but build-manifest.json linkage is missing.',
    });
  }

  if (
    diskHasFiles &&
    firstBrokenLink === 'artifacts→files' &&
    input.connectedBuildReport &&
    input.connectedBuildReport.buildManifest.missingArtifacts.length > 0
  ) {
    candidates.push({
      verdict: 'ARTIFACTS_GENERATED_NOT_LINKED',
      priority: 4,
      reason: `Connected build proof reports ${input.connectedBuildReport.buildManifest.missingArtifacts.length} unlinked artifact(s).`,
    });
  }

  if (
    diskHasFiles &&
    (firstBrokenLink === 'files→workspace' || !executionProofLinked) &&
    manifestLinked
  ) {
    candidates.push({
      verdict: 'WORKSPACE_NOT_LINKED',
      priority: 5,
      reason: 'Artifact files exist but workspace is not linked to execution proof chain.',
    });
  }

  if (propagationFailure || (diskFull && !proofLinked && proofSeesFiles)) {
    candidates.push({
      verdict: 'EVIDENCE_PROPAGATION_FAILURE',
      priority: 6,
      reason:
        'Disk evidence exceeds what connected-build-execution / autonomous-build-execution-proof propagates.',
    });
  }

  if (candidates.length === 0) {
    if (firstBrokenLink === 'artifacts→files') {
      candidates.push({
        verdict: 'ARTIFACTS_NOT_GENERATED',
        priority: 7,
        reason: 'artifacts→files link broken — expected files not proven on disk.',
      });
    } else {
      candidates.push({
        verdict: 'ARTIFACTS_GENERATED_NOT_LINKED',
        priority: 8,
        reason: firstBrokenLink
          ? `Broken link ${firstBrokenLink} prevents materialization proof.`
          : 'Partial materialization without full linkage.',
      });
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  const primary = candidates[0]!;

  let gapKind: MaterializationGapKind = 'PRODUCT_GAP';
  if (primary.verdict === 'EVIDENCE_PROPAGATION_FAILURE') {
    gapKind = 'PROOF_GAP';
  } else if (primary.verdict === 'BUILD_MATERIALIZATION_PROVEN') {
    gapKind = 'NONE';
  } else if (diskHasFiles && !proofSeesFiles) {
    gapKind = 'PROOF_GAP';
  }

  let lostEvidenceAuthority: string | null = null;
  if (primary.verdict === 'EVIDENCE_PROPAGATION_FAILURE') {
    lostEvidenceAuthority = 'connected-build-execution';
  } else if (primary.verdict === 'WORKSPACE_NOT_LINKED') {
    lostEvidenceAuthority = 'autonomous-build-execution-proof';
  } else if (primary.verdict === 'ARTIFACTS_GENERATED_NOT_LINKED') {
    lostEvidenceAuthority = 'build-manifest-analyzer';
  } else if (primary.verdict === 'ARTIFACTS_NOT_GENERATED') {
    lostEvidenceAuthority = 'autonomous-builder-execution';
  }

  return {
    readOnly: true,
    primaryVerdict: primary.verdict,
    gapKind,
    firstBrokenLink,
    firstBrokenFile,
    lostEvidenceAuthority,
    verdictReason: primary.reason,
    supportingVerdicts: candidates.slice(1).map((c) => c.verdict),
  };
}

export function buildFounderAnswersFromVerdict(input: {
  verdict: MaterializationVerdictAnalysis;
  artifactScan: ArtifactRealityScanSummary;
}): import('./build-materialization-reality-types.js').BuildMaterializationFounderAnswers {
  const primaryWorkspace = input.artifactScan.workspaces[0];
  const didGenerate =
    input.artifactScan.totalExistingArtifacts > 0 &&
    input.verdict.primaryVerdict !== 'ARTIFACTS_NOT_GENERATED';
  const didCreateWorkspace = primaryWorkspace?.workspacePopulated === true;

  const fixes: string[] = [];
  switch (input.verdict.primaryVerdict) {
    case 'ARTIFACTS_NOT_GENERATED':
      fixes.push(
        'Run autonomous builder to materialize expected artifact files under .generated-builder-workspaces/.',
      );
      if (input.verdict.firstBrokenFile) {
        fixes.push(`First missing file: ${input.verdict.firstBrokenFile}`);
      }
      break;
    case 'ARTIFACTS_GENERATED_NOT_LINKED':
      fixes.push('Link generated files into build-manifest.json and connected build execution proof.');
      fixes.push(`Repair broken link: ${input.verdict.firstBrokenLink ?? 'artifacts→files'}`);
      break;
    case 'WORKSPACE_NOT_LINKED':
      fixes.push('Connect workspace directory to execution proof and runtime activation chain.');
      break;
    case 'EVIDENCE_PROPAGATION_FAILURE':
      fixes.push(
        'Fix evidence propagation from disk scan into connected-build-execution and autonomous-build-execution-proof.',
      );
      break;
    case 'BUILD_MATERIALIZATION_PROVEN':
      fixes.push('Proceed to RUNTIME → PREVIEW → VERIFY → LAUNCH execution proof stages.');
      break;
  }

  return {
    readOnly: true,
    didGenerateBuildFiles: didGenerate,
    didCreateWorkspaceFiles: didCreateWorkspace,
    firstBrokenLink: input.verdict.firstBrokenLink,
    firstBrokenFile: input.verdict.firstBrokenFile,
    lostEvidenceAuthority: input.verdict.lostEvidenceAuthority,
    gapKind: input.verdict.gapKind,
    whatMustBeFixedNext: fixes,
  };
}
