/**
 * Build task dependency resolver — read-only prerequisite analysis.
 */

import { getDependencyIntelligenceContext } from '../dependency-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import type { BuildTaskDependency } from './build-task-runtime-types.js';

let depCounter = 0;

function nextDepId(): string {
  depCounter += 1;
  return `bdep-${depCounter.toString().padStart(3, '0')}`;
}

export function resetBuildTaskDependencyCounterForTests(): void {
  depCounter = 0;
}

export function resolveBuildTaskDependencies(query: string): BuildTaskDependency[] {
  const dep = getDependencyIntelligenceContext(query);
  const profile = getCurrentProjectProfile();
  const dependencies: BuildTaskDependency[] = [];

  const coreDeps = [
    { name: 'execution_runtime', source: 'execution_runtime', reason: 'Phase 14.1 execution readiness must be evaluated before build tasks execute' },
    { name: 'dependency_intelligence', source: 'dependency_intelligence', reason: 'Dependency graph informs build prerequisites' },
    { name: 'unified_decision_layer', source: 'unified_decision_layer', reason: 'Decision context informs build priority and blockers' },
    { name: 'workspace_intelligence', source: 'workspace_intelligence', reason: 'Workspace boundaries affect build task scope' },
    { name: 'project_understanding_engine', source: 'project_understanding_engine', reason: 'Project facts inform build goals and gaps' },
  ];

  for (const core of coreDeps) {
    dependencies.push({
      dependencyId: nextDepId(),
      name: core.name,
      sourceSystem: core.source,
      required: true,
      satisfied: core.name !== 'execution_runtime',
      reason: core.reason,
      planningOnly: true,
    });
  }

  for (const blocker of dep.dependencyBlockers.slice(0, 4)) {
    dependencies.push({
      dependencyId: nextDepId(),
      name: blocker.slice(0, 60),
      sourceSystem: 'dependency_intelligence',
      required: true,
      satisfied: false,
      reason: blocker,
      planningOnly: true,
    });
  }

  for (const gap of profile.missingCapabilities.slice(0, 3)) {
    dependencies.push({
      dependencyId: nextDepId(),
      name: gap,
      sourceSystem: 'project_understanding_engine',
      required: true,
      satisfied: false,
      reason: `Missing capability: ${gap}`,
      planningOnly: true,
    });
  }

  return dependencies;
}
