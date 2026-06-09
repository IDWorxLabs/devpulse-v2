/**
 * DevPulse V2 Phase 15.2 — World 2 Builder Packet Execution public API.
 */

export {
  WORLD2_BUILDER_PACKET_EXECUTION_PASS_TOKEN,
  WORLD2_BUILDER_PACKET_EXECUTION_OWNER_MODULE,
  BUILDER_PACKET_QUESTION_SIGNALS,
  FORBIDDEN_BUILDER_PACKET_DUPLICATES,
  ALLOWED_PHASE_15_2_STEP_TYPES,
  BLOCKED_PHASE_15_2_STEP_TYPES,
  VALID_ACTIVATION_STATES,
  isWorld2BuilderPacketExecutionQuestion,
  isWorld2BuilderPacketExecutionAdvisoryQuestion,
  isDuplicateBuilderPacketExecutorQuestion,
  type BuilderPacketRiskLevel,
  type BuilderPacketStepType,
  type BuilderPacketExecutionState,
  type BuilderPacketRawStep,
  type BuilderPacket,
  type BuilderPacketExecutionStep,
  type BuilderPacketExecutionPacket,
  type BuilderPacketExecutionReport,
  type BuilderPacketExecutionDiagnostics,
  type PrepareBuilderPacketExecutionInput,
  type PrepareBuilderPacketExecutionResult,
} from './types.js';

export {
  parseBuilderPacketExecutionQuery,
  createDefaultBuilderPacket,
  resetBuilderPacketExecutionRequestCounterForTests,
} from './builder-packet-execution-request-parser.js';

export { validateBuilderPacketExecution } from './builder-packet-execution-validator.js';

export {
  normalizeBuilderPacketSteps,
  resetBuilderPacketStepCounterForTests,
} from './builder-packet-step-normalizer.js';

export {
  classifyBuilderPacketStepRisk,
  classifyBuilderPacketSteps,
  aggregatePacketRiskLevel,
} from './builder-packet-risk-classifier.js';

export {
  buildBuilderPacketExecutionPlan,
  resetBuilderPacketExecutionReportCounterForTests,
} from './builder-packet-execution-plan-builder.js';

export { composeBuilderPacketExecutionResponse } from './builder-packet-execution-report.js';

export {
  getBuilderPacketExecutionDiagnostics,
  updateBuilderPacketExecutionDiagnostics,
  resetBuilderPacketExecutionDiagnostics,
  builderPacketExecutionKey,
} from './builder-packet-execution-diagnostics.js';

export {
  prepareBuilderPacketExecution,
  processBuilderPacketExecutionRequest,
  getBuilderPacketExecutionContext,
} from './builder-packet-execution.js';

export { buildBuilderPacketExecutionFailureContext } from './builder-packet-execution-failure-bridge.js';

export function getDevPulseV2World2BuilderPacketExecution(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_world2_builder_packet_execution',
    passToken: 'WORLD2_BUILDER_PACKET_EXECUTION_V1_PASS',
    phase: 15.2,
    extensionOnly: true,
  };
}
