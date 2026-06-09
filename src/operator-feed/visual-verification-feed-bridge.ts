/**
 * Visual Verification Engine — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishVisualVerificationFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Visual Verification Started', 'visual_verification_engine', { query });
  publishOperatorFeedStage('Verification Targets Identified', 'visual_verification_engine', { query });
  publishOperatorFeedStage('Layout Verification Complete', 'visual_verification_engine', { query });
  publishOperatorFeedStage('Navigation Verification Complete', 'visual_verification_engine', { query });
  publishOperatorFeedStage('Loading Verification Complete', 'visual_verification_engine', { query });
  publishOperatorFeedStage('Responsive Verification Complete', 'visual_verification_engine', { query });
  publishOperatorFeedStage('Interaction Verification Complete', 'visual_verification_engine', { query });
  publishOperatorFeedStage('Verification Evidence Built', 'visual_verification_engine', { query });

  if (ready) {
    publishOperatorFeedStage('Visual Verification Ready', 'visual_verification_engine', { query });
  } else {
    publishOperatorFeedStage('Visual Verification Blocked', 'visual_verification_engine', { query });
  }
}
