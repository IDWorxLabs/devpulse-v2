/**
 * Operator Feed visibility engine — publishes visibility-only feed events.
 */

import type { SelectedCapability } from '../command-center-brain/general-question-understanding/general-question-types.js';
import { createOperatorFeedEvent } from './operator-feed-event.js';
import { trackOperatorFeedContext, contextSummaryForStage } from './operator-feed-context-tracker.js';
import {
  mapCapabilityToFeedStages,
  sourceSystemForCapability,
  sourceSystemsForStages,
} from './operator-feed-stage-mapper.js';
import { buildOperatorFeedTimeline } from './operator-feed-timeline.js';
import { updateOperatorFeedDiagnostics } from './operator-feed-diagnostics.js';
import type { OperatorFeedEvent, OperatorFeedTimeline } from './operator-feed-types.js';

const stageSourceMap: Partial<Record<string, string>> = {
  'Reading Shared Memory': 'shared_memory_layer',
  'Reading Project Understanding': 'project_understanding_engine',
  'Reading Project Facts': 'project_understanding_engine',
  'Reading Vault Facts': 'project_vault_intelligence',
  'Reading Vault Intelligence': 'project_vault_intelligence',
  'Reading Dependency Intelligence': 'dependency_intelligence',
  'Reading Workspace Intelligence': 'workspace_intelligence',
  'Reading History Intelligence': 'project_history_intelligence',
  'Reading Summaries': 'project_summarization_engine',
  'Reading Portfolio Intelligence': 'portfolio_intelligence',
  'Loading Portfolio': 'portfolio_intelligence',
  'Reading Project Inventory': 'portfolio_intelligence',
  'Computing Health': 'portfolio_intelligence',
  'Generating Portfolio Summary': 'portfolio_intelligence',
  'Evaluating Risks': 'unified_decision_layer',
  'Generating Recommendation': 'unified_decision_layer',
  'Generating Project Answer': 'project_understanding_engine',
};

export function publishVisibilityStages(
  query: string,
  primaryCapability: SelectedCapability | null,
  supplementalCapabilities: SelectedCapability[] = [],
  startedAt: number = Date.now(),
): OperatorFeedTimeline {
  const ctx = trackOperatorFeedContext(query, primaryCapability, supplementalCapabilities);
  const stages = mapCapabilityToFeedStages(primaryCapability, supplementalCapabilities);
  const events: OperatorFeedEvent[] = [];

  for (let i = 0; i < stages.length; i += 1) {
    const stage = stages[i]!;
    const source =
      stageSourceMap[stage] ?? sourceSystemForCapability(primaryCapability) ?? 'operator_feed';
    events.push(
      createOperatorFeedEvent(stage, source, startedAt + i, {
        status: 'COMPLETE',
        confidence: 'HIGH',
        relatedProject: ctx.relatedProject,
        relatedWorkspace: ctx.relatedWorkspace,
        summary: contextSummaryForStage(stage, ctx),
      }),
    );
  }

  const timeline = buildOperatorFeedTimeline(
    query,
    events,
    primaryCapability,
    sourceSystemsForStages(stages),
    startedAt,
  );

  updateOperatorFeedDiagnostics(timeline);
  return timeline;
}

export function publishOperatorFeedStage(
  stage: OperatorFeedEvent['stage'],
  sourceSystem: string,
  opts: {
    query?: string;
    relatedProject?: string | null;
    relatedWorkspace?: string | null;
    summary?: string;
  } = {},
): OperatorFeedEvent {
  return createOperatorFeedEvent(stage, sourceSystem, Date.now(), {
    relatedProject: opts.relatedProject ?? null,
    relatedWorkspace: opts.relatedWorkspace ?? null,
    summary: opts.summary,
  });
}
