/**
 * Action Visibility Engine diagnostics.
 */

import type { ActionCandidate, ActionVisibilityDiagnostics } from './action-visibility-types.js';

let diagnostics: ActionVisibilityDiagnostics = {
  actionVisibilityActive: false,
  actionCount: 0,
  recommendedCount: 0,
  blockedCount: 0,
  deferredCount: 0,
  lastAction: null,
  lastActionSource: null,
  lastQuery: null,
};

export function getActionVisibilityDiagnostics(): ActionVisibilityDiagnostics {
  return { ...diagnostics };
}

export function updateActionVisibilityDiagnostics(query: string, candidates: ActionCandidate[]): void {
  const recommended = candidates.filter((c) => c.recommended || c.status === 'Recommended');
  const blocked = candidates.filter((c) => c.blocked || c.status === 'Blocked');
  const deferred = candidates.filter((c) => c.deferred || c.status === 'Deferred' || c.status === 'Waiting');
  const top = candidates[0];

  diagnostics = {
    actionVisibilityActive: true,
    actionCount: candidates.length,
    recommendedCount: recommended.length,
    blockedCount: blocked.length,
    deferredCount: deferred.length,
    lastAction: top?.title ?? null,
    lastActionSource: top?.sourceSystem ?? null,
    lastQuery: query,
  };
}

export function resetActionVisibilityDiagnostics(): void {
  diagnostics = {
    actionVisibilityActive: false,
    actionCount: 0,
    recommendedCount: 0,
    blockedCount: 0,
    deferredCount: 0,
    lastAction: null,
    lastActionSource: null,
    lastQuery: null,
  };
}

export function actionVisibilityKey(): string {
  const d = diagnostics;
  return [
    String(d.actionVisibilityActive),
    String(d.actionCount),
    String(d.recommendedCount),
    String(d.blockedCount),
    d.lastAction ?? 'none',
  ].join('|');
}
