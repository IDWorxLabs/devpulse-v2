/**
 * Bridge — publishes code generation runtime foundation stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const CODE_GENERATION_RUNTIME_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Code Generation Planning Started',
  'Generation Request Parsed',
  'Artifact Proposals Created',
  'Change Proposals Created',
  'Generation Risks Evaluated',
  'Validation Plan Created',
  'Code Generation Plan Ready',
  'Response Ready',
] as const;

export function publishCodeGenerationRuntimeFeedStages(query: string): void {
  publishOperatorFeedStage('Code Generation Planning Started', 'code_generation_runtime', { query });
  publishOperatorFeedStage('Generation Request Parsed', 'code_generation_runtime', { query });
  publishOperatorFeedStage('Artifact Proposals Created', 'code_generation_runtime', { query });
  publishOperatorFeedStage('Change Proposals Created', 'code_generation_runtime', { query });
  publishOperatorFeedStage('Generation Risks Evaluated', 'code_generation_runtime', { query });
  publishOperatorFeedStage('Validation Plan Created', 'code_generation_runtime', { query });
  publishOperatorFeedStage('Code Generation Plan Ready', 'code_generation_runtime', { query });
  publishOperatorFeedStage('Response Ready', 'code_generation_runtime', { query });
}
