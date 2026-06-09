/**
 * Autonomous Builder Foundation — operator feed bridge (11 stages).
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export type AutonomousBuilderFeedStage =
  | 'Autonomous Build Created'
  | 'Autonomous Goal Created'
  | 'Autonomous Plan Created'
  | 'Autonomous Stage Created'
  | 'Autonomous Readiness Evaluated'
  | 'Autonomous Build Ready'
  | 'Autonomous Build Blocked'
  | 'Autonomous Build Paused'
  | 'Autonomous Build Completed'
  | 'Autonomous Build Failed'
  | 'Autonomous Build Archived';

export function publishAutonomousBuilderFeedStage(
  stage: AutonomousBuilderFeedStage,
  query: string,
  autonomousBuildId?: string | null,
): void {
  publishOperatorFeedStage(stage as OperatorFeedStage, 'autonomous_builder_foundation', {
    query,
    summary: autonomousBuildId ? `autonomousBuildId=${autonomousBuildId}` : undefined,
  });
}

export function publishAutonomousBuilderFeedStages(
  query: string,
  ready: boolean,
  autonomousBuildId?: string | null,
  blocked = false,
): void {
  publishAutonomousBuilderFeedStage('Autonomous Build Created', query, autonomousBuildId);

  if (ready) {
    publishAutonomousBuilderFeedStage('Autonomous Goal Created', query, autonomousBuildId);
    publishAutonomousBuilderFeedStage('Autonomous Plan Created', query, autonomousBuildId);
    publishAutonomousBuilderFeedStage('Autonomous Stage Created', query, autonomousBuildId);
    publishAutonomousBuilderFeedStage('Autonomous Readiness Evaluated', query, autonomousBuildId);
    publishAutonomousBuilderFeedStage('Autonomous Build Ready', query, autonomousBuildId);
    publishAutonomousBuilderFeedStage('Autonomous Build Completed', query, autonomousBuildId);
  } else if (blocked) {
    publishAutonomousBuilderFeedStage('Autonomous Build Blocked', query, autonomousBuildId);
    publishAutonomousBuilderFeedStage('Autonomous Build Failed', query, autonomousBuildId);
  } else {
    publishAutonomousBuilderFeedStage('Autonomous Build Failed', query, autonomousBuildId);
  }
}

export function publishAutonomousBuilderLifecycleStage(
  stage:
    | 'Autonomous Build Blocked'
    | 'Autonomous Build Paused'
    | 'Autonomous Build Archived',
  query: string,
  autonomousBuildId?: string | null,
): void {
  publishAutonomousBuilderFeedStage(stage, query, autonomousBuildId);
}
