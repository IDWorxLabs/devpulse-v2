/**
 * Chat-to-Build Execution Bridge V1 — public API.
 */

export {
  CHAT_TO_BUILD_EXECUTION_BRIDGE_API_PATH,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_V1_PASS_TOKEN,
  type ChatToBuildBridgeEvent,
  type ChatToBuildBridgeInput,
  type ChatToBuildBridgeResult,
  type ChatToBuildEngineeringReport,
  type ChatToBuildEngineeringState,
  type ChatToBuildProgressItem,
} from './bridge-types.js';

export { executeChatToBuildBridge, executeCommandCenterMessage } from './bridge-authority.js';
export { buildBridgeEngineeringReport } from './bridge-authority-report.js';
export {
  isCommandCenterBuildRequest,
  routeCommandCenterBuildExecution,
  routeCommandCenterMessage,
} from './command-center-build-router.js';
export { createChatToBuildStateMachine } from './execution-state-machine.js';
export { bridgeEventsToExecutionTrace, bridgeEventsToOperatorFeed } from './bridge-events.js';
export { CHAT_TO_BUILD_EXECUTION_BRIDGE_REGISTRY } from './bridge-registry.js';
