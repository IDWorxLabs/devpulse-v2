/** Workspace surface — current BuildContext ownership. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { BuildContext } from '../build-context-integrity/build-context-types.js';
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';
import { resolveProjectIdentityFromBuildContext } from './project-identity-surface.js';
import { resolveNavigationFromCbgaPlan } from './navigation-surface.js';

export interface WorkspaceSurface {
  readonly readOnly: true;
  readonly buildContextId: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly manifestPaths: readonly string[];
  readonly routeCount: number;
  readonly navigationEntryCount: number;
  readonly fingerprint: string;
}

export function resolveWorkspaceSurface(
  buildContext: BuildContext,
  envelope: ApprovedProductionBuildEnvelope,
  workspaceFiles: readonly GeneratedWorkspaceFile[],
): WorkspaceSurface {
  const identity = resolveProjectIdentityFromBuildContext(buildContext, envelope);
  const navigation = resolveNavigationFromCbgaPlan(envelope);
  const manifestPaths = workspaceFiles
    .map((file) => file.relativePath)
    .filter((path) => /manifest|registry|routes/i.test(path));
  const routesContent = workspaceFiles.find((file) => file.relativePath === 'src/features/routes.ts')?.content ?? '';
  const routeCount = (routesContent.match(/path:/g) ?? []).length;
  const base = {
    buildContextId: buildContext.buildContextId,
    workspaceId: buildContext.workspaceId,
    title: identity.displayName,
    manifestPaths,
    routeCount,
    navigationEntryCount: navigation.entries.length,
  };
  return { readOnly: true, ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export function workspaceReferencesCurrentBuildContext(
  workspaceText: string,
  buildContext: BuildContext,
): boolean {
  return workspaceText.includes(buildContext.buildContextId) || workspaceText.includes(buildContext.fingerprint);
}
