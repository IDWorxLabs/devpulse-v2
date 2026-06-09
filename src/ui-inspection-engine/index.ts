/**
 * DevPulse V2 Phase 16.4 — UI Inspection Engine public API.
 */

export {
  UI_INSPECTION_ENGINE_PASS_TOKEN,
  UI_INSPECTION_ENGINE_OWNER_MODULE,
  UI_INSPECTION_QUESTION_SIGNALS,
  FORBIDDEN_UI_INSPECTION_DUPLICATES,
  ALL_SURFACE_TYPES,
  isUiInspectionQuestion,
  isUiInspectionAdvisoryQuestion,
  isDuplicateUiInspectionQuestion,
  type InspectionState,
  type SurfaceType,
  type InspectedSurface,
  type LayoutStructure,
  type NavigationStructure,
  type LoadingStructure,
  type ResponsiveStructure,
  type UiInspectionReport,
  type UiInspectionDiagnostics,
  type PreviewContextSnapshot,
  type InspectUiSurfaceInput,
  type InspectUiSurfaceResult,
} from './types.js';

export {
  parseUiInspectionQuery,
  resetUiInspectionRequestCounterForTests,
  type ParsedUiInspectionQuery,
} from './ui-inspection-request-parser.js';

export { classifyInspectableSurfaces } from './ui-surface-classifier.js';
export { inspectLayoutStructures } from './ui-layout-inspector.js';
export { inspectNavigationStructures } from './ui-navigation-inspector.js';
export { inspectLoadingStructures } from './ui-loading-state-inspector.js';
export { inspectResponsiveStructures } from './ui-responsive-surface-inspector.js';

export {
  evaluateUiInspectionGates,
  validateUiInspection,
  type UiInspectionGateReport,
  type UiInspectionValidationResult,
} from './ui-inspection-validator.js';

export {
  buildUiInspectionReport,
  composeUiInspectionResponse,
  buildUiInspectionFailureContext,
  nextInspectionId,
  resetUiInspectionReportCounterForTests,
  type UiInspectionFailureContext,
} from './ui-inspection-report.js';

export {
  getUiInspectionDiagnostics,
  updateUiInspectionDiagnostics,
  resetUiInspectionDiagnostics,
  uiInspectionKey,
} from './ui-inspection-diagnostics.js';

export {
  inspectUiSurface,
  processUiInspectionRequest,
  getUiInspectionContext,
} from './ui-inspection-engine.js';

export function getDevPulseV2UiInspectionEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_ui_inspection_engine',
    passToken: 'UI_INSPECTION_ENGINE_V1_PASS',
    phase: 16.4,
    extensionOnly: true,
  };
}
