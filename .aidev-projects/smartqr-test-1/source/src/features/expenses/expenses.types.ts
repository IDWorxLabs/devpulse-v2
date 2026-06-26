/** Types for expenses feature module — Expense Tracking */
export interface ExpensesRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface ExpensesFormState {
  label: string;
}
