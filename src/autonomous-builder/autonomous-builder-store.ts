/**
 * Autonomous Builder Foundation — in-memory store.
 */

import type {
  AutonomousBuildSession,
  AutonomousBuildHistoryEntry,
  AutonomousBuildLifecycleEvent,
  AutonomousBuildStateHistoryEntry,
  AutonomousBuildGoal,
  AutonomousBuildPlan,
  AutonomousBuildStage,
  AutonomousBuildReadiness,
  AutonomousBuildConstraint,
  AutonomousBuildCapability,
} from './autonomous-builder-types.js';

const buildRecords = new Map<string, AutonomousBuildSession>();
const lifecycleEvents = new Map<string, AutonomousBuildLifecycleEvent>();
const historyEntries = new Map<string, AutonomousBuildHistoryEntry>();
const stateHistory = new Map<string, AutonomousBuildStateHistoryEntry[]>();
const goals = new Map<string, AutonomousBuildGoal>();
const plans = new Map<string, AutonomousBuildPlan>();
const stages = new Map<string, AutonomousBuildStage>();
const readinessRecords = new Map<string, AutonomousBuildReadiness>();
const constraints = new Map<string, AutonomousBuildConstraint>();
const capabilities = new Map<string, AutonomousBuildCapability>();

let buildCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let reportCounter = 0;
let goalCounter = 0;
let planCounter = 0;
let stageCounter = 0;
let readinessCounter = 0;
let constraintCounter = 0;
let capabilityCounter = 0;

export function resetAutonomousBuilderStoreForTests(): void {
  buildRecords.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  goals.clear();
  plans.clear();
  stages.clear();
  readinessRecords.clear();
  constraints.clear();
  capabilities.clear();
  buildCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  reportCounter = 0;
  goalCounter = 0;
  planCounter = 0;
  stageCounter = 0;
  readinessCounter = 0;
  constraintCounter = 0;
  capabilityCounter = 0;
}

export function nextAutonomousBuildId(): string {
  buildCounter += 1;
  return `abuild-${buildCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `abuildlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildHistoryEntryId(): string {
  historyCounter += 1;
  return `abuildhi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildReportId(): string {
  reportCounter += 1;
  return `abuildrpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildGoalId(): string {
  goalCounter += 1;
  return `abuild-goal-${goalCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildPlanId(): string {
  planCounter += 1;
  return `abuild-plan-${planCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildStageId(): string {
  stageCounter += 1;
  return `abuild-stage-${stageCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildReadinessId(): string {
  readinessCounter += 1;
  return `abuild-ready-${readinessCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildConstraintId(): string {
  constraintCounter += 1;
  return `abuild-con-${constraintCounter.toString().padStart(4, '0')}`;
}

export function nextAutonomousBuildCapabilityId(): string {
  capabilityCounter += 1;
  return `abuild-cap-${capabilityCounter.toString().padStart(4, '0')}`;
}

export function storeAutonomousBuildRecord(record: AutonomousBuildSession): void {
  buildRecords.set(record.autonomousBuildId, record);
}

export function getStoredAutonomousBuildRecord(autonomousBuildId: string): AutonomousBuildSession | null {
  return buildRecords.get(autonomousBuildId) ?? null;
}

export function listStoredAutonomousBuildRecords(): AutonomousBuildSession[] {
  return [...buildRecords.values()];
}

export function storeAutonomousBuildLifecycleEvent(event: AutonomousBuildLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredAutonomousBuildLifecycleEvents(): AutonomousBuildLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeAutonomousBuildHistoryEntry(entry: AutonomousBuildHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredAutonomousBuildHistoryEntries(): AutonomousBuildHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendAutonomousBuildStateHistory(entry: AutonomousBuildStateHistoryEntry): void {
  const existing = stateHistory.get(entry.autonomousBuildId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.autonomousBuildId, existing);
}

export function getStoredAutonomousBuildStateHistory(autonomousBuildId: string): AutonomousBuildStateHistoryEntry[] {
  return [...(stateHistory.get(autonomousBuildId) ?? [])];
}

export function storeAutonomousBuildGoal(goal: AutonomousBuildGoal): void {
  goals.set(goal.goalId, goal);
}

export function storeAutonomousBuildPlan(plan: AutonomousBuildPlan): void {
  plans.set(plan.planId, plan);
}

export function storeAutonomousBuildStage(stage: AutonomousBuildStage): void {
  stages.set(stage.stageId, stage);
}

export function storeAutonomousBuildReadiness(readiness: AutonomousBuildReadiness): void {
  readinessRecords.set(readiness.readinessId, readiness);
}

export function storeAutonomousBuildConstraint(constraint: AutonomousBuildConstraint): void {
  constraints.set(constraint.constraintId, constraint);
}

export function storeAutonomousBuildCapability(capability: AutonomousBuildCapability): void {
  capabilities.set(capability.capabilityId, capability);
}

export function resetAutonomousBuilderReportCounterForTests(): void {
  reportCounter = 0;
}
