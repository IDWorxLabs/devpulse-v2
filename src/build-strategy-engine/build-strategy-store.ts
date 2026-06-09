/**
 * Build Strategy Engine — in-memory store.
 */

import type {
  BuildStrategySession,
  BuildStrategyHistoryEntry,
  BuildStrategyLifecycleEvent,
  BuildStrategyStateHistoryEntry,
  BuildStrategyClassification,
  BuildStrategyModeSelection,
  BuildStrategyAutonomySelection,
  BuildStrategyRiskEvaluation,
  BuildStrategyConfidenceEvaluation,
  BuildStrategyDepthSelection,
  BuildStrategyStageRecommendation,
  BuildStrategyReadiness,
  BuildStrategyConstraint,
  BuildStrategyDependency,
  BuildStrategyPolicy,
} from './build-strategy-types.js';

const strategyRecords = new Map<string, BuildStrategySession>();
const lifecycleEvents = new Map<string, BuildStrategyLifecycleEvent>();
const historyEntries = new Map<string, BuildStrategyHistoryEntry>();
const stateHistory = new Map<string, BuildStrategyStateHistoryEntry[]>();
const classifications = new Map<string, BuildStrategyClassification>();
const modes = new Map<string, BuildStrategyModeSelection>();
const autonomies = new Map<string, BuildStrategyAutonomySelection>();
const risks = new Map<string, BuildStrategyRiskEvaluation>();
const confidences = new Map<string, BuildStrategyConfidenceEvaluation>();
const depths = new Map<string, BuildStrategyDepthSelection>();
const stages = new Map<string, BuildStrategyStageRecommendation>();
const readinessRecords = new Map<string, BuildStrategyReadiness>();
const constraints = new Map<string, BuildStrategyConstraint>();
const dependencies = new Map<string, BuildStrategyDependency>();
const policies = new Map<string, BuildStrategyPolicy>();

let strategyCounter = 0;
let lifecycleCounter = 0;
let historyCounter = 0;
let reportCounter = 0;
let classCounter = 0;
let modeCounter = 0;
let autoCounter = 0;
let riskCounter = 0;
let confCounter = 0;
let depthCounter = 0;
let stageCounter = 0;
let readyCounter = 0;
let conCounter = 0;
let depCounter = 0;
let polCounter = 0;

export function resetBuildStrategyStoreForTests(): void {
  strategyRecords.clear();
  lifecycleEvents.clear();
  historyEntries.clear();
  stateHistory.clear();
  classifications.clear();
  modes.clear();
  autonomies.clear();
  risks.clear();
  confidences.clear();
  depths.clear();
  stages.clear();
  readinessRecords.clear();
  constraints.clear();
  dependencies.clear();
  policies.clear();
  strategyCounter = 0;
  lifecycleCounter = 0;
  historyCounter = 0;
  reportCounter = 0;
  classCounter = 0;
  modeCounter = 0;
  autoCounter = 0;
  riskCounter = 0;
  confCounter = 0;
  depthCounter = 0;
  stageCounter = 0;
  readyCounter = 0;
  conCounter = 0;
  depCounter = 0;
  polCounter = 0;
}

export function nextBuildStrategyId(): string {
  strategyCounter += 1;
  return `bstrat-${strategyCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyLifecycleEventId(): string {
  lifecycleCounter += 1;
  return `bstratlc-${lifecycleCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyHistoryEntryId(): string {
  historyCounter += 1;
  return `bstrathi-${historyCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyReportId(): string {
  reportCounter += 1;
  return `bstrat-rpt-${reportCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyClassificationId(): string {
  classCounter += 1;
  return `bstrat-class-${classCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyModeId(): string {
  modeCounter += 1;
  return `bstrat-mode-${modeCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyAutonomyId(): string {
  autoCounter += 1;
  return `bstrat-auto-${autoCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyRiskId(): string {
  riskCounter += 1;
  return `bstrat-risk-${riskCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyConfidenceId(): string {
  confCounter += 1;
  return `bstrat-conf-${confCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyDepthId(): string {
  depthCounter += 1;
  return `bstrat-depth-${depthCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyStageId(): string {
  stageCounter += 1;
  return `bstrat-stage-${stageCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyReadinessId(): string {
  readyCounter += 1;
  return `bstrat-ready-${readyCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyConstraintId(): string {
  conCounter += 1;
  return `bstrat-con-${conCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyDependencyId(): string {
  depCounter += 1;
  return `bstrat-dep-${depCounter.toString().padStart(4, '0')}`;
}

export function nextBuildStrategyPolicyId(): string {
  polCounter += 1;
  return `bstrat-pol-${polCounter.toString().padStart(4, '0')}`;
}

export function storeBuildStrategyRecord(record: BuildStrategySession): void {
  strategyRecords.set(record.buildStrategyId, record);
}

export function getStoredBuildStrategyRecord(buildStrategyId: string): BuildStrategySession | null {
  return strategyRecords.get(buildStrategyId) ?? null;
}

export function listStoredBuildStrategyRecords(): BuildStrategySession[] {
  return [...strategyRecords.values()];
}

export function storeBuildStrategyLifecycleEvent(event: BuildStrategyLifecycleEvent): void {
  lifecycleEvents.set(event.eventId, event);
}

export function listStoredBuildStrategyLifecycleEvents(): BuildStrategyLifecycleEvent[] {
  return [...lifecycleEvents.values()];
}

export function storeBuildStrategyHistoryEntry(entry: BuildStrategyHistoryEntry): void {
  historyEntries.set(entry.entryId, entry);
}

export function listStoredBuildStrategyHistoryEntries(): BuildStrategyHistoryEntry[] {
  return [...historyEntries.values()];
}

export function appendBuildStrategyStateHistory(entry: BuildStrategyStateHistoryEntry): void {
  const existing = stateHistory.get(entry.buildStrategyId) ?? [];
  existing.push(entry);
  stateHistory.set(entry.buildStrategyId, existing);
}

export function getStoredBuildStrategyStateHistory(buildStrategyId: string): BuildStrategyStateHistoryEntry[] {
  return [...(stateHistory.get(buildStrategyId) ?? [])];
}

export function storeBuildStrategyClassification(classification: BuildStrategyClassification): void {
  classifications.set(classification.classificationId, classification);
}

export function storeBuildStrategyMode(mode: BuildStrategyModeSelection): void {
  modes.set(mode.modeId, mode);
}

export function storeBuildStrategyAutonomy(autonomy: BuildStrategyAutonomySelection): void {
  autonomies.set(autonomy.autonomyId, autonomy);
}

export function storeBuildStrategyRisk(risk: BuildStrategyRiskEvaluation): void {
  risks.set(risk.riskId, risk);
}

export function storeBuildStrategyConfidence(confidence: BuildStrategyConfidenceEvaluation): void {
  confidences.set(confidence.confidenceId, confidence);
}

export function storeBuildStrategyDepth(depth: BuildStrategyDepthSelection): void {
  depths.set(depth.depthId, depth);
}

export function storeBuildStrategyStage(stage: BuildStrategyStageRecommendation): void {
  stages.set(stage.stageId, stage);
}

export function storeBuildStrategyReadiness(readiness: BuildStrategyReadiness): void {
  readinessRecords.set(readiness.readinessId, readiness);
}

export function storeBuildStrategyConstraint(constraint: BuildStrategyConstraint): void {
  constraints.set(constraint.constraintId, constraint);
}

export function storeBuildStrategyDependency(dependency: BuildStrategyDependency): void {
  dependencies.set(dependency.dependencyId, dependency);
}

export function storeBuildStrategyPolicy(policy: BuildStrategyPolicy): void {
  policies.set(policy.policyId, policy);
}

export function resetBuildStrategyReportCounterForTests(): void {
  reportCounter = 0;
}
