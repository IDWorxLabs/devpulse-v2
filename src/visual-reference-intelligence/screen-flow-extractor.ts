/**
 * Screen Flow Extractor — screen classification and flow inference (V1).
 */

import { normalizeConfidence } from './visual-reference-analyzer.js';
import type {
  ComponentDetectionEvidence,
  DetectedPlatform,
  FlowInferenceEvidence,
  ImageMetadataEvidence,
  InferredFlowType,
  LayoutRegionEvidence,
  ScreenClassification,
  ScreenDetectionResult,
} from './visual-reference-types.js';

function inferPlatform(metadata: ImageMetadataEvidence): DetectedPlatform {
  const { width, height, aspectRatio } = metadata;
  if (width === 0 || height === 0) return 'UNKNOWN';

  if (width <= 480 && aspectRatio < 0.85) return 'MOBILE';
  if (width >= 1024 && aspectRatio >= 1.2) return 'DESKTOP';
  if (width >= 768 && aspectRatio >= 0.9 && aspectRatio <= 1.4) return 'WEB';
  if (aspectRatio < 0.75) return 'MOBILE';
  if (width >= 600) return 'WEB';
  return 'UNKNOWN';
}

function classifyScreen(
  platform: DetectedPlatform,
  layoutRegions: readonly LayoutRegionEvidence[],
  components: readonly ComponentDetectionEvidence[],
): ScreenClassification {
  const regionSet = new Set(layoutRegions.map((r) => r.region));
  const tokens = new Set(components.map((c) => c.token));

  if (regionSet.has('SIDEBAR') && (regionSet.has('CARDS') || tokens.has('CARD_DETECTED'))) {
    return 'DASHBOARD';
  }
  if (platform === 'MOBILE' && tokens.has('BOTTOM_NAVIGATION_DETECTED')) {
    return 'APP';
  }
  if (regionSet.has('HEADER') && regionSet.has('FOOTER') && !regionSet.has('SIDEBAR')) {
    return 'SITE';
  }
  if (tokens.has('FORM_DETECTED') && !regionSet.has('SIDEBAR')) {
    return 'APP';
  }
  if (regionSet.has('CARDS') || regionSet.has('LISTS')) {
    return 'DASHBOARD';
  }
  return 'UNKNOWN';
}

export function detectScreenContext(
  metadata: ImageMetadataEvidence,
  layoutRegions: readonly LayoutRegionEvidence[],
  components: readonly ComponentDetectionEvidence[],
): ScreenDetectionResult {
  const platform = inferPlatform(metadata);
  const classification = classifyScreen(platform, layoutRegions, components);
  const evidence: string[] = [];

  if (metadata.width > 0) evidence.push(`VIEWPORT_WIDTH_${metadata.width}`);
  if (metadata.height > 0) evidence.push(`VIEWPORT_HEIGHT_${metadata.height}`);
  evidence.push(`PLATFORM_${platform}`);
  evidence.push(`CLASSIFICATION_${classification}`);

  const screenCountEstimate =
    classification === 'DASHBOARD' && layoutRegions.some((r) => r.region === 'SIDEBAR') ? 2 : 1;

  return {
    readOnly: true,
    screenCountEstimate,
    screenType: classification,
    platform,
    classification,
    evidence,
  };
}

function pushFlow(
  flows: FlowInferenceEvidence[],
  flow: InferredFlowType,
  confidence: number,
  evidence: string[],
): void {
  if (confidence < 35) return;
  if (flows.some((f) => f.flow === flow)) return;
  flows.push({
    readOnly: true,
    flow,
    confidence: normalizeConfidence(confidence),
    evidence,
  });
}

export function extractScreenFlows(
  screen: ScreenDetectionResult,
  layoutRegions: readonly LayoutRegionEvidence[],
  components: readonly ComponentDetectionEvidence[],
): FlowInferenceEvidence[] {
  const flows: FlowInferenceEvidence[] = [];
  const tokens = new Set(components.map((c) => c.token));
  const regionSet = new Set(layoutRegions.map((r) => r.region));

  if (tokens.has('FORM_DETECTED') && !regionSet.has('SIDEBAR')) {
    pushFlow(flows, 'AUTHENTICATION', 62, ['FORM_WITHOUT_SIDEBAR_SUGGESTS_AUTH']);
  }

  if (screen.classification === 'DASHBOARD' || tokens.has('CARD_DETECTED')) {
    pushFlow(flows, 'DASHBOARD', 68, ['DASHBOARD_LAYOUT_SIGNALS']);
  }

  if (tokens.has('BOTTOM_NAVIGATION_DETECTED') && screen.platform === 'MOBILE') {
    pushFlow(flows, 'ONBOARDING', 48, ['MOBILE_APP_SHELL']);
    pushFlow(flows, 'PROFILE', 50, ['MOBILE_APP_SHELL']);
  }

  if (regionSet.has('SIDEBAR') && tokens.has('FORM_DETECTED')) {
    pushFlow(flows, 'SETTINGS', 58, ['SIDEBAR_WITH_FORM']);
  }

  if (tokens.has('BUTTON_GROUP_DETECTED') && tokens.has('FORM_DETECTED')) {
    pushFlow(flows, 'CHECKOUT', 55, ['FORM_WITH_ACTION_BUTTONS']);
  }

  if (tokens.has('LIST_DETECTED') && tokens.has('NAVIGATION_DETECTED')) {
    pushFlow(flows, 'MESSAGING', 52, ['LIST_WITH_NAVIGATION']);
  }

  if (screen.classification === 'APP' && flows.length === 0) {
    pushFlow(flows, 'ONBOARDING', 45, ['APP_CLASSIFICATION_DEFAULT']);
  }

  return flows;
}
