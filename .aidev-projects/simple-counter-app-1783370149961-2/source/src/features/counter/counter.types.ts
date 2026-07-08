/** Types for counter feature module — simple counter */
export interface CounterRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface CounterFormState {
  label: string;
}
