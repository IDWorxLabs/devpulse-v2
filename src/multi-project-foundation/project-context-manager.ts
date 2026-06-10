/**
 * Multi Project Foundation — isolated project context storage.
 */

import type { ProjectContext } from './multi-project-types.js';

const contexts = new Map<string, ProjectContext>();

export function storeProjectContext(
  projectId: string,
  partial: Partial<Omit<ProjectContext, 'projectId' | 'updatedAt'>>,
): ProjectContext {
  const existing = contexts.get(projectId);
  const context: ProjectContext = {
    projectId,
    planningContext: { ...existing?.planningContext, ...partial.planningContext },
    strategyContext: { ...existing?.strategyContext, ...partial.strategyContext },
    verificationContext: { ...existing?.verificationContext, ...partial.verificationContext },
    completionContext: { ...existing?.completionContext, ...partial.completionContext },
    updatedAt: Date.now(),
  };
  contexts.set(projectId, context);
  return context;
}

export function getProjectContext(projectId: string): ProjectContext | undefined {
  return contexts.get(projectId);
}

export function removeProjectContext(projectId: string): void {
  contexts.delete(projectId);
}

export function getProjectContextCount(): number {
  return contexts.size;
}

export function resetProjectContextForTests(): void {
  contexts.clear();
}
