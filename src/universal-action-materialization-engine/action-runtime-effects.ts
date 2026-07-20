/**
 * Universal Action Materialization Engine V1 — runtime state effects.
 */

export { generatesPreconditionEnforcement } from './action-precondition-generator.js';

export const RUNTIME_STATE_EFFECT_KINDS = [
  'update-selection',
  'clear-selection',
  'reset-form',
  'mark-dirty',
  'update-loading',
  'reorder-collection',
  'set-field',
] as const;
