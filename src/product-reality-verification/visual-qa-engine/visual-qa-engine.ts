/**
 * Visual QA Engine — orchestration and read-only integrations.
 * Visual product evaluation only. No UI modification, execution, or mutations.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listVisualQAEngineUvlRows } from '../../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2InteractiveExplanations } from '../../interactive-explanations/index.js';
import type { VisualQAInput, VisualQARecord, VisualQAResultBundle, VisualQARuntimeReport } from './visual-qa-types.js';
import {
  VISUAL_QA_ENGINE_OWNER_MODULE,
  VISUAL_QA_ENGINE_PASS_TOKEN,
} from './visual-qa-types.js';
import { analyzeVisualHierarchy, getHierarchyAnalysisCount } from './visual-hierarchy-analyzer.js';
import { analyzeLayoutQuality, getLayoutAnalysisCount } from './layout-quality-analyzer.js';
import { analyzeSpacingConsistency, getSpacingAnalysisCount } from './spacing-consistency-analyzer.js';
import { analyzeAlignmentConsistency, getAlignmentAnalysisCount } from './alignment-consistency-analyzer.js';
import { analyzeTypographyQuality, getTypographyAnalysisCount } from './typography-quality-analyzer.js';
import { analyzeColorConsistency, getColorAnalysisCount } from './color-consistency-analyzer.js';
import { analyzeVisualClutter, getClutterAnalysisCount } from './visual-clutter-analyzer.js';
import { analyzeEmptySpaceUtilization, getEmptySpaceAnalysisCount } from './empty-space-utilization-analyzer.js';
import { analyzeMobileVisual, getMobileAnalysisCount } from './mobile-visual-analyzer.js';
import { analyzeDesktopVisual, getDesktopAnalysisCount } from './desktop-visual-analyzer.js';
import { analyzeFirstImpression, getFirstImpressionAnalysisCount } from './first-impression-analyzer.js';
import { analyzeProductProfessionalism, getProfessionalismAnalysisCount } from './product-professionalism-analyzer.js';
import { buildVisualQAAuthority, getAuthorityBuildCount } from './visual-qa-authority-builder.js';
import { evaluateVisualQA, getEvaluationCount } from './visual-qa-evaluator.js';
import { registerVisualQARecord, getVisualQARecordCount } from './visual-qa-registry.js';
import { recordVisualQAHistory } from './bounded-history.js';
import { generateVisualQAReport } from './visual-qa-report-builder.js';
import { getVisualQACacheStats } from './visual-qa-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_CSS_PATH = join(ROOT, 'public/founder-reality/styles.css');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
export interface VisualQASurfaceSnapshot {
  cssAvailable: boolean;
  htmlAvailable: boolean;
  themeVariablesPresent: boolean;
  accentColorPresent: boolean;
  gridLayoutPresent: boolean;
  flexLayoutPresent: boolean;
  mobileMediaQueries: number;
  wideViewportRulesPresent: boolean;
  mobileNavTogglePresent: boolean;
  mobileFeedTogglePresent: boolean;
  hasNavigationPanel: boolean;
  hasStatusBar: boolean;
  hasPrimaryWorkspace: boolean;
  hasOperatorFeed: boolean;
  hasThreeColumnLayout: boolean;
  welcomeStatePresent: boolean;
  chatWorkspacePresent: boolean;
  brandedShellPresent: boolean;
  welcomeCopyPresent: boolean;
  commandCenterSurfacePresent: boolean;
  statusBarPresent: boolean;
  diagnosticSectionCount: number;
  cardComponentPresent: boolean;
  fontFamilyDefined: boolean;
  headingStylesPresent: boolean;
  cssSpacingTokens: number;
  panelCount: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  interactiveExplanationsToken: string;
  registeredAt: number;
}

let cachedSnapshot: VisualQASurfaceSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

function readUiText(path: string): string {
  try {
    if (!existsSync(path)) return '';
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

export function getDevPulseV2VisualQAEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: VISUAL_QA_ENGINE_OWNER_MODULE,
    passToken: VISUAL_QA_ENGINE_PASS_TOKEN,
    phase: 24.71,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerVisualQAEngineWithSurface(): VisualQASurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const css = readUiText(UI_CSS_PATH);
  const html = readUiText(UI_HTML_PATH);

  cachedSnapshot = {
    cssAvailable: css.length > 0,
    htmlAvailable: html.length > 0,
    themeVariablesPresent: css.includes(':root') && css.includes('--bg'),
    accentColorPresent: css.includes('--teal') || css.includes('--turquoise'),
    gridLayoutPresent: css.includes('grid-template'),
    flexLayoutPresent: css.includes('display: flex'),
    mobileMediaQueries: countMatches(css, /@media\s*\(max-width/g),
    wideViewportRulesPresent: css.includes('min-width: 1440px') || css.includes('min-width: 1920px'),
    mobileNavTogglePresent: html.includes('id="mobile-nav-toggle"'),
    mobileFeedTogglePresent: html.includes('id="mobile-feed-toggle"'),
    hasNavigationPanel: html.includes('id="sidebar"'),
    hasStatusBar: html.includes('id="status-bar"'),
    hasPrimaryWorkspace: html.includes('id="center-area"'),
    hasOperatorFeed: html.includes('id="operator-feed"'),
    hasThreeColumnLayout: css.includes("'sidebar center feed'"),
    welcomeStatePresent: html.includes('id="chat-welcome-state"'),
    chatWorkspacePresent: html.includes('id="chat-surface"'),
    brandedShellPresent: html.includes('class="sidebar-brand"'),
    welcomeCopyPresent: html.includes('Unified Command Center Brain Connected'),
    commandCenterSurfacePresent: html.includes('DevPulse V2 Command Center'),
    statusBarPresent: html.includes('id="status-items"'),
    diagnosticSectionCount: countMatches(html, /section class="card"/g),
    cardComponentPresent: css.includes('.card'),
    fontFamilyDefined: css.includes('--font') || css.includes('font-family'),
    headingStylesPresent: css.includes('.welcome-title') || css.includes('h1'),
    cssSpacingTokens: countMatches(css, /padding:|margin:|gap:/g),
    panelCount: countMatches(html, /class="(sidebar|center-area|operator-feed|status-bar)"/g),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    interactiveExplanationsToken: getDevPulseV2InteractiveExplanations().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerVisualQAEngineWithInteractiveExplanations(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2InteractiveExplanations().passToken, readOnly: true };
}

export function registerVisualQAEngineWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerVisualQAEngineWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerVisualQAEngineWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerVisualQAEngineWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listVisualQAEngineUvlRows().length, readOnly: true };
}

export function evaluateVisualQAEngine(input: VisualQAInput): VisualQAResultBundle {
  const snapshot = registerVisualQAEngineWithSurface();

  const hierarchy = analyzeVisualHierarchy(input, {
    hasNavigationPanel: snapshot.hasNavigationPanel,
    hasStatusBar: snapshot.hasStatusBar,
    hasPrimaryWorkspace: snapshot.hasPrimaryWorkspace,
    hasOperatorFeed: snapshot.hasOperatorFeed,
  });
  const layout = analyzeLayoutQuality(input, {
    panelCount: snapshot.panelCount,
    hasThreeColumnLayout: snapshot.hasThreeColumnLayout,
    hasResponsiveRules: snapshot.mobileMediaQueries > 0,
  });
  const spacing = analyzeSpacingConsistency(input, {
    cssSpacingTokens: snapshot.cssSpacingTokens,
    mediaQueryCount: snapshot.mobileMediaQueries,
  });
  const alignment = analyzeAlignmentConsistency(input, {
    gridLayoutPresent: snapshot.gridLayoutPresent,
    flexLayoutPresent: snapshot.flexLayoutPresent,
  });
  const typography = analyzeTypographyQuality(input, {
    fontFamilyDefined: snapshot.fontFamilyDefined,
    headingStylesPresent: snapshot.headingStylesPresent,
  });
  const color = analyzeColorConsistency(input, {
    themeVariablesPresent: snapshot.themeVariablesPresent,
    accentColorPresent: snapshot.accentColorPresent,
  });
  const clutter = analyzeVisualClutter(input, {
    diagnosticSectionCount: snapshot.diagnosticSectionCount,
    cardComponentPresent: snapshot.cardComponentPresent,
  });
  const emptySpace = analyzeEmptySpaceUtilization(input, {
    welcomeStatePresent: snapshot.welcomeStatePresent,
    chatWorkspacePresent: snapshot.chatWorkspacePresent,
  });
  const mobile = analyzeMobileVisual(input, {
    mobileMediaQueries: snapshot.mobileMediaQueries,
    mobileNavTogglePresent: snapshot.mobileNavTogglePresent,
    mobileFeedTogglePresent: snapshot.mobileFeedTogglePresent,
  });
  const desktop = analyzeDesktopVisual(input, {
    threeColumnGridPresent: snapshot.hasThreeColumnLayout,
    operatorFeedPresent: snapshot.hasOperatorFeed,
    wideViewportRulesPresent: snapshot.wideViewportRulesPresent,
  });
  const firstImpression = analyzeFirstImpression(input, {
    brandedShellPresent: snapshot.brandedShellPresent,
    welcomeCopyPresent: snapshot.welcomeCopyPresent,
    accentThemePresent: snapshot.accentColorPresent,
  });
  const professionalism = analyzeProductProfessionalism(input, {
    commandCenterSurfacePresent: snapshot.commandCenterSurfacePresent,
    statusBarPresent: snapshot.statusBarPresent,
  });

  const authority = buildVisualQAAuthority(
    input.requestId,
    hierarchy,
    layout,
    spacing,
    alignment,
    typography,
    color,
    clutter,
    emptySpace,
    mobile,
    desktop,
    firstImpression,
    professionalism,
    input,
  );
  const evaluation = evaluateVisualQA(authority);

  recordCounter += 1;
  const record: VisualQARecord = {
    visualQaId: `visual-qa-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    surfaceType: input.surfaceType ?? 'rendered_ui',
    viewport: input.viewport ?? 'both',
    overallScore: evaluation.overallScore,
    visualQaResult: evaluation.visualQaResult,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerVisualQARecord(record);
  recordVisualQAHistory(record);

  const report = generateVisualQAReport(
    record,
    evaluation,
    hierarchy,
    layout,
    spacing,
    alignment,
    typography,
    color,
    clutter,
    emptySpace,
    mobile,
    desktop,
    firstImpression,
    professionalism,
  );

  return { record, report };
}

export function getVisualQARuntimeReport(): VisualQARuntimeReport {
  const cache = getVisualQACacheStats();
  return {
    hierarchyAnalysisCount: getHierarchyAnalysisCount(),
    layoutAnalysisCount: getLayoutAnalysisCount(),
    spacingAnalysisCount: getSpacingAnalysisCount(),
    alignmentAnalysisCount: getAlignmentAnalysisCount(),
    typographyAnalysisCount: getTypographyAnalysisCount(),
    colorAnalysisCount: getColorAnalysisCount(),
    clutterAnalysisCount: getClutterAnalysisCount(),
    emptySpaceAnalysisCount: getEmptySpaceAnalysisCount(),
    mobileAnalysisCount: getMobileAnalysisCount(),
    desktopAnalysisCount: getDesktopAnalysisCount(),
    firstImpressionAnalysisCount: getFirstImpressionAnalysisCount(),
    professionalismAnalysisCount: getProfessionalismAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getVisualQARecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetVisualQAEngineOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
