/** Types for csv-export feature module — Expense Tracking */
export interface CsvExportRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface CsvExportFormState {
  label: string;
}
