/**
 * Execution packet builder — models future execution intent without performing it.
 */

import type {
  ExecutionConfidence,
  ExecutionPacket,
  ExecutionPlan,
  ExecutionReadinessReport,
  ExecutionSafetyStatus,
  ExecutionState,
} from './execution-runtime-types.js';

let packetCounter = 0;

function nextExecutionId(): string {
  packetCounter += 1;
  return `expkt-${packetCounter.toString().padStart(4, '0')}`;
}

export function resetExecutionPacketCounterForTests(): void {
  packetCounter = 0;
}

export function buildExecutionPlan(input: {
  title: string;
  description: string;
  sourceSystem: string;
  requestedAction: string;
  prerequisites?: string[];
  requiredCapabilities?: string[];
  approvalRequired?: boolean;
}): ExecutionPlan {
  return {
    planId: `plan-${packetCounter.toString().padStart(4, '0')}`,
    title: input.title,
    description: input.description,
    sourceSystem: input.sourceSystem,
    requestedAction: input.requestedAction,
    prerequisites: input.prerequisites ?? [],
    requiredCapabilities: input.requiredCapabilities ?? [],
    approvalRequired: input.approvalRequired ?? true,
    simulationOnly: true,
  };
}

export function createExecutionPacket(input: {
  title: string;
  description: string;
  sourceSystem: string;
  requestedAction: string;
  state: ExecutionState;
  readiness: ExecutionReadinessReport;
  confidence: ExecutionConfidence;
  blockers: string[];
  safetyStatus: ExecutionSafetyStatus;
  plan?: ExecutionPlan;
}): ExecutionPacket {
  const plan =
    input.plan ??
    buildExecutionPlan({
      title: input.title,
      description: input.description,
      sourceSystem: input.sourceSystem,
      requestedAction: input.requestedAction,
      prerequisites: input.readiness.missingDependencies,
      requiredCapabilities: input.readiness.requiredCapabilities,
      approvalRequired: input.readiness.approvalRequired.length > 0,
    });

  return {
    executionId: nextExecutionId(),
    title: input.title,
    description: input.description,
    sourceSystem: input.sourceSystem,
    requestedAction: input.requestedAction,
    state: input.state,
    readiness: input.readiness,
    confidence: input.confidence,
    blockers: input.blockers,
    safetyStatus: input.safetyStatus,
    plan,
    simulationOnly: true,
  };
}

export function summarizePacket(packet: ExecutionPacket): string {
  return [
    `Packet ${packet.executionId}: ${packet.title}`,
    `State: ${packet.state}`,
    `Safety: ${packet.safetyStatus}`,
    `Readiness: ${packet.readiness.readinessLevel} (${packet.readiness.readinessScore})`,
    `Execution allowed: ${packet.readiness.executionAllowed ? 'Yes' : 'No'}`,
    `Blockers: ${packet.blockers.length}`,
  ].join(' | ');
}
