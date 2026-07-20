/**
 * Universal Action Materialization Engine V1 — undo/retry support.
 */

import type { UniversalActionDescriptor } from './universal-action-types.js';

export function supportsUndo(descriptor: UniversalActionDescriptor): boolean {
  return descriptor.undoPolicy.supported;
}

export function supportsRetry(descriptor: UniversalActionDescriptor): boolean {
  return descriptor.semanticType === 'RETRY' || descriptor.executionStrategy === 'crud-adapter';
}

export function generateUndoRetryJsx(descriptors: readonly UniversalActionDescriptor[]): string {
  const hasUndo = descriptors.some((d) => d.semanticType === 'UNDO' || d.undoPolicy.supported);
  if (!hasUndo) return '';
  return `
      {crud.undoSnapshot ? (
        <button type="button" data-interaction-control="true" data-action-undo="true" className="universal-action-btn" onClick={() => crud.undoDelete()}>
          Undo
        </button>
      ) : null}`;
}
