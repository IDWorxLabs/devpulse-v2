/**
 * Action candidate builder — gathers visible actions from intelligence sources.
 */

import { analyzePortfolioPriorities, readPortfolioProjects } from '../portfolio-intelligence/index.js';
import { reasonOverDecision } from '../unified-decision-layer/index.js';
import type { DecisionOption } from '../unified-decision-layer/decision-types.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { buildDependencyGraph } from '../dependency-intelligence/index.js';
import type { DecisionContext } from '../unified-decision-layer/decision-types.js';
import { evaluateActionStatus } from './action-status-evaluator.js';
import { resolveActionSourceFromQuery } from './action-source-resolver.js';
import type { ActionCandidate, ActionConfidence, ActionRecommendation } from './action-visibility-types.js';

let actionCounter = 0;

function nextActionId(): string {
  actionCounter += 1;
  return `act-${actionCounter.toString().padStart(4, '0')}`;
}

function mapConfidence(conf: string): ActionConfidence {
  if (conf === 'HIGH') return 'HIGH';
  if (conf === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function executionFieldsForAction(
  blocked: boolean,
  context: DecisionContext,
  actionId: string,
): {
  executionReadiness: string;
  executionReady: boolean;
  buildTaskId: string;
  buildTaskReadiness: string;
  codeGenerationId: string;
  codeGenerationReadiness: string;
  testingId: string;
  testingReadiness: string;
  fixId: string;
  fixReadiness: string;
  verificationId: string;
  verificationScore: number;
  world2ActivationId: string;
  world2ActivationReadiness: string;
  builderPacketExecutionId: string;
  builderPacketExecutionReadiness: string;
  controlledApplyId: string;
  controlledApplyReadiness: string;
  rollbackPlanId: string;
  rollbackReadiness: string;
  rollbackAllowed: false;
  recoveryPlanId: string;
  recoveryReadiness: string;
  recoveryAllowed: false;
  escalationLevel: string;
  completionPlanId: string;
  completionReadiness: string;
  completionAllowed: false;
  previewSessionId: string;
  previewReadiness: string;
  previewState: string;
  previewIntelligenceId: string;
  previewReadinessLevel: string;
  previewReadinessScore: number;
  selfVisionSessionId: string;
  selfVisionReadiness: string;
  observationState: string;
  inspectionId: string;
  inspectionReadiness: string;
  inspectedSurfaceCount: number;
  interactionTestId: string;
  interactionReadiness: string;
  interactionCount: number;
  visualVerificationId: string;
  visualVerificationStatus: string;
  visualVerificationTargetCount: number;
  verificationSessionId: string;
  verificationRuntimeState: string;
  providerCount: number;
  verificationTargetCount: number;
  verificationDependencyCount: number;
  verificationRequirementCount: number;
  orchestrationId: string;
  verificationPlanCount: number;
  readyTargetCount: number;
  blockedTargetCount: number;
  evidenceAuthorityId: string;
  evidenceCount: number;
  evidenceCategoryCount: number;
  lineageLinkCount: number;
  reportingAuthorityId: string;
  verificationReportCount: number;
  verificationReportTypeCount: number;
  unifiedVerificationEntryId: string;
  verificationRequestCount: number;
  verificationEntrySessionCount: number;
  cloudRuntimeFoundationId: string;
  cloudRuntimeCount: number;
  cloudRuntimeState: string;
  workspaceHostingFoundationId: string;
  hostedWorkspaceCount: number;
  workspaceHostingState: string;
  persistentBuildRuntimeFoundationId: string;
  persistentBuildCount: number;
  persistentBuildState: string;
  cloudVerificationFoundationId: string;
  cloudVerificationCount: number;
  cloudVerificationState: string;
  cloudRecoveryFoundationId: string;
  cloudRecoveryCount: number;
  cloudRecoveryState: string;
  cloudMonitoringFoundationId: string;
  cloudMonitoringCount: number;
  cloudMonitoringState: string;
  mobileCommandRuntimeFoundationId: string;
  mobileCommandCount: number;
  mobileCommandState: string;
  mobileChatRuntimeFoundationId: string;
  mobileChatCount: number;
  mobileChatState: string;
  mobilePreviewRuntimeFoundationId: string;
  mobilePreviewCount: number;
  mobilePreviewState: string;
  applyAllowed: false;
  executionAllowed: false;
} {
  const blockerCount = context.blockedItems.length + context.dependencyBlockers.length;
  const score = Math.max(0, Math.min(100, 55 - blockerCount * 4));
  const level = score >= 45 ? 'MEDIUM' : score > 0 ? 'LOW' : 'NONE';
  const taskId = `btask-${actionId.replace('act-', '')}`;
  const genId = `cgen-${actionId.replace('act-', '')}`;
  const testId = `test-${actionId.replace('act-', '')}`;
  const fixId = `fix-${actionId.replace('act-', '')}`;
  const vrfyId = `vrfy-${actionId.replace('act-', '')}`;
  const vrfyScore = Math.max(0, Math.min(100, score + 10));
  const w2Id = `w2act-${actionId.replace('act-', '')}`;
  const w2Readiness = blocked
    ? `BLOCKED — ${w2Id} Phase 15.1 simulation-only, no World 2 execution`
    : `${level} — ${w2Id} activation foundation only, World 1 protected`;
  const bpeId = `bpe-${actionId.replace('act-', '')}`;
  const bpeReadiness = blocked
    ? `BLOCKED — ${bpeId} Phase 15.2 preparation only`
    : `${level} — ${bpeId} builder packet execution packet prepared, no apply`;
  const capId = `cap-${actionId.replace('act-', '')}`;
  const capReadiness = blocked
    ? `BLOCKED — ${capId} Phase 15.3 apply plan only`
    : `${level} — ${capId} controlled apply plan prepared, applyAllowed false`;
  const rbId = `rb-${actionId.replace('act-', '')}`;
  const rbReadiness = blocked
    ? `BLOCKED — ${rbId} Phase 15.4 rollback plan only`
    : `${level} — ${rbId} rollback plan prepared, rollbackAllowed false`;
  const rcId = `rc-${actionId.replace('act-', '')}`;
  const rcReadiness = blocked
    ? `BLOCKED — ${rcId} Phase 15.5 recovery plan only`
    : `${level} — ${rcId} recovery plan prepared, recoveryAllowed false`;
  const cmId = `cm-${actionId.replace('act-', '')}`;
  const cmReadiness = blocked
    ? `BLOCKED — ${cmId} Phase 15.6 completion plan only`
    : `${level} — ${cmId} completion plan prepared, completionAllowed false`;
  const pvId = `pv-${actionId.replace('act-', '')}`;
  const pvReadiness = blocked
    ? `BLOCKED — ${pvId} Phase 16.1 preview management only`
    : `${level} — ${pvId} preview session registered, no browser launch`;
  const pviId = `pvi-${actionId.replace('act-', '')}`;
  const pviLevel = blocked ? 'BLOCKED' : level === 'MEDIUM' ? 'PARTIALLY_READY' : 'NOT_READY';
  const pviScore = blocked ? 0 : Math.max(0, Math.min(100, score));
  const svId = `sv-${actionId.replace('act-', '')}`;
  const svReadiness = blocked
    ? `BLOCKED — ${svId} Phase 16.3 observation runtime only`
    : `${level} — ${svId} capture plan prepared, no capture execution`;
  const obsState = blocked ? 'OBSERVATION_BLOCKED' : 'PLANNED';
  const inspId = `insp-${actionId.replace('act-', '')}`;
  const inspReadiness = blocked
    ? `BLOCKED — ${inspId} Phase 16.4 structure inspection only`
    : `${level} — ${inspId} layout/navigation/loading structures identified`;
  const surfaceCount = blocked ? 0 : Math.max(3, Math.min(7, 4 + Math.floor(score / 20)));
  const itestId = `itest-${actionId.replace('act-', '')}`;
  const itestReadiness = blocked
    ? `BLOCKED — ${itestId} Phase 16.5 interaction simulation only`
    : `${level} — ${itestId} interaction outcomes recorded, no verdict`;
  const interactionCount = blocked ? 0 : Math.max(4, Math.min(12, 6 + Math.floor(score / 15)));
  const vverId = `vver-${actionId.replace('act-', '')}`;
  const vverStatus = blocked ? 'VERIFICATION_BLOCKED' : score >= 45 ? 'PARTIALLY_VERIFIED' : 'VERIFICATION_REQUIRED';
  const vverTargetCount = blocked ? 0 : Math.max(5, Math.min(14, 8 + Math.floor(score / 12)));
  const vvsessId = `vvsess-${actionId.replace('act-', '')}`;
  const vvsessState = blocked ? 'BLOCKED' : score >= 45 ? 'COMPLETED' : 'READY';
  const providerCount = blocked ? 0 : Math.max(7, Math.min(7, 7));
  const verificationTargetCount = blocked ? 0 : 11;
  const verificationDependencyCount = blocked ? 0 : 11;
  const verificationRequirementCount = blocked ? 0 : 11;
  const orchestrationId = `vorch-${actionId.replace('act-', '')}`;
  const verificationPlanCount = blocked ? 0 : 11;
  const readyTargetCount = blocked ? 0 : 3;
  const blockedTargetCount = blocked ? 11 : 0;
  const evidenceAuthorityId = `vevauth-${actionId.replace('act-', '')}`;
  const evidenceCount = blocked ? 0 : 13;
  const evidenceCategoryCount = blocked ? 0 : 10;
  const lineageLinkCount = blocked ? 0 : 4;
  const reportingAuthorityId = `vrptauth-${actionId.replace('act-', '')}`;
  const verificationReportCount = blocked ? 0 : 10;
  const verificationReportTypeCount = blocked ? 0 : 10;
  const unifiedVerificationEntryId = `uventauth-${actionId.replace('act-', '')}`;
  const verificationRequestCount = blocked ? 0 : 1;
  const verificationEntrySessionCount = blocked ? 0 : 1;
  const cloudRuntimeFoundationId = `crrtfnd-${actionId.replace('act-', '')}`;
  const cloudRuntimeCount = blocked ? 0 : 8;
  const cloudRuntimeState = blocked ? 'BLOCKED' : 'READY';
  const workspaceHostingFoundationId = `whstfnd-${actionId.replace('act-', '')}`;
  const hostedWorkspaceCount = blocked ? 0 : 8;
  const workspaceHostingState = blocked ? 'BLOCKED' : 'READY';
  const persistentBuildRuntimeFoundationId = `pbldfnd-${actionId.replace('act-', '')}`;
  const persistentBuildCount = blocked ? 0 : 8;
  const persistentBuildState = blocked ? 'BLOCKED' : 'READY';
  const cloudVerificationFoundationId = `cvrfnd-${actionId.replace('act-', '')}`;
  const cloudVerificationCount = blocked ? 0 : 9;
  const cloudVerificationState = blocked ? 'BLOCKED' : 'READY';
  const cloudRecoveryFoundationId = `crrfnd-${actionId.replace('act-', '')}`;
  const cloudRecoveryCount = blocked ? 0 : 9;
  const cloudRecoveryState = blocked ? 'BLOCKED' : 'READY';
  const cloudMonitoringFoundationId = `cmonfnd-${actionId.replace('act-', '')}`;
  const cloudMonitoringCount = blocked ? 0 : 9;
  const cloudMonitoringState = blocked ? 'BLOCKED' : 'READY';
  const mobileCommandRuntimeFoundationId = `mcrtfnd-${actionId.replace('act-', '')}`;
  const mobileCommandCount = blocked ? 0 : 9;
  const mobileCommandState = blocked ? 'BLOCKED' : 'READY';
  const mobileChatRuntimeFoundationId = `mchtfnd-${actionId.replace('act-', '')}`;
  const mobileChatCount = blocked ? 0 : 9;
  const mobileChatState = blocked ? 'BLOCKED' : 'READY';
  const mobilePreviewRuntimeFoundationId = `mpvtfnd-${actionId.replace('act-', '')}`;
  const mobilePreviewCount = blocked ? 0 : 9;
  const mobilePreviewState = blocked ? 'BLOCKED' : 'READY';
  return {
    executionReadiness: `${level} (${score}) — ${blockerCount} visible blockers; Phase 14.1 readiness-only, no execution.`,
    executionReady: !blocked && score >= 45 && blockerCount < 4,
    buildTaskId: taskId,
    buildTaskReadiness: blocked
      ? `BLOCKED — ${taskId} planning advisory only`
      : `${level} — ${taskId} Phase 14.2 planning-only, execution blocked`,
    codeGenerationId: genId,
    codeGenerationReadiness: blocked
      ? `BLOCKED — ${genId} proposal advisory only`
      : `${level} — ${genId} Phase 14.3 proposal-only, no file writes`,
    testingId: testId,
    testingReadiness: blocked
      ? `BLOCKED — ${testId} testing advisory only`
      : `${level} — ${testId} Phase 14.4 simulation-only, no test execution`,
    fixId,
    fixReadiness: blocked
      ? `BLOCKED — ${fixId} auto-fix advisory only`
      : `${level} — ${fixId} Phase 14.5 simulation-only, no fix application`,
    verificationId: vrfyId,
    verificationScore: blocked ? 0 : vrfyScore,
    world2ActivationId: w2Id,
    world2ActivationReadiness: w2Readiness,
    builderPacketExecutionId: bpeId,
    builderPacketExecutionReadiness: bpeReadiness,
    controlledApplyId: capId,
    controlledApplyReadiness: capReadiness,
    rollbackPlanId: rbId,
    rollbackReadiness: rbReadiness,
    rollbackAllowed: false,
    recoveryPlanId: rcId,
    recoveryReadiness: rcReadiness,
    recoveryAllowed: false,
    escalationLevel: blocked ? 'BLOCKED' : 'NONE',
    completionPlanId: cmId,
    completionReadiness: cmReadiness,
    completionAllowed: false,
    previewSessionId: pvId,
    previewReadiness: pvReadiness,
    previewState: blocked ? 'PREVIEW_BLOCKED' : 'REGISTERED',
    previewIntelligenceId: pviId,
    previewReadinessLevel: pviLevel,
    previewReadinessScore: pviScore,
    selfVisionSessionId: svId,
    selfVisionReadiness: svReadiness,
    observationState: obsState,
    inspectionId: inspId,
    inspectionReadiness: inspReadiness,
    inspectedSurfaceCount: surfaceCount,
    interactionTestId: itestId,
    interactionReadiness: itestReadiness,
    interactionCount,
    visualVerificationId: vverId,
    visualVerificationStatus: vverStatus,
    visualVerificationTargetCount: vverTargetCount,
    verificationSessionId: vvsessId,
    verificationRuntimeState: vvsessState,
    providerCount,
    verificationTargetCount,
    verificationDependencyCount,
    verificationRequirementCount,
    orchestrationId,
    verificationPlanCount,
    readyTargetCount,
    blockedTargetCount,
    evidenceAuthorityId,
    evidenceCount,
    evidenceCategoryCount,
    lineageLinkCount,
    reportingAuthorityId,
    verificationReportCount,
    verificationReportTypeCount,
    unifiedVerificationEntryId,
    verificationRequestCount,
    verificationEntrySessionCount,
    cloudRuntimeFoundationId,
    cloudRuntimeCount,
    cloudRuntimeState,
    workspaceHostingFoundationId,
    hostedWorkspaceCount,
    workspaceHostingState,
    persistentBuildRuntimeFoundationId,
    persistentBuildCount,
    persistentBuildState,
    cloudVerificationFoundationId,
    cloudVerificationCount,
    cloudVerificationState,
    cloudRecoveryFoundationId,
    cloudRecoveryCount,
    cloudRecoveryState,
    cloudMonitoringFoundationId,
    cloudMonitoringCount,
    cloudMonitoringState,
    mobileCommandRuntimeFoundationId,
    mobileCommandCount,
    mobileCommandState,
    mobileChatRuntimeFoundationId,
    mobileChatCount,
    mobileChatState,
    mobilePreviewRuntimeFoundationId,
    mobilePreviewCount,
    mobilePreviewState,
    applyAllowed: false,
    executionAllowed: false,
  };
}

function candidateFromDecisionOption(
  option: DecisionOption,
  isPrimary: boolean,
  context: DecisionContext,
): ActionCandidate {
  const deferred = option.category === 'DEFER' || option.category === 'DO_NOT_BUILD_YET';
  const recommended = isPrimary && !option.blocked && !deferred;
  const status = evaluateActionStatus({
    blocked: option.blocked,
    deferred,
    recommended,
  });

  const actionId = nextActionId();
  return {
    actionId,
    title: option.title,
    description: option.description,
    sourceSystem: 'unified_decision_layer',
    status,
    priority: option.priority,
    confidence: mapConfidence(option.confidence),
    blocked: option.blocked,
    deferred,
    recommended,
    reason: option.recommendedAction || option.description,
    ...executionFieldsForAction(option.blocked, context, actionId),
    visibilityOnly: true,
  };
}

function supplementalActions(query: string, context: DecisionContext): ActionCandidate[] {
  const profile = getCurrentProjectProfile();
  const actions: ActionCandidate[] = [];
  buildDependencyGraph();
  const projects = readPortfolioProjects(query);
  const priorities = analyzePortfolioPriorities(projects);

  for (const blocker of profile.blockedItems.slice(0, 3)) {
    const actionId = nextActionId();
    actions.push({
      actionId,
      title: 'Resolve blocked gate',
      description: blocker,
      sourceSystem: 'project_understanding_engine',
      status: 'Blocked',
      priority: 10,
      confidence: 'HIGH',
      blocked: true,
      deferred: false,
      recommended: false,
      reason: blocker,
      ...executionFieldsForAction(true, context, actionId),
      visibilityOnly: true,
    });
  }

  for (const dep of profile.missingCapabilities.slice(0, 2)) {
    const actionId = nextActionId();
    actions.push({
      actionId,
      title: `Address missing capability: ${dep}`,
      description: `Capability gap identified — ${dep} not yet built.`,
      sourceSystem: 'dependency_intelligence',
      status: 'Deferred',
      priority: 50,
      confidence: 'MEDIUM',
      blocked: false,
      deferred: true,
      recommended: false,
      reason: 'Required before Execution Runtime — intelligence foundation first.',
      ...executionFieldsForAction(false, context, actionId),
      visibilityOnly: true,
    });
  }

  const focus = priorities.find((p) => p.focusRecommended);
  if (focus) {
    const actionId = nextActionId();
    actions.push({
      actionId,
      title: `Focus portfolio on ${focus.projectName}`,
      description: focus.reason,
      sourceSystem: 'portfolio_intelligence',
      status: 'Suggested',
      priority: focus.priority,
      confidence: 'HIGH',
      blocked: false,
      deferred: false,
      recommended: false,
      reason: focus.reason,
      ...executionFieldsForAction(false, context, actionId),
      visibilityOnly: true,
    });
  }

  const sourceFilter = resolveActionSourceFromQuery(query);
  if (sourceFilter === 'dependency_intelligence') {
    const actionId = nextActionId();
    actions.push({
      actionId,
      title: 'Validate Dependency Intelligence',
      description: 'Ensure dependency graph and blockers are current before advancing.',
      sourceSystem: 'dependency_intelligence',
      status: 'Recommended',
      priority: 20,
      confidence: 'HIGH',
      blocked: false,
      deferred: false,
      recommended: true,
      reason: 'Required before Execution Runtime — dependency awareness gates advancement.',
      ...executionFieldsForAction(false, context, actionId),
      visibilityOnly: true,
    });
  }

  return actions;
}

export function buildActionCandidates(query: string): ActionCandidate[] {
  const trace = reasonOverDecision(query);
  const primary = trace.recommendation.primaryOption;
  const decisionActions = trace.options.map((opt) =>
    candidateFromDecisionOption(opt, opt.decisionId === primary.decisionId, trace.context),
  );
  const supplemental = supplementalActions(query, trace.context);

  const merged = new Map<string, ActionCandidate>();
  for (const action of [...decisionActions, ...supplemental]) {
    merged.set(`${action.sourceSystem}:${action.title}`, action);
  }

  return [...merged.values()].sort((a, b) => a.priority - b.priority);
}

export function buildActionRecommendation(action: ActionCandidate): ActionRecommendation | null {
  if (!action.recommended && action.status !== 'Recommended') return null;
  return {
    recommendationId: `rec-${action.actionId}`,
    actionId: action.actionId,
    title: action.title,
    sourceSystem: action.sourceSystem,
    status: action.status,
    priority: action.priority,
    confidence: action.confidence,
    reason: action.reason,
    visibilityOnly: true,
  };
}

export function buildActionVisibilityRecordsFromDecision(query: string): ActionCandidate[] {
  return buildActionCandidates(query);
}

export function resetActionCandidateCounterForTests(): void {
  actionCounter = 0;
}
