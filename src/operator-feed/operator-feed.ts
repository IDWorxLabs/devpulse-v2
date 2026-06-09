/**
 * Operator Feed Foundation orchestrator — visibility authority for intelligence activity.
 */

import type { QuestionRoutingPlan } from '../command-center-brain/general-question-understanding/general-question-types.js';
import { getOperatorFeedDiagnostics } from './operator-feed-diagnostics.js';
import { publishVisibilityStages } from './operator-feed-visibility-engine.js';
import type { OperatorFeedTimeline } from './operator-feed-types.js';

export interface OperatorFeedVisibilityInput {
  query: string;
  routingPlan?: QuestionRoutingPlan;
  memoryLookup?: boolean;
  timestamp?: number;
}

export function buildOperatorFeedVisibility(input: OperatorFeedVisibilityInput): OperatorFeedTimeline {
  const primary = input.routingPlan?.primaryCapability ?? null;
  const supplemental = input.routingPlan?.selectedCapabilities ?? [];
  const extra = [...supplemental];

  if (input.memoryLookup && !extra.includes('SHARED_MEMORY_RECALL')) {
    extra.push('SHARED_MEMORY_RECALL');
  }

  return publishVisibilityStages(
    input.query,
    primary,
    extra.filter((c) => c !== primary),
    input.timestamp ?? Date.now(),
  );
}

export function getOperatorFeedVisibilityContext(input: OperatorFeedVisibilityInput): {
  timeline: OperatorFeedTimeline;
  diagnostics: ReturnType<typeof getOperatorFeedDiagnostics>;
} {
  const timeline = buildOperatorFeedVisibility(input);
  return {
    timeline,
    diagnostics: getOperatorFeedDiagnostics(),
  };
}
