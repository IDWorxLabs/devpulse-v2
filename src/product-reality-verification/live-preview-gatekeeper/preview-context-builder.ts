/**
 * Live Preview Gatekeeper — preview context builder.
 */

import type { PreviewContext, PreviewContextType } from './live-preview-types.js';
import { PREVIEW_CONTEXT_PASS } from './live-preview-types.js';
import { getCachedPreviewContext, setCachedPreviewContext } from './live-preview-cache.js';

const CONTEXT_DEFINITIONS: Record<PreviewContextType, Omit<PreviewContext, 'passToken'>> = {
  DESKTOP_PREVIEW_REVIEW: {
    contextType: 'DESKTOP_PREVIEW_REVIEW',
    previewIntent: 'Verify desktop product surface in live preview at full viewport',
    expectedVisiblePreviewState: 'Desktop preview frame, target URL, ready/blocked state, and session status',
    expectedUserAction: 'Open desktop preview and compare rendered surface to expected work',
    expectedReadinessSignal: 'PREVIEW_READY or honest PREVIEW_BLOCKED with reason',
    likelyConfusionRisks: ['mobile-only preview shown on desktop', 'empty iframe', 'stale session state'],
    fallbackExpectationWhenUnavailable: 'Clear blocked message with desktop recommendation and next verification step',
  },
  MOBILE_PREVIEW_REVIEW: {
    contextType: 'MOBILE_PREVIEW_REVIEW',
    previewIntent: 'Verify mobile product reality on phone-sized viewport',
    expectedVisiblePreviewState: 'Mobile preview policy, blocked/allowed state, and device recommendation',
    expectedUserAction: 'Switch to mobile preview or follow desktop recommendation honestly',
    expectedReadinessSignal: 'MOBILE_PREVIEW_ALLOWED or MOBILE_PREVIEW_BLOCKED with reason',
    likelyConfusionRisks: ['desktop preview masquerading as mobile', 'missing blocked reason', 'viewport not switching'],
    fallbackExpectationWhenUnavailable: 'Explain mobile preview blocked and offer desktop verification path',
  },
  TABLET_PREVIEW_REVIEW: {
    contextType: 'TABLET_PREVIEW_REVIEW',
    previewIntent: 'Verify tablet-width layout and responsive breakpoints',
    expectedVisiblePreviewState: 'Tablet viewport context and meaningful app surface',
    expectedUserAction: 'Review tablet layout for navigation, spacing, and touch targets',
    expectedReadinessSignal: 'Responsive preview support with viewport clarity',
    likelyConfusionRisks: ['no tablet viewport option', 'desktop-only preview', 'unclear breakpoint state'],
    fallbackExpectationWhenUnavailable: 'State tablet preview unavailable and suggest desktop/mobile alternatives',
  },
  FOUNDER_ACCEPTANCE_REVIEW: {
    contextType: 'FOUNDER_ACCEPTANCE_REVIEW',
    previewIntent: 'Founder verifies completed work before acceptance',
    expectedVisiblePreviewState: 'Representative preview, comparison context, and copy/report actions',
    expectedUserAction: 'Compare expected vs actual behavior and decide accept, fix, or escalate',
    expectedReadinessSignal: 'Founder can trace preview finding to verification report',
    likelyConfusionRisks: ['placeholder-only preview', 'no next step after preview', 'false ready state'],
    fallbackExpectationWhenUnavailable: 'Honest unavailable state with safe founder next step',
  },
  UVL_REPORT_REVIEW: {
    contextType: 'UVL_REPORT_REVIEW',
    previewIntent: 'Connect live preview evidence to UVL verification rows',
    expectedVisiblePreviewState: 'Preview findings traceable to UVL report sections',
    expectedUserAction: 'Cross-check preview state against UVL pass/fail evidence',
    expectedReadinessSignal: 'Preview-report connection visible in verification workflow',
    likelyConfusionRisks: ['preview disconnected from UVL', 'untraceable evidence', 'report mismatch'],
    fallbackExpectationWhenUnavailable: 'Direct user to UVL report without pretending preview succeeded',
  },
  WORLD2_PREVIEW_REVIEW: {
    contextType: 'WORLD2_PREVIEW_REVIEW',
    previewIntent: 'Preview World 2 builder output and simulation surfaces',
    expectedVisiblePreviewState: 'World 2 target registered with meaningful preview URL or blocked reason',
    expectedUserAction: 'Open World 2 preview to verify builder packet output',
    expectedReadinessSignal: 'World 2 preview target discoverable with honest runtime state',
    likelyConfusionRisks: ['World 2 nav placeholder without preview', 'stale builder output', 'hidden blocked state'],
    fallbackExpectationWhenUnavailable: 'Explain World 2 preview waiting for runtime with safe next step',
  },
  PROJECT_BUILD_PREVIEW_REVIEW: {
    contextType: 'PROJECT_BUILD_PREVIEW_REVIEW',
    previewIntent: 'Preview project build output after autonomous or manual build',
    expectedVisiblePreviewState: 'Build-linked preview session with real app surface',
    expectedUserAction: 'Verify build artifact through live preview before launch decision',
    expectedReadinessSignal: 'Build preview ready or honestly blocked with failure reason',
    likelyConfusionRisks: ['build complete but preview empty', 'preview shows old build', 'completion overstated'],
    fallbackExpectationWhenUnavailable: 'State build preview unavailable with rebuild or UVL next step',
  },
};

let contextBuildCount = 0;

export function buildPreviewContext(contextType: PreviewContextType): PreviewContext {
  const cacheKey = contextType;
  const cached = getCachedPreviewContext(cacheKey);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = CONTEXT_DEFINITIONS[contextType];
  const context: PreviewContext = { ...def, passToken: PREVIEW_CONTEXT_PASS };
  setCachedPreviewContext(cacheKey, context);
  return context;
}

export function listPreviewContextTypes(): readonly PreviewContextType[] {
  return Object.keys(CONTEXT_DEFINITIONS) as PreviewContextType[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetPreviewContextBuilderForTests(): void {
  contextBuildCount = 0;
}
