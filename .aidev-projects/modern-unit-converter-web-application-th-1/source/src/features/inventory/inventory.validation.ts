/** Validation metadata for inventory — reusable components where */
export const INVENTORY_VALIDATION = {
  moduleId: 'inventory',
  contractId: 'feature-inventory',
  displayName: 'Inventory',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Inventory label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Inventory label must be at least 2 characters' },
  ],
} as const;

export type InventoryValidationRule = (typeof INVENTORY_VALIDATION.rules)[number];
