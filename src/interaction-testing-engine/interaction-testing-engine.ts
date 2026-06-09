/**
 * Interaction Testing Engine — Phase 16.5 orchestrator.
 * Pure function — interaction simulation and outcome recording only.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { inspectUiSurface } from '../ui-inspection-engine/ui-inspection-engine.js';
import { publishInteractionTestingFeedStages } from '../operator-feed/interaction-testing-feed-bridge.js';
import { parseInteractionTestingQuery } from './interaction-testing-request-parser.js';
import { classifyInteractionSurfaces } from './interaction-surface-classifier.js';
import { buildInteractionPlans } from './interaction-plan-builder.js';
import { executeButtonInteractions } from './button-interaction-tester.js';
import { executeNavigationInteractions } from './navigation-interaction-tester.js';
import { executeFormInteractions } from './form-interaction-tester.js';
import { executeWorkflowInteractions } from './workflow-interaction-tester.js';
import { recordInteractionResults } from './interaction-result-recorder.js';
import {
  evaluateInteractionTestingGates,
  validateInteractionTesting,
} from './interaction-testing-validator.js';
import {
  buildInteractionTestingReport,
  composeInteractionTestingResponse,
} from './interaction-testing-report.js';
import {
  getInteractionTestingDiagnostics,
  updateInteractionTestingDiagnostics,
} from './interaction-testing-diagnostics.js';
import {
  isDuplicateInteractionTestingQuestion,
  type ExecuteInteractionTestingInput,
  type ExecuteInteractionTestingResult,
  type InteractionState,
  type InteractionTestingReport,
} from './types.js';
import type { UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { PreviewContextSnapshot } from '../ui-inspection-engine/types.js';
import type { SelfVisionSession } from '../self-vision-runtime/types.js';
import { getSelfVisionSession } from '../self-vision-runtime/self-vision-session-registry.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<ExecuteInteractionTestingInput> = {},
): ExecuteInteractionTestingInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('interaction_testing_engine');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    targetName: 'DevPulse V2 Web App',
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    world1Protected: true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_interaction_testing_engine',
    ...overrides,
  };
}

function blockedReport(
  query: string,
  reason: string,
  partial: Partial<InteractionTestingReport> = {},
): ExecuteInteractionTestingResult {
  const report = buildInteractionTestingReport({
    inspectionId: null,
    selfVisionSessionId: null,
    projectId: partial.projectId ?? 'unknown',
    workspaceId: partial.workspaceId ?? 'unknown',
    interactionState: 'BLOCKED',
    interactionPlans: [],
    executedInteractions: [],
    interactionResults: [],
    blockedReasons: [reason],
    warnings: [],
    ...partial,
  });
  updateInteractionTestingDiagnostics(query, 'BLOCKED');
  publishInteractionTestingFeedStages(query, false);
  return {
    interactionTestingReport: report,
    diagnostics: getInteractionTestingDiagnostics(),
    responseText: composeInteractionTestingResponse(query, report),
  };
}

export function executeInteractionTesting(
  input: ExecuteInteractionTestingInput,
): ExecuteInteractionTestingResult {
  const query = input.query ?? 'What interactions were tested?';

  if (isDuplicateInteractionTestingQuestion(query)) {
    return blockedReport(
      query,
      'Duplicate engine rejected — use interaction_testing_engine extension only',
      {
        projectId: input.projectId ?? 'unknown',
        workspaceId: input.workspaceId ?? 'unknown',
      },
    );
  }

  parseInteractionTestingQuery(query);

  let inspectionReport: UiInspectionReport | null = input.inspectionReport ?? null;
  let selfVisionSession: SelfVisionSession | null = input.selfVisionSession ?? null;
  let previewContext: PreviewContextSnapshot | null = input.previewContext ?? null;

  if (!input.suppressRuntimeBootstrap && !inspectionReport) {
    const inspection = inspectUiSurface({
      query,
      projectId: input.projectId ?? 'unknown',
      workspaceId: input.workspaceId ?? 'unknown',
      targetName: input.targetName ?? 'DevPulse V2 Web App',
      projectExists: input.projectExists ?? true,
      workspaceExists: input.workspaceExists ?? true,
      world1Protected: input.world1Protected ?? true,
      ownershipValid: true,
    });
    inspectionReport = inspection.inspectionReport;
    selfVisionSession =
      selfVisionSession ??
      (inspectionReport.selfVisionSessionId
        ? getSelfVisionSession(inspectionReport.selfVisionSessionId)
        : null);
    previewContext = previewContext ?? {
      projectId: input.projectId ?? inspectionReport.projectId,
      workspaceId: input.workspaceId ?? inspectionReport.workspaceId,
      targetType: selfVisionSession?.targetType ?? 'WEB_APP',
      targetName: input.targetName ?? 'DevPulse V2 Web App',
      previewUrl: null,
      previewSessionId: selfVisionSession?.previewSessionId ?? null,
    };
  }

  const inspectionReportExists =
    input.inspectionReportExists ??
    (inspectionReport !== null && inspectionReport.inspectionState !== 'INSPECTION_BLOCKED');
  const selfVisionSessionExists =
    input.selfVisionSessionExists ??
    (selfVisionSession !== null && selfVisionSession.observationState !== 'OBSERVATION_BLOCKED');
  const previewContextExists = input.previewContextExists ?? previewContext !== null;

  const gateReport = evaluateInteractionTestingGates(input, {
    inspectionReportExists,
    selfVisionSessionExists,
    previewContextExists,
  });

  const validation = validateInteractionTesting({
    gateReport,
    inspectionReport,
    session: selfVisionSession,
  });

  const surfaces = classifyInteractionSurfaces(inspectionReport);
  const interactionPlans = inspectionReportExists ? buildInteractionPlans(surfaces, inspectionReport) : [];

  let executedInteractions: ExecuteInteractionTestingResult['interactionTestingReport']['executedInteractions'] = [];
  let interactionResults: ExecuteInteractionTestingResult['interactionTestingReport']['interactionResults'] = [];

  if (validation.valid && interactionPlans.length > 0) {
    const button = executeButtonInteractions(interactionPlans);
    const navigation = executeNavigationInteractions(interactionPlans);
    const form = executeFormInteractions(interactionPlans);
    const workflow = executeWorkflowInteractions(interactionPlans);

    executedInteractions = [
      ...button.executed,
      ...navigation.executed,
      ...form.executed,
      ...workflow.executed,
    ];
    interactionResults = recordInteractionResults(executedInteractions, [
      ...button.results,
      ...navigation.results,
      ...form.results,
      ...workflow.results,
    ]);
  }

  const valid = validation.valid && inspectionReportExists && selfVisionSessionExists && previewContextExists;
  const interactionState: InteractionState = valid ? 'COMPLETED' : 'BLOCKED';

  const report = buildInteractionTestingReport({
    inspectionId: inspectionReport?.inspectionId ?? null,
    selfVisionSessionId: selfVisionSession?.selfVisionSessionId ?? null,
    projectId: previewContext?.projectId ?? input.projectId ?? 'unknown',
    workspaceId: previewContext?.workspaceId ?? input.workspaceId ?? 'unknown',
    interactionState,
    interactionPlans,
    executedInteractions,
    interactionResults,
    blockedReasons: valid ? [] : validation.blockers,
    warnings: validation.warnings,
  });

  publishInteractionTestingFeedStages(query, valid);
  updateInteractionTestingDiagnostics(query, interactionState);

  return {
    interactionTestingReport: report,
    diagnostics: getInteractionTestingDiagnostics(),
    responseText: composeInteractionTestingResponse(query, report),
  };
}

export function processInteractionTestingRequest(query: string): ExecuteInteractionTestingResult {
  return executeInteractionTesting(resolveInputFromQuery(query));
}

export function getInteractionTestingContext(query: string): ExecuteInteractionTestingResult {
  return processInteractionTestingRequest(query);
}
