/**
 * Feature Reality Validation — planning-time feature contract builder.
 */

import type { TaskTrackerRequirements } from '../code-generation-engine/code-generation-engine-types.js';
import type { FeatureContract } from './feature-reality-validation-types.js';

export function buildTaskTrackerFeatureContract(input: {
  contractId: string;
  requirements: TaskTrackerRequirements;
}): FeatureContract {
  const features: FeatureContract['features'] = [
    {
      id: 'create-task',
      label: 'Create Task',
      category: 'execution',
      required: input.requirements.addTask,
    },
    {
      id: 'edit-task',
      label: 'Edit Task',
      category: 'edit',
      required: true,
    },
    {
      id: 'complete-task',
      label: 'Complete Task',
      category: 'execution',
      required: input.requirements.completeTask,
    },
    {
      id: 'delete-task',
      label: 'Delete Task',
      category: 'delete',
      required: input.requirements.deleteTask,
    },
    {
      id: 'filter-tasks',
      label: 'Filter Tasks',
      category: 'search',
      required: input.requirements.filterAllActiveCompleted,
    },
  ].filter((feature) => feature.required);

  return {
    contractVersion: '1.0',
    contractId: input.contractId,
    productProfile: 'TASK_TRACKER_WEB_V1',
    productName: 'Task Tracker',
    generatedAt: new Date().toISOString(),
    features,
  };
}

export function buildTaskTrackerFeatureContractJson(input: {
  contractId: string;
  requirements: TaskTrackerRequirements;
}): string {
  return JSON.stringify(buildTaskTrackerFeatureContract(input), null, 2) + '\n';
}

export function parseFeatureContract(source: string): FeatureContract {
  const parsed = JSON.parse(source) as FeatureContract;
  if (!parsed.contractVersion || !Array.isArray(parsed.features)) {
    throw new Error('Invalid feature-contract.json');
  }
  return parsed;
}
