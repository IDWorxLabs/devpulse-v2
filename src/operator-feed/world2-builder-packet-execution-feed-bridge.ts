/**
 * Bridge — publishes World 2 builder packet execution stages into Operator Feed.
 */

import { publishOperatorFeedStage } from './operator-feed-visibility-engine.js';
import type { OperatorFeedStage } from './operator-feed-types.js';

export const WORLD2_BUILDER_PACKET_EXECUTION_FEED_STAGES: readonly OperatorFeedStage[] = [
  'Builder Packet Execution Started',
  'Builder Packet Validated',
  'Builder Packet Steps Normalized',
  'Builder Packet Risks Classified',
  'Builder Packet Execution Packet Ready',
  'Builder Packet Execution Blocked',
] as const;

export function publishWorld2BuilderPacketExecutionFeedStages(
  query: string,
  packetPresent: boolean,
): void {
  publishOperatorFeedStage('Builder Packet Execution Started', 'world2_builder_packet_execution', { query });
  publishOperatorFeedStage('Builder Packet Validated', 'world2_builder_packet_execution', { query });
  publishOperatorFeedStage('Builder Packet Steps Normalized', 'world2_builder_packet_execution', { query });
  publishOperatorFeedStage('Builder Packet Risks Classified', 'world2_builder_packet_execution', { query });
  if (packetPresent) {
    publishOperatorFeedStage('Builder Packet Execution Packet Ready', 'world2_builder_packet_execution', { query });
  } else {
    publishOperatorFeedStage('Builder Packet Execution Blocked', 'world2_builder_packet_execution', { query });
  }
}
