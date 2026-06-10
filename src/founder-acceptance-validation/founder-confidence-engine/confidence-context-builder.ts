/**
 * Founder Confidence Engine — confidence context builder.
 */

import type { ConfidenceContext, ConfidenceContextId } from './founder-confidence-types.js';
import { CONFIDENCE_CONTEXT_PASS } from './founder-confidence-types.js';
import { getCachedConfidenceContext, setCachedConfidenceContext } from './founder-confidence-cache.js';

const CONTEXT_DEFINITIONS: Record<ConfidenceContextId, Omit<ConfidenceContext, 'passToken'>> = {
  PROJECT_UNDERSTANDING_CONFIDENCE: {
    contextId: 'PROJECT_UNDERSTANDING_CONFIDENCE',
    contextName: 'Project Understanding Confidence',
    confidenceIntent: 'Founder feels DevPulse understands the project, phase, goal, and constraints',
    expectedFounderSignal: 'System references project context accurately and tracks current phase',
    requiredEvidence: ['Project Vault', 'Chat Context', 'Operator Feed', 'Framework Authority'],
  },
  ACTION_REASONING_CONFIDENCE: {
    contextId: 'ACTION_REASONING_CONFIDENCE',
    contextName: 'Action Reasoning Confidence',
    confidenceIntent: 'Founder sees why actions are taken without exposing private internals',
    expectedFounderSignal: 'Visible reasoning for what is happening and why each step is needed',
    requiredEvidence: ['Operator Feed', 'Chat Explanations', 'Verification Reports', 'UVL Evidence'],
  },
  PROGRESS_TRUTH_CONFIDENCE: {
    contextId: 'PROGRESS_TRUTH_CONFIDENCE',
    contextName: 'Progress Truth Confidence',
    confidenceIntent: 'Founder trusts progress claims are evidence-backed and not inflated',
    expectedFounderSignal: 'Clear distinction between built, wired, validated, and shipped',
    requiredEvidence: ['Product Reality Reports', 'UVL Pass Tokens', 'Validation Evidence', 'Launch Blockers'],
  },
  NEXT_STEP_CONFIDENCE: {
    contextId: 'NEXT_STEP_CONFIDENCE',
    contextName: 'Next Step Confidence',
    confidenceIntent: 'Founder knows what to do next with clear priority and risk awareness',
    expectedFounderSignal: 'Actionable next step with priority order and validation command clarity',
    requiredEvidence: ['Live Preview Next Action', 'First Impression Readiness', 'Workflow Roadmap', 'UX Heuristics'],
  },
  DECISION_CONFIDENCE: {
    contextId: 'DECISION_CONFIDENCE',
    contextName: 'Decision Confidence',
    confidenceIntent: 'Founder can make informed decisions with visible tradeoffs and assumptions',
    expectedFounderSignal: 'Recommendations justified with stated assumptions and alternatives',
    requiredEvidence: ['Product Reality Verdict', 'Founder Priorities', 'Authority Conflicts', 'Roadmap'],
  },
  UNCERTAINTY_CONFIDENCE: {
    contextId: 'UNCERTAINTY_CONFIDENCE',
    contextName: 'Uncertainty Confidence',
    confidenceIntent: 'Founder trusts DevPulse admits uncertainty and limitations honestly',
    expectedFounderSignal: 'Uncertain claims marked, missing evidence acknowledged, no confidence inflation',
    requiredEvidence: ['Preview Unavailable Honesty', 'Limitation Visibility', 'Gap Analysis', 'Evidence Model'],
  },
  CONTROL_CONFIDENCE: {
    contextId: 'CONTROL_CONFIDENCE',
    contextName: 'Founder Control Confidence',
    confidenceIntent: 'Founder remains confident they control actions and approval boundaries',
    expectedFounderSignal: 'No hidden execution, silent mutation, or unexpected autonomous action',
    requiredEvidence: ['Read-Only Validation', 'Governance Boundaries', 'Rollback Visibility', 'User Control Scores'],
  },
};

let contextBuildCount = 0;
let allContextsCache: ConfidenceContext[] | null = null;

export function buildConfidenceContext(contextId: ConfidenceContextId): ConfidenceContext {
  const cached = getCachedConfidenceContext(contextId);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = CONTEXT_DEFINITIONS[contextId];
  const context: ConfidenceContext = { ...def, passToken: CONFIDENCE_CONTEXT_PASS };
  setCachedConfidenceContext(contextId, context);
  return context;
}

export function buildAllConfidenceContexts(): ConfidenceContext[] {
  if (allContextsCache) return allContextsCache;
  allContextsCache = (Object.keys(CONTEXT_DEFINITIONS) as ConfidenceContextId[]).map(buildConfidenceContext);
  return allContextsCache;
}

export function listConfidenceContextIds(): readonly ConfidenceContextId[] {
  return Object.keys(CONTEXT_DEFINITIONS) as ConfidenceContextId[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetConfidenceContextBuilderForTests(): void {
  contextBuildCount = 0;
  allContextsCache = null;
}
