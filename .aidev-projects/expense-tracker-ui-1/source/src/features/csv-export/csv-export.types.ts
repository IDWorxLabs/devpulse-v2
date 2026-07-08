/** Types for csv-export feature module — modern expense tracking */
export interface CsvExportRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface CsvExportFormState {
  label: string;
}
