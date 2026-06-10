/**
 * Founder Trust Validation — trust context builder.
 */

import type { TrustContext, TrustContextId } from './founder-trust-types.js';
import { TRUST_CONTEXT_PASS } from './founder-trust-types.js';
import { getCachedTrustContext, setCachedTrustContext } from './founder-trust-cache.js';

const CONTEXT_DEFINITIONS: Record<TrustContextId, Omit<TrustContext, 'passToken'>> = {
  TRUTHFULNESS_TRUST: {
    contextId: 'TRUTHFULNESS_TRUST',
    contextName: 'Truthfulness Trust',
    trustIntent: 'Founder trusts completion and status claims are evidence-backed and not inflated',
    expectedFounderSignal: 'Progress claims match validation evidence; limitations and unknowns disclosed',
    requiredEvidence: ['Product Reality Reports', 'UVL Pass Tokens', 'Confidence Progress Truth', 'Launch Blockers'],
  },
  TRANSPARENCY_TRUST: {
    contextId: 'TRANSPARENCY_TRUST',
    contextName: 'Transparency Trust',
    trustIntent: 'Founder can see decisions, results, failures, assumptions, and next steps',
    expectedFounderSignal: 'Operator feed and reports expose what happened and why',
    requiredEvidence: ['Operator Feed', 'Chat Explanations', 'Verification Reports', 'Workflow Roadmap'],
  },
  VERIFICATION_TRUST: {
    contextId: 'VERIFICATION_TRUST',
    contextName: 'Verification Trust',
    trustIntent: 'Founder trusts validation evidence exists and pass claims are supported',
    expectedFounderSignal: 'Verification chain is consistent, honest, and integrity-preserved',
    requiredEvidence: ['UVL Rows', 'Validation Scripts', 'Product Reality Orchestrator', 'Authority Conflicts'],
  },
  GOVERNANCE_TRUST: {
    contextId: 'GOVERNANCE_TRUST',
    contextName: 'Governance Trust',
    trustIntent: 'Founder trusts governance boundaries and approval chains are respected',
    expectedFounderSignal: 'No execution without founder approval; restrictions and authority chains honored',
    requiredEvidence: ['Governance Boundaries', 'Read-Only Validation', 'User Control Scores', 'Safety Controls'],
  },
  EXECUTION_TRUST: {
    contextId: 'EXECUTION_TRUST',
    contextName: 'Execution Predictability Trust',
    trustIntent: 'Founder trusts system behavior is predictable, explainable, and consistent',
    expectedFounderSignal: 'Actions produce expected outcomes; no unexpected autonomous behavior',
    requiredEvidence: ['UX Heuristics', 'Workflow Continuity', 'Operator Feed Consistency', 'Experience Reports'],
  },
  EVIDENCE_TRUST: {
    contextId: 'EVIDENCE_TRUST',
    contextName: 'Evidence Visibility Trust',
    trustIntent: 'Founder can see, trace, and evaluate evidence supporting conclusions',
    expectedFounderSignal: 'Evidence is visible, traceable, sufficient, and gaps disclosed',
    requiredEvidence: ['Evidence Model', 'UVL Registry', 'Verification Reports', 'Gap Analysis'],
  },
  ROLLBACK_TRUST: {
    contextId: 'ROLLBACK_TRUST',
    contextName: 'Rollback Confidence Trust',
    trustIntent: 'Founder trusts rollback paths, checkpoints, and recovery are visible',
    expectedFounderSignal: 'Reversibility and safety recovery paths are discoverable',
    requiredEvidence: ['Rollback Runtime', 'Recovery Runtime', 'Safety Visibility', 'Control Boundaries'],
  },
  SAFETY_TRUST: {
    contextId: 'SAFETY_TRUST',
    contextName: 'Safety Boundary Trust',
    trustIntent: 'Founder trusts no hidden execution, silent mutation, or boundary violations',
    expectedFounderSignal: 'Safety boundaries visible; founder control preserved; risks disclosed',
    requiredEvidence: ['Read-Only Flags', 'No Mutation Guarantees', 'Error Prevention', 'Governance Compliance'],
  },
};

let contextBuildCount = 0;
let allContextsCache: TrustContext[] | null = null;

export function buildTrustContext(contextId: TrustContextId): TrustContext {
  const cached = getCachedTrustContext(contextId);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = CONTEXT_DEFINITIONS[contextId];
  const context: TrustContext = { ...def, passToken: TRUST_CONTEXT_PASS };
  setCachedTrustContext(contextId, context);
  return context;
}

export function buildAllTrustContexts(): TrustContext[] {
  if (allContextsCache) return allContextsCache;
  allContextsCache = (Object.keys(CONTEXT_DEFINITIONS) as TrustContextId[]).map(buildTrustContext);
  return allContextsCache;
}

export function listTrustContextIds(): readonly TrustContextId[] {
  return Object.keys(CONTEXT_DEFINITIONS) as TrustContextId[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetTrustContextBuilderForTests(): void {
  contextBuildCount = 0;
  allContextsCache = null;
}
