/**
 * Verification Registry — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishVerificationRegistryFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Verification Target Registered', 'verification_registry', { query });
  publishOperatorFeedStage('Verification Dependency Registered', 'verification_registry', { query });
  publishOperatorFeedStage('Verification Requirement Registered', 'verification_registry', { query });
  publishOperatorFeedStage('Verification Capability Registered', 'verification_registry', { query });

  if (ready) {
    publishOperatorFeedStage('Verification Registry Ready', 'verification_registry', { query });
  } else {
    publishOperatorFeedStage('Verification Registry Blocked', 'verification_registry', { query });
  }
}
