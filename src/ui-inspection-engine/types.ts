/**
 * DevPulse V2 Phase 16.4 — UI Inspection Engine types.
 * Structure inspection only — no clicking, interaction testing, or visual verification.
 */

import type { PreviewTargetType } from '../live-preview-runtime/types.js';
import type { ObservationTargetItem, SelfVisionSession } from '../self-vision-runtime/types.js';

export const UI_INSPECTION_ENGINE_PASS_TOKEN = 'UI_INSPECTION_ENGINE_V1_PASS';
export const UI_INSPECTION_ENGINE_OWNER_MODULE = 'devpulse_v2_ui_inspection_engine';

export type InspectionState =
  | 'DISCOVERED'
  | 'INSPECTING'
  | 'INSPECTION_READY'
  | 'INSPECTION_BLOCKED';

export type SurfaceType =
  | 'RENDER_SURFACE'
  | 'LAYOUT_SURFACE'
  | 'NAVIGATION_SURFACE'
  | 'INTERACTION_SURFACE'
  | 'ERROR_SURFACE'
  | 'LOADING_SURFACE'
  | 'RESPONSIVE_SURFACE';

export const ALL_SURFACE_TYPES: readonly SurfaceType[] = [
  'RENDER_SURFACE',
  'LAYOUT_SURFACE',
  'NAVIGATION_SURFACE',
  'INTERACTION_SURFACE',
  'ERROR_SURFACE',
  'LOADING_SURFACE',
  'RESPONSIVE_SURFACE',
] as const;

export const FORBIDDEN_UI_INSPECTION_DUPLICATES = [
  'visual_verification_engine',
  'interaction_testing_engine',
  'preview_executor',
  'runtime_brain',
  'autonomous_ui_tester',
] as const;

export const UI_INSPECTION_QUESTION_SIGNALS = [
  'what ui structures exist',
  'what layout was detected',
  'what navigation regions exist',
  'what loading states exist',
  'what responsive surfaces exist',
  'why is inspection blocked',
  'ui inspection',
  'layout inspection',
  'navigation inspection',
  'loading inspection',
  'responsive inspection',
  'inspection ready',
  'inspection blocked',
] as const;

export interface InspectedSurface {
  surfaceType: SurfaceType;
  identified: boolean;
  regionId: string;
  description: string;
  structureOnly: true;
}

export interface LayoutStructure {
  structureId: string;
  headerPresent: boolean;
  sidebarPresent: boolean;
  mainContentPresent: boolean;
  footerPresent: boolean;
  panelCount: number;
  hierarchy: string[];
  layoutRegions: string[];
  inspectionOnly: true;
}

export interface NavigationStructure {
  structureId: string;
  navigationAreas: string[];
  menuStructures: string[];
  tabStructures: string[];
  routeRegions: string[];
  navigationContainers: string[];
  inspectionOnly: true;
}

export interface LoadingStructure {
  structureId: string;
  loadingIndicators: string[];
  loadingRegions: string[];
  emptyStates: string[];
  errorStates: string[];
  readinessIndicators: string[];
  inspectionOnly: true;
}

export interface ResponsiveStructure {
  structureId: string;
  mobileSurfaces: string[];
  tabletSurfaces: string[];
  desktopSurfaces: string[];
  responsiveContainers: string[];
  viewportRegions: string[];
  inspectionOnly: true;
}

export interface UiInspectionReport {
  inspectionId: string;
  selfVisionSessionId: string | null;
  projectId: string;
  workspaceId: string;
  inspectionState: InspectionState;
  inspectedSurfaces: InspectedSurface[];
  layoutStructures: LayoutStructure[];
  navigationStructures: NavigationStructure[];
  loadingStructures: LoadingStructure[];
  responsiveStructures: ResponsiveStructure[];
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
  inspectionOnly: true;
}

export interface UiInspectionDiagnostics {
  uiInspectionActive: boolean;
  inspectionReportCount: number;
  blockedInspectionCount: number;
  readyInspectionCount: number;
  lastQuery: string | null;
  lastState: InspectionState | null;
}

export interface PreviewContextSnapshot {
  projectId: string;
  workspaceId: string;
  targetType: PreviewTargetType;
  targetName: string;
  previewUrl: string | null;
  previewSessionId: string | null;
}

export interface InspectUiSurfaceInput {
  query?: string;
  selfVisionSession?: SelfVisionSession | null;
  observationTargets?: ObservationTargetItem[];
  previewContext?: PreviewContextSnapshot | null;
  projectId?: string;
  workspaceId?: string;
  targetName?: string;
  targetType?: PreviewTargetType;
  projectExists?: boolean;
  workspaceExists?: boolean;
  world1Protected?: boolean;
  ownershipValid?: boolean;
  selfVisionSessionExists?: boolean;
  observationTargetsExist?: boolean;
  previewContextExists?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface InspectUiSurfaceResult {
  inspectionReport: UiInspectionReport;
  diagnostics: UiInspectionDiagnostics;
  responseText: string;
}

export function isUiInspectionQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return UI_INSPECTION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isUiInspectionAdvisoryQuestion(question: string): boolean {
  return isUiInspectionQuestion(question);
}

export function isDuplicateUiInspectionQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_UI_INSPECTION_DUPLICATES.some((d) => lower.includes(d));
}
