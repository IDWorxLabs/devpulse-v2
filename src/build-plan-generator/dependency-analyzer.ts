/**
 * Dependency Analyzer — phase prerequisites and dependency map (V1).
 */

import type { BuildPlanPhase, DependencyMap } from './build-plan-types.js';

let dependencyCounter = 0;

export function resetDependencyCounterForTests(): void {
  dependencyCounter = 0;
}

function findPhase(phases: readonly BuildPlanPhase[], name: string): BuildPlanPhase | undefined {
  return phases.find((p) => p.name === name);
}

export function analyzeDependencies(phases: readonly BuildPlanPhase[]): DependencyMap {
  const dependencies: DependencyMap['dependencies'][number][] = [];
  const blockedPhases: string[] = [];
  const criticalDependencies: string[] = [];

  const push = (
    fromName: string,
    toName: string,
    type: 'REQUIRED_PREREQUISITE' | 'BLOCKS' | 'CRITICAL',
    description: string,
  ) => {
    const from = findPhase(phases, fromName);
    const to = findPhase(phases, toName);
    if (!from || !to) return;
    dependencyCounter += 1;
    dependencies.push({
      readOnly: true,
      dependencyId: `dep-${dependencyCounter}`,
      fromPhaseId: from.phaseId,
      toPhaseId: to.phaseId,
      dependencyType: type,
      description,
    });
    if (type === 'CRITICAL') criticalDependencies.push(`dep-${dependencyCounter}`);
    if (type === 'BLOCKS') blockedPhases.push(to.phaseId);
  };

  push('Foundation', 'Authentication', 'REQUIRED_PREREQUISITE', 'Authentication requires foundation scaffolding.');
  push('Foundation', 'Data Layer', 'REQUIRED_PREREQUISITE', 'Data layer requires project foundation.');
  push('Authentication', 'Core Features', 'REQUIRED_PREREQUISITE', 'Core features require authenticated access model.');
  push('Data Layer', 'Core Features', 'REQUIRED_PREREQUISITE', 'Core features depend on data models.');
  push('Core Features', 'Integrations', 'REQUIRED_PREREQUISITE', 'Integrations attach to core feature workflows.');
  push('Integrations', 'Testing', 'CRITICAL', 'Testing must cover integrated third-party flows.');
  push('Testing', 'Launch Readiness', 'CRITICAL', 'Launch readiness requires completed verification.');

  if (!findPhase(phases, 'Authentication')) {
    push('Foundation', 'Core Features', 'REQUIRED_PREREQUISITE', 'Core features require foundation when auth phase omitted.');
  }

  return {
    readOnly: true,
    dependencies,
    blockedPhases: [...new Set(blockedPhases)],
    criticalDependencies: [...new Set(criticalDependencies)],
  };
}
