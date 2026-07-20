/**
 * Universal Action Materialization Engine V1 — precondition helpers.
 */

import type { UniversalActionDescriptor } from './universal-action-types.js';

export function preconditionCheckIds(descriptor: UniversalActionDescriptor): string[] {
  return descriptor.preconditions.map((p) => p.id);
}

export function generatesPreconditionEnforcement(descriptor: UniversalActionDescriptor): boolean {
  return descriptor.preconditions.length > 0;
}

export function preconditionFailureMessage(descriptor: UniversalActionDescriptor, failedId: string): string {
  return descriptor.preconditions.find((p) => p.id === failedId)?.message ?? 'Precondition failed';
}
