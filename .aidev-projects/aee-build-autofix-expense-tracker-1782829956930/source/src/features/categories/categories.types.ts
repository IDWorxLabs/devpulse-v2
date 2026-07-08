/** Types for categories feature module — Expense Tracker */
export interface CategoriesRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface CategoriesFormState {
  label: string;
}
