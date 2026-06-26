/** Validation metadata for tasks — Lisa As A Real Modular */
export const TASKS_VALIDATION = {
  moduleId: 'tasks',
  contractId: 'feature-tasks',
  displayName: 'Tasks',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Tasks label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Tasks label must be at least 2 characters' },
  ],
} as const;

export type TasksValidationRule = (typeof TASKS_VALIDATION.rules)[number];
