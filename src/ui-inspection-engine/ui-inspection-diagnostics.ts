/**
 * UI inspection diagnostics tracker.
 */

import type { InspectionState, UiInspectionDiagnostics } from './types.js';

let diagnostics: UiInspectionDiagnostics = {
  uiInspectionActive: false,
  inspectionReportCount: 0,
  blockedInspectionCount: 0,
  readyInspectionCount: 0,
  lastQuery: null,
  lastState: null,
};

export function uiInspectionKey(): string {
  return 'ui_inspection_engine';
}

export function getUiInspectionDiagnostics(): UiInspectionDiagnostics {
  return { ...diagnostics };
}

export function resetUiInspectionDiagnostics(): void {
  diagnostics = {
    uiInspectionActive: false,
    inspectionReportCount: 0,
    blockedInspectionCount: 0,
    readyInspectionCount: 0,
    lastQuery: null,
    lastState: null,
  };
}

export function updateUiInspectionDiagnostics(query: string, state: InspectionState): void {
  diagnostics.uiInspectionActive = true;
  diagnostics.inspectionReportCount += 1;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  if (state === 'INSPECTION_BLOCKED') {
    diagnostics.blockedInspectionCount += 1;
  }
  if (state === 'INSPECTION_READY' || state === 'INSPECTING') {
    diagnostics.readyInspectionCount += 1;
  }
}
