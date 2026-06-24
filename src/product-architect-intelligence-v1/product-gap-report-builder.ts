/**
 * Product Architect Intelligence V1 — product gap report builder.
 */

import { matchesAnyPattern, resolveProductPattern } from './product-pattern-registry.js';
import type {
  MissingScreenFinding,
  ProductArchitectDomain,
  ProductGapCategory,
  ProductGapFinding,
  ProductGapReport,
  ProductGapSeverity,
  UserJourneyFinding,
  WorkflowCompletenessFinding,
} from './product-architect-intelligence-types.js';

function pushGap(
  gaps: ProductGapFinding[],
  category: ProductGapCategory,
  severity: ProductGapSeverity,
  summary: string,
  detail: string,
): void {
  gaps.push({ readOnly: true, category, severity, summary, detail });
}

export function buildProductGapReport(input: {
  evidenceText: string;
  domain: ProductArchitectDomain;
  missingScreens: readonly MissingScreenFinding[];
  workflowAnalysis: readonly WorkflowCompletenessFinding[];
  journeyAnalysis: readonly UserJourneyFinding[];
}): ProductGapReport {
  const gaps: ProductGapFinding[] = [];
  const pattern = resolveProductPattern(input.domain);

  for (const missing of input.missingScreens) {
    pushGap(
      gaps,
      'Missing Screens',
      missing.severity,
      `Missing screen: ${missing.screen}`,
      `${missing.flag} — expected ${missing.screen} for ${input.domain} products.`,
    );
  }

  for (const workflow of input.workflowAnalysis.filter((item) => !item.complete)) {
    pushGap(
      gaps,
      'Missing Workflows',
      workflow.severity,
      `Workflow incomplete: ${workflow.workflow}`,
      workflow.missingSteps.length > 0
        ? `Missing steps: ${workflow.missingSteps.join(', ')}`
        : 'Workflow Incomplete',
    );
  }

  for (const journey of input.journeyAnalysis.filter((item) => !item.complete)) {
    pushGap(
      gaps,
      'Missing Workflows',
      journey.broken ? 'CRITICAL' : 'WARNING',
      `Broken journey: ${journey.journeyType}`,
      [
        ...journey.missingActions.map((action) => `Missing action: ${action}`),
        ...journey.deadEnds,
        ...journey.confusingNavigation,
      ].join('; '),
    );
  }

  if (pattern) {
    for (const role of pattern.expectedRoles) {
      if (!new RegExp(`\\b${role}\\b`, 'i').test(input.evidenceText)) {
        pushGap(
          gaps,
          'Missing Roles',
          'WARNING',
          `Missing role: ${role}`,
          `Expected ${role} role support for ${pattern.label}.`,
        );
      }
    }

    if (
      pattern.gapCategories.includes('Missing Notifications') &&
      !/\b(notifications?|alerts?|reminders?)\b/i.test(input.evidenceText)
    ) {
      pushGap(
        gaps,
        'Missing Notifications',
        'INFO',
        'Notification workflows not evidenced',
        'Users may miss important state changes without notification coverage.',
      );
    }

    if (
      pattern.gapCategories.includes('Missing Reporting') &&
      !/\b(reports?|analytics|dashboard|metrics)\b/i.test(input.evidenceText)
    ) {
      pushGap(
        gaps,
        'Missing Reporting',
        'WARNING',
        'Reporting capability not evidenced',
        'Operational visibility may be limited without reporting surfaces.',
      );
    }

    if (
      pattern.gapCategories.includes('Missing Administration') &&
      !/\b(admin|settings|configuration|manage users)\b/i.test(input.evidenceText)
    ) {
      pushGap(
        gaps,
        'Missing Administration',
        'WARNING',
        'Administration capability not evidenced',
        'Product operators may lack management controls.',
      );
    }

    if (
      pattern.gapCategories.includes('Missing Monetization') &&
      !/\b(payment|checkout|billing|subscription|monetiz)\b/i.test(input.evidenceText)
    ) {
      pushGap(
        gaps,
        'Missing Monetization',
        'WARNING',
        'Monetization workflow not evidenced',
        'Revenue-critical flows may be absent.',
      );
    }

    if (
      pattern.gapCategories.includes('Missing Permissions') &&
      !/\b(permission|role|access control|authorization)\b/i.test(input.evidenceText)
    ) {
      pushGap(
        gaps,
        'Missing Permissions',
        'INFO',
        'Permission model not evidenced',
        'Role-based access may be underspecified.',
      );
    }
  }

  const criticalGapCount = gaps.filter((gap) => gap.severity === 'CRITICAL').length;
  const warningGapCount = gaps.filter((gap) => gap.severity === 'WARNING').length;
  const infoGapCount = gaps.filter((gap) => gap.severity === 'INFO').length;

  return {
    readOnly: true,
    gaps,
    criticalGapCount,
    warningGapCount,
    infoGapCount,
    gapSummary: gaps.slice(0, 8).map((gap) => gap.summary),
  };
}

export function listCriticalProductGaps(report: ProductGapReport): readonly ProductGapFinding[] {
  return report.gaps.filter((gap) => gap.severity === 'CRITICAL');
}
