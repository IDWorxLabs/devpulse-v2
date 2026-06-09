/**
 * Operator Feed context tracker — tracks loaded context for visibility reporting.
 */

import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { getWorkspaceSnapshot } from '../workspace-intelligence/index.js';
import type { SelectedCapability } from '../command-center-brain/general-question-understanding/general-question-types.js';
import type { OperatorFeedContext, OperatorFeedStage } from './operator-feed-types.js';
import { mapCapabilityToFeedStages, sourceSystemForCapability } from './operator-feed-stage-mapper.js';

export function trackOperatorFeedContext(
  query: string,
  primaryCapability: SelectedCapability | null,
  supplementalCapabilities: SelectedCapability[] = [],
): OperatorFeedContext {
  const profile = getCurrentProjectProfile();
  const workspace = getWorkspaceSnapshot();
  const stagesPlanned = mapCapabilityToFeedStages(primaryCapability, supplementalCapabilities);
  const sourceSystems = [
    'operator_feed',
    sourceSystemForCapability(primaryCapability),
    ...supplementalCapabilities.map((c) => sourceSystemForCapability(c)),
  ];

  return {
    query,
    primaryCapability,
    sourceSystems: [...new Set(sourceSystems)],
    relatedProject: profile.name,
    relatedWorkspace: workspace.activeWorkspace?.workspaceName ?? null,
    stagesPlanned,
  };
}

export function contextSummaryForStage(stage: OperatorFeedStage, ctx: OperatorFeedContext): string {
  const project = ctx.relatedProject ?? 'current project';
  const workspace = ctx.relatedWorkspace ?? 'active workspace';
  switch (stage) {
    case 'Loading Context':
      return `Visibility context loaded for "${ctx.query.slice(0, 60)}".`;
    case 'Reading Shared Memory':
      return `Shared memory recall scoped to ${project}.`;
    case 'Reading Workspace Intelligence':
      return `Workspace visibility for ${workspace}.`;
    case 'Reading Portfolio Intelligence':
    case 'Loading Portfolio':
      return 'Portfolio visibility across multiple projects.';
    case 'Generating Recommendation':
      return `Advisory recommendation visibility for ${project}.`;
    case 'Response Ready':
      return `Visibility complete — ${ctx.primaryCapability ?? 'command_center_brain'} answer authority.`;
    default:
      return `Visibility stage: ${stage} for ${project}.`;
  }
}
