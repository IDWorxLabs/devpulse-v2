/**
 * Founder Friction Detector — orchestration and read-only integrations.
 * Founder friction authority in Founder Acceptance stack.
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
import { evaluateFounderProductivityValidation } from '../founder-productivity-validation/index.js';
import { evaluateProductRealityOrchestrator } from '../../product-reality-verification/product-reality-orchestrator/index.js';
import { evaluateProductExperienceEngine } from '../../product-reality-verification/product-experience-verification-engine/index.js';
import { evaluateUXHeuristicEngine } from '../../product-reality-verification/ux-heuristic-evaluator/index.js';
import type {
  FounderFrictionRecord,
  FounderFrictionResultBundle,
  FounderFrictionRuntimeReport,
  FounderFrictionDetectorInput,
} from './founder-friction-types.js';
import {
  FOUNDER_FRICTION_DETECTOR_PASS_TOKEN,
  FOUNDER_FRICTION_OWNER_MODULE,
} from './founder-friction-types.js';
import { buildAllFrictionContexts, getContextBuildCount } from './friction-context-builder.js';
import { detectConfusionFriction, getConfusionDetectCount } from './confusion-friction-detector.js';
import { detectWorkflowFriction, getWorkflowFrictionDetectCount } from './workflow-friction-detector.js';
import { detectDecisionFatigue, getDecisionFatigueDetectCount } from './decision-fatigue-detector.js';
import { detectContextSwitchingFriction, getContextSwitchDetectCount } from './context-switching-detector.js';
import { detectDiscoverabilityFriction, getDiscoverabilityDetectCount } from './hidden-capability-detector.js';
import { detectTrustBreakdown, getTrustBreakdownDetectCount } from './trust-breakdown-detector.js';
import { detectConfidenceBreakdown, getConfidenceBreakdownDetectCount } from './confidence-breakdown-detector.js';
import { detectProductivityFriction, getProductivityBlockerDetectCount } from './productivity-blocker-detector.js';
import { detectVerificationFriction, getVerificationFrictionDetectCount } from './verification-friction-detector.js';
import { detectLaunchFriction, getLaunchFrictionDetectCount } from './launch-blocker-friction-detector.js';
import { analyzeFrictionGaps, getGapAnalysisCount } from './friction-gap-analyzer.js';
import { buildFounderFrictionRoadmap, getRoadmapBuildCount } from './friction-roadmap-builder.js';
import { buildFounderFrictionAuthority, getAuthorityBuildCount } from './founder-friction-authority-builder.js';
import { buildFounderFrictionScore, evaluateFounderFriction, getEvaluationCount } from './founder-friction-evaluator.js';
import { registerFounderFrictionRecord, getFounderFrictionRecordCount } from './founder-friction-registry.js';
import { recordFounderFrictionHistory } from './bounded-history.js';
import { generateFounderFrictionReport, getReportCount } from './founder-friction-report-builder.js';
import { getFounderFrictionCacheStats, getCachedSourceText, setCachedSourceText } from './founder-friction-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface FounderFrictionSurfaceSnapshot {
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
  productivityAuthorityId: string;
  registeredAt: number;
}

let cachedSnapshot: FounderFrictionSurfaceSnapshot | null = null;
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

export function getDevPulseV2FounderFrictionDetector(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_FRICTION_OWNER_MODULE,
    passToken: FOUNDER_FRICTION_DETECTOR_PASS_TOKEN,
    phase: 24.86,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderFrictionDetectorWithSurface(): FounderFrictionSurfaceSnapshot {
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
  const productivity = evaluateFounderProductivityValidation({ requestId: 'bootstrap-productivity' });

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
    productivityAuthorityId: productivity.authority.authorityId,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderFrictionDetectorWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderFrictionDetectorWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderFrictionDetectorWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderFrictionDetectorWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerFounderFrictionDetectorWithAcceptanceChain(): {
  founderAcceptanceFramework: boolean;
  founderWorkflowValidation: boolean;
  founderConfidenceEngine: boolean;
  founderTrustValidation: boolean;
  founderProductivityValidation: boolean;
  productRealityOrchestrator: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    founderAcceptanceFramework: caps.includes('FOUNDER_ACCEPTANCE_FRAMEWORK'),
    founderWorkflowValidation: caps.includes('FOUNDER_WORKFLOW_VALIDATION'),
    founderConfidenceEngine: caps.includes('FOUNDER_CONFIDENCE_ENGINE'),
    founderTrustValidation: caps.includes('FOUNDER_TRUST_VALIDATION'),
    founderProductivityValidation: caps.includes('FOUNDER_PRODUCTIVITY_VALIDATION'),
    productRealityOrchestrator: caps.includes('PRODUCT_REALITY_ORCHESTRATOR'),
    readOnly: true,
  };
}

export function evaluateFounderFrictionDetector(input: FounderFrictionDetectorInput): FounderFrictionResultBundle {
  const snapshot = registerFounderFrictionDetectorWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const base = { projectId, workspaceId, governanceBlocked: input.governanceBlocked };

  buildFounderAcceptanceFramework({ requestId: `${input.requestId}-framework`, ...base });

  const workflow = evaluateFounderWorkflowValidation({
    requestId: `${input.requestId}-workflow`,
    ...base,
    workflowFrictionHigh: input.workflowDeadEnd ?? input.workflowLoop,
    workflowContinuityBreak: input.contextSwitchingHigh,
    workflowClarityWeak: input.navigationConfusion ?? input.confusionHigh,
    workflowDeadEnd: input.workflowDeadEnd ?? input.workflowLoop,
    excessiveSteps: input.excessiveSteps,
    contextLoss: input.contextSwitchingHigh,
  });

  const confidence = evaluateFounderConfidenceEngine({
    requestId: `${input.requestId}-confidence`,
    ...base,
    nextStepUnclear: input.confusionHigh,
    understandingWeak: input.confidenceBreakdown,
    progressInflated: input.confidenceBreakdown,
    decisionUnsupported: input.decisionFatigueHigh,
  });

  const trust = evaluateFounderTrustValidation({
    requestId: `${input.requestId}-trust`,
    ...base,
    transparencyWeak: input.trustBreakdown,
    evidenceHidden: input.trustBreakdown,
    verificationIntegrityWeak: input.verificationConfusing,
  });

  const productivity = evaluateFounderProductivityValidation({
    requestId: `${input.requestId}-productivity`,
    ...base,
    workflowSlow: input.productivityBlocked,
    manualWorkHigh: input.productivityBlocked,
    decisionFatigue: input.decisionFatigueHigh,
    contextSwitchingHigh: input.contextSwitchingHigh,
    executionInefficient: input.productivityBlocked,
    throughputLow: input.productivityBlocked,
    workflowOverheadHigh: input.excessiveSteps,
    excessiveSteps: input.excessiveSteps,
  });

  const productReality = evaluateProductRealityOrchestrator({
    requestId: `${input.requestId}-pr`,
    ...base,
    workflowBroken: input.workflowDeadEnd,
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

  const contexts = buildAllFrictionContexts();

  const confusionFriction = detectConfusionFriction(input, {
    navigationClarityScore: workflow.score.clarityScore,
    actionClarityScore: workflow.score.discoverabilityScore,
    workflowClarityScore: workflow.score.efficiencyScore,
  });

  const workflowFriction = detectWorkflowFriction(input, {
    workflowFrictionScore: workflow.score.frictionScore,
    continuityScore: workflow.score.continuityScore,
    frictionGapCount: workflow.authority.gapAnalysis.gaps.length,
  });

  const decisionFatigue = detectDecisionFatigue(input, {
    decisionReductionScore: productivity.score.decisionReductionScore,
    decisionConfidenceScore: confidence.score.decisionConfidenceScore,
    founderPriorityCount: productReality.report.founderPriorities.length,
  });

  const contextSwitching = detectContextSwitchingFriction(input, {
    contextSwitchingScore: productivity.score.contextSwitchingScore,
    experienceContinuityScore: productExperience.experienceContinuityScore,
    fragmentationRiskCount: ux.founderFrictionRisks.length,
  });

  const discoverability = detectDiscoverabilityFriction(input, {
    discoverabilityScore: workflow.score.discoverabilityScore,
    findPanelAliasCount: snapshot.findPanelAliases,
    capabilityCount: snapshot.capabilityEntries,
    uvlDiscoverable: snapshot.uvlDiscoverable,
  });

  const trustBreakdowns = detectTrustBreakdown(input, {
    founderTrustScore: trust.score.overallScore,
    truthfulnessScore: trust.score.truthfulnessScore,
    transparencyScore: trust.score.transparencyScore,
    trustGapCount: trust.authority.gapAnalysis.gaps.length,
  });

  const confidenceBreakdowns = detectConfidenceBreakdown(input, {
    founderConfidenceScore: confidence.score.overallScore,
    progressTruthScore: confidence.score.progressTruthScore,
    reasoningVisibilityScore: confidence.score.reasoningVisibilityScore,
    confidenceGapCount: confidence.authority.gapAnalysis.gaps.length,
  });

  const productivityBlockers = detectProductivityFriction(input, {
    founderProductivityScore: productivity.score.overallScore,
    throughputScore: productivity.score.throughputScore,
    workflowOverheadScore: productivity.score.workflowOverheadScore,
    productivityGapCount: productivity.authority.gapAnalysis.gaps.length,
  });

  const verificationFriction = detectVerificationFriction(input, {
    verificationIntegrityScore: trust.score.verificationIntegrityScore,
    uvlRowCount: snapshot.uvlRows,
    authorityConflictCount: 0,
    validationEvidenceScore: productReality.score.overallScore,
  });

  const criticalBlockerCount = productReality.report.launchBlockers.filter(
    (b) => b.blockerSeverity === 'CRITICAL' || b.blockerSeverity === 'MAJOR',
  ).length;

  const launchFriction = detectLaunchFriction(input, {
    launchBlockerCount: productReality.report.launchBlockers.length,
    releaseReadiness: productReality.report.releaseReadiness,
    productRealityScore: productReality.report.productRealityScore,
    criticalBlockerCount,
  });

  const gapAnalysis = analyzeFrictionGaps(input.requestId, {
    confusionFriction,
    workflowFriction,
    decisionFatigue,
    contextSwitching,
    discoverability,
    trustBreakdowns,
    confidenceBreakdowns,
    productivityBlockers,
    verificationFriction,
    launchFriction,
  });

  const roadmap = buildFounderFrictionRoadmap(input.requestId, gapAnalysis);
  const authority = buildFounderFrictionAuthority(
    input.requestId, contexts,
    confusionFriction, workflowFriction, decisionFatigue, contextSwitching,
    discoverability, trustBreakdowns, confidenceBreakdowns, productivityBlockers,
    verificationFriction, launchFriction,
    gapAnalysis, roadmap, input,
  );

  const evaluation = evaluateFounderFriction(authority);
  const score = buildFounderFrictionScore(authority);

  recordCounter += 1;
  const record: FounderFrictionRecord = {
    founderFrictionId: `founder-friction-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    founderFrictionResult: evaluation.founderFrictionResult,
    totalGaps: evaluation.totalGaps,
    criticalGaps: evaluation.criticalGaps,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerFounderFrictionRecord(record);
  recordFounderFrictionHistory(record);

  const report = generateFounderFrictionReport(record, evaluation, authority);

  return {
    record,
    report,
    authority,
    result: evaluation.founderFrictionResult,
    score,
  };
}

export function getFounderFrictionDetectorRuntimeReport(): FounderFrictionRuntimeReport {
  const cache = getFounderFrictionCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    confusionDetectCount: getConfusionDetectCount(),
    workflowFrictionDetectCount: getWorkflowFrictionDetectCount(),
    decisionFatigueDetectCount: getDecisionFatigueDetectCount(),
    contextSwitchDetectCount: getContextSwitchDetectCount(),
    discoverabilityDetectCount: getDiscoverabilityDetectCount(),
    trustBreakdownDetectCount: getTrustBreakdownDetectCount(),
    confidenceBreakdownDetectCount: getConfidenceBreakdownDetectCount(),
    productivityBlockerDetectCount: getProductivityBlockerDetectCount(),
    verificationFrictionDetectCount: getVerificationFrictionDetectCount(),
    launchFrictionDetectCount: getLaunchFrictionDetectCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    reportCount: getReportCount(),
    recordCount: getFounderFrictionRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFounderFrictionDetectorOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
