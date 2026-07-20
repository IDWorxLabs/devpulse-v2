/** Project identity surface — BuildContext + canonical contract only. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { BuildContext } from '../build-context-integrity/build-context-types.js';
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';
import type { ProjectIdentitySurface } from './production-surface-types.js';

export function resolveProjectIdentityFromBuildContext(
  buildContext: BuildContext,
  envelope: ApprovedProductionBuildEnvelope,
): ProjectIdentitySurface {
  const displayName = envelope.approvedProductIdentity.displayName.trim();
  const description = envelope.approvedMetadataPlan.applicationSubtitle?.trim() ?? null;
  const base = {
    projectId: buildContext.projectId,
    displayName,
    description,
    buildContextId: buildContext.buildContextId,
    source: 'BuildContext.projectId' as const,
  };
  return { readOnly: true, ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export function validateProjectIdentityPurity(input: {
  readonly identity: ProjectIdentitySurface;
  readonly renderedText: readonly string[];
  readonly previousIdentities?: readonly string[];
}): string[] {
  const errors: string[] = [];
  for (const previous of input.previousIdentities ?? []) {
    if (!previous.trim()) continue;
    if (previous === input.identity.displayName) continue;
    if (input.renderedText.some((text) => text.includes(previous))) {
      errors.push(`previous project identity leaked: ${previous}`);
    }
  }
  return errors;
}

export function rejectLegacyProjectIdentitySource(sourceLabel: string): boolean {
  return !/(cached builder state|previous workspace|previous prompt|session residue|legacy builder state|temporary ui cache)/i.test(
    sourceLabel,
  );
}
