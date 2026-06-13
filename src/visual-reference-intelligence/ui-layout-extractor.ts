/**
 * UI Layout Extractor — evidence-based layout region detection (V1).
 */

import {
  averageBandLuminance,
  detectCardBlocks,
  detectFormLikeRegion,
  normalizeConfidence,
} from './visual-reference-analyzer.js';
import type {
  ImageMetadataEvidence,
  LayoutRegionEvidence,
  LuminanceGridSample,
} from './visual-reference-types.js';

function pushRegion(
  regions: LayoutRegionEvidence[],
  region: LayoutRegionEvidence['region'],
  confidence: number,
  evidence: string[],
): void {
  if (confidence < 40) return;
  regions.push({
    readOnly: true,
    region,
    confidence: normalizeConfidence(confidence),
    evidence,
  });
}

export function extractUiLayout(
  metadata: ImageMetadataEvidence,
  sample: LuminanceGridSample | null,
): LayoutRegionEvidence[] {
  const regions: LayoutRegionEvidence[] = [];
  const { width, height, aspectRatio } = metadata;

  if (!sample) {
    if (width > 0 && height > 0) {
      if (aspectRatio < 0.85) {
        pushRegion(regions, 'NAVIGATION', 45, [
          'PORTRAIT_ASPECT_RATIO_SUGGESTS_MOBILE_NAV_CONTEXT',
        ]);
      }
      if (width >= 1024) {
        pushRegion(regions, 'HEADER', 42, ['WIDE_VIEWPORT_SUGGESTS_HEADER_BAND']);
      }
    }
    return regions;
  }

  const topBand = averageBandLuminance(sample, 'top', 0.12);
  const bottomBand = averageBandLuminance(sample, 'bottom', 0.12);
  const leftBand = averageBandLuminance(sample, 'left', 0.14);
  const rightBand = averageBandLuminance(sample, 'right', 0.14);
  const centerBand = averageBandLuminance(sample, 'top', 0.5);

  if (topBand <= centerBand - 25) {
    pushRegion(regions, 'HEADER', 55 + Math.min(30, centerBand - topBand), [
      'TOP_BAND_LUMINANCE_CONTRAST',
      `TOP_BAND_AVG_${Math.round(topBand)}`,
    ]);
  }

  if (bottomBand <= centerBand - 20 && aspectRatio < 0.85) {
    pushRegion(regions, 'NAVIGATION', 50 + Math.min(25, centerBand - bottomBand), [
      'BOTTOM_BAND_LUMINANCE_CONTRAST',
      'PORTRAIT_LAYOUT',
    ]);
  } else if (bottomBand <= centerBand - 25) {
    pushRegion(regions, 'FOOTER', 52 + Math.min(25, centerBand - bottomBand), [
      'BOTTOM_BAND_LUMINANCE_CONTRAST',
    ]);
  }

  if (leftBand <= centerBand - 22 && width >= 768) {
    pushRegion(regions, 'SIDEBAR', 58 + Math.min(22, centerBand - leftBand), [
      'LEFT_BAND_LUMINANCE_CONTRAST',
      'WIDE_VIEWPORT',
    ]);
  }

  if (rightBand <= centerBand - 22 && width >= 768) {
    pushRegion(regions, 'SIDEBAR', 52, ['RIGHT_BAND_LUMINANCE_CONTRAST', 'WIDE_VIEWPORT']);
  }

  const cardBlocks = detectCardBlocks(sample);
  if (cardBlocks >= 2) {
    pushRegion(regions, 'CARDS', 50 + Math.min(35, cardBlocks * 8), [
      'CARD_LIKE_BLOCKS_DETECTED',
      `CARD_BLOCK_COUNT_${cardBlocks}`,
    ]);
  }

  if (detectFormLikeRegion(sample)) {
    pushRegion(regions, 'FORMS', 55, ['FORM_LIKE_LIGHT_FIELD_ROWS']);
  }

  const buttonContrast = Math.abs(topBand - bottomBand);
  if (buttonContrast >= 15 || detectFormLikeRegion(sample)) {
    pushRegion(regions, 'BUTTONS', 48 + Math.min(20, buttonContrast), [
      'ACTION_CONTROL_CONTRAST_SIGNAL',
    ]);
  }

  if (cardBlocks >= 4) {
    pushRegion(regions, 'LISTS', 46, ['REPEATED_VERTICAL_BLOCKS_SUGGEST_LIST']);
  }

  return regions;
}
