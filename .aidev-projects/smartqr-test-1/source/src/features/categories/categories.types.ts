/** Types for categories feature module — Expense Tracking */
export interface CategoriesRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface CategoriesFormState {
  label: string;
}
