/**
 * Founder Productivity Validation — orchestration and read-only integrations.
 * Productivity validation authority in Founder Acceptance stack.
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
import { evaluateFounderConfidenceEngine } from '../founder-confidence-engine/index.js';
import { evaluateFounderTrustValidation } from '../founder-trust-validation/index.js';
import { evaluateProductRealityOrchestrator } from '../../product-reality-verification/product-reality-orchestrator/index.js';
import { evaluateProductExperienceEngine } from '../../product-reality-verification/product-experience-verification-engine/index.js';
import { evaluateUXHeuristicEngine } from '../../product-reality-verification/ux-heuristic-evaluator/index.js';
import type {
  FounderProductivityRecord,
  FounderProductivityResultBundle,
  FounderProductivityRuntimeReport,
  FounderProductivityValidationInput,
} from './founder-productivity-types.js';
import {
  FOUNDER_PRODUCTIVITY_VALIDATION_PASS_TOKEN,
  FOUNDER_PRODUCTIVITY_OWNER_MODULE,
} from './founder-productivity-types.js';
import { buildAllProductivityContexts, getContextBuildCount } from './productivity-context-builder.js';
import { validateWorkflowAcceleration, getAccelerationValidateCount } from './workflow-acceleration-validator.js';
import { validateManualWorkReduction, getManualWorkValidateCount } from './manual-work-reduction-validator.js';
import { validateDecisionReduction, getDecisionValidateCount } from './decision-reduction-validator.js';
import { validateContextSwitching, getContextSwitchValidateCount } from './context-switching-validator.js';
import { validateExecutionEfficiency, getExecutionValidateCount } from './execution-efficiency-validator.js';
import { validateThroughput, getThroughputValidateCount } from './throughput-validator.js';
import { validateWorkflowOverhead, getOverheadValidateCount } from './workflow-overhead-validator.js';
import { analyzeProductivityGaps, getGapAnalysisCount } from './productivity-gap-analyzer.js';
import { buildFounderProductivityRoadmap, getRoadmapBuildCount } from './productivity-roadmap-builder.js';
import { buildFounderProductivityAuthority, getAuthorityBuildCount } from './founder-productivity-authority-builder.js';
import { buildFounderProductivityScore, evaluateFounderProductivity, getEvaluationCount } from './founder-productivity-evaluator.js';
import { registerFounderProductivityRecord, getFounderProductivityRecordCount } from './founder-productivity-registry.js';
import { recordFounderProductivityHistory } from './bounded-history.js';
import { generateFounderProductivityReport, getReportCount } from './founder-productivity-report-builder.js';
import { getFounderProductivityCacheStats, getCachedSourceText, setCachedSourceText } from './founder-productivity-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface FounderProductivitySurfaceSnapshot {
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
  confidenceAuthorityId: string;
  trustAuthorityId: string;
  registeredAt: number;
}

let cachedSnapshot: FounderProductivitySurfaceSnapshot | null = null;
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

export function getDevPulseV2FounderProductivityValidation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_PRODUCTIVITY_OWNER_MODULE,
    passToken: FOUNDER_PRODUCTIVITY_VALIDATION_PASS_TOKEN,
    phase: 24.85,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderProductivityValidationWithSurface(): FounderProductivitySurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);
  const appJs = readSourceText(UI_APP_PATH);
  const framework = buildFounderAcceptanceFramework({ requestId: 'bootstrap-framework' });
  const workflow = evaluateFounderWorkflowValidation({ requestId: 'bootstrap-workflow' });
  const confidence = evaluateFounderConfidenceEngine({ requestId: 'bootstrap-confidence' });
  const trust = evaluateFounderTrustValidation({ requestId: 'bootstrap-trust' });

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
    confidenceAuthorityId: confidence.authority.authorityId,
    trustAuthorityId: trust.authority.authorityId,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderProductivityValidationWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderProductivityValidationWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderProductivityValidationWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderProductivityValidationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerFounderProductivityValidationWithAcceptanceChain(): {
  founderAcceptanceFramework: boolean;
  founderWorkflowValidation: boolean;
  founderConfidenceEngine: boolean;
  founderTrustValidation: boolean;
  productRealityOrchestrator: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    founderAcceptanceFramework: caps.includes('FOUNDER_ACCEPTANCE_FRAMEWORK'),
    founderWorkflowValidation: caps.includes('FOUNDER_WORKFLOW_VALIDATION'),
    founderConfidenceEngine: caps.includes('FOUNDER_CONFIDENCE_ENGINE'),
    founderTrustValidation: caps.includes('FOUNDER_TRUST_VALIDATION'),
    productRealityOrchestrator: caps.includes('PRODUCT_REALITY_ORCHESTRATOR'),
    readOnly: true,
  };
}

export function evaluateFounderProductivityValidation(input: FounderProductivityValidationInput): FounderProductivityResultBundle {
  const snapshot = registerFounderProductivityValidationWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const base = { projectId, workspaceId, governanceBlocked: input.governanceBlocked };

  buildFounderAcceptanceFramework({ requestId: `${input.requestId}-framework`, ...base });

  const workflow = evaluateFounderWorkflowValidation({
    requestId: `${input.requestId}-workflow`,
    ...base,
    workflowEfficiencyLow: input.executionInefficient,
    workflowContinuityBreak: input.contextSwitchingHigh,
    workflowFrictionHigh: input.workflowOverheadHigh,
    excessiveSteps: input.excessiveSteps,
    contextLoss: input.contextSwitchingHigh,
  });

  const confidence = evaluateFounderConfidenceEngine({
    requestId: `${input.requestId}-confidence`,
    ...base,
    nextStepUnclear: input.decisionFatigue,
    decisionUnsupported: input.decisionFatigue,
  });

  const trust = evaluateFounderTrustValidation({
    requestId: `${input.requestId}-trust`,
    ...base,
    executionUnpredictable: input.executionInefficient,
    transparencyWeak: input.coordinationBurden,
  });

  const productReality = evaluateProductRealityOrchestrator({
    requestId: `${input.requestId}-pr`,
    ...base,
    workflowBroken: input.workflowSlow,
    experienceFragmented: input.contextSwitchingHigh,
  });

  const productExperience = evaluateProductExperienceEngine({
    requestId: `${input.requestId}-pe`,
    ...base,
    workflowBreak: input.contextSwitchingHigh,
    experienceBreak: input.contextSwitchingHigh,
  }).report;

  const ux = evaluateUXHeuristicEngine({
    requestId: `${input.requestId}-ux`,
    ...base,
    workflowBreak: input.contextSwitchingHigh,
  }).report;

  const contexts = buildAllProductivityContexts();

  const stepOverhead = [
    input.excessiveSteps,
    input.workflowOverheadHigh,
    input.coordinationBurden,
    input.repetitiveWork,
  ].filter(Boolean).length;

  const workflowAcceleration = validateWorkflowAcceleration(input, {
    workflowEfficiencyScore: workflow.score.efficiencyScore,
    workflowContinuityScore: workflow.score.continuityScore,
    outcomeScore: workflow.score.outcomeScore,
    stepOverheadEstimate: stepOverhead,
  });

  const automationSurfaceScore = Math.round(
    (snapshot.operatorFeedPresent ? 80 : 50) + (snapshot.capabilityEntries > 30 ? 10 : 0),
  );

  const manualWorkReduction = validateManualWorkReduction(input, {
    founderUsabilityScore: ux.founderUsabilityScore,
    cognitiveLoadScore: ux.cognitiveLoadScore,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    automationSurfaceScore,
  });

  const decisionReduction = validateDecisionReduction(input, {
    decisionConfidenceScore: confidence.score.decisionConfidenceScore,
    founderPriorityCount: productReality.report.founderPriorities.length,
    nextStepConfidenceScore: confidence.score.nextStepConfidenceScore,
    trustClarityScore: trust.score.transparencyScore,
  });

  const contextSwitching = validateContextSwitching(input, {
    workflowContinuityScore: workflow.score.continuityScore,
    experienceContinuityScore: productExperience.experienceContinuityScore,
    contextLossRisk: input.contextSwitchingHigh === true,
    fragmentationScore: Math.max(0, 100 - ux.founderFrictionRisks.length * 8),
  });

  const executionEfficiency = validateExecutionEfficiency(input, {
    workflowEfficiencyScore: workflow.score.efficiencyScore,
    founderUsabilityScore: ux.founderUsabilityScore,
    validationEfficiencyScore: productReality.score.overallScore,
    coordinationScore: snapshot.feedStreamPresent ? 78 : 62,
  });

  const throughput = validateThroughput(input, {
    productRealityScore: productReality.report.productRealityScore,
    releaseReadiness: productReality.report.releaseReadiness,
    launchBlockerCount: productReality.report.launchBlockers.length,
    workflowOutcomeScore: workflow.score.outcomeScore,
  });

  const reportingOverhead = productReality.report.launchBlockers.length > 3 ? 1 : 0;
  const coordinationOverhead = input.coordinationBurden === true ? 2 : input.repetitiveWork === true ? 1 : 0;

  const workflowOverhead = validateWorkflowOverhead(input, {
    cognitiveLoadScore: ux.cognitiveLoadScore,
    frictionScore: workflow.score.frictionScore,
    reportingOverheadEstimate: reportingOverhead,
    coordinationOverheadEstimate: coordinationOverhead,
  });

  const gapAnalysis = analyzeProductivityGaps(input.requestId, {
    workflowAcceleration,
    manualWorkReduction,
    decisionReduction,
    contextSwitching,
    executionEfficiency,
    throughput,
    workflowOverhead,
  });

  const roadmap = buildFounderProductivityRoadmap(input.requestId, gapAnalysis);
  const authority = buildFounderProductivityAuthority(
    input.requestId, contexts,
    workflowAcceleration, manualWorkReduction, decisionReduction, contextSwitching,
    executionEfficiency, throughput, workflowOverhead,
    gapAnalysis, roadmap, input,
  );

  const evaluation = evaluateFounderProductivity(authority);
  const score = buildFounderProductivityScore(authority);

  recordCounter += 1;
  const record: FounderProductivityRecord = {
    founderProductivityId: `founder-productivity-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    founderProductivityResult: evaluation.founderProductivityResult,
    totalGaps: evaluation.totalGaps,
    criticalGaps: evaluation.criticalGaps,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerFounderProductivityRecord(record);
  recordFounderProductivityHistory(record);

  const report = generateFounderProductivityReport(record, evaluation, authority);

  return {
    record,
    report,
    authority,
    result: evaluation.founderProductivityResult,
    score,
  };
}

export function getFounderProductivityValidationRuntimeReport(): FounderProductivityRuntimeReport {
  const cache = getFounderProductivityCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    accelerationValidateCount: getAccelerationValidateCount(),
    manualWorkValidateCount: getManualWorkValidateCount(),
    decisionValidateCount: getDecisionValidateCount(),
    contextSwitchValidateCount: getContextSwitchValidateCount(),
    executionValidateCount: getExecutionValidateCount(),
    throughputValidateCount: getThroughputValidateCount(),
    overheadValidateCount: getOverheadValidateCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    reportCount: getReportCount(),
    recordCount: getFounderProductivityRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFounderProductivityValidationOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
