/** Validation metadata for projects — Lisa As A Real Modular */
export const PROJECTS_VALIDATION = {
  moduleId: 'projects',
  contractId: 'feature-projects',
  displayName: 'Projects',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Projects label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Projects label must be at least 2 characters' },
  ],
} as const;

export type ProjectsValidationRule = (typeof PROJECTS_VALIDATION.rules)[number];
