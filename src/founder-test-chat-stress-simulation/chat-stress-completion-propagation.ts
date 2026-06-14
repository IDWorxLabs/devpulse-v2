/**
 * Phase 26.80 — Chat stress completion propagation registry and chain contract (V1).
 * Durable completion boundaries independent of trace buffer eviction.
 */

export const CHAT_STRESS_COMPLETION_PROPAGATION_REPAIR_V1_PASS =
  'CHAT_STRESS_COMPLETION_PROPAGATION_REPAIR_V1_PASS';

/** Operator-visible completion chain boundaries (Stage 2 → Planning Gate). */
export const CHAT_STRESS_COMPLETION_CHAIN_BOUNDARIES = [
  'chat-stress-completion-condition-satisfied',
  'chat-stress-simulation-complete',
  'chat-stress-simulation-complete-emitted',
  'product-readiness-simulation-complete',
  'product-readiness-simulation-complete-emitted',
  'intake-validation-complete',
  'intake-validation-complete-emitted',
  'planning-gate-started',
] as const;

export type ChatStressCompletionChainBoundary =
  (typeof CHAT_STRESS_COMPLETION_CHAIN_BOUNDARIES)[number];

export interface ChatStressCompletionPropagationSnapshot {
  readOnly: true;
  completionConditionSatisfied: boolean;
  chatStressSimulationCompleteEmitted: boolean;
  productReadinessSimulationCompleteEmitted: boolean;
  intakeValidationCompleteEmitted: boolean;
  planningGateStarted: boolean;
  satisfiedBoundaryOperationIds: readonly string[];
  recordedAtByBoundary: Readonly<Partial<Record<ChatStressCompletionChainBoundary, string>>>;
}

const recordedAtByBoundary: Partial<Record<ChatStressCompletionChainBoundary, string>> = {};
const satisfiedBoundaryOperationIds = new Set<string>();

let completionConditionSatisfied = false;
let chatStressSimulationCompleteEmitted = false;
let productReadinessSimulationCompleteEmitted = false;
let intakeValidationCompleteEmitted = false;
let planningGateStarted = false;

export function resetChatStressCompletionPropagationForTests(): void {
  completionConditionSatisfied = false;
  chatStressSimulationCompleteEmitted = false;
  productReadinessSimulationCompleteEmitted = false;
  intakeValidationCompleteEmitted = false;
  planningGateStarted = false;
  satisfiedBoundaryOperationIds.clear();
  for (const key of Object.keys(recordedAtByBoundary)) {
    delete recordedAtByBoundary[key as ChatStressCompletionChainBoundary];
  }
}

export function recordIntakeCompletionBoundaryOperation(operationId: string, at = new Date()): void {
  satisfiedBoundaryOperationIds.add(operationId);
  const iso = at.toISOString();
  if (operationId === 'chat-stress-simulation-complete') {
    chatStressSimulationCompleteEmitted = true;
    recordedAtByBoundary['chat-stress-simulation-complete'] = iso;
    recordedAtByBoundary['chat-stress-simulation-complete-emitted'] = iso;
  }
  if (operationId === 'product-readiness-simulation-complete') {
    productReadinessSimulationCompleteEmitted = true;
    recordedAtByBoundary['product-readiness-simulation-complete'] = iso;
    recordedAtByBoundary['product-readiness-simulation-complete-emitted'] = iso;
  }
  if (operationId === 'intake-validation-complete') {
    intakeValidationCompleteEmitted = true;
    recordedAtByBoundary['intake-validation-complete'] = iso;
    recordedAtByBoundary['intake-validation-complete-emitted'] = iso;
  }
  if (operationId === 'planning-gate-started' || operationId === 'planning-gate-entered') {
    planningGateStarted = true;
    recordedAtByBoundary['planning-gate-started'] = iso;
  }
}

function recordChainBoundary(boundary: ChatStressCompletionChainBoundary, at = new Date()): void {
  recordedAtByBoundary[boundary] = at.toISOString();
  switch (boundary) {
    case 'chat-stress-completion-condition-satisfied':
      completionConditionSatisfied = true;
      break;
    case 'chat-stress-simulation-complete':
    case 'chat-stress-simulation-complete-emitted':
      chatStressSimulationCompleteEmitted = true;
      satisfiedBoundaryOperationIds.add('chat-stress-simulation-complete');
      break;
    case 'product-readiness-simulation-complete':
    case 'product-readiness-simulation-complete-emitted':
      productReadinessSimulationCompleteEmitted = true;
      satisfiedBoundaryOperationIds.add('product-readiness-simulation-complete');
      break;
    case 'intake-validation-complete':
    case 'intake-validation-complete-emitted':
      intakeValidationCompleteEmitted = true;
      satisfiedBoundaryOperationIds.add('intake-validation-complete');
      break;
    case 'planning-gate-started':
      planningGateStarted = true;
      satisfiedBoundaryOperationIds.add('planning-gate-started');
      break;
    default:
      break;
  }
}

export function recordChatStressCompletionConditionSatisfied(at?: Date): void {
  recordChainBoundary('chat-stress-completion-condition-satisfied', at);
}

export function recordChatStressSimulationCompleteEmitted(at?: Date): void {
  recordChainBoundary('chat-stress-simulation-complete-emitted', at);
}

export function recordProductReadinessSimulationCompleteEmitted(at?: Date): void {
  recordChainBoundary('product-readiness-simulation-complete-emitted', at);
}

export function recordIntakeValidationCompleteEmitted(at?: Date): void {
  recordChainBoundary('intake-validation-complete-emitted', at);
}

export function recordPlanningGateStarted(at?: Date): void {
  recordChainBoundary('planning-gate-started', at);
}

export function hasChatStressCompletionConditionSatisfied(): boolean {
  return completionConditionSatisfied;
}

export function hasChatStressSimulationCompletePropagated(): boolean {
  return chatStressSimulationCompleteEmitted;
}

export function hasProductReadinessSimulationCompletePropagated(): boolean {
  return productReadinessSimulationCompleteEmitted;
}

export function hasIntakeValidationCompletePropagated(): boolean {
  return intakeValidationCompleteEmitted;
}

export function hasPlanningGateStartedPropagated(): boolean {
  return planningGateStarted;
}

export function hasIntakeValidationCompletionBoundaryInRegistry(operationId: string): boolean {
  return satisfiedBoundaryOperationIds.has(operationId);
}

export function getChatStressCompletionPropagationSnapshot(): ChatStressCompletionPropagationSnapshot {
  return {
    readOnly: true,
    completionConditionSatisfied,
    chatStressSimulationCompleteEmitted,
    productReadinessSimulationCompleteEmitted,
    intakeValidationCompleteEmitted,
    planningGateStarted,
    satisfiedBoundaryOperationIds: [...satisfiedBoundaryOperationIds],
    recordedAtByBoundary: { ...recordedAtByBoundary },
  };
}
