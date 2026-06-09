/**
 * Self Vision Runtime — Phase 16.3 orchestrator.
 * Pure function — visual observation session runtime only, no capture or analysis.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { prepareLivePreviewRuntime } from '../live-preview-runtime/preview-runtime.js';
import { getPreviewTarget } from '../live-preview-runtime/preview-target-registry.js';
import { publishSelfVisionRuntimeFeedStages } from '../operator-feed/self-vision-runtime-feed-bridge.js';
import { parseSelfVisionQuery } from './self-vision-request-parser.js';
import { createSelfVisionSession } from './self-vision-session-registry.js';
import { planCaptureSequence } from './self-vision-capture-planner.js';
import { planObservationTargets } from './self-vision-observation-model.js';
import { evaluateSelfVisionGates, validateSelfVisionRuntime } from './self-vision-runtime-validator.js';
import {
  composeSelfVisionResponse,
  nextSelfVisionReportId,
} from './self-vision-runtime-report.js';
import {
  getSelfVisionRuntimeDiagnostics,
  updateSelfVisionRuntimeDiagnostics,
} from './self-vision-runtime-diagnostics.js';
import {
  isDuplicateSelfVisionRuntimeQuestion,
  type ObservationState,
  type PrepareSelfVisionRuntimeInput,
  type PrepareSelfVisionRuntimeResult,
  type SelfVisionRuntimeReport,
  type SelfVisionSession,
} from './types.js';

function resolveState(valid: boolean): ObservationState {
  if (!valid) return 'OBSERVATION_BLOCKED';
  return 'READY_FOR_OBSERVATION';
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareSelfVisionRuntimeInput> = {},
): PrepareSelfVisionRuntimeInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('self_vision_runtime');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    targetName: 'DevPulse V2 Web App',
    targetType: 'WEB_APP',
    previewUrl: null,
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    world1Protected: true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_self_vision_runtime',
    ...overrides,
  };
}

export function prepareSelfVisionRuntime(
  input: PrepareSelfVisionRuntimeInput,
): PrepareSelfVisionRuntimeResult {
  const query = input.query ?? 'Show Self Vision session';

  if (isDuplicateSelfVisionRuntimeQuestion(query)) {
    const blockedReport: SelfVisionRuntimeReport = {
      reportId: nextSelfVisionReportId(),
      state: 'OBSERVATION_BLOCKED',
      valid: false,
      summary: 'Duplicate self vision engine rejected',
      session: null,
      observationTargets: [],
      gatesEvaluated: 0,
      gatesPassed: 0,
      runtimeOnly: true,
    };
    return {
      selfVisionSession: null,
      runtimeReport: blockedReport,
      diagnostics: getSelfVisionRuntimeDiagnostics(),
      responseText: 'Recommendation: No.\nDo not create ui_inspection_engine or autonomous_ui_tester duplicates.',
    };
  }

  parseSelfVisionQuery(query);

  let previewSession = null as import('../live-preview-runtime/types.js').PreviewSession | null;
  let previewTarget = getPreviewTarget(input.projectId, input.workspaceId, input.targetName);

  if (!input.suppressPreviewBootstrap) {
    const preview = prepareLivePreviewRuntime({
      query,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      targetName: input.targetName,
      targetType: input.targetType,
      previewUrl: input.previewUrl,
      projectExists: input.projectExists,
      workspaceExists: input.workspaceExists,
      world1Protected: input.world1Protected,
      ownershipValid: true,
    });
    previewSession = preview.previewSession;
    previewTarget =
      previewTarget ??
      getPreviewTarget(input.projectId, input.workspaceId, input.targetName);
  }

  const previewSessionExists =
    input.previewSessionExists ?? (previewSession !== null && previewSession.previewState !== 'PREVIEW_BLOCKED');
  const previewTargetExists =
    input.previewTargetExists ?? previewTarget !== null;

  const capturePlan = planCaptureSequence(input.targetType);
  const observationTargets = planObservationTargets(input.targetType);

  const gateReport = evaluateSelfVisionGates(input, {
    previewSessionExists,
    previewTargetExists,
    duplicateSession: false,
  });

  const validation = validateSelfVisionRuntime({ gateReport });

  let session: SelfVisionSession | null = null;
  let duplicateSession = false;

  if (!previewSessionExists) {
    validation.blockers.push('Missing preview session — preview runtime must prepare session first');
  }
  if (!previewTargetExists) {
    validation.blockers.push('Missing preview target — target must be registered');
  }

  if (validation.valid && previewSessionExists && previewTargetExists && previewSession) {
    const result = createSelfVisionSession({
      previewSessionId: previewSession.previewSessionId,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      targetType: input.targetType,
      capturePlan,
      observationState: 'PLANNED',
      warnings: validation.warnings,
      allowDuplicate: false,
    });
    session = result.session;
    duplicateSession = result.duplicate || input.forceDuplicateSession === true;
  }

  if (duplicateSession) {
    validation.blockers.push('Duplicate self vision session — active session already exists for preview session');
  }

  const valid = validation.valid && previewSessionExists && previewTargetExists && !duplicateSession && session !== null;
  const state = resolveState(valid);

  if (session && !valid) {
    session = {
      ...session,
      observationState: 'OBSERVATION_BLOCKED',
      blockedReasons: validation.blockers,
    };
  } else if (session && valid) {
    session = {
      ...session,
      observationState: state,
      warnings: validation.warnings,
    };
  }

  publishSelfVisionRuntimeFeedStages(query, valid);

  const report: SelfVisionRuntimeReport = {
    reportId: nextSelfVisionReportId(),
    state,
    valid,
    summary: valid
      ? `Self vision runtime ready — session ${session?.selfVisionSessionId ?? 'none'}`
      : `Self vision blocked — ${validation.blockers.length} blockers`,
    session,
    observationTargets,
    gatesEvaluated: gateReport.gates.length,
    gatesPassed: gateReport.gates.filter((g) => g.satisfied).length,
    runtimeOnly: true,
  };

  updateSelfVisionRuntimeDiagnostics(query, state, session !== null);

  return {
    selfVisionSession: session,
    runtimeReport: report,
    diagnostics: getSelfVisionRuntimeDiagnostics(),
    responseText: composeSelfVisionResponse(query, report, session),
  };
}

export function processSelfVisionRuntimeRequest(query: string): PrepareSelfVisionRuntimeResult {
  return prepareSelfVisionRuntime(resolveInputFromQuery(query));
}

export function getSelfVisionRuntimeContext(query: string): PrepareSelfVisionRuntimeResult {
  return processSelfVisionRuntimeRequest(query);
}
