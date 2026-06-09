/**
 * Preview Intelligence — Phase 16.2 orchestrator.
 * Pure function — intelligence around preview state only, no side effects beyond feed visibility.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { prepareLivePreviewRuntime } from '../live-preview-runtime/preview-runtime.js';
import { getPreviewTarget } from '../live-preview-runtime/preview-target-registry.js';
import { publishPreviewIntelligenceFeedStages } from '../operator-feed/preview-intelligence-feed-bridge.js';
import type { PreviewTargetType } from '../live-preview-runtime/types.js';
import { parsePreviewIntelligenceQuery } from './preview-intelligence-request-parser.js';
import { analyzePreviewContext } from './preview-context-analyzer.js';
import { evaluatePreviewReadiness } from './preview-readiness-engine.js';
import { analyzePreviewCapabilities } from './preview-capability-analyzer.js';
import { analyzePreviewLimitations } from './preview-limitation-analyzer.js';
import { planPreviewObservations } from './preview-observation-planner.js';
import {
  buildPreviewIntelligenceReport,
  composePreviewIntelligenceResponse,
} from './preview-intelligence-report.js';
import {
  getPreviewIntelligenceDiagnostics,
  updatePreviewIntelligenceDiagnostics,
} from './preview-intelligence-diagnostics.js';
import {
  isDuplicatePreviewIntelligenceQuestion,
  type AnalyzePreviewIntelligenceInput,
  type AnalyzePreviewIntelligenceResult,
  type PreviewIntelligenceReport,
} from './types.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<AnalyzePreviewIntelligenceInput> = {},
): AnalyzePreviewIntelligenceInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('preview_intelligence');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    targetName: 'DevPulse V2 Web App',
    targetType: 'WEB_APP',
    previewUrl: null,
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    workspaceReady: project.workspaceId !== 'none',
    ownershipValid: owner.ownerModule === 'devpulse_v2_preview_intelligence',
    ...overrides,
  };
}

function blockedReport(
  query: string,
  reason: string,
  partial: Partial<PreviewIntelligenceReport> = {},
): AnalyzePreviewIntelligenceResult {
  const report = buildPreviewIntelligenceReport({
    previewSessionId: null,
    projectId: partial.projectId ?? 'unknown',
    workspaceId: partial.workspaceId ?? 'unknown',
    targetType: partial.targetType ?? 'UNKNOWN_TARGET',
    readinessLevel: 'BLOCKED',
    readinessScore: 0,
    capabilitySummary: [],
    limitations: [],
    observationPlan: [],
    blockedReasons: [reason],
    warnings: [],
    ...partial,
  });
  updatePreviewIntelligenceDiagnostics(query, 'BLOCKED');
  publishPreviewIntelligenceFeedStages(query, false);
  return {
    previewIntelligenceReport: report,
    diagnostics: getPreviewIntelligenceDiagnostics(),
    responseText: composePreviewIntelligenceResponse(query, report),
  };
}

export function analyzePreviewIntelligence(
  input: AnalyzePreviewIntelligenceInput,
): AnalyzePreviewIntelligenceResult {
  const query = input.query ?? 'Is this preview ready?';

  if (isDuplicatePreviewIntelligenceQuestion(query)) {
    return blockedReport(
      query,
      'Duplicate preview executor rejected — use preview_intelligence extension only',
      {
        projectId: input.projectId ?? 'unknown',
        workspaceId: input.workspaceId ?? 'unknown',
        targetType: input.targetType ?? 'UNKNOWN_TARGET',
      },
    );
  }

  parsePreviewIntelligenceQuery(query);

  let session = input.previewSession ?? null;
  let target = input.previewTarget ?? null;

  if ((!session || !target) && !input.suppressRuntimeBootstrap) {
    const runtime = prepareLivePreviewRuntime({
      query,
      projectId: input.projectId ?? 'unknown',
      workspaceId: input.workspaceId ?? 'unknown',
      targetName: input.targetName ?? 'DevPulse V2 Web App',
      targetType: (input.targetType ?? 'WEB_APP') as PreviewTargetType,
      previewUrl: input.previewUrl,
      projectExists: input.projectExists ?? true,
      workspaceExists: input.workspaceExists ?? true,
      world1Protected: true,
      ownershipValid: input.ownershipValid ?? true,
    });
    session = session ?? runtime.previewSession;
    target =
      target ??
      getPreviewTarget(
        input.projectId ?? session?.projectId ?? 'unknown',
        input.workspaceId ?? session?.workspaceId ?? 'unknown',
        input.targetName ?? session?.previewTargetName ?? 'DevPulse V2 Web App',
      );
  }

  const context = analyzePreviewContext({
    session,
    target,
    projectExists: input.projectExists ?? true,
    workspaceExists: input.workspaceExists ?? true,
    workspaceReady: input.workspaceReady ?? true,
    ownershipValid: input.ownershipValid ?? true,
    targetType: input.targetType,
    targetName: input.targetName,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    previewUrl: input.previewUrl,
  });

  const limitations = analyzePreviewLimitations(context);
  const readiness = evaluatePreviewReadiness(context, limitations);
  const capabilitySummary = analyzePreviewCapabilities(context, session, limitations);
  const observationPlan = planPreviewObservations(context, readiness.readinessLevel);

  const report = buildPreviewIntelligenceReport({
    previewSessionId: session?.previewSessionId ?? null,
    projectId: context.projectId,
    workspaceId: context.workspaceId,
    targetType: context.targetType,
    readinessLevel: readiness.readinessLevel,
    readinessScore: readiness.readinessScore,
    capabilitySummary,
    limitations,
    observationPlan,
    blockedReasons: readiness.blockedReasons,
    warnings: readiness.warnings,
  });

  const ready = readiness.readinessLevel !== 'BLOCKED';
  publishPreviewIntelligenceFeedStages(query, ready);
  updatePreviewIntelligenceDiagnostics(query, readiness.readinessLevel);

  return {
    previewIntelligenceReport: report,
    diagnostics: getPreviewIntelligenceDiagnostics(),
    responseText: composePreviewIntelligenceResponse(query, report),
  };
}

export function processPreviewIntelligenceRequest(query: string): AnalyzePreviewIntelligenceResult {
  return analyzePreviewIntelligence(resolveInputFromQuery(query));
}

export function getPreviewIntelligenceContext(query: string): AnalyzePreviewIntelligenceResult {
  return processPreviewIntelligenceRequest(query);
}
