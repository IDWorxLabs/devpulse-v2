/**
 * Frontend Architecture Summarizer — detected UI needs (V1).
 */

import type { ArchitectureEvidenceBundle, ArchitectureFrontendSummary } from './architecture-brief-types.js';

export function summarizeFrontendArchitecture(bundle: ArchitectureEvidenceBundle): ArchitectureFrontendSummary {
  const platforms = bundle.platforms.map((p) => p.toUpperCase());
  const webUi = platforms.includes('WEB') || /WEB/.test(bundle.productType);
  const mobileUi =
    platforms.includes('MOBILE') ||
    platforms.includes('IOS') ||
    platforms.includes('ANDROID') ||
    /MOBILE/.test(bundle.productType);
  const tabletUi =
    platforms.includes('TABLET') || platforms.includes('IPAD') || platforms.includes('ANDROID_TABLET');
  const desktopUi = platforms.includes('DESKTOP');

  const detectedNeeds: string[] = [];
  if (webUi) detectedNeeds.push('Responsive web UI with screen-based navigation');
  if (mobileUi) detectedNeeds.push('Native or cross-platform mobile UI');
  if (tabletUi) detectedNeeds.push('Tablet-optimized layout and navigation');
  if (desktopUi) detectedNeeds.push('Desktop application shell and window management');
  if (bundle.screens.length > 0) {
    detectedNeeds.push(`Screen inventory: ${bundle.screens.slice(0, 5).join(', ')}`);
  }

  return {
    readOnly: true,
    webUi,
    mobileUi,
    tabletUi,
    desktopUi,
    detectedNeeds,
    evidence: [...bundle.platforms, `SCREENS_${bundle.screens.length}`],
  };
}
