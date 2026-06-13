/**
 * Component Detector — evidence tokens from layout and pixel signals (V1).
 */

import {
  detectButtonGroup,
  detectFormLikeRegion,
  detectModalOverlay,
  normalizeConfidence,
} from './visual-reference-analyzer.js';
import type {
  ComponentDetectionEvidence,
  ComponentEvidenceToken,
  LayoutRegionEvidence,
  LuminanceGridSample,
} from './visual-reference-types.js';

function pushComponent(
  components: ComponentDetectionEvidence[],
  token: ComponentEvidenceToken,
  confidence: number,
  evidence: string[],
): void {
  if (confidence < 40) return;
  if (components.some((c) => c.token === token)) return;
  components.push({
    readOnly: true,
    token,
    confidence: normalizeConfidence(confidence),
    evidence,
  });
}

export function detectUiComponents(
  layoutRegions: readonly LayoutRegionEvidence[],
  sample: LuminanceGridSample | null,
): ComponentDetectionEvidence[] {
  const components: ComponentDetectionEvidence[] = [];
  const regionSet = new Set(layoutRegions.map((r) => r.region));

  if (regionSet.has('HEADER')) {
    pushComponent(components, 'HEADER_DETECTED', 70, ['LAYOUT_HEADER_REGION']);
  }
  if (regionSet.has('FOOTER')) {
    pushComponent(components, 'FOOTER_DETECTED', 68, ['LAYOUT_FOOTER_REGION']);
  }
  if (regionSet.has('SIDEBAR')) {
    pushComponent(components, 'SIDEBAR_DETECTED', 72, ['LAYOUT_SIDEBAR_REGION']);
  }
  if (regionSet.has('NAVIGATION')) {
    const bottomNav = layoutRegions.some(
      (r) => r.region === 'NAVIGATION' && r.evidence.some((e) => e.includes('BOTTOM')),
    );
    if (bottomNav) {
      pushComponent(components, 'BOTTOM_NAVIGATION_DETECTED', 75, [
        'LAYOUT_BOTTOM_NAVIGATION_REGION',
      ]);
    } else {
      pushComponent(components, 'NAVIGATION_DETECTED', 68, ['LAYOUT_NAVIGATION_REGION']);
    }
  }
  if (regionSet.has('CARDS')) {
    pushComponent(components, 'CARD_DETECTED', 65, ['LAYOUT_CARD_REGION']);
  }
  if (regionSet.has('LISTS')) {
    pushComponent(components, 'LIST_DETECTED', 60, ['LAYOUT_LIST_REGION']);
  }
  if (regionSet.has('FORMS')) {
    pushComponent(components, 'FORM_DETECTED', 66, ['LAYOUT_FORM_REGION']);
  }
  if (regionSet.has('BUTTONS')) {
    pushComponent(components, 'BUTTON_DETECTED', 58, ['LAYOUT_BUTTON_REGION']);
  }

  if (sample) {
    if (detectButtonGroup(sample)) {
      pushComponent(components, 'BUTTON_GROUP_DETECTED', 62, ['PIXEL_BUTTON_GROUP_CONTRAST']);
    }
    if (detectFormLikeRegion(sample) && !regionSet.has('FORMS')) {
      pushComponent(components, 'FORM_DETECTED', 55, ['PIXEL_FORM_FIELD_PATTERN']);
    }
    if (detectModalOverlay(sample)) {
      pushComponent(components, 'MODAL_DETECTED', 64, ['PIXEL_MODAL_OVERLAY_PATTERN']);
    }
  }

  return components;
}
