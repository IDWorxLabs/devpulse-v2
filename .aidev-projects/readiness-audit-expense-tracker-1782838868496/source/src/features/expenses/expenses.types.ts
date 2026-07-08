/** Types for expenses feature module — Expense Tracker */
export interface ExpensesRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface ExpensesFormState {
  label: string;
}
