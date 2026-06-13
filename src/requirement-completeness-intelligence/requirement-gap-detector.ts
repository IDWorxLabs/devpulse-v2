/**
 * Requirement Gap Detector — evidence-based missing requirement identification (V1).
 */

import type {
  AnalysisDomain,
  ConsolidatedRequirementEvidence,
  DomainAnalysisResult,
  RequirementGap,
  RequirementRiskLevel,
} from './requirement-completeness-types.js';
import type { ProjectScopeAnalysis } from './project-scope-analyzer.js';

function gapSeverity(domain: AnalysisDomain, gapId: string): RequirementRiskLevel {
  if (gapId.includes('NOT_DEFINED') && (domain === 'AUTHENTICATION' || domain === 'PLATFORM_TARGETS')) {
    return 'CRITICAL';
  }
  if (gapId.includes('NOT_DEFINED') && domain === 'UI_REQUIREMENTS') return 'HIGH';
  if (gapId.includes('NOT_FULLY') || gapId.includes('PARTIAL')) return 'HIGH';
  if (gapId.includes('WITHOUT')) return 'HIGH';
  if (gapId.includes('NOT_DEFINED')) return 'MEDIUM';
  return 'LOW';
}

export function detectRequirementGaps(input: {
  evidence: ConsolidatedRequirementEvidence;
  domainResults: readonly DomainAnalysisResult[];
  scope: ProjectScopeAnalysis;
}): RequirementGap[] {
  const gaps: RequirementGap[] = [];

  for (const domainResult of input.domainResults) {
    for (const gap of domainResult.gaps) {
      gaps.push({
        readOnly: true,
        domain: domainResult.domain,
        gapId: gap,
        description: gap.replace(/_/g, ' ').toLowerCase(),
        severity: gapSeverity(domainResult.domain, gap),
        evidence: [`DOMAIN_${domainResult.domain}`, `DOMAIN_SCORE_${domainResult.score}`],
      });
    }
  }

  for (const risk of input.scope.scopeRisks) {
    gaps.push({
      readOnly: true,
      domain: 'BUSINESS_LOGIC',
      gapId: risk,
      description: risk.replace(/_/g, ' ').toLowerCase(),
      severity: risk.includes('WITHOUT') ? 'HIGH' : 'MEDIUM',
      evidence: ['SCOPE_RISK'],
    });
  }

  if (input.evidence.sources.length === 0) {
    gaps.push({
      readOnly: true,
      domain: 'PLATFORM_TARGETS',
      gapId: 'NO_EVIDENCE_SOURCES',
      description: 'no requirement evidence sources provided',
      severity: 'CRITICAL',
      evidence: ['EMPTY_EVIDENCE'],
    });
  }

  const seen = new Set<string>();
  return gaps.filter((g) => {
    const key = `${g.domain}:${g.gapId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
