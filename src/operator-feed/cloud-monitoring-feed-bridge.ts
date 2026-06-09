/**
 * Cloud Monitoring Foundation — operator feed bridge.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';

export function publishCloudMonitoringFeedStages(query: string, ready: boolean): void {
  publishOperatorFeedStage('Cloud Monitoring Created', 'cloud_monitoring_foundation', { query });
  if (ready) {
    publishOperatorFeedStage('Cloud Monitoring Activated', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Health Updated', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Alert Created', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Alert Acknowledged', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Monitoring Linked To Runtime', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Monitoring Linked To Workspace', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Monitoring Linked To Build', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Monitoring Linked To Verification', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Monitoring Linked To Recovery', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Cloud Monitoring Completed', 'cloud_monitoring_foundation', { query });
  } else {
    publishOperatorFeedStage('Cloud Monitoring Failed', 'cloud_monitoring_foundation', { query });
    publishOperatorFeedStage('Cloud Monitoring Foundation Blocked', 'cloud_monitoring_foundation', { query });
  }
}

export function publishCloudMonitoringLifecycleStage(
  stage: 'Cloud Monitoring Archived',
  query: string,
): void {
  publishOperatorFeedStage(stage, 'cloud_monitoring_foundation', { query });
}
