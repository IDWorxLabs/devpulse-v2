/**
 * Founder Productivity Validation — productivity context builder.
 */

import type { ProductivityContext, ProductivityContextId } from './founder-productivity-types.js';
import { PRODUCTIVITY_CONTEXT_PASS } from './founder-productivity-types.js';
import { getCachedProductivityContext, setCachedProductivityContext } from './founder-productivity-cache.js';

const CONTEXT_DEFINITIONS: Record<ProductivityContextId, Omit<ProductivityContext, 'passToken'>> = {
  IDEA_TO_EXECUTION_PRODUCTIVITY: {
    contextId: 'IDEA_TO_EXECUTION_PRODUCTIVITY',
    contextName: 'Idea to Execution Productivity',
    productivityIntent: 'Founder moves from idea to outcome faster with fewer manual steps',
    expectedFounderBenefit: 'Accelerated path from idea vault to project build to delivery',
    requiredEvidence: ['Workflow Validation', 'Idea Vault', 'Project Vault', 'Operator Feed'],
  },
  PROJECT_MANAGEMENT_PRODUCTIVITY: {
    contextId: 'PROJECT_MANAGEMENT_PRODUCTIVITY',
    contextName: 'Project Management Productivity',
    productivityIntent: 'Founder manages projects with reduced coordination overhead',
    expectedFounderBenefit: 'Clear project state, priorities, and next actions without manual tracking',
    requiredEvidence: ['Project Vault', 'Founder Priorities', 'Workflow Roadmap', 'Chat'],
  },
  BUILD_PRODUCTIVITY: {
    contextId: 'BUILD_PRODUCTIVITY',
    contextName: 'Build Productivity',
    productivityIntent: 'Founder initiates and tracks builds with minimal friction',
    expectedFounderBenefit: 'Fast build initiation with visible progress and reduced manual coordination',
    requiredEvidence: ['Operator Feed', 'Build Runtime', 'Workflow Continuity', 'UX Heuristics'],
  },
  VERIFICATION_PRODUCTIVITY: {
    contextId: 'VERIFICATION_PRODUCTIVITY',
    contextName: 'Verification Productivity',
    productivityIntent: 'Founder validates product state efficiently without repeated manual checks',
    expectedFounderBenefit: 'Streamlined UVL and reality verification with clear pass/fail signals',
    requiredEvidence: ['UVL', 'Product Reality Orchestrator', 'Validation Scripts', 'Reports'],
  },
  DECISION_PRODUCTIVITY: {
    contextId: 'DECISION_PRODUCTIVITY',
    contextName: 'Decision Productivity',
    productivityIntent: 'Founder makes fewer repeated decisions with better prioritization',
    expectedFounderBenefit: 'Reduced decision fatigue through clear recommendations and priorities',
    requiredEvidence: ['Confidence Engine', 'Trust Validation', 'Founder Priorities', 'Roadmaps'],
  },
  AUTOMATION_PRODUCTIVITY: {
    contextId: 'AUTOMATION_PRODUCTIVITY',
    contextName: 'Automation Productivity',
    productivityIntent: 'Founder benefits from automated coordination and reduced repetitive work',
    expectedFounderBenefit: 'Less manual effort through operator feed, validation, and intelligence automation',
    requiredEvidence: ['Operator Feed', 'Intelligence Console', 'Capability Registry', 'Find Panel'],
  },
  DELIVERY_PRODUCTIVITY: {
    contextId: 'DELIVERY_PRODUCTIVITY',
    contextName: 'Delivery Productivity',
    productivityIntent: 'Founder delivers validated outcomes with higher throughput',
    expectedFounderBenefit: 'Faster validation-to-release path with clear release readiness',
    requiredEvidence: ['Product Reality Orchestrator', 'Launch Blockers', 'Release Readiness', 'Reports'],
  },
};

let contextBuildCount = 0;
let allContextsCache: ProductivityContext[] | null = null;

export function buildProductivityContext(contextId: ProductivityContextId): ProductivityContext {
  const cached = getCachedProductivityContext(contextId);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = CONTEXT_DEFINITIONS[contextId];
  const context: ProductivityContext = { ...def, passToken: PRODUCTIVITY_CONTEXT_PASS };
  setCachedProductivityContext(contextId, context);
  return context;
}

export function buildAllProductivityContexts(): ProductivityContext[] {
  if (allContextsCache) return allContextsCache;
  allContextsCache = (Object.keys(CONTEXT_DEFINITIONS) as ProductivityContextId[]).map(buildProductivityContext);
  return allContextsCache;
}

export function listProductivityContextIds(): readonly ProductivityContextId[] {
  return Object.keys(CONTEXT_DEFINITIONS) as ProductivityContextId[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetProductivityContextBuilderForTests(): void {
  contextBuildCount = 0;
  allContextsCache = null;
}
