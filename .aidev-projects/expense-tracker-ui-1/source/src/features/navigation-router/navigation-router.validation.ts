/** Validation metadata for navigation-router — modern expense tracking */
export const NAVIGATION_ROUTER_VALIDATION = {
  moduleId: 'navigation-router',
  contractId: 'feature-navigation-router',
  displayName: 'Navigation Router',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Navigation Router label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Navigation Router label must be at least 2 characters' },
  ],
} as const;

export type NavigationRouterValidationRule = (typeof NAVIGATION_ROUTER_VALIDATION.rules)[number];
