/**
 * Chat-to-Build Execution Bridge V1 — Command Center build routing helpers.
 */

import { classifyBuildIntentRequest } from '../build-intent-routing/build-intent-route-parity-v1.js';
import type { ChatToBuildBridgeInput, ChatToBuildBridgeResult } from './bridge-types.js';
import { executeChatToBuildBridge } from './bridge-authority.js';

export function routeCommandCenterMessage(
  input: Pick<ChatToBuildBridgeInput, 'message'>,
): ReturnType<typeof classifyBuildIntentRequest> {
  return classifyBuildIntentRequest(input.message);
}

export async function routeCommandCenterBuildExecution(
  input: ChatToBuildBridgeInput,
): Promise<ChatToBuildBridgeResult> {
  return executeChatToBuildBridge(input);
}

export function isCommandCenterBuildRequest(message: string): boolean {
  return classifyBuildIntentRequest(message).isBuildIntent;
}
