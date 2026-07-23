/**
 * Chat-to-Build Execution Bridge V1 — autonomous engineering launch authority.
 */

import { classifyBuildIntentRequest } from '../build-intent-routing/build-intent-route-parity-v1.js';
import {
  alignmentBlocksBuildExecution,
  assessProjectContextAlignment,
  composeProjectContextAlignmentBrainApiPayload,
} from '../project-context-alignment-v1/index.js';
import {
  PROJECT_NAME_CONFLICT_RESOLUTION_TRACE,
  ProjectNameConflictRejectedError,
} from '../project-name-conflict-resolution-v1/index.js';
import {
  buildProjectResumePlan,
  composeDuplicateResumeResponse,
  routeDuplicateProjectResume,
} from '../project-resume-state/index.js';
import {
  bootstrapProjectAndSessionForBuild,
  deriveProjectNameFromPrompt,
  enrichBrainPayloadWithProjectSession,
  finalizeProjectSessionAfterBuild,
} from '../project-session-continuity-v1/index.js';
import {
  composeOnePromptBuildBrainApiPayload,
  composeOnePromptBuildFailurePayload,
} from '../one-prompt-live-preview/one-prompt-build-chat-response.js';
import {
  runOnePromptLivePreviewBuild,
  type OnePromptLivePreviewBuildResult,
} from '../one-prompt-live-preview/index.js';
import { createHash } from 'node:crypto';
import { applyBuildResultConversationalIntelligence } from '../build-result-conversational-intelligence/index.js';
import { buildContextScope, classifyNewBuildDecision } from '../project-context-isolation-v4/index.js';
import type { BuildDecisionResult, BuildIntentOverride } from '../project-context-isolation-v4/index.js';
import { buildBridgeEngineeringReport } from './bridge-authority-report.js';
import { bridgeEventsToExecutionTrace, bridgeEventsToOperatorFeed } from './bridge-events.js';
import { createChatToBuildStateMachine } from './execution-state-machine.js';
import type {
  ChatToBuildBridgeInput,
  ChatToBuildBridgeResult,
  ChatToBuildEngineeringState,
  ChatToBuildProgressItem,
} from './bridge-types.js';
import {
  CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
  CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
} from './bridge-types.js';
import {
  COMMAND_CENTER_CHAT_AUDIT_EVENTS,
  recordChatExecutionAuditEvent,
} from '../command-center-chat-execution-audit-v1/index.js';
import {
  HTTP_ROUTING_FORENSIC_EVENTS,
  recordHttpForensicStage,
} from '../command-center-http-routing-forensic-audit-v1/index.js';
import { getRegistryProject } from '../project-registry-v1/project-registry-v1-store.js';

function auditBridgeEvent(input: {
  auditId?: string | null;
  name: string;
  detail: string;
  metadata?: Record<string, string | number | boolean | null | string[]>;
}): void {
  if (!input.auditId) return;
  recordChatExecutionAuditEvent({
    auditId: input.auditId,
    layer: 'bridge',
    name: input.name,
    detail: input.detail,
    metadata: input.metadata,
  });
}

const PROGRESS_STAGE_ORDER: ChatToBuildEngineeringState[] = [
  'INTENT_ANALYSIS',
  'PROJECT_ALIGNMENT',
  'PROJECT_IDENTITY',
  'PLANNING',
  'ARCHITECTURE',
  'FEATURE_GENERATION',
  'CODE_GENERATION',
  'WORKSPACE_BUILD',
  'RUNTIME_START',
  'LIVE_PREVIEW',
  'VALIDATION',
  'FOUNDER_EVIDENCE',
  'COMPLETE',
];

function createBridgeRunId(): string {
  return `chat-to-build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function progressItemsWithStages(
  items: ChatToBuildProgressItem[],
): Array<ChatToBuildProgressItem & { stage: ChatToBuildEngineeringState; detail: string }> {
  return items.map((item, index) => ({
    ...item,
    stage: PROGRESS_STAGE_ORDER[index] ?? 'COMPLETE',
    detail: item.detail ?? item.label,
  }));
}

function attachBridgeMetadata(
  payload: Record<string, unknown>,
  bridge: ChatToBuildBridgeResult,
  bridgeRunId: string,
): Record<string, unknown> {
  const bridgeTrace = bridgeEventsToExecutionTrace(bridge.bridgeEvents);
  const bridgeOperator = bridgeEventsToOperatorFeed(bridge.bridgeEvents);
  const existingTrace = Array.isArray(payload.executionTraceEvents) ? payload.executionTraceEvents : [];
  const existingOperator = Array.isArray(payload.operatorFeedEvents) ? payload.operatorFeedEvents : [];
  const bridgeProgress = progressItemsWithStages(bridge.progressItems);

  return {
    ...payload,
    engineeringReport: bridge.engineeringReport ?? payload.engineeringReport ?? null,
    chatToBuildExecutionBridge: {
      readOnly: true,
      contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
      trace: CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE,
      bridgeRunId,
      kind: bridge.kind,
      bridgeProgress,
      progressItems: bridge.progressItems,
      bridgeTraceEvents: bridgeTrace,
      projectIdentity: bridge.projectIdentity ?? null,
      engineeringReport: bridge.engineeringReport ?? null,
      conflictResolutionTrace: bridge.conflictResolutionTrace ?? null,
    },
    executionTraceEvents: [...bridgeTrace, ...existingTrace],
    operatorFeedEvents: [...bridgeOperator, ...existingOperator],
  };
}

function shouldAutoContinueDuplicate(input: ChatToBuildBridgeInput, decision: BuildDecisionResult): boolean {
  // Duplicate detection may still suggest a possible existing project, but it must never
  // auto-resume it unless the New Build Decision Authority explicitly classified this request as
  // a continuation (see src/project-context-isolation-v4/, requirement 7).
  return input.rejectDuplicates !== true && decision.decision === 'CONTINUE_EXISTING_PROJECT';
}

function hashPromptForBridge(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

/**
 * Resolves the New Build Decision Authority's classification for this request. An explicit
 * confirmFreshCopy/confirmProjectResume from the caller (already an explicit user choice made in
 * response to a prior AMBIGUOUS_REQUIRES_CONFIRMATION or RESUME_REQUIRED prompt) is honored as-is
 * rather than re-classified. buildIntentOverride (NEW_BUILD_CONFIRMATION_REQUIRED UX V4) is passed
 * straight into the decision authority itself, which is the single place override
 * acceptance/rejection rules live (requirement 5) — it never bypasses the classification below.
 */
function resolveBridgeBuildDecision(
  input: ChatToBuildBridgeInput,
  buildPrompt: string,
  currentProjectIdentitySummary: string | null,
  hasKnownExistingProject: boolean,
): BuildDecisionResult {
  if (input.confirmFreshCopy === true) {
    return {
      readOnly: true,
      decision: 'NEW_BUILD',
      confidence: 1,
      reasons: ['Caller explicitly confirmed starting a fresh copy (confirmFreshCopy).'],
      continuationSignals: [],
      newBuildSignals: [],
      message: null,
      overrideApplied: null,
      overrideRejected: null,
    };
  }
  if (input.confirmProjectResume === true) {
    return {
      readOnly: true,
      decision: 'CONTINUE_EXISTING_PROJECT',
      confidence: 1,
      reasons: ['Caller explicitly confirmed resuming the existing project (confirmProjectResume).'],
      continuationSignals: [],
      newBuildSignals: [],
      message: null,
      overrideApplied: null,
      overrideRejected: null,
    };
  }
  return classifyNewBuildDecision({
    rawPrompt: buildPrompt,
    requestedProjectId: input.activeProjectId ?? null,
    requestedProjectName: input.projectName ?? null,
    hasKnownExistingProject,
    currentProjectIdentitySummary,
    buildIntentOverride: input.buildIntentOverride ?? null,
  });
}

function summarizePromptForConfirmation(prompt: string): string {
  const trimmed = prompt.trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
}

/**
 * Builds the deterministic, structured NEW_BUILD_CONFIRMATION_REQUIRED payload (requirement 1).
 * Reuses the real Context Scope Authority (rather than hand-rolling a second copy of its
 * allow/block rules) so the sources listed here always match what generation would actually
 * block/allow if the same decision reached the orchestrator.
 */
function buildNewBuildConfirmationPayload(input: {
  bridgeRunId: string;
  buildPrompt: string;
  activeProjectId: string | null;
  activeProjectName: string | null;
  decision: BuildDecisionResult;
}): Record<string, unknown> {
  const previewScope = buildContextScope({
    requestId: input.bridgeRunId,
    buildId: input.bridgeRunId,
    projectId: input.activeProjectId ?? 'pending',
    decision: 'AMBIGUOUS_REQUIRES_CONFIRMATION',
    currentPromptHash: hashPromptForBridge(input.buildPrompt),
    activeProjectIdCandidate: input.activeProjectId,
  });
  const message =
    input.decision.message ??
    'AiDevEngine needs to know whether this prompt should start a new app or continue the existing project.';
  const reason = input.decision.overrideRejected?.reason ?? input.decision.reasons.join(' ') ?? message;
  return {
    outcome: 'NEW_BUILD_CONFIRMATION_REQUIRED',
    message,
    currentPromptSummary: summarizePromptForConfirmation(input.buildPrompt),
    activeProjectId: input.activeProjectId,
    activeProjectSummary: input.activeProjectName ?? input.activeProjectId ?? null,
    choices: [
      {
        id: 'START_NEW_BUILD',
        label: 'Start a brand-new app',
        description: 'Use only the current prompt and block previous project context.',
      },
      {
        id: 'CONTINUE_EXISTING_PROJECT',
        label: 'Continue existing project',
        description: 'Use the existing project context because this prompt is an update or continuation.',
      },
    ],
    contextIsolation: {
      decision: input.decision.decision,
      blockedContextSources: previewScope.blockedContextSources.map((s) => s.source),
      allowedContextSources: previewScope.allowedContextSources.map((s) => s.source),
      reason,
    },
  };
}

export async function executeChatToBuildBridge(
  input: ChatToBuildBridgeInput,
): Promise<ChatToBuildBridgeResult> {
  const bridgeRunId = createBridgeRunId();
  const machine = createChatToBuildStateMachine();

  auditBridgeEvent({
    auditId: input.chatExecutionAuditId,
    name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ENTER,
    detail: 'Chat-to-build bridge received Command Center message.',
    metadata: { source: input.source },
  });
  recordHttpForensicStage(
    input.httpRequestId,
    HTTP_ROUTING_FORENSIC_EVENTS.BRIDGE_ENTER,
    'executeChatToBuildBridge entered',
    'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
    'executeChatToBuildBridge',
    { source: input.source },
  );

  machine.transition('CHAT_RECEIVED', {
    title: 'Chat received',
    detail: 'Command Center message accepted for routing.',
    status: 'Completed',
  });

  machine.transition('INTENT_ANALYSIS', {
    title: 'Intent understood',
    detail: 'Analyzing message for autonomous build intent.',
  });
  const baseClassification = classifyBuildIntentRequest(input.message);
  const buildIntentDetected = baseClassification.isBuildIntent || input.forceBuildIntent === true;
  const classification =
    buildIntentDetected && !baseClassification.isBuildIntent
      ? {
          ...baseClassification,
          isBuildIntent: true,
          route: 'BUILD_ORCHESTRATION' as const,
          requestCategory: 'BUILD' as const,
          buildIntentDetected: true,
          confidence: 'HIGH' as const,
          matchedBuildSignals: [
            ...baseClassification.matchedBuildSignals,
            'recovery:force-build-orchestration',
          ],
          routingReason: 'Build intent recovery forced BUILD_ORCHESTRATION route',
        }
      : baseClassification;
  machine.completeLast();

  auditBridgeEvent({
    auditId: input.chatExecutionAuditId,
    name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_INTENT_DETECTED,
    detail: `isBuildIntent=${buildIntentDetected} route=${buildIntentDetected ? 'BUILD_ORCHESTRATION' : classification.route}`,
    metadata: {
      isBuildIntent: buildIntentDetected,
      route: buildIntentDetected ? 'BUILD_ORCHESTRATION' : classification.route,
      requestCategory: classification.requestCategory,
      confidence: classification.confidence,
      matchedBuildSignals: classification.matchedBuildSignals,
      routingReason: classification.routingReason,
    },
  });

  if (!buildIntentDetected) {
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ROUTE_SELECTED,
      detail: 'Route=CHAT_ONLY — bridge skipping autonomous engineering.',
    });
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ASE_SKIP,
      detail: 'ASE not invoked — message classified as non-build chat.',
    });
    return {
      readOnly: true,
      kind: 'CHAT_ONLY',
      classification,
      bridgeEvents: machine.getEvents(),
      progressItems: machine.buildProgressItems('INTENT_ANALYSIS'),
    };
  }

  machine.transition('PROJECT_ALIGNMENT', {
    title: 'Project context alignment',
    detail: 'Checking active project context against build prompt.',
  });

  let buildPrompt = input.message.trim();
  const selectedProject = input.activeProjectId
    ? getRegistryProject(input.activeProjectId, input.rootDir)
    : null;
  const currentProjectIdentitySummary = selectedProject
    ? [selectedProject.name, selectedProject.summary].filter(Boolean).join(' — ')
    : input.projectName?.trim() || null;

  // New Build Decision Authority — classifies this request as NEW_BUILD,
  // CONTINUE_EXISTING_PROJECT, or AMBIGUOUS_REQUIRES_CONFIRMATION from current-request evidence
  // only, before any duplicate/resume/activeProjectId logic can influence the outcome. See
  // src/project-context-isolation-v4/.
  const buildDecision = resolveBridgeBuildDecision(
    input,
    buildPrompt,
    currentProjectIdentitySummary,
    Boolean(selectedProject),
  );

  if (buildDecision.decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION') {
    machine.transition('PROJECT_IDENTITY', {
      title: 'New build or continuation?',
      detail: buildDecision.message ?? 'Confirmation required before generation can proceed.',
      status: 'Warning',
    });
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ROUTE_SELECTED,
      detail: 'Route=NEW_BUILD_CONFIRMATION_REQUIRED — ambiguous new-build-vs-continue intent.',
    });
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ASE_SKIP,
      detail: 'ASE not invoked — stopped before generation to avoid building on stale/ambiguous context.',
    });
    const confirmationPayload = buildNewBuildConfirmationPayload({
      bridgeRunId,
      buildPrompt,
      activeProjectId: input.activeProjectId ?? null,
      activeProjectName: input.projectName ?? null,
      decision: buildDecision,
    });
    const previewContextIsolation = confirmationPayload.contextIsolation as {
      blockedContextSources: string[];
      allowedContextSources: string[];
    };
    return {
      readOnly: true,
      kind: 'NEW_BUILD_CONFIRMATION_REQUIRED',
      classification,
      bridgeEvents: machine.getEvents(),
      progressItems: machine.buildProgressItems('PROJECT_IDENTITY'),
      contextIsolation: {
        readOnly: true,
        decision: buildDecision.decision,
        reasons: buildDecision.reasons,
        message: buildDecision.message,
        blockedContextSources: previewContextIsolation.blockedContextSources,
        allowedContextSources: previewContextIsolation.allowedContextSources,
        overrideApplied: buildDecision.overrideApplied ?? null,
        overrideRejected: buildDecision.overrideRejected ?? null,
      },
      newBuildConfirmationPayload: confirmationPayload,
    };
  }

  const resumeRoute = routeDuplicateProjectResume({
    rawPrompt: buildPrompt,
    projectId: input.activeProjectId ?? undefined,
    projectName: input.projectName ?? undefined,
    rootDir: input.rootDir,
    confirmResume: input.confirmProjectResume === true,
    confirmFreshCopy: input.confirmFreshCopy === true,
  });

  if (
    resumeRoute.shouldBlock &&
    input.rejectDuplicates === true &&
    !input.confirmProjectResume &&
    !input.confirmFreshCopy
  ) {
    machine.transition('FAILED', {
      title: 'Duplicate rejected',
      detail: resumeRoute.reason ?? 'Duplicate project rejected by explicit instruction.',
      status: 'Failed',
    });
    throw new ProjectNameConflictRejectedError({
      readOnly: true,
      requestedName: input.projectName ?? buildPrompt.slice(0, 40),
      resolvedProjectName: resumeRoute.resumingProjectName ?? input.projectName ?? '',
      projectId: resumeRoute.resumingProjectId ?? '',
      workspacePath: null,
      resolutionMode: 'EXPLICIT_REJECTION',
      conflictFound: true,
      continuationAllowed: false,
      reason: resumeRoute.reason ?? 'Duplicate rejected.',
      createdProject: false,
    });
  }

  let effectiveProjectId: string | null = null;
  if (buildDecision.decision === 'NEW_BUILD') {
    // NEW_BUILD never uses activeProjectId, never resumes previous project state, and never
    // reuses a duplicate-detection match — a fresh project scope is created unconditionally.
    // (Covers both heuristic NEW_BUILD and an honored buildIntentOverride=START_NEW_BUILD.)
    effectiveProjectId = null;
  } else if (buildDecision.overrideApplied === 'CONTINUE_EXISTING_PROJECT' && input.activeProjectId) {
    // Explicit buildIntentOverride=CONTINUE_EXISTING_PROJECT was already validated by the decision
    // authority (existing project present + product-identity compatible) — use it directly rather
    // than depending on duplicate-name detection to rediscover the same project.
    effectiveProjectId = input.activeProjectId;
  } else if (input.confirmProjectResume && resumeRoute.resumingProjectId) {
    effectiveProjectId = resumeRoute.resumingProjectId;
  } else if (shouldAutoContinueDuplicate(input, buildDecision) && resumeRoute.shouldBlock && resumeRoute.resumingProjectId) {
    effectiveProjectId = resumeRoute.resumingProjectId;
  } else if (resumeRoute.shouldBlock && resumeRoute.resumingProjectId) {
    effectiveProjectId = resumeRoute.resumingProjectId;
  } else if (buildPrompt) {
    effectiveProjectId = resumeRoute.resumingExistingProject ? resumeRoute.resumingProjectId : null;
  } else {
    effectiveProjectId = input.activeProjectId ?? null;
  }

  if (!buildPrompt && resumeRoute.effectivePrompt) {
    buildPrompt = resumeRoute.effectivePrompt.trim();
  }
  if (!buildPrompt && effectiveProjectId) {
    const resumePlan = buildProjectResumePlan({
      projectId: effectiveProjectId,
      rootDir: input.rootDir,
      primaryAction: input.resumeAction,
    });
    if (resumePlan?.effectivePrompt) {
      buildPrompt = resumePlan.effectivePrompt;
    }
  }

  if (!buildPrompt) {
    machine.transition('FAILED', {
      title: 'Prompt unavailable',
      detail: 'Original build prompt unavailable for continuation.',
      status: 'Failed',
    });
    throw new Error('Original prompt unavailable. Paste prompt to continue.');
  }

  const alignmentActiveProjectId =
    input.confirmFreshCopy || buildDecision.decision === 'NEW_BUILD'
      ? null
      : (input.activeProjectId ?? null);

  const alignment = assessProjectContextAlignment({
    prompt: buildPrompt,
    activeProjectId: alignmentActiveProjectId,
    // Never pass a resume display name without an active project id — stale same-prompt
    // ExpenseTracker (or other) records would otherwise re-bind as "active project".
    activeProjectName:
      alignmentActiveProjectId == null
        ? null
        : (input.projectName ?? resumeRoute.resumingProjectName),
    confirmProjectContextAlignment: input.confirmProjectContextAlignment === true,
    rootDir: input.rootDir,
  });

  if (alignmentBlocksBuildExecution(alignment)) {
    machine.completeLast();
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ROUTE_SELECTED,
      detail: 'Route=ALIGNMENT_REQUIRED — build blocked pending alignment confirmation.',
    });
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ASE_SKIP,
      detail: 'ASE not invoked — project context alignment guard blocked execution.',
    });
    return {
      readOnly: true,
      kind: 'ALIGNMENT_REQUIRED',
      classification,
      bridgeEvents: machine.getEvents(),
      progressItems: machine.buildProgressItems('PROJECT_ALIGNMENT'),
      alignmentPayload: composeProjectContextAlignmentBrainApiPayload({
        message: input.message,
        alignment,
      }),
    };
  }
  machine.completeLast();

  if (
    resumeRoute.shouldBlock &&
    !input.confirmProjectResume &&
    !input.confirmFreshCopy &&
    buildDecision.decision !== 'NEW_BUILD' &&
    !shouldAutoContinueDuplicate(input, buildDecision)
  ) {
    machine.transition('PROJECT_IDENTITY', {
      title: 'Existing project detected',
      detail: resumeRoute.reason ?? 'Choose resume, fresh copy, or cancel.',
      status: 'Warning',
    });
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ROUTE_SELECTED,
      detail: 'Route=RESUME_REQUIRED — duplicate project requires user choice.',
    });
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ASE_SKIP,
      detail: 'ASE not invoked — waiting for resume/fresh-copy decision.',
    });
    return {
      readOnly: true,
      kind: 'RESUME_REQUIRED',
      classification,
      bridgeEvents: machine.getEvents(),
      progressItems: machine.buildProgressItems('PROJECT_IDENTITY'),
      resumePayload: composeDuplicateResumeResponse(resumeRoute),
    };
  }

  machine.transition('PROJECT_IDENTITY', {
    title: resumeRoute.resumingProjectId ? 'Existing project resolved' : 'Project identity resolved',
    detail: resumeRoute.resumingProjectId
      ? `Continuing ${resumeRoute.resumingProjectName ?? 'existing project'} via conflict resolution.`
      : 'Applying project name conflict resolution and session bootstrap.',
  });

  try {
    const promptBoundProjectName =
      buildDecision.decision === 'NEW_BUILD'
        ? deriveProjectNameFromPrompt(buildPrompt)
        : (input.projectName ?? resumeRoute.resumingProjectName ?? undefined);
    const sessionBootstrap = bootstrapProjectAndSessionForBuild({
      rawPrompt: buildPrompt,
      projectId: effectiveProjectId,
      projectName: promptBoundProjectName,
      confirmFreshCopy: input.confirmFreshCopy === true || buildDecision.decision === 'NEW_BUILD',
      rejectDuplicates: input.rejectDuplicates === true,
      rootDir: input.rootDir,
      repoRootDir: input.repoRootDir,
    });
    effectiveProjectId = sessionBootstrap.projectId;
    machine.completeLast();

    for (const stage of [
      ['PLANNING', 'Planning started', 'Autonomous planning pipeline engaged.'],
      ['ARCHITECTURE', 'Architecture complete', 'Architecture brief materialized.'],
      ['FEATURE_GENERATION', 'Universal Feature Contract generated', 'Feature contract approved for build.'],
    ] as const) {
      machine.transition(stage[0], { title: stage[1], detail: stage[2] });
      machine.completeLast();
    }

    // Materialization / module generation are only marked complete after the orchestrator returns
    // without a GPCA pre-generation block — never optimistic.
    machine.transition('CODE_GENERATION', {
      title: 'Code generation started',
      detail: 'Awaiting Contract-Bound Generation Authority and Generation Pipeline Compliance.',
      status: 'Active',
    });

    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ROUTE_SELECTED,
      detail: 'Route=BUILD_ORCHESTRATION — invoking autonomous engineering pipeline.',
    });
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_FIRST_EVENT,
      detail: machine.getEvents()[0]?.title ?? 'Bridge state machine started.',
    });
    auditBridgeEvent({
      auditId: input.chatExecutionAuditId,
      name: COMMAND_CENTER_CHAT_AUDIT_EVENTS.BRIDGE_ASE_INVOKE,
      detail: 'Invoking runOnePromptLivePreviewBuild (ASE pipeline).',
      metadata: { projectId: effectiveProjectId ?? sessionBootstrap.projectId },
    });
    recordHttpForensicStage(
      input.httpRequestId,
      HTTP_ROUTING_FORENSIC_EVENTS.ASE_ENTER,
      'Invoking runOnePromptLivePreviewBuild (ASE pipeline)',
      'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
      'executeChatToBuildBridge',
      { projectId: effectiveProjectId ?? sessionBootstrap.projectId ?? null },
    );

    const buildResult = await runOnePromptLivePreviewBuild({
      rawPrompt: buildPrompt,
      projectRootDir: input.repoRootDir,
      source: input.source,
      projectId: effectiveProjectId,
      projectName: sessionBootstrap.projectName,
      buildDecisionKind: buildDecision.decision,
      buildIntentOverride: buildDecision.overrideApplied ?? null,
      freshProjectContextCreated:
        buildDecision.decision === 'NEW_BUILD' && sessionBootstrap.createdProject,
      resumeExistingProject:
        buildDecision.decision === 'CONTINUE_EXISTING_PROJECT' &&
        (buildDecision.overrideApplied === 'CONTINUE_EXISTING_PROJECT' ||
          (input.confirmProjectResume === true && !input.confirmFreshCopy) ||
          (shouldAutoContinueDuplicate(input, buildDecision) && Boolean(resumeRoute.resumingProjectId))),
    });

    const autofixAttempts =
      (buildResult.buildAutofixAttempts ?? 0) + (buildResult.previewRecoveryAttempts ?? 0);
    const autofixApplied = autofixAttempts > 0;

    if (autofixApplied) {
      machine.transition('AUTOFIX', {
        title: 'AutoFix applied',
        detail: `Autonomous repair loop completed (${autofixAttempts} attempt(s)).`,
        status: 'Completed',
      });
      machine.completeLast();
    }

    const gpcaBlockedBuild =
      buildResult.gpcaHardStop === true ||
      buildResult.gpcaBlockedMaterialization === true ||
      buildResult.gpcaBlockedPreviewActivation === true;

    // Do not emit optimistic completed events for stages that never ran when GPCA blocked.
    if (!gpcaBlockedBuild) {
      machine.transition('CODE_GENERATION', {
        title: 'Modules generated',
        detail: 'Feature modules and source files generated.',
        status: 'Completed',
      });
      machine.completeLast();
      machine.transition('WORKSPACE_BUILD', {
        title: 'Workspace materialized',
        detail: 'Workspace artifacts written.',
        status: 'Completed',
      });
      machine.completeLast();
      for (const stage of [
        ['RUNTIME_START', 'Runtime started', 'Generated workspace runtime activation attempted.'],
        [
          'LIVE_PREVIEW',
          'Live Preview started',
          buildResult.previewUrl ? `Preview URL: ${buildResult.previewUrl}` : 'Preview activation attempted.',
        ],
        ['VALIDATION', 'Validation running', 'Feature reality and workspace validation executed.'],
        ['FOUNDER_EVIDENCE', 'Engineering report generated', 'Founder evidence collection complete.'],
      ] as const) {
        machine.transition(stage[0], {
          title: stage[1],
          detail: stage[2],
          status: buildResult.status === 'FAILED' && stage[0] === 'VALIDATION' ? 'Warning' : 'Completed',
        });
        machine.completeLast();
      }
    } else {
      machine.transition('VALIDATION', {
        title: 'Generation compliance validation',
        detail: buildResult.failureReason ?? 'Generation pipeline compliance blocked this build.',
        status: 'Failed',
      });
    }

    const finalState: ChatToBuildEngineeringState =
      buildResult.status === 'FAILED' ? 'FAILED' : 'COMPLETE';
    machine.transition(finalState, {
      title: finalState === 'FAILED' ? 'Engineering failed' : 'Engineering complete',
      detail: `Build status: ${buildResult.status}`,
      status: buildResult.status === 'FAILED' ? 'Failed' : 'Completed',
    });

    const engineeringReport = buildBridgeEngineeringReport({
      bridgeRunId,
      buildResult,
      sessionBootstrap,
      autofixApplied,
      autofixAttempts,
      finalState,
    });

    const payload = composeOnePromptBuildBrainApiPayload({
      message: buildPrompt,
      buildResult,
    });
    const enrichedPayload = enrichBrainPayloadWithProjectSession(
      await applyBuildResultConversationalIntelligence({
        message: input.message,
        payload,
        buildResult,
        rootDir: input.repoRootDir,
      }),
      input.rootDir,
    );

    finalizeProjectSessionAfterBuild({
      projectId: sessionBootstrap.projectId,
      sessionId: sessionBootstrap.sessionId,
      buildResult,
      userMessage: input.message,
      brainResponse:
        typeof enrichedPayload.brainResponse === 'string' ? enrichedPayload.brainResponse : undefined,
      rootDir: input.rootDir,
    });

    const bridgeResult: ChatToBuildBridgeResult = {
      readOnly: true,
      kind: buildResult.status === 'FAILED' ? 'BUILD_FAILED' : 'BUILD_COMPLETE',
      classification,
      bridgeEvents: machine.getEvents(),
      progressItems: machine.buildProgressItems(finalState),
      conflictResolutionTrace: PROJECT_NAME_CONFLICT_RESOLUTION_TRACE,
      projectIdentity: sessionBootstrap.projectIdentity ?? null,
      buildResult,
      engineeringReport,
      contextIsolation: {
        readOnly: true,
        decision: buildDecision.decision,
        reasons: buildDecision.reasons,
        message: buildDecision.message,
        overrideApplied: buildDecision.overrideApplied ?? null,
        overrideRejected: buildDecision.overrideRejected ?? null,
      },
      brainPayload: attachBridgeMetadata(enrichedPayload, {
        readOnly: true,
        kind: buildResult.status === 'FAILED' ? 'BUILD_FAILED' : 'BUILD_COMPLETE',
        classification,
        bridgeEvents: machine.getEvents(),
        progressItems: machine.buildProgressItems(finalState),
        projectIdentity: sessionBootstrap.projectIdentity ?? null,
        buildResult,
        engineeringReport,
      }, bridgeRunId),
    };

    console.info(
      `${CHAT_TO_BUILD_EXECUTION_BRIDGE_TRACE} source=${input.source} projectId=${buildResult.projectId} status=${buildResult.status} bridgeRunId=${bridgeRunId}`,
    );

    return bridgeResult;
  } catch (err) {
    const failureReason = err instanceof Error ? err.message : String(err);
    machine.transition('FAILED', {
      title: 'Engineering failed',
      detail: failureReason,
      status: 'Failed',
    });
    if (err instanceof ProjectNameConflictRejectedError) {
      throw err;
    }
    const payload = composeOnePromptBuildFailurePayload({
      message: input.message,
      failureReason,
      projectId: input.activeProjectId ?? undefined,
      projectName: input.projectName ?? undefined,
    });
    const failedBuildResult = payload.onePromptLivePreview as OnePromptLivePreviewBuildResult;
    const enrichedPayload = await applyBuildResultConversationalIntelligence({
      message: input.message,
      payload,
      buildResult: failedBuildResult,
      rootDir: input.repoRootDir,
    });
    return {
      readOnly: true,
      kind: 'BUILD_FAILED',
      classification,
      bridgeEvents: machine.getEvents(),
      progressItems: machine.buildProgressItems('FAILED'),
      // Always attach the synthetic failure build so /api/build/from-prompt can return a structured
      // generation-stage failure instead of an opaque "did not produce a build result" 400.
      buildResult: failedBuildResult,
      brainPayload: attachBridgeMetadata(enrichedPayload, {
        readOnly: true,
        kind: 'BUILD_FAILED',
        classification,
        bridgeEvents: machine.getEvents(),
        progressItems: machine.buildProgressItems('FAILED'),
        buildResult: failedBuildResult,
      }, bridgeRunId),
    };
  }
}

/** Command Center alias — same authority as executeChatToBuildBridge. */
export async function executeCommandCenterMessage(
  input: Omit<ChatToBuildBridgeInput, 'source'> & { timestamp?: number },
): Promise<ChatToBuildBridgeResult> {
  return executeChatToBuildBridge({
    ...input,
    source: 'chat',
  });
}
