/**
 * Founder Acceptance Orchestrator — orchestration and read-only integrations.
 * Final authority for the entire Founder Acceptance Validation stack.
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
import { evaluateFounderReadinessAuthority } from '../founder-readiness-authority/index.js';
import type { FounderWorkflowResultBundle } from '../founder-workflow-validation/founder-workflow-types.js';
import type { FounderConfidenceResultBundle } from '../founder-confidence-engine/founder-confidence-types.js';
import type { FounderTrustResultBundle } from '../founder-trust-validation/founder-trust-types.js';
import type { FounderProductivityResultBundle } from '../founder-productivity-validation/founder-productivity-types.js';
import type { FounderFrictionResultBundle } from '../founder-friction-detector/founder-friction-types.js';
import type { FounderReadinessResultBundle } from '../founder-readiness-authority/founder-readiness-types.js';
import { evaluateProductRealityOrchestrator } from '../../product-reality-verification/product-reality-orchestrator/index.js';
import type { ProductRealityResultBundle } from '../../product-reality-verification/product-reality-orchestrator/product-reality-types.js';
import { evaluateProductExperienceEngine } from '../../product-reality-verification/product-experience-verification-engine/index.js';
import { evaluateUXHeuristicEngine } from '../../product-reality-verification/ux-heuristic-evaluator/index.js';
import type {
  FounderAcceptanceRecord,
  FounderAcceptanceResultBundle,
  FounderAcceptanceRuntimeReport,
  FounderAcceptanceOrchestratorInput,
} from './founder-acceptance-orchestrator-types.js';
import {
  FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_ORCHESTRATOR_OWNER_MODULE,
} from './founder-acceptance-orchestrator-types.js';
import { buildFounderAcceptanceAggregate, getAggregateBuildCount } from './acceptance-aggregation-builder.js';
import { detectAuthorityConflicts, getConflictDetectCount } from './authority-conflict-detector.js';
import { analyzeAcceptanceBlockers, getAcceptanceBlockerAnalyzeCount } from './acceptance-blocker-analyzer.js';
import { analyzeFounderAcceptance, getFounderAcceptanceAnalyzeCount } from './founder-acceptance-analyzer.js';
import { analyzeReadinessAcceptance, getReadinessAcceptanceAnalyzeCount } from './readiness-acceptance-analyzer.js';
import { analyzeFrictionAcceptanceImpact, getFrictionImpactAnalyzeCount } from './friction-impact-analyzer.js';
import { analyzeAcceptanceGaps, getGapAnalysisCount } from './acceptance-gap-analyzer.js';
import { buildFounderAcceptanceRoadmap, getRoadmapBuildCount } from './acceptance-roadmap-builder.js';
import { buildFounderAcceptanceAuthority, getAuthorityBuildCount } from './founder-acceptance-authority-builder.js';
import { buildFounderAcceptanceScore, evaluateFounderAcceptance, getEvaluationCount } from './founder-acceptance-evaluator.js';
import { registerFounderAcceptanceRecord, getFounderAcceptanceRecordCount } from './founder-acceptance-registry.js';
import { recordFounderAcceptanceHistory } from './bounded-history.js';
import { generateFounderAcceptanceReport, getReportCount } from './founder-acceptance-report-builder.js';
import { getFounderAcceptanceCacheStats, getCachedSourceText, setCachedSourceText } from './founder-acceptance-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface FounderAcceptanceSurfaceSnapshot {
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
  readinessAuthorityId: string;
  registeredAt: number;
}

let cachedSnapshot: FounderAcceptanceSurfaceSnapshot | null = null;
let bootstrapReuseCount = 0;
let upstreamChainReuseCount = 0;
let recordCounter = 0;

interface CachedUpstreamChain {
  cacheKey: string;
  workflow: FounderWorkflowResultBundle;
  confidence: FounderConfidenceResultBundle;
  trust: FounderTrustResultBundle;
  productivity: FounderProductivityResultBundle;
  friction: FounderFrictionResultBundle;
  readiness: FounderReadinessResultBundle;
  productReality: ProductRealityResultBundle;
}

let cachedUpstreamChain: CachedUpstreamChain | null = null;

function buildUpstreamCacheKey(
  input: FounderAcceptanceOrchestratorInput,
  projectId: string,
  workspaceId: string,
): string {
  return [
    projectId,
    workspaceId,
    input.workflowWeak,
    input.confidenceWeak,
    input.trustWeak,
    input.productivityWeak,
    input.frictionExcessive,
    input.readinessLow,
    input.launchBlocked,
    input.adoptionBlocked,
    input.governanceBlocked,
  ].join('|');
}

function resolveUpstreamChain(
  input: FounderAcceptanceOrchestratorInput,
  base: { projectId: string; workspaceId: string; governanceBlocked?: boolean },
): CachedUpstreamChain {
  const cacheKey = buildUpstreamCacheKey(input, base.projectId, base.workspaceId);
  if (cachedUpstreamChain?.cacheKey === cacheKey) {
    upstreamChainReuseCount += 1;
    return cachedUpstreamChain;
  }

  const stableId = `acceptance-upstream-${cacheKey}`;

  buildFounderAcceptanceFramework({ requestId: `${stableId}-framework`, ...base });

  const workflow = evaluateFounderWorkflowValidation({
    requestId: `${stableId}-workflow`,
    ...base,
    workflowClarityWeak: input.workflowWeak,
    workflowFrictionHigh: input.workflowWeak,
    workflowDeadEnd: input.workflowWeak,
  });

  const confidence = evaluateFounderConfidenceEngine({
    requestId: `${stableId}-confidence`,
    ...base,
    understandingWeak: input.confidenceWeak,
    nextStepUnclear: input.confidenceWeak,
  });

  const trust = evaluateFounderTrustValidation({
    requestId: `${stableId}-trust`,
    ...base,
    transparencyWeak: input.trustWeak,
    evidenceHidden: input.trustWeak,
    governanceViolation: input.trustWeak,
  });

  const productivity = evaluateFounderProductivityValidation({
    requestId: `${stableId}-productivity`,
    ...base,
    workflowSlow: input.productivityWeak,
    throughputLow: input.productivityWeak,
    executionInefficient: input.productivityWeak,
  });

  const friction = evaluateFounderFrictionDetector({
    requestId: `${stableId}-friction`,
    ...base,
    confusionHigh: input.frictionExcessive,
    workflowDeadEnd: input.frictionExcessive,
    trustBreakdown: input.frictionExcessive,
    productivityBlocked: input.frictionExcessive,
    launchBlocked: input.launchBlocked,
  });

  const readiness = evaluateFounderReadinessAuthority({
    requestId: `${stableId}-readiness`,
    ...base,
    workflowNotReady: input.readinessLow,
    confidenceNotReady: input.confidenceWeak,
    trustNotReady: input.trustWeak,
    productivityNotReady: input.productivityWeak,
    frictionBlocking: input.frictionExcessive,
    launchNotReady: input.launchBlocked,
    operationalGaps: input.adoptionBlocked,
  });

  const productReality = evaluateProductRealityOrchestrator({
    requestId: `${stableId}-pr`,
    ...base,
    workflowBroken: input.workflowWeak,
    experienceFragmented: input.adoptionBlocked,
  });

  evaluateProductExperienceEngine({
    requestId: `${stableId}-pe`,
    ...base,
    workflowBreak: input.adoptionBlocked,
  });

  evaluateUXHeuristicEngine({
    requestId: `${stableId}-ux`,
    ...base,
    workflowBreak: input.adoptionBlocked,
  });

  cachedUpstreamChain = {
    cacheKey,
    workflow,
    confidence,
    trust,
    productivity,
    friction,
    readiness,
    productReality,
  };
  return cachedUpstreamChain;
}

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

export function getDevPulseV2FounderAcceptanceOrchestrator(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_ACCEPTANCE_ORCHESTRATOR_OWNER_MODULE,
    passToken: FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS_TOKEN,
    phase: 24.88,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderAcceptanceOrchestratorWithSurface(): FounderAcceptanceSurfaceSnapshot {
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
  const readiness = evaluateFounderReadinessAuthority({ requestId: 'bootstrap-readiness' });

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
    readinessAuthorityId: readiness.authority.authorityId,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderAcceptanceOrchestratorWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderAcceptanceOrchestratorWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderAcceptanceOrchestratorWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderAcceptanceOrchestratorWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerFounderAcceptanceOrchestratorWithAcceptanceChain(): {
  founderAcceptanceFramework: boolean;
  founderWorkflowValidation: boolean;
  founderConfidenceEngine: boolean;
  founderTrustValidation: boolean;
  founderProductivityValidation: boolean;
  founderFrictionDetector: boolean;
  founderReadinessAuthority: boolean;
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
    founderReadinessAuthority: caps.includes('FOUNDER_READINESS_AUTHORITY'),
    productRealityOrchestrator: caps.includes('PRODUCT_REALITY_ORCHESTRATOR'),
    readOnly: true,
  };
}

export function evaluateFounderAcceptanceOrchestrator(
  input: FounderAcceptanceOrchestratorInput,
): FounderAcceptanceResultBundle {
  registerFounderAcceptanceOrchestratorWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const base = { projectId, workspaceId, governanceBlocked: input.governanceBlocked };

  const upstream = resolveUpstreamChain(input, base);
  const { workflow, confidence, trust, productivity, friction, readiness, productReality } = upstream;

  const workflowScore = workflow.score.overallScore;
  const confidenceScore = confidence.score.overallScore;
  const trustScore = trust.score.overallScore;
  const productivityScore = productivity.score.overallScore;
  const frictionScore = friction.score.overallScore;
  const readinessScore = readiness.score.overallScore;

  const criticalGapCount =
    workflow.authority.gapAnalysis.gaps.filter((g) => g.severity === 'CRITICAL').length
    + confidence.authority.gapAnalysis.gaps.filter((g) => g.severity === 'CRITICAL').length
    + trust.authority.gapAnalysis.gaps.filter((g) => g.severity === 'CRITICAL').length
    + productivity.authority.gapAnalysis.gaps.filter((g) => g.severity === 'CRITICAL').length
    + friction.authority.gapAnalysis.criticalFrictionGaps.length
    + readiness.authority.gapAnalysis.criticalReadinessGaps.length;

  const majorGapCount =
    workflow.authority.gapAnalysis.gaps.filter((g) => g.severity === 'MAJOR').length
    + friction.authority.gapAnalysis.majorFrictionGaps.length
    + readiness.authority.gapAnalysis.majorReadinessGaps.length;

  const minorGapCount =
    workflow.authority.gapAnalysis.gaps.filter((g) => g.severity === 'MINOR').length
    + friction.authority.gapAnalysis.minorFrictionGaps.length;

  const criticalBlockerCount = readiness.authority.readinessBlockers.criticalReadinessBlockers.length;

  const aggregate = buildFounderAcceptanceAggregate(input.requestId, {
    workflowScore,
    confidenceScore,
    trustScore,
    productivityScore,
    frictionScore,
    readinessScore,
    criticalGapCount,
    majorGapCount,
    minorGapCount,
    criticalBlockerCount,
  });

  const conflicts = detectAuthorityConflicts(input.requestId, {
    workflowScore,
    confidenceScore,
    trustScore,
    productivityScore,
    frictionScore,
    readinessScore,
    overallAcceptanceScore: aggregate.overallAcceptanceScore,
  });

  const launchBlockerCount = productReality.report.launchBlockers.length;

  const blockers = analyzeAcceptanceBlockers(input.requestId, input, {
    launchBlockerCount,
    releaseReadiness: productReality.report.releaseReadiness,
    readinessCriticalBlockers: readiness.authority.readinessBlockers.criticalReadinessBlockers.length,
    frictionCriticalGaps: friction.authority.gapAnalysis.criticalFrictionGaps.length,
    trustCriticalGaps: trust.authority.gapAnalysis.gaps.filter((g) => g.severity === 'CRITICAL').length,
  });

  const founderAcceptance = analyzeFounderAcceptance(input, {
    workflowScore,
    confidenceScore,
    trustScore,
    workflowResult: workflow.result,
    trustResult: trust.result,
  });

  const readinessAcceptance = analyzeReadinessAcceptance(input, {
    readinessScore,
    readinessStatus: readiness.status,
    launchBlockerCount,
    releaseReadiness: productReality.report.releaseReadiness,
  });

  const frictionImpact = analyzeFrictionAcceptanceImpact(input, {
    frictionScore,
    criticalFrictionGaps: friction.authority.gapAnalysis.criticalFrictionGaps.length,
    majorFrictionGaps: friction.authority.gapAnalysis.majorFrictionGaps.length,
    frictionResult: friction.result,
  });

  const gapAnalysis = analyzeAcceptanceGaps(input.requestId, {
    founderAcceptance,
    readinessAcceptance,
    frictionImpact,
  });

  const roadmap = buildFounderAcceptanceRoadmap(input.requestId, gapAnalysis, blockers);

  const authority = buildFounderAcceptanceAuthority(
    input.requestId,
    aggregate,
    conflicts,
    blockers,
    founderAcceptance,
    readinessAcceptance,
    frictionImpact,
    gapAnalysis,
    roadmap,
    input,
    launchBlockerCount,
    readiness.status,
  );

  const evaluation = evaluateFounderAcceptance(authority);
  const score = buildFounderAcceptanceScore(authority);

  recordCounter += 1;
  const record: FounderAcceptanceRecord = {
    founderAcceptanceId: `founder-acceptance-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    founderAcceptanceResult: evaluation.founderAcceptanceResult,
    founderAcceptanceVerdict: evaluation.founderAcceptanceVerdict,
    totalGaps: evaluation.totalGaps,
    criticalGaps: evaluation.criticalGaps,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerFounderAcceptanceRecord(record);
  recordFounderAcceptanceHistory(record);

  const report = generateFounderAcceptanceReport(record, evaluation, authority);

  return {
    record,
    report,
    authority,
    result: evaluation.founderAcceptanceResult,
    score,
    verdict: evaluation.founderAcceptanceVerdict,
  };
}

export function getFounderAcceptanceOrchestratorRuntimeReport(): FounderAcceptanceRuntimeReport {
  const cache = getFounderAcceptanceCacheStats();
  return {
    aggregateBuildCount: getAggregateBuildCount(),
    conflictDetectCount: getConflictDetectCount(),
    blockerAnalyzeCount: getAcceptanceBlockerAnalyzeCount(),
    founderAcceptanceAnalyzeCount: getFounderAcceptanceAnalyzeCount(),
    readinessAcceptanceAnalyzeCount: getReadinessAcceptanceAnalyzeCount(),
    frictionImpactAnalyzeCount: getFrictionImpactAnalyzeCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    reportCount: getReportCount(),
    recordCount: getFounderAcceptanceRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    upstreamChainReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFounderAcceptanceOrchestrationForTests(): void {
  cachedSnapshot = null;
  cachedUpstreamChain = null;
  bootstrapReuseCount = 0;
  upstreamChainReuseCount = 0;
  recordCounter = 0;
}
