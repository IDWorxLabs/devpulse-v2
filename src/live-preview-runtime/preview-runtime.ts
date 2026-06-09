/**
 * Live Preview Runtime — Phase 16.1 orchestrator.
 * Pure function — preview management only, no side effects.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { publishLivePreviewRuntimeFeedStages } from '../operator-feed/live-preview-runtime-feed-bridge.js';
import { parsePreviewQuery } from './preview-request-parser.js';
import { getPreviewTarget, registerPreviewTarget } from './preview-target-registry.js';
import { createPreviewSession } from './preview-session-manager.js';
import { evaluatePreviewGates, validatePreviewRuntime } from './preview-runtime-validator.js';
import {
  composePreviewResponse,
  nextPreviewReportId,
} from './preview-runtime-report.js';
import { getPreviewRuntimeDiagnostics, updatePreviewRuntimeDiagnostics } from './preview-runtime-diagnostics.js';
import {
  isDuplicatePreviewExecutorQuestion,
  type PrepareLivePreviewRuntimeInput,
  type PrepareLivePreviewRuntimeResult,
  type PreviewRuntimeReport,
  type PreviewSession,
  type PreviewState,
} from './types.js';

function resolveState(valid: boolean): PreviewState {
  if (!valid) return 'PREVIEW_BLOCKED';
  return 'PREVIEW_READY';
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareLivePreviewRuntimeInput> = {},
): PrepareLivePreviewRuntimeInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('live_preview_runtime');

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
    ownershipValid: owner.ownerModule === 'devpulse_v2_live_preview_runtime',
    ...overrides,
  };
}

export function prepareLivePreviewRuntime(
  input: PrepareLivePreviewRuntimeInput,
): PrepareLivePreviewRuntimeResult {
  const query = input.query ?? 'Show preview session';

  if (isDuplicatePreviewExecutorQuestion(query)) {
    const blockedReport: PreviewRuntimeReport = {
      reportId: nextPreviewReportId(),
      state: 'PREVIEW_BLOCKED',
      valid: false,
      summary: 'Duplicate preview executor rejected',
      session: null,
      gatesEvaluated: 0,
      gatesPassed: 0,
      managementOnly: true,
    };
    return {
      previewSession: null,
      runtimeReport: blockedReport,
      diagnostics: getPreviewRuntimeDiagnostics(),
      responseText: 'Recommendation: No.\nDo not create preview_executor or live_preview_executor duplicates.',
    };
  }

  parsePreviewQuery(query);

  const registration = registerPreviewTarget({
    targetName: input.targetName,
    targetType: input.targetType,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    previewUrl: input.previewUrl,
    allowDuplicate: false,
  });

  const duplicateTarget = registration.duplicate || input.forceDuplicateTarget === true;
  const target =
    registration.target ??
    getPreviewTarget(input.projectId, input.workspaceId, input.targetName);

  const gateReport = evaluatePreviewGates(input, {
    targetRegistered: target !== null,
    duplicateTarget,
    duplicateSession: false,
  });

  const validation = validatePreviewRuntime({ gateReport });

  let session: PreviewSession | null = null;
  let duplicateSession = false;

  if (duplicateTarget) {
    validation.blockers.push('Duplicate preview target — target already registered for project/workspace');
  }

  if (validation.valid && !duplicateTarget && target) {
    const result = createPreviewSession({
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      targetName: input.targetName,
      targetType: input.targetType,
      previewUrl: input.previewUrl,
      previewState: 'PREVIEW_READY',
      warnings: validation.warnings,
      allowDuplicate: false,
    });
    session = result.session;
    duplicateSession = result.duplicate || input.forceDuplicateSession === true;
  }

  if (duplicateSession) {
    validation.blockers.push('Duplicate preview session — active session already exists for target');
  }

  const valid = validation.valid && !duplicateTarget && !duplicateSession && session !== null;
  const state = resolveState(valid);

  if (session && !valid) {
    session = {
      ...session,
      previewState: 'PREVIEW_BLOCKED',
      blockedReasons: validation.blockers,
    };
  } else if (session && valid) {
    session = {
      ...session,
      previewState: state,
      warnings: validation.warnings,
    };
  }

  publishLivePreviewRuntimeFeedStages(query, valid);

  const report: PreviewRuntimeReport = {
    reportId: nextPreviewReportId(),
    state,
    valid,
    summary: valid
      ? `Preview runtime ready — session ${session?.previewSessionId ?? 'none'}`
      : `Preview blocked — ${validation.blockers.length} blockers`,
    session,
    gatesEvaluated: gateReport.gates.length,
    gatesPassed: gateReport.gates.filter((g) => g.satisfied).length,
    managementOnly: true,
  };

  updatePreviewRuntimeDiagnostics(query, state, session !== null, target !== null);

  return {
    previewSession: session,
    runtimeReport: report,
    diagnostics: getPreviewRuntimeDiagnostics(),
    responseText: composePreviewResponse(query, report, session),
  };
}

export function processLivePreviewRequest(query: string): PrepareLivePreviewRuntimeResult {
  return prepareLivePreviewRuntime(resolveInputFromQuery(query));
}

export function getLivePreviewContext(query: string): PrepareLivePreviewRuntimeResult {
  return processLivePreviewRequest(query);
}
