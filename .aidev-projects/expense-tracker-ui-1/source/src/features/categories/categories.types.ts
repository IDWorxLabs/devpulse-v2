/** Types for categories feature module — modern expense tracking */
export interface CategoriesRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface CategoriesFormState {
  label: string;
}
