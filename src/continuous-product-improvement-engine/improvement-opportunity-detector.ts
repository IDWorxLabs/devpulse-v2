/**
 * Continuous Product Improvement Engine — opportunity detection from signals.
 */

import type {
  ImprovementOpportunity,
  ImprovementOpportunityCategory,
  ImprovementSignalRecord,
} from './continuous-improvement-types.js';

let opportunityCounter = 0;

export function resetImprovementOpportunityDetectorForTests(): void {
  opportunityCounter = 0;
}

function nextOpportunityId(): string {
  opportunityCounter += 1;
  return `opp-${opportunityCounter}`;
}

function categoryForSignal(signal: ImprovementSignalRecord): ImprovementOpportunityCategory {
  switch (signal.kind) {
    case 'UX_FRICTION':
    case 'FRICTION':
      return /emergency|step/i.test(signal.observedResult)
        ? 'USABILITY_IMPROVEMENT'
        : 'INTERACTION_CLARITY';
    case 'PERFORMANCE_DEGRADATION':
      return /memory/i.test(signal.evidence) ? 'MEMORY_OPTIMIZATION' : 'PERFORMANCE_OPTIMIZATION';
    case 'ACCESSIBILITY_WARNING':
      return 'ACCESSIBILITY_IMPROVEMENT';
    case 'DEVICE_WARNING':
      return 'RESPONSIVE_LAYOUT_IMPROVEMENT';
    case 'SECURITY_CONCERN':
      return 'SECURITY_HARDENING';
    case 'RELIABILITY_RISK':
      return 'RELIABILITY_IMPROVEMENT';
    case 'EDGE_CASE_GAP':
    case 'STRESS_WARNING':
      return 'EDGE_CASE_HANDLING';
    case 'SCALABILITY_LIMIT':
      return 'SCALABILITY_IMPROVEMENT';
    case 'MAINTAINABILITY_CONCERN':
      return 'QUALITY_REFACTOR';
    case 'QUALITY_GAP':
      return /copy/i.test(signal.observedResult) ? 'USABILITY_IMPROVEMENT' : 'QUALITY_REFACTOR';
    default:
      return 'RELIABILITY_IMPROVEMENT';
  }
}

function impactForCategory(category: ImprovementOpportunityCategory, signal: ImprovementSignalRecord): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (/emergency/i.test(signal.observedResult) || category === 'ACCESSIBILITY_IMPROVEMENT') return 'HIGH';
  if (category === 'PERFORMANCE_OPTIMIZATION' || signal.severity === 'HIGH') return 'MEDIUM';
  if (signal.severity === 'LOW') return 'LOW';
  return 'MEDIUM';
}

export function detectImprovementOpportunities(
  signals: readonly ImprovementSignalRecord[],
): ImprovementOpportunity[] {
  const grouped = new Map<string, ImprovementSignalRecord[]>();

  for (const signal of signals) {
    const key = `${signal.source}:${categoryForSignal(signal)}:${signal.observedResult.slice(0, 48)}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(signal);
    grouped.set(key, bucket);
  }

  const opportunities: ImprovementOpportunity[] = [];

  for (const group of grouped.values()) {
    const primary = group[0]!;
    const category = categoryForSignal(primary);
    const impact = impactForCategory(category, primary);
    const effort =
      category === 'PERFORMANCE_OPTIMIZATION' ? 'MEDIUM' :
      category === 'QUALITY_REFACTOR' ? 'HIGH' :
      'LOW';
    const risk =
      category === 'USABILITY_IMPROVEMENT' && /remove|simplify workflow/i.test(primary.evidence)
        ? 'HIGH'
        : 'LOW';

    opportunities.push({
      readOnly: true,
      opportunityId: nextOpportunityId(),
      category,
      evidenceSource: primary.source,
      signalIds: group.map((s) => s.signalId),
      affectedRequirements: [...new Set(group.flatMap((s) => s.requirementIds))],
      affectedFeatures: [...new Set(group.flatMap((s) => s.featureSliceIds))],
      affectedCapabilities: [...new Set(group.flatMap((s) => s.capabilityIds))],
      affectedBehaviors: [...new Set(group.flatMap((s) => s.behaviorScenarioIds))],
      affectedVirtualUsers: [...new Set(group.flatMap((s) => s.virtualUserIds))],
      affectedDevices: [...new Set(group.flatMap((s) => s.deviceProfileIds))],
      affectedInteractions: [...new Set(group.flatMap((s) => s.interactionIds))],
      severity: group.some((s) => s.severity === 'HIGH')
        ? 'HIGH'
        : group.some((s) => s.severity === 'MEDIUM')
          ? 'MEDIUM'
          : 'LOW',
      impact,
      effort,
      risk,
      promptFaithfulnessRisk: risk === 'HIGH' ? 'HIGH' : 'LOW',
      expectedBenefit: `Improve ${category.toLowerCase().replace(/_/g, ' ')} for ${primary.source}`,
      summary: primary.observedResult,
    });
  }

  return opportunities;
}
