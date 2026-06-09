/**
 * Preview runtime diagnostics.
 */

import type { PreviewRuntimeDiagnostics, PreviewState } from './types.js';

let diagnostics: PreviewRuntimeDiagnostics = {
  previewRuntimeActive: false,
  previewSessionCount: 0,
  registeredTargetCount: 0,
  blockedPreviewCount: 0,
  readyPreviewCount: 0,
  lastQuery: null,
  lastState: null,
};

export function getPreviewRuntimeDiagnostics(): PreviewRuntimeDiagnostics {
  return { ...diagnostics };
}

export function updatePreviewRuntimeDiagnostics(
  query: string,
  state: PreviewState,
  sessionCreated: boolean,
  targetRegistered: boolean,
): void {
  diagnostics = {
    previewRuntimeActive: true,
    previewSessionCount: diagnostics.previewSessionCount + (sessionCreated ? 1 : 0),
    registeredTargetCount: diagnostics.registeredTargetCount + (targetRegistered ? 1 : 0),
    blockedPreviewCount: diagnostics.blockedPreviewCount + (state === 'PREVIEW_BLOCKED' ? 1 : 0),
    readyPreviewCount: diagnostics.readyPreviewCount + (state === 'PREVIEW_READY' ? 1 : 0),
    lastQuery: query,
    lastState: state,
  };
}

export function resetPreviewRuntimeDiagnostics(): void {
  diagnostics = {
    previewRuntimeActive: false,
    previewSessionCount: 0,
    registeredTargetCount: 0,
    blockedPreviewCount: 0,
    readyPreviewCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function previewRuntimeKey(): string {
  const d = diagnostics;
  return [
    String(d.previewRuntimeActive),
    String(d.previewSessionCount),
    String(d.registeredTargetCount),
    String(d.blockedPreviewCount),
    String(d.readyPreviewCount),
    d.lastQuery ?? '',
    d.lastState ?? '',
  ].join('|');
}
