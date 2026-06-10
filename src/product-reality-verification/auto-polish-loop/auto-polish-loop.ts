/**
 * Auto-Polish Loop — orchestration and read-only integrations.
 * Polish evaluation only. No UI, CSS, copy mutation, or automatic fixes.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listAutoPolishLoopUvlRows } from '../../unified-verification-lab/uvl-row-registry.js';
import { evaluateVisualQAEngine } from '../visual-qa-engine/index.js';
import { evaluateUXHeuristicEngine } from '../ux-heuristic-evaluator/index.js';
import { evaluateFirstImpressionJudge } from '../first-impression-judge/index.js';
import { evaluateLivePreviewGatekeeper } from '../live-preview-gatekeeper/index.js';
import { getDevPulseV2LivePreviewGatekeeper } from '../live-preview-gatekeeper/index.js';
import type {
  AutoPolishInput,
  AutoPolishRecord,
  AutoPolishResultBundle,
  AutoPolishRuntimeReport,
} from './auto-polish-types.js';
import {
  AUTO_POLISH_LOOP_OWNER_MODULE,
  AUTO_POLISH_LOOP_PASS_TOKEN,
} from './auto-polish-types.js';
import { analyzeVisualPolish, getVisualPolishAnalysisCount } from './visual-polish-analyzer.js';
import { analyzeUXPolish, getUXPolishAnalysisCount } from './ux-polish-analyzer.js';
import { analyzeResponsivePolish, getResponsivePolishAnalysisCount } from './responsive-polish-analyzer.js';
import { analyzePreviewPolish, getPreviewPolishAnalysisCount } from './preview-polish-analyzer.js';
import { analyzeDiscoverabilityPolish, getDiscoverabilityPolishAnalysisCount } from './discoverability-polish-analyzer.js';
import { analyzeFounderUsabilityPolish, getFounderUsabilityPolishAnalysisCount } from './founder-usability-polish-analyzer.js';
import { analyzeTrustPolish, getTrustPolishAnalysisCount } from './trust-polish-analyzer.js';
import { analyzeIntelligenceVisibilityPolish, getIntelligenceVisibilityPolishAnalysisCount } from './intelligence-visibility-polish-analyzer.js';
import { analyzeWorkflowPolish, getWorkflowPolishAnalysisCount } from './workflow-polish-analyzer.js';
import { analyzeProductCoherencePolish, getProductCoherencePolishAnalysisCount } from './product-coherence-polish-analyzer.js';
import { analyzePolishPriority, getPriorityAnalysisCount } from './polish-priority-analyzer.js';
import { buildPolishRoadmap, getRoadmapBuildCount } from './polish-roadmap-builder.js';
import { buildAutoPolishAuthority, getAuthorityBuildCount } from './auto-polish-authority-builder.js';
import { evaluateAutoPolish, getEvaluationCount } from './auto-polish-evaluator.js';
import { registerAutoPolishRecord, getAutoPolishRecordCount } from './auto-polish-registry.js';
import { recordAutoPolishHistory } from './bounded-history.js';
import { generateAutoPolishReport } from './auto-polish-report-builder.js';
import { getAutoPolishCacheStats, getCachedSourceText, setCachedSourceText } from './auto-polish-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface AutoPolishSurfaceSnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  world2NavPresent: boolean;
  notificationPresent: boolean;
  projectVaultNavPresent: boolean;
  ideaVaultNavPresent: boolean;
  uvlDiscoverable: boolean;
  mobileNavTogglePresent: boolean;
  mobileDrawerPresent: boolean;
  feedStreamPresent: boolean;
  devPulseBrandingPresent: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  livePreviewGatekeeperToken: string;
  registeredAt: number;
}

let cachedSnapshot: AutoPolishSurfaceSnapshot | null = null;
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

export function getDevPulseV2AutoPolishLoop(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: AUTO_POLISH_LOOP_OWNER_MODULE,
    passToken: AUTO_POLISH_LOOP_PASS_TOKEN,
    phase: 24.76,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerAutoPolishLoopWithSurface(): AutoPolishSurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);
  const appJs = readSourceText(UI_APP_PATH);

  cachedSnapshot = {
    chatPresent: html.includes('id="chat-input"') || html.includes('id="chat-surface"'),
    operatorFeedPresent: html.includes('id="operator-feed"'),
    world2NavPresent: html.includes('data-view="world2"') || html.includes('World 2'),
    notificationPresent: html.includes('notification') || html.includes('id="notification'),
    projectVaultNavPresent: html.includes('Project Vault') || html.includes('project-vault'),
    ideaVaultNavPresent: html.includes('Idea Vault') || html.includes('idea-vault'),
    uvlDiscoverable: html.includes('UVL') || ALL_UVL_ROWS.length > 0,
    mobileNavTogglePresent: html.includes('mobile-nav-toggle') || html.includes('id="mobile-menu-toggle"'),
    mobileDrawerPresent: html.includes('mobile-drawer') || html.includes('mobile-nav-drawer'),
    feedStreamPresent: html.includes('id="feed-stream-log"') || appJs.includes('streamOperatorFeedEvents'),
    devPulseBrandingPresent: html.includes('DevPulse'),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    livePreviewGatekeeperToken: getDevPulseV2LivePreviewGatekeeper().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerAutoPolishLoopWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerAutoPolishLoopWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerAutoPolishLoopWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerAutoPolishLoopWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listAutoPolishLoopUvlRows().length, readOnly: true };
}

export function registerAutoPolishLoopWithProductRealityChain(): {
  visualQa: boolean;
  uxHeuristic: boolean;
  firstImpression: boolean;
  livePreview: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    visualQa: caps.includes('VISUAL_QA_ENGINE'),
    uxHeuristic: caps.includes('UX_HEURISTIC_EVALUATOR'),
    firstImpression: caps.includes('FIRST_IMPRESSION_JUDGE'),
    livePreview: caps.includes('LIVE_PREVIEW_GATEKEEPER'),
    readOnly: true,
  };
}

export function evaluateAutoPolishLoop(input: AutoPolishInput): AutoPolishResultBundle {
  const snapshot = registerAutoPolishLoopWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';

  const visualReport = evaluateVisualQAEngine({
    requestId: `${input.requestId}-visual`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
  }).report;

  const uxReport = evaluateUXHeuristicEngine({
    requestId: `${input.requestId}-ux`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
  }).report;

  const firstImpressionReport = evaluateFirstImpressionJudge({
    requestId: `${input.requestId}-fi`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
  }).report;

  const livePreviewReport = evaluateLivePreviewGatekeeper({
    requestId: `${input.requestId}-lp`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
  }).report;

  const visual = analyzeVisualPolish(input, {
    overallScore: visualReport.overallScore,
    hierarchyScore: visualReport.hierarchyQuality,
    spacingScore: visualReport.spacingQuality,
    typographyScore: visualReport.typographyQuality,
    clutterScore: visualReport.clutterRating,
    priorityFixes: visualReport.recommendedPriorityFixes,
  });

  const ux = analyzeUXPolish(input, {
    overallScore: uxReport.overallScore,
    navigationScore: uxReport.navigationClarityScore,
    actionClarityScore: uxReport.actionClarityScore,
    feedbackScore: uxReport.feedbackQualityScore,
    founderFrictionRisks: uxReport.founderFrictionRisks,
  });

  const responsive = analyzeResponsivePolish(input, {
    mobileVisualScore: visualReport.mobileRating,
    desktopVisualScore: visualReport.desktopRating,
    responsivePreviewScore: livePreviewReport.responsivePreviewSupportScore,
    mobileNavPresent: snapshot.mobileNavTogglePresent,
    mobileDrawerPresent: snapshot.mobileDrawerPresent,
  });

  const preview = analyzePreviewPolish(input, {
    overallScore: livePreviewReport.overallScore,
    visibilityScore: livePreviewReport.previewVisibilityScore,
    understandabilityScore: livePreviewReport.previewUnderstandabilityScore,
    founderVerificationScore: livePreviewReport.founderVerificationSupportScore,
    readinessGaps: livePreviewReport.readinessGaps,
    recommendedFixes: livePreviewReport.recommendedPriorityFixes,
  });

  const discoverability = analyzeDiscoverabilityPolish(input, {
    chatPresent: snapshot.chatPresent,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    world2NavPresent: snapshot.world2NavPresent,
    notificationPresent: snapshot.notificationPresent,
    projectVaultNavPresent: snapshot.projectVaultNavPresent,
    ideaVaultNavPresent: snapshot.ideaVaultNavPresent,
    uvlDiscoverable: snapshot.uvlDiscoverable,
  });

  const founder = analyzeFounderUsabilityPolish(input, {
    founderUsabilityScore: uxReport.founderUsabilityScore,
    founderFrictionNotes: uxReport.founderAcceptanceNotes,
    nextStepScore: firstImpressionReport.actionReadinessScore,
  });

  const trust = analyzeTrustPolish(input, {
    trustworthinessScore: firstImpressionReport.trustworthinessScore,
    trustRisks: firstImpressionReport.trustRisks,
    launchReadinessScore: firstImpressionReport.launchReadinessPerceptionScore,
  });

  const intelligence = analyzeIntelligenceVisibilityPolish(input, {
    intelligencePerceptionScore: firstImpressionReport.intelligencePerceptionScore,
    intelligenceVisibilityScore: uxReport.intelligenceVisibilityScore,
    hiddenIntelligenceRisks: [
      ...firstImpressionReport.hiddenIntelligenceRisks,
      ...uxReport.hiddenIntelligenceRisks,
    ],
    operatorFeedPresent: snapshot.operatorFeedPresent,
    feedStreamPresent: snapshot.feedStreamPresent,
  });

  const workflow = analyzeWorkflowPolish(input, {
    workflowContinuityScore: uxReport.workflowContinuityScore,
    previewReportConnectionScore: livePreviewReport.previewReportConnectionScore,
    chatToFeedConnected: snapshot.chatPresent && snapshot.feedStreamPresent,
    previewToUvlConnected: livePreviewReport.previewReportConnectionScore >= 70,
  });

  const coherence = analyzeProductCoherencePolish(input, {
    productIdentityScore: firstImpressionReport.productIdentityScore,
    productCoherenceSignals: snapshot.devPulseBrandingPresent ? 3 : 1,
    fragmentedTerminologyCount: uxReport.detectedUxProblems.length > 5 ? 3 : 1,
  });

  const authority = buildAutoPolishAuthority(
    input.requestId,
    visual, ux, responsive, preview, discoverability,
    founder, trust, intelligence, workflow, coherence,
    input,
  );

  const priority = analyzePolishPriority(input.requestId, authority.allOpportunities);
  const roadmap = buildPolishRoadmap(input.requestId, priority);
  const evaluation = evaluateAutoPolish(authority);

  recordCounter += 1;
  const record: AutoPolishRecord = {
    autoPolishId: `auto-polish-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    autoPolishResult: evaluation.autoPolishResult,
    totalOpportunities: evaluation.totalOpportunities,
    criticalOpportunities: evaluation.criticalOpportunities,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerAutoPolishRecord(record);
  recordAutoPolishHistory(record);

  const report = generateAutoPolishReport(record, evaluation, priority, roadmap);

  return { record, report, authority };
}

export function getAutoPolishLoopRuntimeReport(): AutoPolishRuntimeReport {
  const cache = getAutoPolishCacheStats();
  return {
    visualPolishAnalysisCount: getVisualPolishAnalysisCount(),
    uxPolishAnalysisCount: getUXPolishAnalysisCount(),
    responsivePolishAnalysisCount: getResponsivePolishAnalysisCount(),
    previewPolishAnalysisCount: getPreviewPolishAnalysisCount(),
    discoverabilityPolishAnalysisCount: getDiscoverabilityPolishAnalysisCount(),
    founderUsabilityPolishAnalysisCount: getFounderUsabilityPolishAnalysisCount(),
    trustPolishAnalysisCount: getTrustPolishAnalysisCount(),
    intelligenceVisibilityPolishAnalysisCount: getIntelligenceVisibilityPolishAnalysisCount(),
    workflowPolishAnalysisCount: getWorkflowPolishAnalysisCount(),
    productCoherencePolishAnalysisCount: getProductCoherencePolishAnalysisCount(),
    priorityAnalysisCount: getPriorityAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getAutoPolishRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetAutoPolishLoopOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
