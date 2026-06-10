/**
 * Product Reality Orchestrator — bounded model helpers.
 */

import type {
  AuthorityConflict,
  BlockerSeverity,
  ConflictSeverity,
  FounderPriority,
  LaunchBlocker,
  PriorityTier,
} from './product-reality-types.js';

const MAX_PER_ANALYZER = 12;
let conflictCounter = 0;
let blockerCounter = 0;
let priorityCounter = 0;

export function resetProductRealityModelCountersForTests(): void {
  conflictCounter = 0;
  blockerCounter = 0;
  priorityCounter = 0;
}

export function createAuthorityConflict(params: {
  subsystemA: string;
  subsystemB: string;
  conflictSeverity: ConflictSeverity;
  conflictExplanation: string;
  detectionCode: string;
}): AuthorityConflict {
  conflictCounter += 1;
  return {
    conflictId: `authority-conflict-${conflictCounter}`,
    subsystemA: params.subsystemA,
    subsystemB: params.subsystemB,
    conflictSeverity: params.conflictSeverity,
    conflictExplanation: params.conflictExplanation,
    detectionCode: params.detectionCode,
  };
}

export function createLaunchBlocker(params: {
  blockerCode: string;
  blockerReason: string;
  blockerSeverity: BlockerSeverity;
  sourceSubsystem: string;
}): LaunchBlocker {
  blockerCounter += 1;
  return {
    blockerId: `launch-blocker-${blockerCounter}`,
    blockerCode: params.blockerCode,
    blockerReason: params.blockerReason,
    blockerSeverity: params.blockerSeverity,
    sourceSubsystem: params.sourceSubsystem,
  };
}

export function createFounderPriority(params: {
  title: string;
  description: string;
  expectedImpact: number;
  estimatedConfidenceGain: number;
  estimatedProductGain: number;
  sourceSubsystem: string;
  tier: PriorityTier;
}): FounderPriority {
  priorityCounter += 1;
  return {
    priorityId: `founder-priority-${priorityCounter}`,
    title: params.title,
    description: params.description,
    expectedImpact: Math.max(0, Math.min(100, params.expectedImpact)),
    estimatedConfidenceGain: Math.max(0, Math.min(100, params.estimatedConfidenceGain)),
    estimatedProductGain: Math.max(0, Math.min(100, params.estimatedProductGain)),
    sourceSubsystem: params.sourceSubsystem,
    tier: params.tier,
  };
}

export function boundList<T>(list: T[], max = MAX_PER_ANALYZER): T[] {
  return list.slice(0, max);
}

export function mergeBounded<T>(lists: T[][], maxTotal: number): T[] {
  const merged: T[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (merged.length >= maxTotal) return merged;
      merged.push(item);
    }
  }
  return merged;
}

export const MAX_ITEMS_PER_ANALYZER = MAX_PER_ANALYZER;
