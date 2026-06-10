/**
 * Founder Readiness Authority — readiness context builder.
 */

import type { ReadinessContext, ReadinessContextId } from './founder-readiness-types.js';
import { READINESS_CONTEXT_PASS } from './founder-readiness-types.js';
import { getCachedReadinessContext, setCachedReadinessContext } from './founder-readiness-cache.js';

const CONTEXT_DEFINITIONS: Record<ReadinessContextId, Omit<ReadinessContext, 'passToken'>> = {
  WORKFLOW_READINESS: {
    contextId: 'WORKFLOW_READINESS',
    contextName: 'Workflow Readiness',
    readinessIntent: 'Determine whether founder workflows are complete and operable today',
    requiredAuthorities: ['FOUNDER_WORKFLOW_AUTHORITY'],
    expectedOutcome: 'Founder can navigate and complete core workflows without dead ends',
  },
  CONFIDENCE_READINESS: {
    contextId: 'CONFIDENCE_READINESS',
    contextName: 'Confidence Readiness',
    readinessIntent: 'Determine whether founder has sufficient understanding and reasoning visibility',
    requiredAuthorities: ['FOUNDER_CONFIDENCE_AUTHORITY'],
    expectedOutcome: 'Founder understands progress, next steps, and system reasoning',
  },
  TRUST_READINESS: {
    contextId: 'TRUST_READINESS',
    contextName: 'Trust Readiness',
    readinessIntent: 'Determine whether founder can trust governance, verification, and transparency',
    requiredAuthorities: ['FOUNDER_TRUST_AUTHORITY'],
    expectedOutcome: 'Founder trusts system claims with visible evidence',
  },
  PRODUCTIVITY_READINESS: {
    contextId: 'PRODUCTIVITY_READINESS',
    contextName: 'Productivity Readiness',
    readinessIntent: 'Determine whether founder can operate productively with acceptable throughput',
    requiredAuthorities: ['FOUNDER_PRODUCTIVITY_AUTHORITY'],
    expectedOutcome: 'Founder achieves meaningful daily productivity gains',
  },
  FRICTION_READINESS: {
    contextId: 'FRICTION_READINESS',
    contextName: 'Friction Readiness',
    readinessIntent: 'Determine whether friction levels allow effective founder operation',
    requiredAuthorities: ['FOUNDER_FRICTION_AUTHORITY'],
    expectedOutcome: 'Friction does not actively block founder effectiveness',
  },
  OPERATIONAL_READINESS: {
    contextId: 'OPERATIONAL_READINESS',
    contextName: 'Operational Readiness',
    readinessIntent: 'Determine whether operational surfaces support daily founder use',
    requiredAuthorities: ['FOUNDER_ACCEPTANCE_FRAMEWORK_AUTHORITY', 'PRODUCT_REALITY_AUTHORITY'],
    expectedOutcome: 'Founder can operate DevPulse surfaces without operational blockers',
  },
  LAUNCH_READINESS: {
    contextId: 'LAUNCH_READINESS',
    contextName: 'Launch Readiness',
    readinessIntent: 'Determine whether founder is ready for launch-level adoption',
    requiredAuthorities: ['FOUNDER_READINESS_AUTHORITY', 'PRODUCT_REALITY_AUTHORITY'],
    expectedOutcome: 'Founder can adopt DevPulse at launch scale without critical blockers',
  },
};

let contextBuildCount = 0;
let allContextsCache: ReadinessContext[] | null = null;

export function buildReadinessContext(contextId: ReadinessContextId): ReadinessContext {
  const cached = getCachedReadinessContext(contextId);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = CONTEXT_DEFINITIONS[contextId];
  const context: ReadinessContext = { ...def, passToken: READINESS_CONTEXT_PASS };
  setCachedReadinessContext(contextId, context);
  return context;
}

export function buildAllReadinessContexts(): ReadinessContext[] {
  if (allContextsCache) return allContextsCache;
  allContextsCache = (Object.keys(CONTEXT_DEFINITIONS) as ReadinessContextId[]).map(buildReadinessContext);
  return allContextsCache;
}

export function listReadinessContextIds(): readonly ReadinessContextId[] {
  return Object.keys(CONTEXT_DEFINITIONS) as ReadinessContextId[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetReadinessContextBuilderForTests(): void {
  contextBuildCount = 0;
  allContextsCache = null;
}
