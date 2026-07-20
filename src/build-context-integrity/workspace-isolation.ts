/** Workspace isolation validation. */
import { buildContextFinding } from './artifact-ownership-validator.js';
import type { BuildContext, BuildContextIntegrityFinding } from './build-context-types.js';

export function validateWorkspaceIsolation(input: {
  readonly buildContext: BuildContext;
  readonly workspaceTextByPath: Readonly<Record<string, string>>;
  readonly previousWorkspaceTokens?: readonly string[];
}): BuildContextIntegrityFinding[] {
  const allText = Object.entries(input.workspaceTextByPath)
    .map(([path, content]) => `${path}\n${content}`)
    .join('\n')
    .toLowerCase();
  return (input.previousWorkspaceTokens ?? [])
    .filter((token) => token.trim().length > 0 && allText.includes(token.toLowerCase()))
    .map((token) =>
      buildContextFinding({
        diagnosticCode: 'previous_workspace_contamination',
        expectedBuildContextId: input.buildContext.buildContextId,
        artifactIds: [token],
        message: 'Previous workspace evidence appears in current build workspace.',
      }),
    );
}
