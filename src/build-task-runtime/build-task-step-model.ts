/**
 * Build task step model — ordered planning steps only.
 */

import type { BuildTaskStep } from './build-task-runtime-types.js';

const STANDARD_STEPS: Array<Omit<BuildTaskStep, 'stepId' | 'order'>> = [
  {
    title: 'Parse build task request',
    description: 'Extract goal, outcome, and planning scope from operator query.',
    dependencyRefs: [],
    safetyGateRefs: ['gate-intelligence-only'],
    verificationRef: 'verify-request-parsed',
    simulationOnly: true,
  },
  {
    title: 'Resolve dependencies',
    description: 'Consult Dependency Intelligence and Project Understanding for prerequisites.',
    dependencyRefs: ['dependency_intelligence', 'project_understanding_engine'],
    safetyGateRefs: ['gate-dependency-check'],
    verificationRef: 'verify-dependencies-resolved',
    simulationOnly: true,
  },
  {
    title: 'Evaluate safety gates',
    description: 'Check execution safety boundaries and founder approval requirements.',
    dependencyRefs: ['execution_runtime'],
    safetyGateRefs: ['gate-founder-approval', 'gate-no-real-execution'],
    verificationRef: 'verify-safety-gates',
    simulationOnly: true,
  },
  {
    title: 'Link execution packet',
    description: 'Attach Execution Runtime Foundation packet — simulation only, execution blocked.',
    dependencyRefs: ['execution_runtime', 'unified_decision_layer'],
    safetyGateRefs: ['gate-execution-blocked'],
    verificationRef: 'verify-packet-linked',
    simulationOnly: true,
  },
  {
    title: 'Create verification plan',
    description: 'Define proof criteria and rollback considerations for future governed execution.',
    dependencyRefs: ['failure_visibility_engine', 'learning_visibility_engine'],
    safetyGateRefs: ['gate-verification-plan'],
    verificationRef: 'verify-plan-created',
    simulationOnly: true,
  },
  {
    title: 'Simulation review',
    description: 'Review planned build task in simulation-only mode — no file writes or commands.',
    dependencyRefs: ['workspace_intelligence'],
    safetyGateRefs: ['gate-simulation-only'],
    verificationRef: 'verify-simulation-review',
    simulationOnly: true,
  },
];

export function buildTaskSteps(query: string): BuildTaskStep[] {
  const lower = query.toLowerCase();
  const steps = [...STANDARD_STEPS];

  if (lower.includes('what steps') && !lower.includes('verification')) {
    return steps.map((s, i) => ({
      stepId: `bstep-${(i + 1).toString().padStart(2, '0')}`,
      order: i + 1,
      ...s,
    }));
  }

  return steps.map((s, i) => ({
    stepId: `bstep-${(i + 1).toString().padStart(2, '0')}`,
    order: i + 1,
    ...s,
  }));
}

export function stepCountForPlan(query: string): number {
  return buildTaskSteps(query).length;
}
