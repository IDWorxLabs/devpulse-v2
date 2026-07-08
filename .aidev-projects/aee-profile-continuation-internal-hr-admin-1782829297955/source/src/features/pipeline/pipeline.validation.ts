/** Validation metadata for pipeline — CRM */
export const PIPELINE_VALIDATION = {
  moduleId: 'pipeline',
  contractId: 'feature-pipeline',
  displayName: 'Pipeline',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Pipeline label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Pipeline label must be at least 2 characters' },
  ],
} as const;

export type PipelineValidationRule = (typeof PIPELINE_VALIDATION.rules)[number];
