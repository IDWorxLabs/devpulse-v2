/**
 * Verification Orchestrator — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishVerificationOrchestratorFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Verification Plan Created', 'verification_orchestrator', { query });
  publishOperatorFeedStage('Verification Dependencies Resolved', 'verification_orchestrator', { query });
  publishOperatorFeedStage('Verification Schedule Prepared', 'verification_orchestrator', { query });
  publishOperatorFeedStage('Verification Parallel Groups Identified', 'verification_orchestrator', { query });

  if (ready) {
    publishOperatorFeedStage('Verification Orchestration Ready', 'verification_orchestrator', { query });
  } else {
    publishOperatorFeedStage('Verification Targets Blocked', 'verification_orchestrator', { query });
    publishOperatorFeedStage('Verification Orchestration Blocked', 'verification_orchestrator', { query });
  }
}
