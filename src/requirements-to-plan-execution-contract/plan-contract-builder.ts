/**
 * Plan Contract — convert requirements into implementation plan tasks.
 */

import { MAX_PLAN_TASKS } from './requirements-to-plan-contract-registry.js';
import type {
  PlanContract,
  PlanTask,
  PlanTaskLayer,
  RequirementContract,
  RequirementContractEntry,
} from './requirements-to-plan-contract-types.js';

let taskCounter = 0;

export function resetPlanContractCounterForTests(): void {
  taskCounter = 0;
}

function nextTaskId(): string {
  taskCounter += 1;
  return `task-${String(taskCounter).padStart(3, '0')}`;
}

function layerForRequirement(req: RequirementContractEntry): PlanTaskLayer {
  switch (req.requirementType) {
    case 'AUTH':
    case 'SECURITY':
      return 'AUTH';
    case 'DATA':
      return 'DATABASE';
    case 'UI_UX':
      return 'FRONTEND';
    case 'PLATFORM':
    case 'DEPLOYMENT':
      return 'DEPLOYMENT';
    case 'INTEGRATION':
      return 'API';
    case 'NON_FUNCTIONAL':
      return 'VERIFICATION';
    default:
      return 'BACKEND';
  }
}

function complexityForRequirement(req: RequirementContractEntry): PlanTask['estimatedComplexity'] {
  if (req.priority === 'CRITICAL' && req.requirementType === 'AUTH') return 'HIGH';
  if (req.requirementType === 'DATA') return 'HIGH';
  if (req.requirementType === 'UI_UX') return 'MEDIUM';
  return req.priority === 'CRITICAL' ? 'MEDIUM' : 'LOW';
}

function taskFromRequirement(req: RequirementContractEntry, buildOrder: number, deps: string[]): PlanTask {
  const layer = layerForRequirement(req);
  return {
    readOnly: true,
    taskId: nextTaskId(),
    sourceRequirementIds: [req.requirementId],
    title: `Implement: ${req.description}`,
    description: `${req.description} (${req.requirementType})`,
    layer,
    estimatedComplexity: complexityForRequirement(req),
    dependencies: [...deps],
    acceptanceCriteria: [...req.acceptanceCriteria],
    buildOrder,
    status: 'PLANNED',
  };
}

export function buildPlanContract(requirementContract: RequirementContract): PlanContract {
  const tasks: PlanTask[] = [];
  const authReq = requirementContract.requirements.find((r) => r.requirementType === 'AUTH');
  const dataReq = requirementContract.requirements.find((r) => r.requirementType === 'DATA');
  let order = 1;

  if (dataReq) {
    tasks.push(taskFromRequirement(dataReq, order++, []));
  }
  if (authReq) {
    tasks.push(
      taskFromRequirement(authReq, order++, dataReq ? [tasks[tasks.length - 1]?.taskId].filter(Boolean) : []),
    );
  }

  for (const req of requirementContract.requirements) {
    if (req.requirementId === dataReq?.requirementId || req.requirementId === authReq?.requirementId) {
      continue;
    }
    const deps: string[] = [];
    if (dataReq && req.requirementType !== 'PLATFORM') deps.push(tasks.find((t) => t.sourceRequirementIds.includes(dataReq.requirementId))?.taskId ?? '');
    if (authReq && /dashboard|admin|role/i.test(req.description)) {
      deps.push(tasks.find((t) => t.sourceRequirementIds.includes(authReq.requirementId))?.taskId ?? '');
    }
    tasks.push(taskFromRequirement(req, order++, deps.filter(Boolean)));
  }

  tasks.push({
    readOnly: true,
    taskId: nextTaskId(),
    sourceRequirementIds: requirementContract.requirements.map((r) => r.requirementId),
    title: 'Verification harness for planned build units',
    description: 'Define verification steps for each build unit before execution',
    layer: 'VERIFICATION',
    estimatedComplexity: 'MEDIUM',
    dependencies: tasks.slice(-3).map((t) => t.taskId),
    acceptanceCriteria: ['Each build unit has pass/fail criteria', 'Founder can inspect verification results'],
    buildOrder: order++,
    status: 'PLANNED',
  });

  tasks.push({
    readOnly: true,
    taskId: nextTaskId(),
    sourceRequirementIds: requirementContract.requirements
      .filter((r) => r.requirementType === 'PLATFORM' || r.requirementType === 'DEPLOYMENT')
      .map((r) => r.requirementId),
    title: 'Document deployment and workspace requirements',
    description: 'Capture workspace/runtime prerequisites for builder handoff',
    layer: 'DOCUMENTATION',
    estimatedComplexity: 'LOW',
    dependencies: [],
    acceptanceCriteria: ['Workspace requirements documented', 'Runtime requirements documented'],
    buildOrder: order,
    status: 'PLANNED',
  });

  return {
    readOnly: true,
    contractId: `plan-contract-${requirementContract.sourceIdeaId}`,
    sourceIdeaId: requirementContract.sourceIdeaId,
    tasks: tasks.slice(0, MAX_PLAN_TASKS),
  };
}
