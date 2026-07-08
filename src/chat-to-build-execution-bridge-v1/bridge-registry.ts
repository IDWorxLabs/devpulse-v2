/**
 * Chat-to-Build Execution Bridge V1 — subsystem registry metadata.
 */

export const CHAT_TO_BUILD_EXECUTION_BRIDGE_REGISTRY = {
  subsystemId: 'chat-to-build-execution-bridge-v1',
  contractVersion: 'CHAT_TO_BUILD_EXECUTION_BRIDGE_V1',
  integratesWith: [
    'command-center',
    'brain-api-handler',
    'build-from-prompt-handler',
    'intent-understanding-engine',
    'build-intent-routing',
    'project-context-alignment',
    'project-name-conflict-resolution',
    'autonomous-software-engineering-engine',
    'one-prompt-live-preview',
    'execution-trace',
    'live-preview-runtime',
  ],
} as const;
