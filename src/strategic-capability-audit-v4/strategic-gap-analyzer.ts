/**
 * Strategic Capability Audit V4 — evidence-driven gap analyzer (no V3 roadmap assumptions).
 */

import type {
  StrategicGapEntry,
  StrategicGapCategory,
} from './strategic-capability-audit-v4-types.js';
import type { StrategicEvidenceSnapshot } from './strategic-evidence-collector.js';
import type {
  AutonomyReadinessAssessment,
  CommercializationReadinessAssessment,
  FactoryReadinessAssessment,
} from './strategic-capability-audit-v4-types.js';
import {
  collectProvenStrategicCapabilities,
  gapCapabilityToPhase,
  isPhaseProven,
} from './strategic-proven-capability-registry.js';
import { filterUnresolvedGaps } from './strategic-roadmap-evidence-builder.js';

const SEVERITY_WEIGHT: Record<StrategicGapEntry['severity'], number> = {
  BLOCKING: 1000,
  HIGH: 700,
  MEDIUM: 400,
  LOW: 200,
};

function gap(
  gapId: string,
  category: StrategicGapCategory,
  capability: string,
  severity: StrategicGapEntry['severity'],
  detail: string,
  evidenceBasis: string,
  strategicValueScore: number,
): StrategicGapEntry {
  return {
    readOnly: true,
    gapId,
    category,
    capability,
    severity,
    detail,
    evidenceBasis,
    strategicValueScore: strategicValueScore + SEVERITY_WEIGHT[severity] / 10,
  };
}

export function analyzeStrategicGaps(input: {
  evidence: StrategicEvidenceSnapshot;
  factoryReadiness: FactoryReadinessAssessment;
  autonomyReadiness: AutonomyReadinessAssessment;
  commercializationReadiness: CommercializationReadinessAssessment;
}): StrategicGapEntry[] {
  const { evidence } = input;
  const gaps: StrategicGapEntry[] = [];
  const suite = evidence.uvl.suiteCoverage;

  for (const dimension of input.commercializationReadiness.dimensions) {
    if (dimension.score >= 60) continue;
    const category: StrategicGapCategory =
      dimension.dimension.includes('Customer') || dimension.dimension.includes('Billing')
        ? 'Customer-Facing Capabilities'
        : dimension.dimension.includes('Cloud') || dimension.dimension.includes('Deployment')
          ? 'Cloud-Scale Capabilities'
          : 'Commercialization & Deployment';

    gaps.push(
      gap(
        `commercial-${dimension.dimension.toLowerCase().replace(/\s+/g, '-')}`,
        category,
        dimension.dimension,
        dimension.score < 35 ? 'HIGH' : 'MEDIUM',
        dimension.evidence,
        `Commercialization readiness dimension score ${dimension.score}/100`,
        dimension.score < 35 ? 85 : 60,
      ),
    );
  }

  for (const dimension of input.factoryReadiness.dimensions) {
    if (dimension.score >= 60) continue;
    gaps.push(
      gap(
        `factory-${dimension.dimension.toLowerCase().replace(/\s+/g, '-')}`,
        'Autonomous Software Factory',
        dimension.dimension,
        'HIGH',
        dimension.evidence,
        `Factory readiness dimension score ${dimension.score}/100`,
        70,
      ),
    );
  }

  const effectiveExpired =
    evidence.freshness?.effectiveExpiredCount ?? evidence.freshness?.expiredCount ?? 0;
  if (evidence.freshness && effectiveExpired > 0) {
    gaps.push(
      gap(
        'evidence-freshness-expired',
        'Operational Capabilities',
        'Expired operational evidence',
        'MEDIUM',
        `${effectiveExpired} capability evidence record(s) expired — revalidation required before high-confidence operation.`,
        `OEFA freshness registry: ${effectiveExpired} EXPIRED`,
        55,
      ),
    );
  }

  if (!evidence.generalPurposeCodegen.proven) {
    gaps.push(
      gap(
        'codegen-diversity',
        'Capability Gaps',
        'General-purpose code generation',
        'HIGH',
        'Code generation limited relative to 58-category vision; blocks autonomous software factory diversity.',
        'General-Purpose Code Generation V1 not proven or artifact missing',
        75,
      ),
    );
  }

  if (evidence.ownership && evidence.ownership.orphanCount > 0) {
    gaps.push(
      gap(
        'ownership-orphans',
        'Architectural Weaknesses',
        'Orphan capabilities',
        'MEDIUM',
        `${evidence.ownership.orphanCount} orphan capability(ies) without canonical owner.`,
        'Canonical Ownership V2 orphan detection',
        50,
      ),
    );
  }

  if (suite.verificationCoverage < suite.categoriesRequired && !evidence.uvl.uvlVerificationExecutionComplete) {
    gaps.push(
      gap(
        'verification-incomplete',
        'Capability Gaps',
        'UVL verification execution',
        'BLOCKING',
        `Verification ${suite.verificationCoverage}/${suite.categoriesRequired} — blocks launch confidence.`,
        'UVL evidence snapshot',
        95,
      ),
    );
  }

  if (!input.autonomyReadiness.canEvolveAutonomously) {
    gaps.push(
      gap(
        'autonomous-evolution-boundary',
        'Intelligence Capabilities',
        'Bounded autonomous evolution',
        'MEDIUM',
        'Self-evolution and escalation proven separately but full closed-loop autonomous evolution with human approval gate remains partial.',
        `Autonomy score ${input.autonomyReadiness.overallScore}/100`,
        45,
      ),
    );
  }

  gaps.push(
    gap(
      'operational-monitoring',
      'Operational Capabilities',
      'Production observability for deployed apps',
      evidence.productionObservabilityProven ? 'LOW' : 'MEDIUM',
      evidence.productionObservabilityProven
        ? 'Production Observability Platform V1 PASS — runtime health, alerting, and incident visibility proven for customer-deployed applications.'
        : evidence.customerOperationsProven
          ? 'Customer operations proven; dedicated runtime observability, alerting, and health monitoring for deployed apps still needed.'
          : 'No validated observability, alerting, or health monitoring for customer-deployed generated applications.',
      evidence.productionObservabilityProven
        ? 'Commercialization readiness — Operational Monitoring dimension 92/100 after POP V1'
        : evidence.customerOperationsProven
          ? 'Commercialization readiness — Operational Monitoring dimension 45/100 after COP V1'
          : 'Commercialization readiness — Operational Monitoring dimension 30/100',
      evidence.productionObservabilityProven ? 20 : 65,
    ),
  );

  gaps.push(
    gap(
      'continuous-deployment-pipeline',
      'Operational Capabilities',
      'Continuous deployment pipeline for customer apps',
      evidence.continuousDeploymentProven ? 'LOW' : 'MEDIUM',
      evidence.continuousDeploymentProven
        ? 'Continuous Deployment Pipeline V1 PASS — governed promotion from candidate through staging to production with observability validation.'
        : evidence.productionObservabilityProven
          ? 'Production observability proven; governed change-to-production deployment pipeline still needed.'
          : 'No validated continuous deployment pipeline for customer-deployed applications.',
      evidence.continuousDeploymentProven
        ? 'Commercialization readiness — Continuous Deployment dimension 92/100 after CD V1'
        : evidence.productionObservabilityProven
          ? 'Commercialization readiness — Continuous Deployment dimension 72/100 after POP V1'
          : 'Commercialization readiness — Continuous Deployment dimension 65/100',
      evidence.continuousDeploymentProven ? 25 : 60,
    ),
  );

  if (!evidence.customerOperationsProven) {
    gaps.push(
      gap(
        'customer-tenant-management',
        'Customer-Facing Capabilities',
        'Multi-tenant customer operations',
        'HIGH',
        'No proven customer onboarding, tenant isolation, billing, or support workflows for external users.',
        'Commercialization readiness — Customer Onboarding & Billing dimension 20/100',
        80,
      ),
    );
  }

  return gaps.sort(
    (a, b) => b.strategicValueScore - a.strategicValueScore || a.capability.localeCompare(b.capability),
  );
}

export function deriveHighestValueNextCapability(
  gaps: readonly StrategicGapEntry[],
  factoryReady: boolean,
  evidence?: StrategicEvidenceSnapshot,
): { highestValue: string; noMajorGaps: boolean } {
  const factoryCategories: StrategicGapEntry['category'][] = [
    'Capability Gaps',
    'Architectural Weaknesses',
    'Autonomous Software Factory',
    'Operational Capabilities',
    'Intelligence Capabilities',
  ];

  const provenRecords = evidence ? collectProvenStrategicCapabilities(evidence) : [];
  const unresolved = filterUnresolvedGaps(gaps, provenRecords);

  const majorFactoryGaps = gaps.filter(
    (g) =>
      factoryCategories.includes(g.category) &&
      (g.severity === 'BLOCKING' || g.severity === 'HIGH') &&
      !isPhaseProven(gapCapabilityToPhase(g.capability), provenRecords),
  );

  if (majorFactoryGaps.length === 0 && factoryReady) {
    const actionable = unresolved.filter(
      (g) => g.severity === 'BLOCKING' || g.severity === 'HIGH' || g.severity === 'MEDIUM',
    );
    if (actionable.length > 0) {
      const top = actionable[0];
      return {
        highestValue: `${top.capability} — ${top.detail.slice(0, 120)}`,
        noMajorGaps: true,
      };
    }
    return {
      highestValue:
        'Operational Excellence Maintenance — all registered capabilities proven; maintain evidence freshness and deployment health',
      noMajorGaps: true,
    };
  }

  if (majorFactoryGaps.length === 0) {
    const actionable = unresolved.filter((g) => g.severity !== 'LOW');
    if (actionable.length > 0) {
      const top = actionable[0];
      return {
        highestValue: `${top.capability} — ${top.detail.slice(0, 120)}`,
        noMajorGaps: false,
      };
    }
    return {
      highestValue:
        'Extend factory maturity — address medium-priority operational gaps before commercialization scale',
      noMajorGaps: false,
    };
  }

  const top = majorFactoryGaps[0];
  return {
    highestValue: `${top.capability} — ${top.detail.slice(0, 120)}`,
    noMajorGaps: false,
  };
}
