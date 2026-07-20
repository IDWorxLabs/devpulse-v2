/**
 * Universal Action Materialization Engine V1 — action validation helpers.
 */

import type { UniversalActionDescriptor } from './universal-action-types.js';

export function hasValidationRules(descriptor: UniversalActionDescriptor): boolean {
  return descriptor.validationRules.length > 0 || descriptor.inputSchema.fields.some((f) => f.required);
}

export function validationExecutesBeforeEffects(descriptor: UniversalActionDescriptor): boolean {
  if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY') return true;
  if (descriptor.supportClassification === 'NOT_EXECUTABLE_INFORMATIONAL') return true;
  return descriptor.validationRules.length > 0 || ['CREATE', 'UPDATE', 'SAVE', 'SUBMIT'].includes(descriptor.semanticType);
}
