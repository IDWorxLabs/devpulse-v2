/**
 * Interaction Testing Engine — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishInteractionTestingFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Interaction Testing Started', 'interaction_testing_engine', { query });
  publishOperatorFeedStage('Interaction Plans Generated', 'interaction_testing_engine', { query });
  publishOperatorFeedStage('Button Testing Executed', 'interaction_testing_engine', { query });
  publishOperatorFeedStage('Navigation Testing Executed', 'interaction_testing_engine', { query });
  publishOperatorFeedStage('Form Testing Executed', 'interaction_testing_engine', { query });
  publishOperatorFeedStage('Workflow Testing Executed', 'interaction_testing_engine', { query });
  publishOperatorFeedStage('Interaction Results Recorded', 'interaction_testing_engine', { query });
  if (ready) {
    publishOperatorFeedStage('Interaction Testing Ready', 'interaction_testing_engine', { query });
  } else {
    publishOperatorFeedStage('Interaction Testing Blocked', 'interaction_testing_engine', { query });
  }
}
