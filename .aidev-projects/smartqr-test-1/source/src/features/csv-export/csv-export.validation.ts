/** Validation metadata for csv-export — Expense Tracking */
export const CSV_EXPORT_VALIDATION = {
  moduleId: 'csv-export',
  contractId: 'feature-csv-export',
  displayName: 'Csv Export',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Csv Export label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Csv Export label must be at least 2 characters' },
  ],
} as const;

export type CsvExportValidationRule = (typeof CSV_EXPORT_VALIDATION.rules)[number];
