/**
 * Product Experience Verification Engine — orchestration and read-only integrations.
 * Master product verification authority. No UI, copy, execution, or state mutation.
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
import { getDevPulseV2AutoPolishLoop } from '../auto-polish-loop/index.js';
import type {
  ProductExperienceInput,
  ProductExperienceRecord,
  ProductExperienceResultBundle,
  ProductExperienceRuntimeReport,
} from './product-experience-types.js';
import {
  PRODUCT_EXPERIENCE_ENGINE_PASS_TOKEN,
  PRODUCT_EXPERIENCE_OWNER_MODULE,
} from './product-experience-types.js';
import { buildExperienceContext, getContextBuildCount } from './experience-context-builder.js';
import { verifyProductCoherence, getProductCoherenceVerifyCount } from './product-coherence-verifier.js';
import { verifyExperienceContinuity, getExperienceContinuityVerifyCount } from './experience-continuity-verifier.js';
import { verifyIntelligenceContinuity, getIntelligenceContinuityVerifyCount } from './intelligence-continuity-verifier.js';
import { verifyWorkflowContinuity, getWorkflowContinuityVerifyCount } from './workflow-continuity-verifier.js';
import { verifyNavigationContinuity, getNavigationContinuityVerifyCount } from './navigation-continuity-verifier.js';
import { verifyVerificationContinuity, getVerificationContinuityVerifyCount } from './verification-continuity-verifier.js';
import { verifyFounderExperience, getFounderExperienceVerifyCount } from './founder-experience-verifier.js';
import { verifyTrustContinuity, getTrustContinuityVerifyCount } from './trust-continuity-verifier.js';
import { verifyProductIdentityContinuity, getProductIdentityVerifyCount } from './product-identity-continuity-verifier.js';
import { verifyLaunchReadinessContinuity, getLaunchReadinessVerifyCount } from './launch-readiness-continuity-verifier.js';
import { analyzeExperienceGaps, getGapAnalysisCount } from './experience-gap-analyzer.js';
import { buildExperienceRoadmap, getRoadmapBuildCount } from './experience-roadmap-builder.js';
import { buildProductExperienceAuthority, getAuthorityBuildCount } from './product-experience-authority-builder.js';
import { evaluateProductExperience, getEvaluationCount } from './product-experience-evaluator.js';
import { registerProductExperienceRecord, getProductExperienceRecordCount } from './product-experience-registry.js';
import { recordProductExperienceHistory } from './bounded-history.js';
import { generateProductExperienceReport } from './product-experience-report-builder.js';
import { getProductExperienceCacheStats, getCachedSourceText, setCachedSourceText } from './product-experience-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface ProductExperienceSurfaceSnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  world2NavPresent: boolean;
  notificationPresent: boolean;
  mobileNavTogglePresent: boolean;
  mobileDrawerPresent: boolean;
  feedStreamPresent: boolean;
  devPulseBrandingPresent: boolean;
  commandCenterSignalsPresent: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  autoPolishToken: string;
  registeredAt: number;
}

let cachedSnapshot: ProductExperienceSurfaceSnapshot | null = null;
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

export function getDevPulseV2ProductExperienceVerificationEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: PRODUCT_EXPERIENCE_OWNER_MODULE,
    passToken: PRODUCT_EXPERIENCE_ENGINE_PASS_TOKEN,
    phase: 24.77,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerProductExperienceEngineWithSurface(): ProductExperienceSurfaceSnapshot {
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
    mobileNavTogglePresent: html.includes('mobile-nav-toggle') || html.includes('id="mobile-menu-toggle"'),
    mobileDrawerPresent: html.includes('mobile-drawer') || html.includes('mobile-nav-drawer'),
    feedStreamPresent: html.includes('id="feed-stream-log"') || appJs.includes('streamOperatorFeedEvents'),
    devPulseBrandingPresent: html.includes('DevPulse'),
    commandCenterSignalsPresent: html.includes('Command Center') || html.includes('command-center'),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    autoPolishToken: getDevPulseV2AutoPolishLoop().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerProductExperienceEngineWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerProductExperienceEngineWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerProductExperienceEngineWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerProductExperienceEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerProductExperienceEngineWithProductRealityChain(): {
  visualQa: boolean;
  uxHeuristic: boolean;
  firstImpression: boolean;
  livePreview: boolean;
  autoPolish: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    visualQa: caps.includes('VISUAL_QA_ENGINE'),
    uxHeuristic: caps.includes('UX_HEURISTIC_EVALUATOR'),
    firstImpression: caps.includes('FIRST_IMPRESSION_JUDGE'),
    livePreview: caps.includes('LIVE_PREVIEW_GATEKEEPER'),
    autoPolish: caps.includes('AUTO_POLISH_LOOP'),
    readOnly: true,
  };
}

export function evaluateProductExperienceEngine(input: ProductExperienceInput): ProductExperienceResultBundle {
  const snapshot = registerProductExperienceEngineWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';

  buildExperienceContext('FOUNDER_DAILY_USE');
  buildExperienceContext('VERIFICATION_WORKFLOW');

  const visualBundle = evaluateVisualQAEngine({
    requestId: `${input.requestId}-visual`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
  });
  const uxBundle = evaluateUXHeuristicEngine({
    requestId: `${input.requestId}-ux`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
  });
  const firstImpressionBundle = evaluateFirstImpressionJudge({
    requestId: `${input.requestId}-fi`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
  });
  const livePreviewBundle = evaluateLivePreviewGatekeeper({
    requestId: `${input.requestId}-lp`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
  });
  const autoPolishBundle = evaluateAutoPolishLoop({
    requestId: `${input.requestId}-ap`,
    projectId,
    workspaceId,
    governanceBlocked: input.governanceBlocked,
    productFragmented: input.productFragmented,
    workflowBreak: input.workflowBreak,
    intelligenceHidden: input.intelligenceVisibilityGaps,
    founderFriction: input.founderExperienceBreak,
    trustGap: input.trustGap,
  });

  const visualReport = visualBundle.report;
  const uxReport = uxBundle.report;
  const fiReport = firstImpressionBundle.report;
  const lpReport = livePreviewBundle.report;
  const apReport = autoPolishBundle.report;

  const coherence = verifyProductCoherence(input, {
    visualQaScore: visualReport.overallScore,
    uxScore: uxReport.overallScore,
    firstImpressionScore: fiReport.overallScore,
    autoPolishCoherenceScore: apReport.productCoherenceScore,
    devPulseBrandingPresent: snapshot.devPulseBrandingPresent,
    capabilityCount: snapshot.capabilityEntries,
  });

  const experience = verifyExperienceContinuity(input, {
    chatPresent: snapshot.chatPresent,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    notificationPresent: snapshot.notificationPresent,
    uvlDiscoverable: snapshot.uvlRows > 0,
    workflowContinuityScore: uxReport.workflowContinuityScore,
    previewReportConnectionScore: lpReport.previewReportConnectionScore,
  });

  const intelligence = verifyIntelligenceContinuity(input, {
    intelligenceVisibilityScore: uxReport.intelligenceVisibilityScore,
    intelligencePerceptionScore: fiReport.intelligencePerceptionScore,
    hiddenIntelligenceRiskCount: fiReport.hiddenIntelligenceRisks.length + uxReport.hiddenIntelligenceRisks.length,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    feedStreamPresent: snapshot.feedStreamPresent,
    recommendationsVisible: uxReport.intelligenceVisibilityScore >= 70,
  });

  const workflow = verifyWorkflowContinuity(input, {
    workflowContinuityScore: uxReport.workflowContinuityScore,
    previewReportConnectionScore: lpReport.previewReportConnectionScore,
    actionReadinessScore: fiReport.actionReadinessScore,
    chatToFeedConnected: snapshot.chatPresent && snapshot.feedStreamPresent,
    reportToNextActionConnected: fiReport.actionReadinessScore >= 70 && lpReport.previewNextActionScore >= 65,
  });

  const navigation = verifyNavigationContinuity(input, {
    navigationClarityScore: uxReport.navigationClarityScore,
    mobileNavPresent: snapshot.mobileNavTogglePresent,
    mobileDrawerPresent: snapshot.mobileDrawerPresent,
    world2NavPresent: snapshot.world2NavPresent,
    desktopRating: visualReport.desktopRating,
    mobileRating: visualReport.mobileRating,
    tabletRating: Math.round((visualReport.desktopRating + visualReport.mobileRating) / 2),
  });

  const verification = verifyVerificationContinuity(input, {
    visualQaScore: visualReport.overallScore,
    uxHeuristicScore: uxReport.overallScore,
    firstImpressionScore: fiReport.overallScore,
    livePreviewScore: lpReport.overallScore,
    autoPolishScore: apReport.overallScore,
    uvlRowCount: snapshot.uvlRows,
    previewReportConnectionScore: lpReport.previewReportConnectionScore,
  });

  const founder = verifyFounderExperience(input, {
    founderUsabilityScore: uxReport.founderUsabilityScore,
    actionReadinessScore: fiReport.actionReadinessScore,
    launchReadinessPerceptionScore: fiReport.launchReadinessPerceptionScore,
    chatPresent: snapshot.chatPresent,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    founderFrictionRiskCount: uxReport.founderFrictionRisks.length,
  });

  const trust = verifyTrustContinuity(input, {
    trustworthinessScore: fiReport.trustworthinessScore,
    trustClarityScore: uxReport.trustClarityScore,
    previewHonestyScore: lpReport.previewUnavailableHonestyScore,
    trustRiskCount: fiReport.trustRisks.length,
    evidenceVisibilityPresent: snapshot.uvlRows > 50,
  });

  const identity = verifyProductIdentityContinuity(input, {
    productIdentityScore: fiReport.productIdentityScore,
    devPulseBrandingPresent: snapshot.devPulseBrandingPresent,
    commandCenterSignalsPresent: snapshot.commandCenterSignalsPresent,
    intelligenceConsoleCapabilityCount: snapshot.capabilityEntries,
  });

  const preliminaryCriticalGaps = [
    coherence, experience, intelligence, workflow, navigation,
    verification, founder, trust, identity,
  ].flatMap((v) => v.gaps).filter((g) => g.severity === 'CRITICAL').length;

  const launch = verifyLaunchReadinessContinuity(input, {
    overallProductScore: Math.round((visualReport.overallScore + uxReport.overallScore + fiReport.overallScore) / 3),
    autoPolishScore: apReport.overallScore,
    firstImpressionLaunchScore: fiReport.launchReadinessPerceptionScore,
    criticalGapCount: preliminaryCriticalGaps,
    founderAlphaReady: fiReport.launchReadinessPerceptionScore >= 60,
  });

  const authorityFinal = buildProductExperienceAuthority(
    input.requestId,
    coherence, experience, intelligence, workflow, navigation,
    verification, founder, trust, identity, launch, input,
  );

  const gapAnalysis = analyzeExperienceGaps(input.requestId, {
    coherence, experience, intelligence, workflow, navigation,
    verification, founder, trust, identity, launch,
  });

  const roadmap = buildExperienceRoadmap(input.requestId, gapAnalysis);
  const evaluation = evaluateProductExperience(authorityFinal);

  recordCounter += 1;
  const record: ProductExperienceRecord = {
    productExperienceId: `product-experience-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    productExperienceResult: evaluation.productExperienceResult,
    totalGaps: evaluation.totalGaps,
    criticalGaps: evaluation.criticalGaps,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerProductExperienceRecord(record);
  recordProductExperienceHistory(record);

  const report = generateProductExperienceReport(record, evaluation, gapAnalysis, roadmap);

  return { record, report, authority: authorityFinal };
}

export function getProductExperienceEngineRuntimeReport(): ProductExperienceRuntimeReport {
  const cache = getProductExperienceCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    productCoherenceVerifyCount: getProductCoherenceVerifyCount(),
    experienceContinuityVerifyCount: getExperienceContinuityVerifyCount(),
    intelligenceContinuityVerifyCount: getIntelligenceContinuityVerifyCount(),
    workflowContinuityVerifyCount: getWorkflowContinuityVerifyCount(),
    navigationContinuityVerifyCount: getNavigationContinuityVerifyCount(),
    verificationContinuityVerifyCount: getVerificationContinuityVerifyCount(),
    founderExperienceVerifyCount: getFounderExperienceVerifyCount(),
    trustContinuityVerifyCount: getTrustContinuityVerifyCount(),
    productIdentityVerifyCount: getProductIdentityVerifyCount(),
    launchReadinessVerifyCount: getLaunchReadinessVerifyCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getProductExperienceRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetProductExperienceEngineOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
