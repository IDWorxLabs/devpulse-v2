/**
 * UI Inspection Engine — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishUiInspectionFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('UI Inspection Started', 'ui_inspection_engine', { query });
  publishOperatorFeedStage('Layout Structures Identified', 'ui_inspection_engine', { query });
  publishOperatorFeedStage('Navigation Structures Identified', 'ui_inspection_engine', { query });
  publishOperatorFeedStage('Loading Structures Identified', 'ui_inspection_engine', { query });
  publishOperatorFeedStage('Responsive Structures Identified', 'ui_inspection_engine', { query });
  if (ready) {
    publishOperatorFeedStage('UI Inspection Ready', 'ui_inspection_engine', { query });
  } else {
    publishOperatorFeedStage('UI Inspection Blocked', 'ui_inspection_engine', { query });
  }
}
