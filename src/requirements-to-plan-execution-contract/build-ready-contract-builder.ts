/**
 * Build-Ready Execution Contract — assemble builder handoff contract.
 */

import { MAX_BUILD_UNITS } from './requirements-to-plan-contract-registry.js';
import type {
  BuildReadyExecutionContract,
  BuildUnit,
  ClarifyingGapAnalysis,
  PlanContract,
  PlanTask,
  RequirementContract,
  UserIdeaContract,
} from './requirements-to-plan-contract-types.js';

function groupTasksByLayer(tasks: PlanTask[]): Map<string, PlanTask[]> {
  const map = new Map<string, PlanTask[]>();
  for (const task of tasks) {
    const list = map.get(task.layer) ?? [];
    list.push(task);
    map.set(task.layer, list);
  }
  return map;
}

function verificationForTask(task: PlanTask): string[] {
  return [
    ...task.acceptanceCriteria.map((c) => `Verify: ${c}`),
    `Layer ${task.layer} task ${task.taskId} produces inspectable output`,
  ];
}

export function buildBuildReadyExecutionContract(input: {
  idea: UserIdeaContract;
  requirementContract: RequirementContract | null;
  planContract: PlanContract | null;
  clarifyingGaps: ClarifyingGapAnalysis;
}): BuildReadyExecutionContract | null {
  const { idea, requirementContract, planContract, clarifyingGaps } = input;

  if (!requirementContract || !planContract || planContract.tasks.length === 0) {
    return null;
  }

  const requirementIds = requirementContract.requirements.map((r) => r.requirementId);
  const planTaskIds = planContract.tasks.map((t) => t.taskId);

  const buildUnits: BuildUnit[] = [];
  const byLayer = groupTasksByLayer(planContract.tasks.filter((t) => t.layer !== 'DOCUMENTATION'));

  let unitOrder = 0;
  for (const [layer, layerTasks] of byLayer) {
    if (layer === 'VERIFICATION') continue;
    unitOrder += 1;
    const sourcePlanTaskIds = layerTasks.map((t) => t.taskId);
    const sourceRequirementIds = [...new Set(layerTasks.flatMap((t) => t.sourceRequirementIds))];
    buildUnits.push({
      readOnly: true,
      unitId: `unit-${String(unitOrder).padStart(3, '0')}`,
      sourcePlanTaskIds,
      sourceRequirementIds,
      label: `${layer} build unit`,
      layer: layerTasks[0]!.layer,
      verificationRequirements: layerTasks.flatMap(verificationForTask),
    });
  }

  const verificationTasks = planContract.tasks.filter((t) => t.layer === 'VERIFICATION');
  if (verificationTasks.length > 0) {
    buildUnits.push({
      readOnly: true,
      unitId: `unit-${String(unitOrder + 1).padStart(3, '0')}`,
      sourcePlanTaskIds: verificationTasks.map((t) => t.taskId),
      sourceRequirementIds: [...new Set(verificationTasks.flatMap((t) => t.sourceRequirementIds))],
      label: 'Verification build unit',
      layer: 'VERIFICATION',
      verificationRequirements: verificationTasks.flatMap(verificationForTask),
    });
  }

  const executionOrder = buildUnits.map((u) => u.unitId);
  const allTasksLinked = planContract.tasks.every(
    (t) => t.layer === 'DOCUMENTATION' || t.sourceRequirementIds.length >= 1,
  );
  const allUnitsHaveVerification = buildUnits.every((u) => u.verificationRequirements.length >= 1);

  const blockers: string[] = [];
  if (clarifyingGaps.contractReadiness === 'NEEDS_CLARIFICATION') {
    blockers.push('Critical clarifying gaps remain');
  }
  if (!allTasksLinked) blockers.push('Plan tasks missing requirement linkage');
  if (!allUnitsHaveVerification) blockers.push('Build units missing verification requirements');

  let readinessState = clarifyingGaps.contractReadiness;
  if (
    readinessState === 'BUILD_READY' &&
    allTasksLinked &&
    allUnitsHaveVerification &&
    clarifyingGaps.criticalGaps.length === 0
  ) {
    readinessState = 'BUILD_READY';
  } else if (clarifyingGaps.criticalGaps.length > 0) {
    readinessState = 'NEEDS_CLARIFICATION';
  } else if (!allTasksLinked) {
    readinessState = 'NEEDS_PLANNING';
  }

  const confidence = Math.round(
    Math.min(
      100,
      idea.confidence * 0.35 +
        (requirementIds.length >= 5 ? 25 : 10) +
        (allTasksLinked ? 20 : 0) +
        (allUnitsHaveVerification ? 15 : 0) +
        (readinessState === 'BUILD_READY' ? 10 : 0),
    ),
  );

  return {
    readOnly: true,
    contractId: `build-ready-${idea.ideaId}`,
    ideaId: idea.ideaId,
    requirementIds,
    planTaskIds,
    buildUnits: buildUnits.slice(0, MAX_BUILD_UNITS),
    executionOrder,
    workspaceRequirements: [
      'Isolated builder workspace with file generation capability',
      'Rollback artifact before apply',
      'Traceability to requirement and plan task IDs',
    ],
    runtimeRequirements: [
      'Modeled runtime activation path from build output',
      'Preview activation path linked to runtime contract',
    ],
    verificationRequirements: buildUnits.flatMap((u) => u.verificationRequirements).slice(0, 24),
    readinessState,
    blockers,
    confidence,
  };
}
