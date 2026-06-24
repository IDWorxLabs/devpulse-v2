/**
 * Product Architect Intelligence V1 — missing screen detection.
 */

import { matchesAnyPattern, resolveProductPattern } from './product-pattern-registry.js';
import type {
  MissingScreenFinding,
  ProductArchitectDomain,
  ProductGapSeverity,
  ProductPatternDefinition,
} from './product-architect-intelligence-types.js';

function severityForMissingScreen(
  screen: ProductPatternDefinition['expectedScreens'][number],
  domain: ProductArchitectDomain,
): { severity: ProductGapSeverity; flag: string } {
  if (!screen.critical) {
    return { severity: 'INFO', flag: 'Product Gap' };
  }
  if (domain === 'MARKETPLACE') {
    return { severity: 'WARNING', flag: 'Launch Risk' };
  }
  return { severity: 'CRITICAL', flag: 'Critical Product Gap' };
}

export function detectMissingScreens(input: {
  evidenceText: string;
  domain: ProductArchitectDomain;
}): MissingScreenFinding[] {
  const pattern = resolveProductPattern(input.domain);
  if (!pattern) return [];

  const findings: MissingScreenFinding[] = [];
  for (const screen of pattern.expectedScreens) {
    if (matchesAnyPattern(input.evidenceText, screen.detectionPatterns)) continue;
    const { severity, flag } = severityForMissingScreen(screen, input.domain);
    findings.push({
      readOnly: true,
      screen: screen.label,
      severity,
      flag,
      critical: screen.critical,
    });
  }
  return findings;
}
