/** Artifact ownership validation for current BuildContext. */
import { fingerprintBuildContextValue } from './build-context-fingerprint.js';
import type { BuildContext, BuildContextArtifact, BuildContextFindingSeverity, BuildContextIntegrityFinding } from './build-context-types.js';

export function ownedArtifact(input: {
  readonly artifactKind: BuildContextArtifact['artifactKind'];
  readonly artifactId: string;
  readonly buildContext: BuildContext;
  readonly sourceAuthority: string;
  readonly displayName?: string | null;
  readonly route?: string | null;
}): BuildContextArtifact {
  const base = {
    artifactId: input.artifactId,
    artifactKind: input.artifactKind,
    displayName: input.displayName ?? null,
    route: input.route ?? null,
    buildContextId: input.buildContext.buildContextId,
    approvedEnvelopeFingerprint: input.buildContext.approvedEnvelopeFingerprint,
    sourceAuthority: input.sourceAuthority,
  };
  return { ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export function buildContextFinding(input: {
  readonly diagnosticCode: string;
  readonly severity?: BuildContextFindingSeverity;
  readonly expectedBuildContextId: string;
  readonly observedBuildContextIds?: readonly string[];
  readonly artifactIds?: readonly string[];
  readonly message: string;
}): BuildContextIntegrityFinding {
  const base = {
    diagnosticCode: input.diagnosticCode,
    severity: input.severity ?? 'BLOCKER',
    expectedBuildContextId: input.expectedBuildContextId,
    observedBuildContextIds: [...(input.observedBuildContextIds ?? [])].sort(),
    artifactIds: [...(input.artifactIds ?? [])].sort(),
    message: input.message,
  };
  return {
    ...base,
    findingId: `pbci-${base.diagnosticCode}-${fingerprintBuildContextValue(base).slice(0, 10)}`,
    fingerprint: fingerprintBuildContextValue(base),
  };
}

export function validateArtifactOwnership(
  buildContext: BuildContext,
  artifacts: readonly BuildContextArtifact[],
): BuildContextIntegrityFinding[] {
  return artifacts
    .filter(
      (artifact) =>
        artifact.buildContextId !== buildContext.buildContextId ||
        artifact.approvedEnvelopeFingerprint !== buildContext.approvedEnvelopeFingerprint,
    )
    .map((artifact) =>
      buildContextFinding({
        diagnosticCode: 'foreign_build_context_artifact',
        expectedBuildContextId: buildContext.buildContextId,
        observedBuildContextIds: [artifact.buildContextId],
        artifactIds: [artifact.artifactId],
        message: `Artifact ${artifact.artifactId} belongs to a different build context.`,
      }),
    );
}
