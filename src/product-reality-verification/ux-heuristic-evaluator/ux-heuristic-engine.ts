/**
 * UX Heuristic Evaluator — orchestration and read-only integrations.
 * Product experience evaluation only. No UI modification, execution, or mutations.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listUXHeuristicEvaluatorUvlRows } from '../../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2VisualQAEngine } from '../visual-qa-engine/index.js';
import type {
  UXHeuristicInput,
  UXHeuristicRecord,
  UXHeuristicResultBundle,
  UXHeuristicRuntimeReport,
} from './ux-heuristic-types.js';
import {
  UX_HEURISTIC_EVALUATOR_OWNER_MODULE,
  UX_HEURISTIC_EVALUATOR_PASS_TOKEN,
} from './ux-heuristic-types.js';
import { analyzeNavigationClarity, getNavigationAnalysisCount } from './navigation-clarity-analyzer.js';
import { analyzeFeatureDiscoverability, getDiscoverabilityAnalysisCount } from './feature-discoverability-analyzer.js';
import { analyzeActionClarity, getActionClarityAnalysisCount } from './action-clarity-analyzer.js';
import { analyzeFeedbackQuality, getFeedbackAnalysisCount } from './feedback-quality-analyzer.js';
import { analyzeSystemStatusVisibility, getStatusVisibilityAnalysisCount } from './system-status-visibility-analyzer.js';
import { analyzeErrorPrevention, getErrorPreventionAnalysisCount } from './error-prevention-analyzer.js';
import { analyzeUserControl, getUserControlAnalysisCount } from './user-control-analyzer.js';
import { analyzeCognitiveLoad, getCognitiveLoadAnalysisCount } from './cognitive-load-analyzer.js';
import { analyzeTrustClarity, getTrustClarityAnalysisCount } from './trust-clarity-analyzer.js';
import { analyzeWorkflowContinuity, getWorkflowContinuityAnalysisCount } from './workflow-continuity-analyzer.js';
import { analyzeIntelligenceVisibility, getIntelligenceVisibilityAnalysisCount } from './intelligence-visibility-analyzer.js';
import { analyzeFounderUsability, getFounderUsabilityAnalysisCount } from './founder-usability-analyzer.js';
import { buildUXHeuristicAuthority, getAuthorityBuildCount } from './ux-heuristic-authority-builder.js';
import { evaluateUXHeuristic, getEvaluationCount } from './ux-heuristic-evaluator.js';
import { registerUXHeuristicRecord, getUXHeuristicRecordCount } from './ux-heuristic-registry.js';
import { recordUXHeuristicHistory } from './bounded-history.js';
import { generateUXHeuristicReport } from './ux-heuristic-report-builder.js';
import { getCachedSourceText, getUXHeuristicCacheStats, setCachedSourceText } from './ux-heuristic-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface UXHeuristicSurfaceSnapshot {
  htmlAvailable: boolean;
  appJsAvailable: boolean;
  sidebarNavPresent: boolean;
  navItemCount: number;
  centerTitlePresent: boolean;
  mobileNavTogglePresent: boolean;
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  notificationPresent: boolean;
  founderRealityPresent: boolean;
  world2NavPresent: boolean;
  projectVaultNavPresent: boolean;
  sendButtonPresent: boolean;
  chatFormPresent: boolean;
  notifButtonPresent: boolean;
  thinkingIndicatorPresent: boolean;
  notificationDrawerPresent: boolean;
  chatHistoryPresent: boolean;
  statusBarPresent: boolean;
  statusItemsPresent: boolean;
  operatorFeedStagesPresent: boolean;
  readOnlySurface: boolean;
  noExecutionEndpoints: boolean;
  navigationSwitchPresent: boolean;
  chatInputPresent: boolean;
  mobileEscapePresent: boolean;
  diagnosticSectionCount: number;
  panelCount: number;
  welcomeTrustCopyPresent: boolean;
  brainHealthEndpointPresent: boolean;
  operatorFeedStagesInApp: boolean;
  chatToFeedLinkage: boolean;
  founderRealityNextStepPresent: boolean;
  feedStreamPresent: boolean;
  welcomeIntelligenceCopyPresent: boolean;
  brainApiPresent: boolean;
  chatFirstLayout: boolean;
  mobileUsabilityPresent: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  visualQaEngineToken: string;
  registeredAt: number;
}

let cachedSnapshot: UXHeuristicSurfaceSnapshot | null = null;
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

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

export function getDevPulseV2UXHeuristicEvaluator(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: UX_HEURISTIC_EVALUATOR_OWNER_MODULE,
    passToken: UX_HEURISTIC_EVALUATOR_PASS_TOKEN,
    phase: 24.73,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerUXHeuristicEvaluatorWithSurface(): UXHeuristicSurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);
  const appJs = readSourceText(UI_APP_PATH);

  cachedSnapshot = {
    htmlAvailable: html.length > 0,
    appJsAvailable: appJs.length > 0,
    sidebarNavPresent: html.includes('id="sidebar-nav"'),
    navItemCount: countMatches(html, /class="nav-item"/g),
    centerTitlePresent: html.includes('id="center-title"'),
    mobileNavTogglePresent: html.includes('id="mobile-nav-toggle"'),
    chatPresent: html.includes('id="chat-surface"'),
    operatorFeedPresent: html.includes('id="operator-feed"'),
    notificationPresent: html.includes('id="notif-toggle"'),
    founderRealityPresent: html.includes('data-view="founder-reality"'),
    world2NavPresent: html.includes('data-label="World 2"'),
    projectVaultNavPresent: html.includes('data-label="Project Vault"'),
    sendButtonPresent: html.includes('id="chat-send"'),
    chatFormPresent: html.includes('id="chat-form"'),
    notifButtonPresent: html.includes('id="notif-toggle"'),
    thinkingIndicatorPresent: appJs.includes('Brain is analyzing'),
    notificationDrawerPresent: html.includes('id="notification-drawer"'),
    chatHistoryPresent: html.includes('id="chat-history"'),
    statusBarPresent: html.includes('id="status-bar"'),
    statusItemsPresent: html.includes('id="status-items"'),
    operatorFeedStagesPresent: html.includes('id="feed-sections"'),
    readOnlySurface: html.includes('Founder Reality Surface') && !html.includes('api/exec'),
    noExecutionEndpoints: !html.includes('/api/exec'),
    navigationSwitchPresent: appJs.includes("switchView('"),
    chatInputPresent: html.includes('id="chat-input"'),
    mobileEscapePresent: html.includes('id="sidebar-backdrop"') || html.includes('id="mobile-nav-toggle"'),
    diagnosticSectionCount: countMatches(html, /section class="card"/g),
    panelCount: countMatches(html, /class="(sidebar|center-area|operator-feed|status-bar)"/g),
    welcomeTrustCopyPresent: html.includes('Unified Command Center Brain Connected'),
    brainHealthEndpointPresent: appJs.includes('/api/brain/health'),
    operatorFeedStagesInApp: appJs.includes('defaultFeedSections'),
    chatToFeedLinkage: appJs.includes('streamOperatorFeedEvents') && appJs.includes('askBrain'),
    founderRealityNextStepPresent: html.includes('id="next-step"'),
    feedStreamPresent: html.includes('id="feed-stream-log"'),
    welcomeIntelligenceCopyPresent: html.includes('Ask DevPulse anything'),
    brainApiPresent: appJs.includes('/api/brain/respond'),
    chatFirstLayout: html.includes('id="view-command-center"') && html.includes('id="chat-surface"'),
    mobileUsabilityPresent: html.includes('id="mobile-feed-toggle"'),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    visualQaEngineToken: getDevPulseV2VisualQAEngine().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerUXHeuristicEvaluatorWithVisualQAEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2VisualQAEngine().passToken, readOnly: true };
}

export function registerUXHeuristicEvaluatorWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerUXHeuristicEvaluatorWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerUXHeuristicEvaluatorWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerUXHeuristicEvaluatorWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listUXHeuristicEvaluatorUvlRows().length, readOnly: true };
}

export function evaluateUXHeuristicEngine(input: UXHeuristicInput): UXHeuristicResultBundle {
  const snapshot = registerUXHeuristicEvaluatorWithSurface();

  const navigation = analyzeNavigationClarity(input, {
    sidebarNavPresent: snapshot.sidebarNavPresent,
    navItemCount: snapshot.navItemCount,
    centerTitlePresent: snapshot.centerTitlePresent,
    mobileNavTogglePresent: snapshot.mobileNavTogglePresent,
  });
  const discoverability = analyzeFeatureDiscoverability(input, {
    chatPresent: snapshot.chatPresent,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    notificationPresent: snapshot.notificationPresent,
    founderRealityPresent: snapshot.founderRealityPresent,
    world2NavPresent: snapshot.world2NavPresent,
    projectVaultNavPresent: snapshot.projectVaultNavPresent,
  });
  const action = analyzeActionClarity(input, {
    sendButtonPresent: snapshot.sendButtonPresent,
    chatFormPresent: snapshot.chatFormPresent,
    notifButtonPresent: snapshot.notifButtonPresent,
  });
  const feedback = analyzeFeedbackQuality(input, {
    thinkingIndicatorPresent: snapshot.thinkingIndicatorPresent,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    notificationDrawerPresent: snapshot.notificationDrawerPresent,
    chatHistoryPresent: snapshot.chatHistoryPresent,
  });
  const status = analyzeSystemStatusVisibility(input, {
    statusBarPresent: snapshot.statusBarPresent,
    statusItemsPresent: snapshot.statusItemsPresent,
    operatorFeedStagesPresent: snapshot.operatorFeedStagesPresent,
  });
  const errorPrevention = analyzeErrorPrevention(input, {
    readOnlySurface: snapshot.readOnlySurface,
    noExecutionEndpoints: snapshot.noExecutionEndpoints,
  });
  const userControl = analyzeUserControl(input, {
    navigationSwitchPresent: snapshot.navigationSwitchPresent,
    chatInputPresent: snapshot.chatInputPresent,
    mobileEscapePresent: snapshot.mobileEscapePresent,
  });
  const cognitive = analyzeCognitiveLoad(input, {
    diagnosticSectionCount: snapshot.diagnosticSectionCount,
    panelCount: snapshot.panelCount,
  });
  const trust = analyzeTrustClarity(input, {
    welcomeTrustCopyPresent: snapshot.welcomeTrustCopyPresent,
    statusConnectedIndicators: snapshot.statusItemsPresent,
    brainHealthEndpointPresent: snapshot.brainHealthEndpointPresent,
  });
  const workflow = analyzeWorkflowContinuity(input, {
    operatorFeedStagesPresent: snapshot.operatorFeedStagesInApp,
    chatToFeedLinkage: snapshot.chatToFeedLinkage,
    founderRealityNextStepPresent: snapshot.founderRealityNextStepPresent,
  });
  const intelligence = analyzeIntelligenceVisibility(input, {
    operatorFeedPresent: snapshot.operatorFeedPresent,
    brainApiPresent: snapshot.brainApiPresent,
    feedStreamPresent: snapshot.feedStreamPresent,
    welcomeIntelligenceCopyPresent: snapshot.welcomeIntelligenceCopyPresent,
  });
  const founder = analyzeFounderUsability(input, {
    chatFirstLayout: snapshot.chatFirstLayout,
    statusBarPresent: snapshot.statusBarPresent,
    founderRealityPresent: snapshot.founderRealityPresent,
    mobileUsabilityPresent: snapshot.mobileUsabilityPresent,
  });

  const authority = buildUXHeuristicAuthority(
    input.requestId,
    navigation,
    discoverability,
    action,
    feedback,
    status,
    errorPrevention,
    userControl,
    cognitive,
    trust,
    workflow,
    intelligence,
    founder,
    input,
  );
  const evaluation = evaluateUXHeuristic(authority);

  recordCounter += 1;
  const record: UXHeuristicRecord = {
    uxHeuristicId: `ux-heuristic-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    overallScore: evaluation.overallScore,
    uxHeuristicResult: evaluation.uxHeuristicResult,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerUXHeuristicRecord(record);
  recordUXHeuristicHistory(record);

  const report = generateUXHeuristicReport(
    record,
    evaluation,
    navigation,
    discoverability,
    action,
    feedback,
    status,
    errorPrevention,
    userControl,
    cognitive,
    trust,
    workflow,
    intelligence,
    founder,
  );

  return { record, report };
}

export function getUXHeuristicRuntimeReport(): UXHeuristicRuntimeReport {
  const cache = getUXHeuristicCacheStats();
  return {
    navigationAnalysisCount: getNavigationAnalysisCount(),
    discoverabilityAnalysisCount: getDiscoverabilityAnalysisCount(),
    actionClarityAnalysisCount: getActionClarityAnalysisCount(),
    feedbackAnalysisCount: getFeedbackAnalysisCount(),
    statusVisibilityAnalysisCount: getStatusVisibilityAnalysisCount(),
    errorPreventionAnalysisCount: getErrorPreventionAnalysisCount(),
    userControlAnalysisCount: getUserControlAnalysisCount(),
    cognitiveLoadAnalysisCount: getCognitiveLoadAnalysisCount(),
    trustClarityAnalysisCount: getTrustClarityAnalysisCount(),
    workflowContinuityAnalysisCount: getWorkflowContinuityAnalysisCount(),
    intelligenceVisibilityAnalysisCount: getIntelligenceVisibilityAnalysisCount(),
    founderUsabilityAnalysisCount: getFounderUsabilityAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getUXHeuristicRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetUXHeuristicEngineOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
