/**
 * Build Strategy Engine — operator feed bridge (12 stages).
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export type BuildStrategyFeedStage =
  | 'Build Strategy Created'
  | 'Build Strategy Classified'
  | 'Build Mode Selected'
  | 'Autonomy Level Selected'
  | 'Build Risk Evaluated'
  | 'Build Confidence Evaluated'
  | 'Build Depth Selected'
  | 'Build Stages Recommended'
  | 'Build Strategy Ready'
  | 'Build Strategy Blocked'
  | 'Build Strategy Completed'
  | 'Build Strategy Failed';

export function publishBuildStrategyFeedStage(
  stage: BuildStrategyFeedStage,
  query: string,
  buildStrategyId?: string | null,
): void {
  publishOperatorFeedStage(stage as OperatorFeedStage, 'build_strategy_engine', {
    query,
    summary: buildStrategyId ? `buildStrategyId=${buildStrategyId}` : undefined,
  });
}

export function publishBuildStrategyFeedStages(
  query: string,
  ready: boolean,
  buildStrategyId?: string | null,
  blocked = false,
): void {
  publishBuildStrategyFeedStage('Build Strategy Created', query, buildStrategyId);

  if (ready) {
    publishBuildStrategyFeedStage('Build Strategy Classified', query, buildStrategyId);
    publishBuildStrategyFeedStage('Build Mode Selected', query, buildStrategyId);
    publishBuildStrategyFeedStage('Autonomy Level Selected', query, buildStrategyId);
    publishBuildStrategyFeedStage('Build Risk Evaluated', query, buildStrategyId);
    publishBuildStrategyFeedStage('Build Confidence Evaluated', query, buildStrategyId);
    publishBuildStrategyFeedStage('Build Depth Selected', query, buildStrategyId);
    publishBuildStrategyFeedStage('Build Stages Recommended', query, buildStrategyId);
    publishBuildStrategyFeedStage('Build Strategy Ready', query, buildStrategyId);
    publishBuildStrategyFeedStage('Build Strategy Completed', query, buildStrategyId);
  } else if (blocked) {
    publishBuildStrategyFeedStage('Build Strategy Blocked', query, buildStrategyId);
    publishBuildStrategyFeedStage('Build Strategy Failed', query, buildStrategyId);
  } else {
    publishBuildStrategyFeedStage('Build Strategy Failed', query, buildStrategyId);
  }
}

export function publishBuildStrategyLifecycleStage(
  stage: 'Build Strategy Blocked' | 'Build Strategy Failed',
  query: string,
  buildStrategyId?: string | null,
): void {
  publishBuildStrategyFeedStage(stage, query, buildStrategyId);
}
