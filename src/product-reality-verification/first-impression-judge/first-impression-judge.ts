/**
 * First-Impression Judge — orchestration and read-only integrations.
 * Product perception evaluation only. No UI, copy, or execution mutation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listFirstImpressionJudgeUvlRows } from '../../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2UXHeuristicEvaluator } from '../ux-heuristic-evaluator/index.js';
import type {
  FirstImpressionInput,
  FirstImpressionRecord,
  FirstImpressionResultBundle,
  FirstImpressionRuntimeReport,
  FirstVisitPersona,
} from './first-impression-types.js';
import {
  FIRST_IMPRESSION_JUDGE_OWNER_MODULE,
  FIRST_IMPRESSION_JUDGE_PASS_TOKEN,
} from './first-impression-types.js';
import { buildFirstVisitContext, getContextBuildCount } from './first-visit-context-builder.js';
import { analyzeProductClarity, getProductClarityAnalysisCount } from './product-clarity-analyzer.js';
import { analyzeIntelligencePerception, getIntelligencePerceptionAnalysisCount } from './intelligence-perception-analyzer.js';
import { analyzeTrustworthinessPerception, getTrustworthinessAnalysisCount } from './trustworthiness-perception-analyzer.js';
import { analyzeVisualConfidence, getVisualConfidenceAnalysisCount } from './visual-confidence-analyzer.js';
import { analyzeFounderUsefulness, getFounderUsefulnessAnalysisCount } from './founder-usefulness-analyzer.js';
import { analyzePremiumFeel, getPremiumFeelAnalysisCount } from './premium-feel-analyzer.js';
import { analyzeActionReadiness, getActionReadinessAnalysisCount } from './action-readiness-analyzer.js';
import { analyzeProductIdentity, getProductIdentityAnalysisCount } from './product-identity-analyzer.js';
import { analyzeEmotionalConfidence, getEmotionalConfidenceAnalysisCount } from './emotional-confidence-analyzer.js';
import { analyzeLaunchReadinessPerception, getLaunchReadinessAnalysisCount } from './launch-readiness-perception-analyzer.js';
import { buildFirstImpressionAuthority, getAuthorityBuildCount } from './first-impression-authority-builder.js';
import { evaluateFirstImpression, getEvaluationCount } from './first-impression-evaluator.js';
import { registerFirstImpressionRecord, getFirstImpressionRecordCount } from './first-impression-registry.js';
import { recordFirstImpressionHistory } from './bounded-history.js';
import { generateFirstImpressionReport } from './first-impression-report-builder.js';
import { getCachedSourceText, getFirstImpressionCacheStats, setCachedSourceText } from './first-impression-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_CSS_PATH = join(ROOT, 'public/founder-reality/styles.css');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface FirstImpressionSurfaceSnapshot {
  htmlAvailable: boolean;
  cssAvailable: boolean;
  appJsAvailable: boolean;
  welcomeCopyPresent: boolean;
  commandCenterTitlePresent: boolean;
  chatInputPresent: boolean;
  statusBarPresent: boolean;
  operatorFeedPresent: boolean;
  brainConnectedCopyPresent: boolean;
  feedStreamPresent: boolean;
  welcomeIntelligenceHintPresent: boolean;
  notConnectedStatusPresent: boolean;
  brainHealthPresent: boolean;
  brandedShellPresent: boolean;
  themeVariablesPresent: boolean;
  welcomeIconPresent: boolean;
  chatFirstLayout: boolean;
  nextStepSectionPresent: boolean;
  interFontPresent: boolean;
  accentThemePresent: boolean;
  cardStylingPresent: boolean;
  sendButtonPresent: boolean;
  welcomeStatePresent: boolean;
  devPulseBrandingPresent: boolean;
  commandCenterIdentityPresent: boolean;
  operatorFeedIdentityPresent: boolean;
  welcomeSubtitlePresent: boolean;
  premiumStylingPresent: boolean;
  intelligenceSignalsPresent: boolean;
  diagnosticSectionCount: number;
  placeholderNavCount: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  uxHeuristicEvaluatorToken: string;
  registeredAt: number;
}

let cachedSnapshot: FirstImpressionSurfaceSnapshot | null = null;
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

export function getDevPulseV2FirstImpressionJudge(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FIRST_IMPRESSION_JUDGE_OWNER_MODULE,
    passToken: FIRST_IMPRESSION_JUDGE_PASS_TOKEN,
    phase: 24.74,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFirstImpressionJudgeWithSurface(): FirstImpressionSurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);
  const css = readSourceText(UI_CSS_PATH);
  const appJs = readSourceText(UI_APP_PATH);

  cachedSnapshot = {
    htmlAvailable: html.length > 0,
    cssAvailable: css.length > 0,
    appJsAvailable: appJs.length > 0,
    welcomeCopyPresent: html.includes('Unified Command Center Brain Connected'),
    commandCenterTitlePresent: html.includes('DevPulse V2 Command Center'),
    chatInputPresent: html.includes('id="chat-input"'),
    statusBarPresent: html.includes('id="status-bar"'),
    operatorFeedPresent: html.includes('id="operator-feed"'),
    brainConnectedCopyPresent: html.includes('Brain Connected'),
    feedStreamPresent: html.includes('id="feed-stream-log"'),
    welcomeIntelligenceHintPresent: html.includes('Ask DevPulse anything'),
    notConnectedStatusPresent: html.includes('Not Connected'),
    brainHealthPresent: appJs.includes('/api/brain/health'),
    brandedShellPresent: html.includes('class="sidebar-brand"'),
    themeVariablesPresent: css.includes(':root') && (css.includes('--teal') || css.includes('--turquoise')),
    welcomeIconPresent: html.includes('class="welcome-icon"'),
    chatFirstLayout: html.includes('id="chat-surface"'),
    nextStepSectionPresent: html.includes('id="next-step"'),
    interFontPresent: html.includes('fonts.googleapis.com') || css.includes('Inter'),
    accentThemePresent: css.includes('--teal') || css.includes('--turquoise'),
    cardStylingPresent: css.includes('.card'),
    sendButtonPresent: html.includes('id="chat-send"'),
    welcomeStatePresent: html.includes('id="chat-welcome-state"'),
    devPulseBrandingPresent: html.includes('DevPulse V2'),
    commandCenterIdentityPresent: html.includes('Command Center'),
    operatorFeedIdentityPresent: html.includes('Operator Feed'),
    welcomeSubtitlePresent: html.includes('welcome-subtitle'),
    premiumStylingPresent: css.includes('backdrop-filter') || css.includes('linear-gradient'),
    intelligenceSignalsPresent: html.includes('Operator Feed') && appJs.includes('streamOperatorFeedEvents'),
    diagnosticSectionCount: countMatches(html, /section class="card"/g),
    placeholderNavCount: countMatches(html, /data-view="placeholder"/g),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    uxHeuristicEvaluatorToken: getDevPulseV2UXHeuristicEvaluator().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFirstImpressionJudgeWithUXHeuristicEvaluator(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UXHeuristicEvaluator().passToken, readOnly: true };
}

export function registerFirstImpressionJudgeWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFirstImpressionJudgeWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFirstImpressionJudgeWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFirstImpressionJudgeWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listFirstImpressionJudgeUvlRows().length, readOnly: true };
}

export function evaluateFirstImpressionJudge(input: FirstImpressionInput): FirstImpressionResultBundle {
  const snapshot = registerFirstImpressionJudgeWithSurface();
  const persona: FirstVisitPersona = input.persona ?? 'FOUNDER_FIRST_VISIT';
  const context = buildFirstVisitContext(persona);

  const clarity = analyzeProductClarity(input, context, {
    welcomeCopyPresent: snapshot.welcomeCopyPresent,
    commandCenterTitlePresent: snapshot.commandCenterTitlePresent,
    chatInputPresent: snapshot.chatInputPresent,
    statusBarPresent: snapshot.statusBarPresent,
  });
  const intelligence = analyzeIntelligencePerception(input, context, {
    operatorFeedPresent: snapshot.operatorFeedPresent,
    brainConnectedCopyPresent: snapshot.brainConnectedCopyPresent,
    feedStreamPresent: snapshot.feedStreamPresent,
    welcomeIntelligenceHintPresent: snapshot.welcomeIntelligenceHintPresent,
  });
  const trust = analyzeTrustworthinessPerception(input, context, {
    statusBarPresent: snapshot.statusBarPresent,
    notConnectedStatusPresent: snapshot.notConnectedStatusPresent,
    brainHealthPresent: snapshot.brainHealthPresent,
  });
  const visual = analyzeVisualConfidence(input, context, {
    brandedShellPresent: snapshot.brandedShellPresent,
    themeVariablesPresent: snapshot.themeVariablesPresent,
    welcomeIconPresent: snapshot.welcomeIconPresent,
  });
  const founder = analyzeFounderUsefulness(input, context, {
    chatFirstLayout: snapshot.chatFirstLayout,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    nextStepSectionPresent: snapshot.nextStepSectionPresent,
    statusBarPresent: snapshot.statusBarPresent,
  });
  const premium = analyzePremiumFeel(input, context, {
    interFontPresent: snapshot.interFontPresent,
    accentThemePresent: snapshot.accentThemePresent,
    cardStylingPresent: snapshot.cardStylingPresent,
  });
  const action = analyzeActionReadiness(input, context, {
    chatInputPresent: snapshot.chatInputPresent,
    sendButtonPresent: snapshot.sendButtonPresent,
    welcomeStatePresent: snapshot.welcomeStatePresent,
  });
  const identity = analyzeProductIdentity(input, context, {
    devPulseBrandingPresent: snapshot.devPulseBrandingPresent,
    commandCenterIdentityPresent: snapshot.commandCenterIdentityPresent,
    operatorFeedIdentityPresent: snapshot.operatorFeedIdentityPresent,
  });
  const emotional = analyzeEmotionalConfidence(input, context, {
    welcomeSubtitlePresent: snapshot.welcomeSubtitlePresent,
    premiumStylingPresent: snapshot.premiumStylingPresent,
    intelligenceSignalsPresent: snapshot.intelligenceSignalsPresent,
  });
  const launch = analyzeLaunchReadinessPerception(input, context, {
    diagnosticSectionCount: snapshot.diagnosticSectionCount,
    placeholderNavCount: snapshot.placeholderNavCount,
    brainConnectedPresent: snapshot.brainConnectedCopyPresent,
  });

  const authority = buildFirstImpressionAuthority(
    input.requestId,
    context,
    clarity,
    intelligence,
    trust,
    visual,
    founder,
    premium,
    action,
    identity,
    emotional,
    launch,
    input,
  );
  const evaluation = evaluateFirstImpression(authority, launch.perceivedStage);

  recordCounter += 1;
  const record: FirstImpressionRecord = {
    firstImpressionId: `first-impression-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    persona,
    overallScore: evaluation.overallScore,
    firstImpressionResult: evaluation.firstImpressionResult,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerFirstImpressionRecord(record);
  recordFirstImpressionHistory(record);

  const report = generateFirstImpressionReport(
    record,
    evaluation,
    context,
    clarity,
    intelligence,
    trust,
    visual,
    founder,
    premium,
    action,
    identity,
    emotional,
    launch,
  );

  return { record, report, context };
}

export function getFirstImpressionRuntimeReport(): FirstImpressionRuntimeReport {
  const cache = getFirstImpressionCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    productClarityAnalysisCount: getProductClarityAnalysisCount(),
    intelligencePerceptionAnalysisCount: getIntelligencePerceptionAnalysisCount(),
    trustworthinessAnalysisCount: getTrustworthinessAnalysisCount(),
    visualConfidenceAnalysisCount: getVisualConfidenceAnalysisCount(),
    founderUsefulnessAnalysisCount: getFounderUsefulnessAnalysisCount(),
    premiumFeelAnalysisCount: getPremiumFeelAnalysisCount(),
    actionReadinessAnalysisCount: getActionReadinessAnalysisCount(),
    productIdentityAnalysisCount: getProductIdentityAnalysisCount(),
    emotionalConfidenceAnalysisCount: getEmotionalConfidenceAnalysisCount(),
    launchReadinessAnalysisCount: getLaunchReadinessAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getFirstImpressionRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFirstImpressionJudgeOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
