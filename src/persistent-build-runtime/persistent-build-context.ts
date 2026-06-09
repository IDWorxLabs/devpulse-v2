/**
 * Persistent Build Runtime Foundation — build context metadata (no code generation).
 */

import { getStoredPersistentBuild, storePersistentBuild } from './persistent-build-store.js';
import { recordPersistentBuildHistoryEntry } from './persistent-build-history.js';
import type { PersistentBuildContext } from './persistent-build-types.js';

export function buildDefaultBuildContext(input: {
  currentGoal?: string;
  buildType?: string;
}): PersistentBuildContext {
  return {
    currentGoal: input.currentGoal ?? 'Persistent build session authority — no execution',
    activePlanId: null,
    activeTaskId: null,
    currentStep: null,
    contextSummary: `Metadata-only context for ${input.buildType ?? 'GENERAL_BUILD'}`,
    knownConstraints: ['No file mutation', 'No real build execution', 'Authority only'],
    requiredApprovals: [],
    verificationRequirements: [],
    recoveryContext: null,
    world2Context: null,
    aidevContext: null,
    mobileCommandContext: null,
  };
}

export function updateBuildContext(
  buildId: string,
  updates: Partial<PersistentBuildContext>,
): PersistentBuildContext | null {
  const build = getStoredPersistentBuild(buildId);
  if (!build) return null;

  const context: PersistentBuildContext = { ...build.buildContext, ...updates };
  storePersistentBuild({ ...build, buildContext: context, updatedAt: Date.now() });

  recordPersistentBuildHistoryEntry({
    buildId,
    category: 'CONTEXT',
    summary: `Context updated: goal=${context.currentGoal.slice(0, 60)}`,
    scopeUsed: 'CONTEXT',
  });

  return context;
}

export function getBuildContext(buildId: string): PersistentBuildContext | null {
  return getStoredPersistentBuild(buildId)?.buildContext ?? null;
}

export function validateBuildContext(context: PersistentBuildContext): string[] {
  const issues: string[] = [];
  if (!context.currentGoal?.trim()) issues.push('Context missing goal');
  return issues;
}
