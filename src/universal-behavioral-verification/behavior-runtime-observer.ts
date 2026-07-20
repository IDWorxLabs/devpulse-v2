/**
 * Universal Behavioral Verification Engine V1 — runtime observation.
 */

import type { UniversalBehaviorDescriptor } from './universal-behavior-types.js';

export interface RuntimeObservationSnapshot {
  readonly stateBefore: Record<string, unknown>;
  readonly actionExecuted: string;
  readonly stateAfter: Record<string, unknown>;
  readonly persistenceDelta: Record<string, unknown>;
  readonly workflowTransition: string | null;
  readonly emittedEvents: readonly string[];
  readonly navigationChanges: readonly string[];
  readonly businessRuleEvaluation: Record<string, unknown> | null;
  readonly runtimeTimingMs: number;
  readonly verificationLogs: readonly string[];
}

export interface BehaviorObservationContext {
  readonly descriptor: UniversalBehaviorDescriptor;
  readonly workspaceSources: Record<string, string>;
}

export function createEmptyObservation(action: string): RuntimeObservationSnapshot {
  return {
    stateBefore: {},
    actionExecuted: action,
    stateAfter: {},
    persistenceDelta: {},
    workflowTransition: null,
    emittedEvents: [],
    navigationChanges: [],
    businessRuleEvaluation: null,
    runtimeTimingMs: 0,
    verificationLogs: [],
  };
}

export function observeBehaviorExecution(
  context: BehaviorObservationContext,
  execute: () => {
    stateBefore: Record<string, unknown>;
    stateAfter: Record<string, unknown>;
    persistenceDelta?: Record<string, unknown>;
    events?: readonly string[];
    navigation?: readonly string[];
    ruleEvaluation?: Record<string, unknown>;
    workflowTransition?: string;
    logs?: readonly string[];
  },
): RuntimeObservationSnapshot {
  const started = Date.now();
  const result = execute();
  return {
    stateBefore: result.stateBefore,
    actionExecuted: context.descriptor.normalizedKey,
    stateAfter: result.stateAfter,
    persistenceDelta: result.persistenceDelta ?? {},
    workflowTransition: result.workflowTransition ?? null,
    emittedEvents: result.events ?? [],
    navigationChanges: result.navigation ?? [],
    businessRuleEvaluation: result.ruleEvaluation ?? null,
    runtimeTimingMs: Date.now() - started,
    verificationLogs: result.logs ?? [`observed:${context.descriptor.behaviorId}`],
  };
}
