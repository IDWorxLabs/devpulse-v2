/**
 * Founder Workflow Validation — workflow context builder.
 */

import type { WorkflowContext, WorkflowContextId } from './founder-workflow-types.js';
import { WORKFLOW_CONTEXT_PASS } from './founder-workflow-types.js';
import { getCachedWorkflowContext, setCachedWorkflowContext } from './founder-workflow-cache.js';

const CONTEXT_DEFINITIONS: Record<WorkflowContextId, Omit<WorkflowContext, 'passToken'>> = {
  IDEA_TO_PROJECT: {
    workflowId: 'IDEA_TO_PROJECT',
    workflowName: 'Idea to Project',
    goal: 'Transform a founder idea into a structured DevPulse project',
    expectedOutcome: 'Project created with clear scope, vault entry, and next build step',
    requiredCapabilities: ['Chat', 'Idea Vault', 'Project Vault', 'Intelligence Console'],
  },
  PROJECT_TO_BUILD: {
    workflowId: 'PROJECT_TO_BUILD',
    workflowName: 'Project to Build',
    goal: 'Initiate and track project build from founder direction',
    expectedOutcome: 'Build started with visible progress and operator feed updates',
    requiredCapabilities: ['Chat', 'Operator Feed', 'World 2', 'Build Runtime'],
  },
  BUILD_TO_VERIFICATION: {
    workflowId: 'BUILD_TO_VERIFICATION',
    workflowName: 'Build to Verification',
    goal: 'Move from completed build to verification assessment',
    expectedOutcome: 'Verification initiated with UVL and reality verification surfaces',
    requiredCapabilities: ['UVL', 'Visual QA', 'UX Heuristics', 'Live Preview'],
  },
  VERIFICATION_TO_FIX: {
    workflowId: 'VERIFICATION_TO_FIX',
    workflowName: 'Verification to Fix',
    goal: 'Translate verification findings into actionable fixes',
    expectedOutcome: 'Founder understands gaps and directs fix work through chat',
    requiredCapabilities: ['Reports', 'Chat', 'Operator Feed', 'Verification Intelligence'],
  },
  FIX_TO_VALIDATION: {
    workflowId: 'FIX_TO_VALIDATION',
    workflowName: 'Fix to Validation',
    goal: 'Re-validate after fixes applied',
    expectedOutcome: 'Updated verification confirms fix effectiveness',
    requiredCapabilities: ['UVL', 'Live Preview', 'Product Reality Verification'],
  },
  VALIDATION_TO_RELEASE: {
    workflowId: 'VALIDATION_TO_RELEASE',
    workflowName: 'Validation to Release',
    goal: 'Determine release readiness from validated product state',
    expectedOutcome: 'Founder receives clear release readiness verdict and next action',
    requiredCapabilities: ['Product Reality Orchestrator', 'Founder Acceptance Framework', 'Reports'],
  },
  DISCOVERY_TO_ACTION: {
    workflowId: 'DISCOVERY_TO_ACTION',
    workflowName: 'Discovery to Action',
    goal: 'Discover capabilities and take first meaningful action',
    expectedOutcome: 'Founder finds capability, understands path, and completes first action',
    requiredCapabilities: ['Find Panel', 'Intelligence Console', 'Chat', 'Navigation'],
  },
};

let contextBuildCount = 0;

export function buildWorkflowContext(contextId: WorkflowContextId): WorkflowContext {
  const cacheKey = contextId;
  const cached = getCachedWorkflowContext(cacheKey);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = CONTEXT_DEFINITIONS[contextId];
  const context: WorkflowContext = { ...def, passToken: WORKFLOW_CONTEXT_PASS };
  setCachedWorkflowContext(cacheKey, context);
  return context;
}

export function buildAllWorkflowContexts(): WorkflowContext[] {
  return (Object.keys(CONTEXT_DEFINITIONS) as WorkflowContextId[]).map(buildWorkflowContext);
}

export function listWorkflowContextIds(): readonly WorkflowContextId[] {
  return Object.keys(CONTEXT_DEFINITIONS) as WorkflowContextId[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetWorkflowContextBuilderForTests(): void {
  contextBuildCount = 0;
}
