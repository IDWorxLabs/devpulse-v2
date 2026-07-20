/** Project identity purity validation. */
import { buildContextFinding } from './artifact-ownership-validator.js';
import type { BuildContext, BuildContextIntegrityFinding } from './build-context-types.js';

export function validateProjectIdentityPurity(input: {
  readonly buildContext: BuildContext;
  readonly currentProductIdentity: string;
  readonly renderedText: readonly string[];
  readonly previousProductIdentities?: readonly string[];
}): BuildContextIntegrityFinding[] {
  const rendered = input.renderedText.join('\n').toLowerCase();
  const previousHits = (input.previousProductIdentities ?? [])
    .filter((identity) => identity.trim().length > 0)
    .filter((identity) => rendered.includes(identity.toLowerCase()));
  const currentMissing = !rendered.includes(input.currentProductIdentity.toLowerCase());
  const findings: BuildContextIntegrityFinding[] = [];
  if (previousHits.length > 0) {
    findings.push(
      buildContextFinding({
        diagnosticCode: 'previous_project_identity_contamination',
        expectedBuildContextId: input.buildContext.buildContextId,
        artifactIds: previousHits,
        message: 'Previous project identity appears in current build surface.',
      }),
    );
  }
  if (currentMissing) {
    findings.push(
      buildContextFinding({
        diagnosticCode: 'current_project_identity_missing',
        expectedBuildContextId: input.buildContext.buildContextId,
        message: 'Current approved product identity is missing from rendered surface evidence.',
      }),
    );
  }
  return findings;
}
