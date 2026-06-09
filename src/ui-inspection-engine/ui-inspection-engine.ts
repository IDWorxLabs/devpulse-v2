/**
 * UI Inspection Engine — Phase 16.4 orchestrator.
 * Pure function — structure inspection only, no interaction or verification.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { prepareSelfVisionRuntime } from '../self-vision-runtime/self-vision-runtime.js';
import { publishUiInspectionFeedStages } from '../operator-feed/ui-inspection-feed-bridge.js';
import { parseUiInspectionQuery } from './ui-inspection-request-parser.js';
import { classifyInspectableSurfaces } from './ui-surface-classifier.js';
import { inspectLayoutStructures } from './ui-layout-inspector.js';
import { inspectNavigationStructures } from './ui-navigation-inspector.js';
import { inspectLoadingStructures } from './ui-loading-state-inspector.js';
import { inspectResponsiveStructures } from './ui-responsive-surface-inspector.js';
import { evaluateUiInspectionGates, validateUiInspection } from './ui-inspection-validator.js';
import { buildUiInspectionReport, composeUiInspectionResponse } from './ui-inspection-report.js';
import {
  getUiInspectionDiagnostics,
  updateUiInspectionDiagnostics,
} from './ui-inspection-diagnostics.js';
import {
  isDuplicateUiInspectionQuestion,
  type InspectUiSurfaceInput,
  type InspectUiSurfaceResult,
  type InspectionState,
  type PreviewContextSnapshot,
  type UiInspectionReport,
} from './types.js';
import type { SelfVisionSession } from '../self-vision-runtime/types.js';
import type { ObservationTargetItem } from '../self-vision-runtime/types.js';
import type { PreviewTargetType } from '../live-preview-runtime/types.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<InspectUiSurfaceInput> = {},
): InspectUiSurfaceInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('ui_inspection_engine');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    targetName: 'DevPulse V2 Web App',
    targetType: 'WEB_APP',
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    world1Protected: true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_ui_inspection_engine',
    ...overrides,
  };
}

function blockedReport(
  query: string,
  reason: string,
  partial: Partial<UiInspectionReport> = {},
): InspectUiSurfaceResult {
  const report = buildUiInspectionReport({
    selfVisionSessionId: null,
    projectId: partial.projectId ?? 'unknown',
    workspaceId: partial.workspaceId ?? 'unknown',
    inspectionState: 'INSPECTION_BLOCKED',
    inspectedSurfaces: [],
    layoutStructures: [],
    navigationStructures: [],
    loadingStructures: [],
    responsiveStructures: [],
    blockedReasons: [reason],
    warnings: [],
    ...partial,
  });
  updateUiInspectionDiagnostics(query, 'INSPECTION_BLOCKED');
  publishUiInspectionFeedStages(query, false);
  return {
    inspectionReport: report,
    diagnostics: getUiInspectionDiagnostics(),
    responseText: composeUiInspectionResponse(query, report),
  };
}

export function inspectUiSurface(input: InspectUiSurfaceInput): InspectUiSurfaceResult {
  const query = input.query ?? 'What UI structures exist?';

  if (isDuplicateUiInspectionQuestion(query)) {
    return blockedReport(
      query,
      'Duplicate engine rejected — use ui_inspection_engine extension only',
      {
        projectId: input.projectId ?? 'unknown',
        workspaceId: input.workspaceId ?? 'unknown',
      },
    );
  }

  parseUiInspectionQuery(query);

  let selfVisionSession: SelfVisionSession | null = input.selfVisionSession ?? null;
  let observationTargets: ObservationTargetItem[] = input.observationTargets ?? [];
  let previewContext: PreviewContextSnapshot | null = input.previewContext ?? null;

  if (!input.suppressRuntimeBootstrap && (!selfVisionSession || observationTargets.length === 0)) {
    const sv = prepareSelfVisionRuntime({
      query,
      projectId: input.projectId ?? 'unknown',
      workspaceId: input.workspaceId ?? 'unknown',
      targetName: input.targetName ?? 'DevPulse V2 Web App',
      targetType: (input.targetType ?? 'WEB_APP') as PreviewTargetType,
      projectExists: input.projectExists ?? true,
      workspaceExists: input.workspaceExists ?? true,
      world1Protected: input.world1Protected ?? true,
      ownershipValid: true,
    });
    selfVisionSession = selfVisionSession ?? sv.selfVisionSession;
    observationTargets =
      observationTargets.length > 0 ? observationTargets : sv.runtimeReport.observationTargets;
    previewContext = previewContext ?? {
      projectId: input.projectId ?? sv.selfVisionSession?.projectId ?? 'unknown',
      workspaceId: input.workspaceId ?? sv.selfVisionSession?.workspaceId ?? 'unknown',
      targetType: input.targetType ?? sv.selfVisionSession?.targetType ?? 'WEB_APP',
      targetName: input.targetName ?? 'DevPulse V2 Web App',
      previewUrl: null,
      previewSessionId: sv.selfVisionSession?.previewSessionId ?? null,
    };
  }

  const selfVisionSessionExists =
    input.selfVisionSessionExists ?? (selfVisionSession !== null && selfVisionSession.observationState !== 'OBSERVATION_BLOCKED');
  const observationTargetsExist =
    input.observationTargetsExist ?? observationTargets.length > 0;
  const previewContextExists =
    input.previewContextExists ?? previewContext !== null;

  const gateReport = evaluateUiInspectionGates(input, {
    selfVisionSessionExists,
    observationTargetsExist,
    previewContextExists,
  });

  const validation = validateUiInspection({
    gateReport,
    session: selfVisionSession,
    observationTargets,
  });

  const inspectedSurfaces = observationTargetsExist
    ? classifyInspectableSurfaces(observationTargets)
    : [];

  const layoutStructures = inspectLayoutStructures(inspectedSurfaces);
  const navigationStructures = inspectNavigationStructures(inspectedSurfaces);
  const loadingStructures = inspectLoadingStructures(inspectedSurfaces);
  const responsiveStructures = inspectResponsiveStructures(inspectedSurfaces);

  const valid = validation.valid && selfVisionSessionExists && observationTargetsExist && previewContextExists;
  const inspectionState: InspectionState = valid ? 'INSPECTION_READY' : 'INSPECTION_BLOCKED';

  const report = buildUiInspectionReport({
    selfVisionSessionId: selfVisionSession?.selfVisionSessionId ?? null,
    projectId: previewContext?.projectId ?? input.projectId ?? 'unknown',
    workspaceId: previewContext?.workspaceId ?? input.workspaceId ?? 'unknown',
    inspectionState,
    inspectedSurfaces,
    layoutStructures,
    navigationStructures,
    loadingStructures,
    responsiveStructures,
    blockedReasons: valid ? [] : validation.blockers,
    warnings: validation.warnings,
  });

  publishUiInspectionFeedStages(query, valid);
  updateUiInspectionDiagnostics(query, inspectionState);

  return {
    inspectionReport: report,
    diagnostics: getUiInspectionDiagnostics(),
    responseText: composeUiInspectionResponse(query, report),
  };
}

export function processUiInspectionRequest(query: string): InspectUiSurfaceResult {
  return inspectUiSurface(resolveInputFromQuery(query));
}

export function getUiInspectionContext(query: string): InspectUiSurfaceResult {
  return processUiInspectionRequest(query);
}
