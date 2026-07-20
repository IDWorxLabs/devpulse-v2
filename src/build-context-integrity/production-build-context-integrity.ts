/** Canonical Production Build Context and Surface Integrity Authority V1. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import { createProductionBuildContext } from './build-context.js';
import { ownedArtifact, validateArtifactOwnership } from './artifact-ownership-validator.js';
import { generateBuildContextIntegrityReport } from './build-context-report.js';
import { validateNavigationPurity, toBuildContextNavigationEntry } from './navigation-purity-validator.js';
import { validateProjectIdentityPurity } from './project-identity-validator.js';
import { validateWorkspaceIsolation } from './workspace-isolation.js';
import type { BuildContext, BuildContextArtifact, BuildContextIntegrityReport } from './build-context-types.js';

function workspaceRecord(files: readonly GeneratedWorkspaceFile[]): Record<string, string> {
  return Object.fromEntries(files.map((file) => [file.relativePath, file.content]));
}

function extractRegistryNavigation(files: readonly GeneratedWorkspaceFile[], buildContext: BuildContext, envelope: ApprovedProductionBuildEnvelope) {
  const registry = files.find((file) => file.relativePath === 'src/features/registry.ts')?.content ?? '';
  return [...registry.matchAll(/id: '([^']+)'.*?name: '([^']+)'.*?route: '([^']+)'/gs)].map((match) =>
    toBuildContextNavigationEntry({
      moduleId: match[1] ?? null,
      label: match[2] ?? '',
      route: match[3] ?? '/',
      buildContext,
      envelope,
    }),
  );
}

export function evaluateProductionBuildContextIntegrity(input: {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly workspaceFiles: readonly GeneratedWorkspaceFile[];
  readonly projectId?: string | null;
  readonly workspaceId?: string | null;
  readonly previousProductIdentities?: readonly string[];
  readonly previousWorkspaceTokens?: readonly string[];
  readonly traceabilityFingerprint?: string | null;
  readonly engineeringFingerprint?: string | null;
}): BuildContextIntegrityReport {
  const buildContext = createProductionBuildContext({
    envelope: input.envelope,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    traceabilityFingerprint: input.traceabilityFingerprint,
    engineeringFingerprint: input.engineeringFingerprint,
  });
  const artifacts: BuildContextArtifact[] = input.workspaceFiles.map((file) =>
    ownedArtifact({
      artifactKind: 'GENERATED_FILE',
      artifactId: file.relativePath,
      buildContext,
      sourceAuthority: 'UNIVERSAL_APP_MATERIALIZATION',
      displayName: file.relativePath,
    }),
  );
  const navigationEntries = extractRegistryNavigation(input.workspaceFiles, buildContext, input.envelope);
  const findings = [
    ...validateArtifactOwnership(buildContext, artifacts),
    ...validateNavigationPurity({ buildContext, envelope: input.envelope, navigationEntries }),
    ...validateProjectIdentityPurity({
      buildContext,
      currentProductIdentity: input.envelope.approvedProductIdentity.displayName,
      renderedText: input.workspaceFiles.map((file) => file.content),
      previousProductIdentities: input.previousProductIdentities,
    }),
    ...validateWorkspaceIsolation({
      buildContext,
      workspaceTextByPath: workspaceRecord(input.workspaceFiles),
      previousWorkspaceTokens: input.previousWorkspaceTokens,
    }),
  ];
  return generateBuildContextIntegrityReport({ buildContext, artifacts, navigationEntries, findings });
}

export function buildContextIntegrityWorkspaceArtifacts(report: BuildContextIntegrityReport): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'src/build-context-integrity/build-context.json',
      content: `${JSON.stringify(report.buildContext, null, 2)}\n`,
    },
    {
      relativePath: 'src/build-context-integrity/build-context-integrity-report.json',
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
    {
      relativePath: 'src/build-context-integrity/build-context-marker.ts',
      content: `/** BuildContext marker only — not product evidence. */\nexport const BUILD_CONTEXT_ID = ${JSON.stringify(report.buildContext.buildContextId)};\nexport const BUILD_CONTEXT_FINGERPRINT = ${JSON.stringify(report.buildContext.fingerprint)};\nexport const BUILD_CONTEXT_OUTCOME = ${JSON.stringify(report.buildOutcome)};\n`,
    },
  ];
}
