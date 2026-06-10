/**
 * Product Reality Orchestrator — orchestration and read-only integrations.
 * Final authority for Product Reality Verification stack.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS } from '../../unified-verification-lab/uvl-row-registry.js';
import { evaluateVisualQAEngine } from '../visual-qa-engine/index.js';
import { evaluateUXHeuristicEngine } from '../ux-heuristic-evaluator/index.js';
import { evaluateFirstImpressionJudge } from '../first-impression-judge/index.js';
import { evaluateLivePreviewGatekeeper } from '../live-preview-gatekeeper/index.js';
import { evaluateAutoPolishLoop } from '../auto-polish-loop/index.js';
import { evaluateProductExperienceEngine } from '../product-experience-verification-engine/index.js';
import { getDevPulseV2ProductExperienceVerificationEngine } from '../product-experience-verification-engine/index.js';
import type {
  ProductRealityInput,
  ProductRealityRecord,
  ProductRealityResultBundle,
  ProductRealityRuntimeReport,
  UpstreamReportBundle,
} from './product-reality-types.js';
import {
  PRODUCT_REALITY_ORCHESTRATOR_PASS_TOKEN,
  PRODUCT_REALITY_OWNER_MODULE,
} from './product-reality-types.js';
import {
  buildProductRealityAggregate,
  deriveResponsiveRealityReport,
  getAggregateBuildCount,
} from './experience-aggregation-builder.js';
import { detectAuthorityConflicts, getConflictDetectionCount } from './authority-conflict-detector.js';
import { analyzeLaunchBlockers, getBlockerAnalysisCount } from './launch-blocker-analyzer.js';
import { analyzeReleaseReadiness, getReleaseReadinessCount } from './release-readiness-analyzer.js';
import { analyzeFounderPriorities, getFounderPriorityCount } from './founder-priority-analyzer.js';
import { buildProductRealityRoadmap, getRoadmapBuildCount } from './roadmap-builder.js';
import { buildProductRealityAuthority, getAuthorityBuildCount } from './product-reality-authority-builder.js';
import {
  buildProductRealityResult,
  buildProductRealityScore,
  evaluateProductReality,
  getEvaluationCount,
} from './product-reality-evaluator.js';
import { registerProductRealityRecord, getProductRealityRecordCount } from './product-reality-registry.js';
import { recordProductRealityHistory } from './bounded-history.js';
import { generateProductRealityReport, getReportCount } from './product-reality-report-builder.js';
import { getProductRealityCacheStats, getCachedSourceText, setCachedSourceText } from './product-reality-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface ProductRealitySurfaceSnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  mobileNavTogglePresent: boolean;
  devPulseBrandingPresent: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  productExperienceToken: string;
  registeredAt: number;
}

let cachedSnapshot: ProductRealitySurfaceSnapshot | null = null;
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

export function getDevPulseV2ProductRealityOrchestrator(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: PRODUCT_REALITY_OWNER_MODULE,
    passToken: PRODUCT_REALITY_ORCHESTRATOR_PASS_TOKEN,
    phase: 24.78,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerProductRealityOrchestratorWithSurface(): ProductRealitySurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);
  const appJs = readSourceText(UI_APP_PATH);

  cachedSnapshot = {
    chatPresent: html.includes('id="chat-input"') || html.includes('id="chat-surface"'),
    operatorFeedPresent: html.includes('id="operator-feed"'),
    mobileNavTogglePresent: html.includes('mobile-nav-toggle') || html.includes('id="mobile-menu-toggle"'),
    devPulseBrandingPresent: html.includes('DevPulse'),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    productExperienceToken: getDevPulseV2ProductExperienceVerificationEngine().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerProductRealityOrchestratorWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerProductRealityOrchestratorWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerProductRealityOrchestratorWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerProductRealityOrchestratorWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerProductRealityOrchestratorWithProductRealityChain(): {
  visualQa: boolean;
  uxHeuristic: boolean;
  firstImpression: boolean;
  livePreview: boolean;
  autoPolish: boolean;
  productExperience: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    visualQa: caps.includes('VISUAL_QA_ENGINE'),
    uxHeuristic: caps.includes('UX_HEURISTIC_EVALUATOR'),
    firstImpression: caps.includes('FIRST_IMPRESSION_JUDGE'),
    livePreview: caps.includes('LIVE_PREVIEW_GATEKEEPER'),
    autoPolish: caps.includes('AUTO_POLISH_LOOP'),
    productExperience: caps.includes('PRODUCT_EXPERIENCE_VERIFICATION_ENGINE'),
    readOnly: true,
  };
}

function consumeUpstreamReports(
  input: ProductRealityInput,
  snapshot: ProductRealitySurfaceSnapshot,
): UpstreamReportBundle {
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const base = { projectId, workspaceId, governanceBlocked: input.governanceBlocked };

  const visualQa = evaluateVisualQAEngine({
    ...base,
    requestId: `${input.requestId}-visual`,
    missingHeadingHierarchy: input.visualWeak,
    layoutFragmentation: input.visualWeak,
  }).report;

  const uxHeuristics = evaluateUXHeuristicEngine({
    ...base,
    requestId: `${input.requestId}-ux`,
    navigationConfusion: input.navigationDeadEnd,
    workflowBreak: input.workflowBroken,
  }).report;

  const firstImpression = evaluateFirstImpressionJudge({
    ...base,
    requestId: `${input.requestId}-fi`,
    trustSignalWeak: input.trustGap,
  }).report;

  const livePreview = evaluateLivePreviewGatekeeper({
    ...base,
    requestId: `${input.requestId}-lp`,
    previewNextActionMissing: input.previewDisconnected,
    previewReportDisconnected: input.previewDisconnected,
  }).report;

  const autoPolish = evaluateAutoPolishLoop({
    ...base,
    requestId: `${input.requestId}-ap`,
    productFragmented: input.experienceFragmented,
    workflowBreak: input.workflowBroken,
    trustGap: input.trustGap,
    visualClutter: input.polishGaps,
    previewClarityWeak: input.polishGaps,
  }).report;

  const productExperience = evaluateProductExperienceEngine({
    ...base,
    requestId: `${input.requestId}-pe`,
    productFragmented: input.experienceFragmented,
    workflowBreak: input.workflowBroken,
    trustGap: input.trustGap,
    verificationSilo: input.verificationSilo,
    navigationFragmentation: input.navigationDeadEnd,
    navigationContextLoss: input.navigationDeadEnd,
  }).report;

  const responsiveReality = deriveResponsiveRealityReport(
    visualQa,
    livePreview,
    snapshot.mobileNavTogglePresent,
  );

  return {
    visualQa,
    responsiveReality,
    uxHeuristics,
    firstImpression,
    livePreview,
    autoPolish,
    productExperience,
  };
}

export function evaluateProductRealityOrchestrator(input: ProductRealityInput): ProductRealityResultBundle {
  const snapshot = registerProductRealityOrchestratorWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';

  const reports = consumeUpstreamReports(input, snapshot);
  const aggregate = buildProductRealityAggregate(input.requestId, reports, input);
  const conflicts = detectAuthorityConflicts(input.requestId, aggregate, reports);
  const blockers = analyzeLaunchBlockers(input.requestId, reports, input);
  const release = analyzeReleaseReadiness(input.requestId, aggregate, blockers, conflicts);
  const priorities = analyzeFounderPriorities(input.requestId, reports, blockers);
  const roadmap = buildProductRealityRoadmap(input.requestId, priorities);
  const authority = buildProductRealityAuthority(
    input.requestId, aggregate, conflicts, blockers, priorities, roadmap, release, input,
  );

  const evaluation = evaluateProductReality(authority);
  const score = buildProductRealityScore(authority);
  const result = buildProductRealityResult(authority);

  recordCounter += 1;
  const record: ProductRealityRecord = {
    productRealityId: `product-reality-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    productRealityVerdict: evaluation.productRealityVerdict,
    releaseReadiness: evaluation.releaseReadiness,
    criticalBlockerCount: evaluation.criticalBlockerCount,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerProductRealityRecord(record);
  recordProductRealityHistory(record);

  const report = generateProductRealityReport(record, evaluation, authority);

  return { record, report, authority, result, score };
}

export function getProductRealityOrchestratorRuntimeReport(): ProductRealityRuntimeReport {
  const cache = getProductRealityCacheStats();
  return {
    aggregateBuildCount: getAggregateBuildCount(),
    conflictDetectionCount: getConflictDetectionCount(),
    blockerAnalysisCount: getBlockerAnalysisCount(),
    releaseReadinessCount: getReleaseReadinessCount(),
    founderPriorityCount: getFounderPriorityCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    reportCount: getReportCount(),
    recordCount: getProductRealityRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetProductRealityOrchestratorForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
