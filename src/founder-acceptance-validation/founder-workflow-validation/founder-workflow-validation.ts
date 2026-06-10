/**
 * Founder Workflow Validation — orchestration and read-only integrations.
 * First actual validation authority in Founder Acceptance stack.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS } from '../../unified-verification-lab/uvl-row-registry.js';
import { buildFounderAcceptanceFramework } from '../founder-acceptance-framework/index.js';
import { evaluateProductRealityOrchestrator } from '../../product-reality-verification/product-reality-orchestrator/index.js';
import { evaluateProductExperienceEngine } from '../../product-reality-verification/product-experience-verification-engine/index.js';
import { evaluateUXHeuristicEngine } from '../../product-reality-verification/ux-heuristic-evaluator/index.js';
import { evaluateFirstImpressionJudge } from '../../product-reality-verification/first-impression-judge/index.js';
import { evaluateLivePreviewGatekeeper } from '../../product-reality-verification/live-preview-gatekeeper/index.js';
import type {
  FounderWorkflowRecord,
  FounderWorkflowResultBundle,
  FounderWorkflowRuntimeReport,
  FounderWorkflowValidationInput,
} from './founder-workflow-types.js';
import {
  FOUNDER_WORKFLOW_VALIDATION_PASS_TOKEN,
  FOUNDER_WORKFLOW_OWNER_MODULE,
} from './founder-workflow-types.js';
import { buildAllWorkflowContexts, getContextBuildCount } from './workflow-context-builder.js';
import { validateWorkflowClarity, getClarityValidateCount } from './workflow-clarity-validator.js';
import { validateWorkflowDiscoverability, getDiscoverabilityValidateCount } from './workflow-discoverability-validator.js';
import { validateWorkflowContinuity, getContinuityValidateCount } from './workflow-continuity-validator.js';
import { validateWorkflowFriction, getFrictionValidateCount } from './workflow-friction-validator.js';
import { validateWorkflowRecovery, getRecoveryValidateCount } from './workflow-recovery-validator.js';
import { validateWorkflowOutcome, getOutcomeValidateCount } from './workflow-outcome-validator.js';
import { validateWorkflowEfficiency, getEfficiencyValidateCount } from './workflow-efficiency-validator.js';
import { analyzeWorkflowGaps, getGapAnalysisCount } from './workflow-gap-analyzer.js';
import { buildFounderWorkflowRoadmap, getRoadmapBuildCount } from './workflow-roadmap-builder.js';
import { buildFounderWorkflowAuthority, getAuthorityBuildCount } from './founder-workflow-authority-builder.js';
import { buildFounderWorkflowScore, evaluateFounderWorkflow, getEvaluationCount } from './founder-workflow-evaluator.js';
import { registerFounderWorkflowRecord, getFounderWorkflowRecordCount } from './founder-workflow-registry.js';
import { recordFounderWorkflowHistory } from './bounded-history.js';
import { generateFounderWorkflowReport, getReportCount } from './founder-workflow-report-builder.js';
import { getFounderWorkflowCacheStats, getCachedSourceText, setCachedSourceText } from './founder-workflow-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface FounderWorkflowSurfaceSnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  uvlDiscoverable: boolean;
  ideaVaultPresent: boolean;
  projectVaultPresent: boolean;
  feedStreamPresent: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  frameworkAuthorityId: string;
  registeredAt: number;
}

let cachedSnapshot: FounderWorkflowSurfaceSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

function readSourceText(path: string): string {
  const cached = getCachedSourceText(path);
  if (cached !== undefined) return cached;
  try {
    if (!existsSync(path)) {
      setCachedSourceText(path, '');
      return '';
    }
    const text = readFileSync(path, 'utf8');
    setCachedSourceText(path, text);
    return text;
  } catch {
    setCachedSourceText(path, '');
    return '';
  }
}

export function getDevPulseV2FounderWorkflowValidation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_WORKFLOW_OWNER_MODULE,
    passToken: FOUNDER_WORKFLOW_VALIDATION_PASS_TOKEN,
    phase: 24.82,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderWorkflowValidationWithSurface(): FounderWorkflowSurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);
  const appJs = readSourceText(UI_APP_PATH);
  const framework = buildFounderAcceptanceFramework({ requestId: 'bootstrap-framework' });

  cachedSnapshot = {
    chatPresent: html.includes('id="chat-input"') || html.includes('id="chat-surface"'),
    operatorFeedPresent: html.includes('id="operator-feed"'),
    uvlDiscoverable: html.includes('UVL') || ALL_UVL_ROWS.length > 0,
    ideaVaultPresent: html.includes('Idea Vault') || html.includes('idea-vault'),
    projectVaultPresent: html.includes('Project Vault') || html.includes('project-vault'),
    feedStreamPresent: html.includes('id="feed-stream-log"') || appJs.includes('streamOperatorFeedEvents'),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    frameworkAuthorityId: framework.authority.authorityId,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderWorkflowValidationWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderWorkflowValidationWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderWorkflowValidationWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderWorkflowValidationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerFounderWorkflowValidationWithAcceptanceChain(): {
  founderAcceptanceFramework: boolean;
  productRealityOrchestrator: boolean;
  productExperience: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    founderAcceptanceFramework: caps.includes('FOUNDER_ACCEPTANCE_FRAMEWORK'),
    productRealityOrchestrator: caps.includes('PRODUCT_REALITY_ORCHESTRATOR'),
    productExperience: caps.includes('PRODUCT_EXPERIENCE_VERIFICATION_ENGINE'),
    readOnly: true,
  };
}

export function evaluateFounderWorkflowValidation(input: FounderWorkflowValidationInput): FounderWorkflowResultBundle {
  const snapshot = registerFounderWorkflowValidationWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const base = { projectId, workspaceId, governanceBlocked: input.governanceBlocked };

  buildFounderAcceptanceFramework({ requestId: `${input.requestId}-framework`, ...base });

  const productReality = evaluateProductRealityOrchestrator({
    requestId: `${input.requestId}-pr`,
    ...base,
    experienceFragmented: input.workflowContinuityBreak,
    workflowBroken: input.workflowContinuityBreak,
    navigationDeadEnd: input.workflowDeadEnd,
  }).report;

  const productExperience = evaluateProductExperienceEngine({
    requestId: `${input.requestId}-pe`,
    ...base,
    workflowBreak: input.workflowContinuityBreak,
    experienceBreak: input.contextLoss,
    workflowDeadEnd: input.workflowDeadEnd,
  }).report;

  const ux = evaluateUXHeuristicEngine({
    requestId: `${input.requestId}-ux`,
    ...base,
    navigationConfusion: input.workflowClarityWeak,
    workflowBreak: input.workflowContinuityBreak,
  }).report;

  const firstImpression = evaluateFirstImpressionJudge({
    requestId: `${input.requestId}-fi`,
    ...base,
  }).report;

  const livePreview = evaluateLivePreviewGatekeeper({
    requestId: `${input.requestId}-lp`,
    ...base,
    previewNextActionMissing: input.workflowOutcomeUnclear,
  }).report;

  const contexts = buildAllWorkflowContexts();

  const clarity = validateWorkflowClarity(input, {
    navigationClarityScore: ux.navigationClarityScore,
    actionClarityScore: ux.actionClarityScore,
    founderUsabilityScore: ux.founderUsabilityScore,
    workflowContinuityScore: ux.workflowContinuityScore,
  });

  const discoverability = validateWorkflowDiscoverability(input, {
    featureDiscoverabilityScore: ux.featureDiscoverabilityScore,
    uvlDiscoverable: snapshot.uvlDiscoverable,
    chatPresent: snapshot.chatPresent,
    findPanelAliasCount: snapshot.findPanelAliases,
    capabilityCount: snapshot.capabilityEntries,
  });

  const continuity = validateWorkflowContinuity(input, {
    workflowContinuityScore: ux.workflowContinuityScore,
    experienceContinuityScore: productExperience.experienceContinuityScore,
    chatToFeedConnected: snapshot.chatPresent && snapshot.feedStreamPresent,
    previewReportConnected: livePreview.previewReportConnectionScore >= 70,
  });

  const friction = validateWorkflowFriction(input, {
    founderFrictionRiskCount: ux.founderFrictionRisks.length,
    cognitiveLoadScore: ux.cognitiveLoadScore,
    feedbackQualityScore: ux.feedbackQualityScore,
  });

  const recovery = validateWorkflowRecovery(input, {
    errorPreventionScore: ux.errorPreventionScore,
    userControlScore: ux.userControlScore,
    feedbackQualityScore: ux.feedbackQualityScore,
    trustClarityScore: ux.trustClarityScore,
  });

  const outcome = validateWorkflowOutcome(input, {
    actionReadinessScore: firstImpression.actionReadinessScore,
    previewNextActionScore: livePreview.previewNextActionScore,
    productRealityScore: productReality.productRealityScore,
    workflowContinuityScore: ux.workflowContinuityScore,
  });

  const stepOverhead = [
    input.excessiveSteps,
    input.workflowFrictionHigh,
    input.hiddenCapabilities,
    input.contextLoss,
  ].filter(Boolean).length;

  const efficiency = validateWorkflowEfficiency(input, {
    founderUsabilityScore: ux.founderUsabilityScore,
    cognitiveLoadScore: ux.cognitiveLoadScore,
    workflowContinuityScore: ux.workflowContinuityScore,
    stepOverheadEstimate: stepOverhead,
  });

  const gapAnalysis = analyzeWorkflowGaps(input.requestId, {
    clarity, discoverability, continuity, friction, recovery, outcome, efficiency,
  });

  const roadmap = buildFounderWorkflowRoadmap(input.requestId, gapAnalysis);
  const authority = buildFounderWorkflowAuthority(
    input.requestId, contexts,
    clarity, discoverability, continuity, friction, recovery, outcome, efficiency,
    gapAnalysis, roadmap, input,
  );

  const evaluation = evaluateFounderWorkflow(authority);
  const score = buildFounderWorkflowScore(authority);

  recordCounter += 1;
  const record: FounderWorkflowRecord = {
    founderWorkflowId: `founder-workflow-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    founderWorkflowResult: evaluation.founderWorkflowResult,
    totalGaps: evaluation.totalGaps,
    criticalGaps: evaluation.criticalGaps,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerFounderWorkflowRecord(record);
  recordFounderWorkflowHistory(record);

  const report = generateFounderWorkflowReport(record, evaluation, authority);

  return {
    record,
    report,
    authority,
    result: evaluation.founderWorkflowResult,
    score,
  };
}

export function getFounderWorkflowValidationRuntimeReport(): FounderWorkflowRuntimeReport {
  const cache = getFounderWorkflowCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    clarityValidateCount: getClarityValidateCount(),
    discoverabilityValidateCount: getDiscoverabilityValidateCount(),
    continuityValidateCount: getContinuityValidateCount(),
    frictionValidateCount: getFrictionValidateCount(),
    recoveryValidateCount: getRecoveryValidateCount(),
    outcomeValidateCount: getOutcomeValidateCount(),
    efficiencyValidateCount: getEfficiencyValidateCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    reportCount: getReportCount(),
    recordCount: getFounderWorkflowRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFounderWorkflowValidationOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
