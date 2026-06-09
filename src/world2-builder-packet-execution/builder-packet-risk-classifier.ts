/**
 * Builder packet risk classifier — classifies step and packet risk without execution.
 */

import type {
  BuilderPacketExecutionStep,
  BuilderPacketRiskLevel,
  BuilderPacketStepType,
} from './types.js';

const CRITICAL_PATTERNS = [
  'shell',
  'child_process',
  'spawn',
  'exec(',
  'deploy',
  'writefilesync',
  'direct apply',
  'world1',
  'world 1',
  'ungoverned',
  'duplicate authority',
  'monolith edit',
  'runtime mutation',
  'approval bypass',
  'workspace escape',
] as const;

function isCriticalStep(step: BuilderPacketExecutionStep): boolean {
  const text = `${step.title} ${step.description} ${step.targetArea} ${step.stepType}`.toLowerCase();

  if (step.stepType === 'DELETE_FILE_PROPOSAL') return true;
  if (step.stepType === 'ROLLBACK_PROPOSAL' && !step.allowedInThisPhase) return true;

  if (text.includes('world1') || text.includes('world 1')) return true;
  if (text.includes('shell') || text.includes('child_process') || text.includes('spawn')) return true;
  if (text.includes('deploy') || text.includes('direct apply') || text.includes('writefilesync')) return true;
  if (text.includes('duplicate authority') || text.includes('approval bypass')) return true;
  if (text.includes('workspace escape') || text.includes('runtime mutation')) return true;

  return CRITICAL_PATTERNS.some((p) => text.includes(p));
}

function baseRiskForType(stepType: BuilderPacketStepType): BuilderPacketRiskLevel {
  switch (stepType) {
    case 'READ_CONTEXT':
    case 'REPORT_RESULT':
      return 'LOW';
    case 'PLAN_CHANGE':
    case 'GENERATE_CODE_PROPOSAL':
    case 'RUN_TEST_PROPOSAL':
      return 'MEDIUM';
    case 'CREATE_FILE_PROPOSAL':
    case 'MODIFY_FILE_PROPOSAL':
      return 'HIGH';
    case 'DELETE_FILE_PROPOSAL':
    case 'ROLLBACK_PROPOSAL':
      return 'CRITICAL';
    default:
      return 'MEDIUM';
  }
}

function escalate(current: BuilderPacketRiskLevel, next: BuilderPacketRiskLevel): BuilderPacketRiskLevel {
  const order: BuilderPacketRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

export function classifyBuilderPacketStepRisk(step: BuilderPacketExecutionStep): BuilderPacketExecutionStep {
  let riskLevel = baseRiskForType(step.stepType);
  if (!step.allowedInThisPhase) {
    riskLevel = escalate(riskLevel, 'HIGH');
  }
  if (isCriticalStep(step)) {
    riskLevel = 'CRITICAL';
  }

  const requiresApproval = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  return {
    ...step,
    riskLevel,
    requiresApproval,
  };
}

export function classifyBuilderPacketSteps(steps: BuilderPacketExecutionStep[]): BuilderPacketExecutionStep[] {
  return steps.map(classifyBuilderPacketStepRisk);
}

export function aggregatePacketRiskLevel(steps: BuilderPacketExecutionStep[]): BuilderPacketRiskLevel {
  let aggregate: BuilderPacketRiskLevel = 'LOW';
  for (const step of steps) {
    aggregate = escalate(aggregate, step.riskLevel);
  }
  return aggregate;
}
