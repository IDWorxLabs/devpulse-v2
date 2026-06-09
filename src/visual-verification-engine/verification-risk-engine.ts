/**
 * Verification risk engine — classifies verification risks without auto-fix.
 */

import type { VerificationEvidence, VerificationResult, VerificationRisk } from './types.js';

let riskCounter = 0;

export function resetVerificationRiskCounterForTests(): void {
  riskCounter = 0;
}

function nextRiskId(): string {
  riskCounter += 1;
  return `vrisk-${riskCounter.toString().padStart(3, '0')}`;
}

const ISSUE_RISK_MAP: Record<string, { level: VerificationRisk['level']; category: string }> = {
  'missing-required-layout-region': { level: 'HIGH', category: 'layout' },
  'unexpected-layout-region': { level: 'MEDIUM', category: 'layout' },
  'missing-navigation-path': { level: 'HIGH', category: 'navigation' },
  'missing-menu-structure': { level: 'MEDIUM', category: 'navigation' },
  'missing-tab-structure': { level: 'MEDIUM', category: 'navigation' },
  'missing-route-structure': { level: 'HIGH', category: 'navigation' },
  'missing-loading-indicator': { level: 'MEDIUM', category: 'loading' },
  'missing-readiness-indicator': { level: 'MEDIUM', category: 'loading' },
  'empty-state-not-exposed': { level: 'LOW', category: 'loading' },
  'error-state-not-exposed': { level: 'MEDIUM', category: 'loading' },
  'missing-mobile-region': { level: 'HIGH', category: 'responsive' },
  'missing-tablet-region': { level: 'MEDIUM', category: 'responsive' },
  'missing-desktop-region': { level: 'HIGH', category: 'responsive' },
  'missing-responsive-container': { level: 'MEDIUM', category: 'responsive' },
  'responsive-surface-missing': { level: 'CRITICAL', category: 'responsive' },
  'interaction-outcome-unavailable': { level: 'HIGH', category: 'interaction' },
  'interaction-blocked': { level: 'CRITICAL', category: 'interaction' },
  'interaction-unavailable': { level: 'HIGH', category: 'interaction' },
};

export function classifyVerificationRisks(
  results: VerificationResult[],
  evidence: VerificationEvidence[],
): VerificationRisk[] {
  const risks: VerificationRisk[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    for (const issue of result.issueClassifications) {
      if (seen.has(issue)) continue;
      seen.add(issue);
      const mapping = ISSUE_RISK_MAP[issue] ?? { level: 'MEDIUM' as const, category: 'general' };
      risks.push({
        riskId: nextRiskId(),
        level: mapping.level,
        category: mapping.category,
        description: issue.replace(/-/g, ' '),
        relatedTargetId: result.targetId,
      });
    }
  }

  if (evidence.length === 0) {
    risks.push({
      riskId: nextRiskId(),
      level: 'CRITICAL',
      category: 'evidence',
      description: 'verification evidence missing',
      relatedTargetId: null,
    });
  }

  return risks;
}
