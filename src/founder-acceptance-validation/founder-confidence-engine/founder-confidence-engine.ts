/**
 * Founder Confidence Engine — orchestration and read-only integrations.
 * Confidence validation authority in Founder Acceptance stack.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS } from '../../unified-verification-lab/uvl-row-registry.js';
import { buildFounderAcceptanceFramework } from '../founder-acceptance-framework/index.js';
import { evaluateFounderWorkflowValidation } from '../founder-workflow-validation/index.js';
import { evaluateProductRealityOrchestrator } from '../../product-reality-verification/product-reality-orchestrator/index.js';
import { evaluateProductExperienceEngine } from '../../product-reality-verification/product-experience-verification-engine/index.js';
import { evaluateUXHeuristicEngine } from '../../product-reality-verification/ux-heuristic-evaluator/index.js';
import { evaluateFirstImpressionJudge } from '../../product-reality-verification/first-impression-judge/index.js';
import { evaluateLivePreviewGatekeeper } from '../../product-reality-verification/live-preview-gatekeeper/index.js';
import type {
  FounderConfidenceRecord,
  FounderConfidenceResultBundle,
  FounderConfidenceRuntimeReport,
  FounderConfidenceEngineInput,
} from './founder-confidence-types.js';
import {
  FOUNDER_CONFIDENCE_ENGINE_PASS_TOKEN,
  FOUNDER_CONFIDENCE_OWNER_MODULE,
} from './founder-confidence-types.js';
import { buildAllConfidenceContexts, getContextBuildCount } from './confidence-context-builder.js';
import { validateUnderstandingConfidence, getUnderstandingValidateCount } from './understanding-confidence-validator.js';
import { validateReasoningVisibility, getReasoningValidateCount } from './reasoning-visibility-validator.js';
import { validateProgressTruth, getProgressTruthValidateCount } from './progress-truth-validator.js';
import { validateNextStepConfidence, getNextStepValidateCount } from './next-step-confidence-validator.js';
import { validateDecisionConfidence, getDecisionValidateCount } from './decision-confidence-validator.js';
import { validateUncertaintyHonesty, getUncertaintyValidateCount } from './uncertainty-honesty-validator.js';
import { validateFounderControlConfidence, getControlValidateCount } from './founder-control-confidence-validator.js';
import { analyzeConfidenceGaps, getGapAnalysisCount } from './confidence-gap-analyzer.js';
import { buildFounderConfidenceRoadmap, getRoadmapBuildCount } from './confidence-roadmap-builder.js';
import { buildFounderConfidenceAuthority, getAuthorityBuildCount } from './founder-confidence-authority-builder.js';
import { buildFounderConfidenceScore, evaluateFounderConfidence, getEvaluationCount } from './founder-confidence-evaluator.js';
import { registerFounderConfidenceRecord, getFounderConfidenceRecordCount } from './founder-confidence-registry.js';
import { recordFounderConfidenceHistory } from './bounded-history.js';
import { generateFounderConfidenceReport, getReportCount } from './founder-confidence-report-builder.js';
import { getFounderConfidenceCacheStats, getCachedSourceText, setCachedSourceText } from './founder-confidence-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface FounderConfidenceSurfaceSnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  feedStreamPresent: boolean;
  uvlDiscoverable: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  frameworkAuthorityId: string;
  workflowAuthorityId: string;
  registeredAt: number;
}

let cachedSnapshot: FounderConfidenceSurfaceSnapshot | null = null;
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

export function getDevPulseV2FounderConfidenceEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_CONFIDENCE_OWNER_MODULE,
    passToken: FOUNDER_CONFIDENCE_ENGINE_PASS_TOKEN,
    phase: 24.83,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderConfidenceEngineWithSurface(): FounderConfidenceSurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);
  const appJs = readSourceText(UI_APP_PATH);
  const framework = buildFounderAcceptanceFramework({ requestId: 'bootstrap-framework' });
  const workflow = evaluateFounderWorkflowValidation({ requestId: 'bootstrap-workflow' });

  cachedSnapshot = {
    chatPresent: html.includes('id="chat-input"') || html.includes('id="chat-surface"'),
    operatorFeedPresent: html.includes('id="operator-feed"'),
    feedStreamPresent: html.includes('id="feed-stream-log"') || appJs.includes('streamOperatorFeedEvents'),
    uvlDiscoverable: html.includes('UVL') || ALL_UVL_ROWS.length > 0,
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    frameworkAuthorityId: framework.authority.authorityId,
    workflowAuthorityId: workflow.authority.authorityId,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderConfidenceEngineWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderConfidenceEngineWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderConfidenceEngineWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderConfidenceEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerFounderConfidenceEngineWithAcceptanceChain(): {
  founderAcceptanceFramework: boolean;
  founderWorkflowValidation: boolean;
  productRealityOrchestrator: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    founderAcceptanceFramework: caps.includes('FOUNDER_ACCEPTANCE_FRAMEWORK'),
    founderWorkflowValidation: caps.includes('FOUNDER_WORKFLOW_VALIDATION'),
    productRealityOrchestrator: caps.includes('PRODUCT_REALITY_ORCHESTRATOR'),
    readOnly: true,
  };
}

export function evaluateFounderConfidenceEngine(input: FounderConfidenceEngineInput): FounderConfidenceResultBundle {
  const snapshot = registerFounderConfidenceEngineWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const base = { projectId, workspaceId, governanceBlocked: input.governanceBlocked };

  const framework = buildFounderAcceptanceFramework({ requestId: `${input.requestId}-framework`, ...base });

  const workflow = evaluateFounderWorkflowValidation({
    requestId: `${input.requestId}-workflow`,
    ...base,
    workflowClarityWeak: input.understandingWeak,
    workflowOutcomeUnclear: input.nextStepUnclear,
    workflowContinuityBreak: input.understandingWeak,
  });

  const productReality = evaluateProductRealityOrchestrator({
    requestId: `${input.requestId}-pr`,
    ...base,
    trustGap: input.progressInflated,
    verificationSilo: input.missingEvidence,
  });

  const productExperience = evaluateProductExperienceEngine({
    requestId: `${input.requestId}-pe`,
    ...base,
    experienceBreak: input.uncertaintyHidden,
  }).report;

  const ux = evaluateUXHeuristicEngine({
    requestId: `${input.requestId}-ux`,
    ...base,
    navigationConfusion: input.understandingWeak,
  }).report;

  const firstImpression = evaluateFirstImpressionJudge({
    requestId: `${input.requestId}-fi`,
    ...base,
  }).report;

  const livePreview = evaluateLivePreviewGatekeeper({
    requestId: `${input.requestId}-lp`,
    ...base,
    previewNextActionMissing: input.nextStepUnclear,
    previewUnavailableHidden: input.uncertaintyHidden,
  }).report;

  const contexts = buildAllConfidenceContexts();

  const understandingConfidence = validateUnderstandingConfidence(input, {
    projectContextScore: workflow.score.clarityScore,
    founderUsabilityScore: ux.founderUsabilityScore,
    workflowContinuityScore: workflow.score.continuityScore,
    frameworkComplete: framework.result.frameworkCompleteness === 'FRAMEWORK_COMPLETE',
  });

  const reasoningVisibility = validateReasoningVisibility(input, {
    trustClarityScore: ux.trustClarityScore,
    feedbackQualityScore: ux.feedbackQualityScore,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    feedStreamPresent: snapshot.feedStreamPresent,
  });

  const progressTruth = validateProgressTruth(input, {
    productRealityScore: productReality.report.productRealityScore,
    validationEvidenceScore: productReality.score.overallScore,
    launchBlockerCount: productReality.report.launchBlockers.length,
    releaseReadiness: productReality.report.releaseReadiness,
  });

  const nextStepConfidence = validateNextStepConfidence(input, {
    actionReadinessScore: firstImpression.actionReadinessScore,
    previewNextActionScore: livePreview.previewNextActionScore,
    workflowOutcomeScore: workflow.score.outcomeScore,
    priorityClarityScore: productReality.report.founderPriorities.length > 0 ? 78 : 62,
  });

  const decisionConfidence = validateDecisionConfidence(input, {
    userControlScore: ux.userControlScore,
    trustClarityScore: ux.trustClarityScore,
    authorityConflictCount: productReality.report.authorityConflicts.length,
    founderPriorityCount: productReality.report.founderPriorities.length,
  });

  const evidenceGapCount = [
    input.missingEvidence,
    input.uncertaintyHidden,
    input.unsupportedPassClaims,
  ].filter(Boolean).length;

  const uncertaintyHonesty = validateUncertaintyHonesty(input, {
    previewHonestyScore: livePreview.previewUnavailableHonestyScore,
    errorPreventionScore: ux.errorPreventionScore,
    limitationVisibilityScore: productExperience.experienceContinuityScore,
    evidenceGapCount,
  });

  const founderControlConfidence = validateFounderControlConfidence(input, {
    userControlScore: ux.userControlScore,
    errorPreventionScore: ux.errorPreventionScore,
    readOnlyValidation: getDevPulseV2FounderConfidenceEngine().noMutations === true,
    rollbackVisible: appJsHasRollbackHint(),
  });

  const gapAnalysis = analyzeConfidenceGaps(input.requestId, {
    understandingConfidence,
    reasoningVisibility,
    progressTruth,
    nextStepConfidence,
    decisionConfidence,
    uncertaintyHonesty,
    founderControlConfidence,
  });

  const roadmap = buildFounderConfidenceRoadmap(input.requestId, gapAnalysis);
  const authority = buildFounderConfidenceAuthority(
    input.requestId, contexts,
    understandingConfidence, reasoningVisibility, progressTruth,
    nextStepConfidence, decisionConfidence, uncertaintyHonesty, founderControlConfidence,
    gapAnalysis, roadmap, input,
  );

  const evaluation = evaluateFounderConfidence(authority);
  const score = buildFounderConfidenceScore(authority);

  recordCounter += 1;
  const record: FounderConfidenceRecord = {
    founderConfidenceId: `founder-confidence-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    founderConfidenceResult: evaluation.founderConfidenceResult,
    totalGaps: evaluation.totalGaps,
    criticalGaps: evaluation.criticalGaps,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerFounderConfidenceRecord(record);
  recordFounderConfidenceHistory(record);

  const report = generateFounderConfidenceReport(record, evaluation, authority);

  return {
    record,
    report,
    authority,
    result: evaluation.founderConfidenceResult,
    score,
  };
}

function appJsHasRollbackHint(): boolean {
  const appJs = readSourceText(UI_APP_PATH);
  return appJs.includes('rollback') || appJs.includes('Rollback');
}

export function getFounderConfidenceEngineRuntimeReport(): FounderConfidenceRuntimeReport {
  const cache = getFounderConfidenceCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    understandingValidateCount: getUnderstandingValidateCount(),
    reasoningValidateCount: getReasoningValidateCount(),
    progressTruthValidateCount: getProgressTruthValidateCount(),
    nextStepValidateCount: getNextStepValidateCount(),
    decisionValidateCount: getDecisionValidateCount(),
    uncertaintyValidateCount: getUncertaintyValidateCount(),
    controlValidateCount: getControlValidateCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    reportCount: getReportCount(),
    recordCount: getFounderConfidenceRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFounderConfidenceEngineOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
