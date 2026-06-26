/**
 * Materialization Quality Score V1 — gap detection from evidence.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  getProfileFeatureDefinition,
  type MaterializationProfile,
} from '../universal-prompt-to-app-materialization/profile-feature-map.js';

const GENERIC_PM_MARKERS = ['Project Management System', 'Welcome to Project Management'];

export function detectMaterializationQualityGaps(input: {
  manifest: GeneratedAppManifest;
  workspaceDir: string;
  matchedUiTerms: string[];
  missingFeatureModules: string[];
  shellSource: string;
}): {
  gaps: string[];
  criticalFailures: string[];
  recommendedNextActions: string[];
} {
  const gaps: string[] = [];
  const criticalFailures: string[] = [];
  const recommendedNextActions: string[] = [];

  const profile = String(input.manifest.selectedProfile) as MaterializationProfile;
  const definition = getProfileFeatureDefinition(profile, input.manifest.prompt);

  for (const moduleId of input.missingFeatureModules) {
    gaps.push(formatModuleGap(moduleId));
  }

  for (const term of definition.requiredUiTerms) {
    if (!input.matchedUiTerms.some((matched) => matched.toLowerCase().includes(term.toLowerCase()))) {
      gaps.push(formatTermGap(term));
    }
  }

  if (input.manifest.status === 'FAIL' || input.manifest.status === 'ABORTED') {
    criticalFailures.push(input.manifest.failureReason ?? 'Build failed before materialization completed');
    recommendedNextActions.push('Fix the build failure and re-run materialization');
  }

  if (input.manifest.previewHtmlStatus === 'FAIL' || !input.manifest.previewVerified) {
    gaps.push('Live preview verification incomplete');
    recommendedNextActions.push('Verify preview HTML and dev server startup');
  }

  if (input.manifest.productionValidationStatus === 'FAIL') {
    criticalFailures.push(
      input.manifest.productionValidationFailureReasons[0] ?? 'Production validation failed',
    );
    recommendedNextActions.push('Resolve production validation failures before launch');
  }

  if (input.manifest.persistentProjectRealityStatus !== 'PASS') {
    gaps.push('Persistent project workspace not promoted');
    recommendedNextActions.push('Promote successful build into persistent project source');
  }

  if (input.manifest.fallbackUsed) {
    gaps.push('Generic profile fallback was used');
    recommendedNextActions.push('Align prompt and profile selection to avoid generic fallback');
  }

  if (GENERIC_PM_MARKERS.some((marker) => input.shellSource.includes(marker))) {
    gaps.push('Generic Project Management fallback detected in shell');
    criticalFailures.push('Generic Project Management fallback in blueprint shell');
  }

  if (input.manifest.blueprintPurityStatus === 'FAIL') {
    criticalFailures.push(
      input.manifest.blueprintPurityFailureReasons[0] ?? 'Blueprint purity violations detected',
    );
  }

  return {
    gaps: [...new Set(gaps)],
    criticalFailures: [...new Set(criticalFailures)],
    recommendedNextActions: [...new Set(recommendedNextActions)],
  };
}

function formatModuleGap(moduleId: string): string {
  const label = moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return label;
}

function formatTermGap(term: string): string {
  if (term === 'csv') return 'CSV Export';
  if (term === 'chart') return 'Charts / Analytics';
  if (term === 'reports') return 'Advanced Reports';
  if (term === 'budget') return 'Budget Analytics';
  return term.charAt(0).toUpperCase() + term.slice(1);
}

export function deriveMaterializationStrengths(categories: Array<{ label: string; score: number }>): string[] {
  return categories
    .filter((category) => category.score >= 90)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((category) => category.label);
}
