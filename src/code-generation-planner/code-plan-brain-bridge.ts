/**
 * Central Brain bridge — awareness owner unchanged; planner publishes summaries only.
 */

import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { summarizeCodePlan } from './code-planning-engine.js';
import type { CodeGenerationPlan, CodePlanSummary } from './types.js';

let latestPublishedSummary: CodePlanSummary | null = null;

export function publishCodePlanSummary(plan: CodeGenerationPlan): CodePlanSummary {
  const summary: CodePlanSummary = {
    planId: plan.planId,
    strategyId: plan.strategyId,
    taskCount: plan.tasks.length,
    summary: summarizeCodePlan(plan),
    publishedAt: Date.now(),
  };
  latestPublishedSummary = { ...summary };
  return { ...summary };
}

export function getLatestCodePlanSummary(): CodePlanSummary | null {
  return latestPublishedSummary ? { ...latestPublishedSummary } : null;
}

export function getBrainSummariesForPlanDetection(): string[] {
  const brain = getDevPulseV2CentralBrainAuthority();
  const state = brain.getBrainState();
  const fromState = state.systems.map((s) => s.summary);
  const fromAdapters = readAllSystemSummaries().map((s) => s.summary);
  return [...new Set([...fromState, ...fromAdapters])];
}

export function assertCentralBrainOwnershipUnchanged(): boolean {
  const brain = getDevPulseV2CentralBrainAuthority();
  return (
    brain.constructor.name === 'DevPulseV2CentralBrainAuthority' &&
    typeof brain.getBrainState === 'function' &&
    typeof (brain as { generateCodePlan?: unknown }).generateCodePlan === 'undefined'
  );
}

export function getCentralBrainOwnerForBridge(): string {
  return CENTRAL_BRAIN_OWNER_MODULE;
}

export function resetCodePlanBrainBridgeForTests(): void {
  latestPublishedSummary = null;
}
