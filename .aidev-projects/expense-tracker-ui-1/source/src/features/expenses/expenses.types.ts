/** Types for expenses feature module — modern expense tracking */
export interface ExpensesRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface ExpensesFormState {
  label: string;
}
