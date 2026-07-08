/** Types for inventory feature module — reusable components where */
export interface InventoryRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface InventoryFormState {
  label: string;
}
