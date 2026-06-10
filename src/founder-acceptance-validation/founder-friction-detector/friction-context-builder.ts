/**
 * Founder Friction Detector — friction context builder.
 */

import type { FrictionContext, FrictionContextId } from './founder-friction-types.js';
import { FRICTION_CONTEXT_PASS } from './founder-friction-types.js';
import { getCachedFrictionContext, setCachedFrictionContext } from './founder-friction-cache.js';

const CONTEXT_DEFINITIONS: Record<FrictionContextId, Omit<FrictionContext, 'passToken'>> = {
  CONFUSION_FRICTION: {
    contextId: 'CONFUSION_FRICTION',
    contextName: 'Confusion Friction',
    frictionIntent: 'Detect unclear actions, next steps, outcomes, ownership, and workflows',
    expectedNegativeSignal: 'Founder cannot determine what to do, where to go, or what happens next',
    requiredEvidence: ['Workflow Clarity', 'UX Heuristics', 'Navigation Clarity', 'Action Clarity'],
  },
  WORKFLOW_FRICTION: {
    contextId: 'WORKFLOW_FRICTION',
    contextName: 'Workflow Friction',
    frictionIntent: 'Detect workflow dead ends, broken continuity, loops, and complexity',
    expectedNegativeSignal: 'Founder hits dead ends, loses context, or repeats workflow steps',
    requiredEvidence: ['Workflow Validation', 'Continuity Scores', 'Friction Gaps', 'Experience Reports'],
  },
  DECISION_FATIGUE: {
    contextId: 'DECISION_FATIGUE',
    contextName: 'Decision Fatigue',
    frictionIntent: 'Detect excessive, repeated, or unsupported founder decisions',
    expectedNegativeSignal: 'Founder faces decision overload without clear prioritization',
    requiredEvidence: ['Confidence Engine', 'Productivity Validation', 'Founder Priorities', 'Roadmaps'],
  },
  CONTEXT_SWITCHING_FRICTION: {
    contextId: 'CONTEXT_SWITCHING_FRICTION',
    contextName: 'Context Switching Friction',
    frictionIntent: 'Detect fragmented workflows, context loss, and attention fragmentation',
    expectedNegativeSignal: 'Founder loses focus switching between surfaces and workflows',
    requiredEvidence: ['Workflow Continuity', 'Experience Continuity', 'Productivity Context Switching'],
  },
  DISCOVERABILITY_FRICTION: {
    contextId: 'DISCOVERABILITY_FRICTION',
    contextName: 'Discoverability Friction',
    frictionIntent: 'Detect hidden capabilities, features, and inaccessible workflows',
    expectedNegativeSignal: 'Founder cannot find capabilities or available paths',
    requiredEvidence: ['Find Panel', 'Capability Registry', 'UVL', 'Workflow Discoverability'],
  },
  TRUST_BREAKDOWN_FRICTION: {
    contextId: 'TRUST_BREAKDOWN_FRICTION',
    contextName: 'Trust Breakdown Friction',
    frictionIntent: 'Detect trust failures, transparency gaps, and evidence visibility failures',
    expectedNegativeSignal: 'Founder cannot trust system claims or see supporting evidence',
    requiredEvidence: ['Trust Validation', 'Truthfulness', 'Transparency', 'Evidence Visibility'],
  },
  CONFIDENCE_BREAKDOWN_FRICTION: {
    contextId: 'CONFIDENCE_BREAKDOWN_FRICTION',
    contextName: 'Confidence Breakdown Friction',
    frictionIntent: 'Detect confidence failures in reasoning, progress truth, and uncertainty honesty',
    expectedNegativeSignal: 'Founder loses confidence in system understanding and progress claims',
    requiredEvidence: ['Confidence Engine', 'Progress Truth', 'Reasoning Visibility', 'Uncertainty Honesty'],
  },
  PRODUCTIVITY_FRICTION: {
    contextId: 'PRODUCTIVITY_FRICTION',
    contextName: 'Productivity Friction',
    frictionIntent: 'Detect workflow slowdown, manual work burden, and throughput reduction',
    expectedNegativeSignal: 'Founder productivity blocked by overhead and manual coordination',
    requiredEvidence: ['Productivity Validation', 'Manual Work', 'Throughput', 'Workflow Overhead'],
  },
  VERIFICATION_FRICTION: {
    contextId: 'VERIFICATION_FRICTION',
    contextName: 'Verification Friction',
    frictionIntent: 'Detect validation confusion, complexity, bottlenecks, and unclear outcomes',
    expectedNegativeSignal: 'Founder struggles to understand or complete verification workflows',
    requiredEvidence: ['UVL', 'Verification Integrity', 'Product Reality', 'Validation Scripts'],
  },
  LAUNCH_FRICTION: {
    contextId: 'LAUNCH_FRICTION',
    contextName: 'Launch Friction',
    frictionIntent: 'Detect launch blockers, readiness blockers, and release adoption barriers',
    expectedNegativeSignal: 'Founder blocked from release by unresolved launch or readiness gaps',
    requiredEvidence: ['Launch Blockers', 'Release Readiness', 'Product Reality Verdict', 'Roadmaps'],
  },
};

let contextBuildCount = 0;
let allContextsCache: FrictionContext[] | null = null;

export function buildFrictionContext(contextId: FrictionContextId): FrictionContext {
  const cached = getCachedFrictionContext(contextId);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = CONTEXT_DEFINITIONS[contextId];
  const context: FrictionContext = { ...def, passToken: FRICTION_CONTEXT_PASS };
  setCachedFrictionContext(contextId, context);
  return context;
}

export function buildAllFrictionContexts(): FrictionContext[] {
  if (allContextsCache) return allContextsCache;
  allContextsCache = (Object.keys(CONTEXT_DEFINITIONS) as FrictionContextId[]).map(buildFrictionContext);
  return allContextsCache;
}

export function listFrictionContextIds(): readonly FrictionContextId[] {
  return Object.keys(CONTEXT_DEFINITIONS) as FrictionContextId[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetFrictionContextBuilderForTests(): void {
  contextBuildCount = 0;
  allContextsCache = null;
}
