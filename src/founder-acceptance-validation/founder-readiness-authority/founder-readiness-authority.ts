/**
 * Founder Readiness Authority — orchestration and read-only integrations.
 * Final evaluation authority before Founder Acceptance Orchestrator.
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
import { evaluateFounderFrictionDetector } from '../founder-friction-detector/index.js';
import { evaluateProductRealityOrchestrator } from '../../product-reality-verification/product-reality-orchestrator/index.js';
import { evaluateProductExperienceEngine } from '../../product-reality-verification/product-experience-verification-engine/index.js';
import { evaluateUXHeuristicEngine } from '../../product-reality-verification/ux-heuristic-evaluator/index.js';
import type {
  FounderReadinessRecord,
  FounderReadinessResultBundle,
  FounderReadinessRuntimeReport,
  FounderReadinessAuthorityInput,
} from './founder-readiness-types.js';
import {
  FOUNDER_READINESS_AUTHORITY_PASS_TOKEN,
  FOUNDER_READINESS_OWNER_MODULE,
} from './founder-readiness-types.js';
import { buildAllReadinessContexts, getContextBuildCount } from './readiness-context-builder.js';
import { analyzeWorkflowReadiness, getWorkflowReadinessAnalyzeCount } from './workflow-readiness-analyzer.js';
import { analyzeConfidenceReadiness, getConfidenceReadinessAnalyzeCount } from './confidence-readiness-analyzer.js';
import { analyzeTrustReadiness, getTrustReadinessAnalyzeCount } from './trust-readiness-analyzer.js';
import { analyzeProductivityReadiness, getProductivityReadinessAnalyzeCount } from './productivity-readiness-analyzer.js';
import { analyzeFrictionReadiness, getFrictionReadinessAnalyzeCount } from './friction-readiness-analyzer.js';
import { analyzeReadinessBlockers, getBlockerAnalyzeCount } from './readiness-blocker-analyzer.js';
import { analyzeReadinessGaps, getGapAnalysisCount } from './readiness-gap-analyzer.js';
import { buildFounderReadinessRoadmap, getRoadmapBuildCount } from './readiness-roadmap-builder.js';
import { buildFounderReadinessAuthority, getAuthorityBuildCount } from './founder-readiness-authority-builder.js';
import { buildFounderReadinessScore, evaluateFounderReadiness, getEvaluationCount } from './founder-readiness-evaluator.js';
import { registerFounderReadinessRecord, getFounderReadinessRecordCount } from './founder-readiness-registry.js';
import { recordFounderReadinessHistory } from './bounded-history.js';
import { generateFounderReadinessReport, getReportCount } from './founder-readiness-report-builder.js';
import { getFounderReadinessCacheStats, getCachedSourceText, setCachedSourceText } from './founder-readiness-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface FounderReadinessSurfaceSnapshot {
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
  frictionAuthorityId: string;
  registeredAt: number;
}

let cachedSnapshot: FounderReadinessSurfaceSnapshot | null = null;
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

export function getDevPulseV2FounderReadinessAuthority(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_READINESS_OWNER_MODULE,
    passToken: FOUNDER_READINESS_AUTHORITY_PASS_TOKEN,
    phase: 24.87,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderReadinessAuthorityWithSurface(): FounderReadinessSurfaceSnapshot {
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
  const friction = evaluateFounderFrictionDetector({ requestId: 'bootstrap-friction' });

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
    frictionAuthorityId: friction.authority.authorityId,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderReadinessAuthorityWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderReadinessAuthorityWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderReadinessAuthorityWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderReadinessAuthorityWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerFounderReadinessAuthorityWithAcceptanceChain(): {
  founderAcceptanceFramework: boolean;
  founderWorkflowValidation: boolean;
  founderConfidenceEngine: boolean;
  founderTrustValidation: boolean;
  founderProductivityValidation: boolean;
  founderFrictionDetector: boolean;
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
    founderFrictionDetector: caps.includes('FOUNDER_FRICTION_DETECTOR'),
    productRealityOrchestrator: caps.includes('PRODUCT_REALITY_ORCHESTRATOR'),
    readOnly: true,
  };
}

export function evaluateFounderReadinessAuthority(input: FounderReadinessAuthorityInput): FounderReadinessResultBundle {
  const snapshot = registerFounderReadinessAuthorityWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const base = { projectId, workspaceId, governanceBlocked: input.governanceBlocked };

  buildFounderAcceptanceFramework({ requestId: `${input.requestId}-framework`, ...base });
  buildAllReadinessContexts();

  const workflow = evaluateFounderWorkflowValidation({
    requestId: `${input.requestId}-workflow`,
    ...base,
    workflowClarityWeak: input.workflowNotReady,
    workflowFrictionHigh: input.workflowNotReady,
    workflowDeadEnd: input.workflowNotReady,
    workflowOutcomeUnclear: input.workflowNotReady,
  });

  const confidence = evaluateFounderConfidenceEngine({
    requestId: `${input.requestId}-confidence`,
    ...base,
    understandingWeak: input.confidenceNotReady,
    progressInflated: input.confidenceNotReady,
    nextStepUnclear: input.confidenceNotReady,
  });

  const trust = evaluateFounderTrustValidation({
    requestId: `${input.requestId}-trust`,
    ...base,
    transparencyWeak: input.trustNotReady,
    evidenceHidden: input.trustNotReady,
    governanceViolation: input.trustNotReady,
  });

  const productivity = evaluateFounderProductivityValidation({
    requestId: `${input.requestId}-productivity`,
    ...base,
    workflowSlow: input.productivityNotReady,
    throughputLow: input.productivityNotReady,
    executionInefficient: input.productivityNotReady,
    manualWorkHigh: input.productivityNotReady,
  });

  const friction = evaluateFounderFrictionDetector({
    requestId: `${input.requestId}-friction`,
    ...base,
    confusionHigh: input.frictionBlocking,
    workflowDeadEnd: input.frictionBlocking,
    trustBreakdown: input.frictionBlocking,
    productivityBlocked: input.frictionBlocking,
    launchBlocked: input.launchNotReady,
  });

  const productReality = evaluateProductRealityOrchestrator({
    requestId: `${input.requestId}-pr`,
    ...base,
    workflowBroken: input.workflowNotReady,
    experienceFragmented: input.operationalGaps,
  });

  evaluateProductExperienceEngine({
    requestId: `${input.requestId}-pe`,
    ...base,
    workflowBreak: input.operationalGaps,
  });

  evaluateUXHeuristicEngine({
    requestId: `${input.requestId}-ux`,
    ...base,
    workflowBreak: input.operationalGaps,
  });

  const workflowReadiness = analyzeWorkflowReadiness(input, {
    founderWorkflowScore: workflow.score.overallScore,
    clarityScore: workflow.score.clarityScore,
    continuityScore: workflow.score.continuityScore,
    outcomeScore: workflow.score.outcomeScore,
    workflowGapCount: workflow.authority.gapAnalysis.gaps.length,
  });

  const confidenceReadiness = analyzeConfidenceReadiness(input, {
    founderConfidenceScore: confidence.score.overallScore,
    understandingScore: confidence.score.understandingConfidenceScore,
    reasoningVisibilityScore: confidence.score.reasoningVisibilityScore,
    confidenceGapCount: confidence.authority.gapAnalysis.gaps.length,
  });

  const trustReadiness = analyzeTrustReadiness(input, {
    founderTrustScore: trust.score.overallScore,
    governanceScore: trust.score.governanceComplianceScore,
    verificationIntegrityScore: trust.score.verificationIntegrityScore,
    trustGapCount: trust.authority.gapAnalysis.gaps.length,
  });

  const productivityReadiness = analyzeProductivityReadiness(input, {
    founderProductivityScore: productivity.score.overallScore,
    throughputScore: productivity.score.throughputScore,
    executionEfficiencyScore: productivity.score.executionEfficiencyScore,
    productivityGapCount: productivity.authority.gapAnalysis.gaps.length,
  });

  const frictionReadiness = analyzeFrictionReadiness(input, {
    founderFrictionScore: friction.score.overallScore,
    criticalFrictionGaps: friction.authority.gapAnalysis.criticalFrictionGaps.length,
    majorFrictionGaps: friction.authority.gapAnalysis.majorFrictionGaps.length,
    launchFrictionScore: friction.score.launchFrictionScore,
  });

  const launchBlockerCount = productReality.report.launchBlockers.length;
  const operationalSurfaceReady = snapshot.chatPresent && snapshot.operatorFeedPresent;

  const readinessBlockers = analyzeReadinessBlockers(
    input.requestId,
    input,
    { workflowReadiness, confidenceReadiness, trustReadiness, productivityReadiness, frictionReadiness },
    {
      launchBlockerCount,
      releaseReadiness: productReality.report.releaseReadiness,
      operationalSurfaceReady,
      adoptionBlockerCount: input.launchNotReady === true ? 1 : 0,
    },
  );

  const gapAnalysis = analyzeReadinessGaps(input.requestId, {
    workflowReadiness,
    confidenceReadiness,
    trustReadiness,
    productivityReadiness,
    frictionReadiness,
  });

  const roadmap = buildFounderReadinessRoadmap(input.requestId, gapAnalysis, readinessBlockers);
  const authority = buildFounderReadinessAuthority(
    input.requestId,
    workflowReadiness,
    confidenceReadiness,
    trustReadiness,
    productivityReadiness,
    frictionReadiness,
    readinessBlockers,
    gapAnalysis,
    roadmap,
    input,
    launchBlockerCount,
  );

  const evaluation = evaluateFounderReadiness(authority);
  const score = buildFounderReadinessScore(authority);

  recordCounter += 1;
  const record: FounderReadinessRecord = {
    founderReadinessId: `founder-readiness-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    founderReadinessResult: evaluation.founderReadinessResult,
    founderReadinessStatus: evaluation.founderReadinessStatus,
    totalGaps: evaluation.totalGaps,
    criticalGaps: evaluation.criticalGaps,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerFounderReadinessRecord(record);
  recordFounderReadinessHistory(record);

  const report = generateFounderReadinessReport(record, evaluation, authority);

  return {
    record,
    report,
    authority,
    result: evaluation.founderReadinessResult,
    score,
    status: evaluation.founderReadinessStatus,
  };
}

export function getFounderReadinessAuthorityRuntimeReport(): FounderReadinessRuntimeReport {
  const cache = getFounderReadinessCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    workflowReadinessAnalyzeCount: getWorkflowReadinessAnalyzeCount(),
    confidenceReadinessAnalyzeCount: getConfidenceReadinessAnalyzeCount(),
    trustReadinessAnalyzeCount: getTrustReadinessAnalyzeCount(),
    productivityReadinessAnalyzeCount: getProductivityReadinessAnalyzeCount(),
    frictionReadinessAnalyzeCount: getFrictionReadinessAnalyzeCount(),
    blockerAnalyzeCount: getBlockerAnalyzeCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    reportCount: getReportCount(),
    recordCount: getFounderReadinessRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFounderReadinessAuthorityOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
