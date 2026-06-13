/**
 * Architecture Risk Detector — architecture blockers and ambiguities (V1).
 */

import type {
  ArchitectureEvidenceBundle,
  ArchitectureRiskAnalysis,
  ArchitectureRiskItem,
  ArchitectureRiskSeverity,
  GenerateArchitectureBriefInput,
} from './architecture-brief-types.js';

let riskCounter = 0;

export function resetArchitectureRiskCounterForTests(): void {
  riskCounter = 0;
}

function pushRisk(
  risks: ArchitectureRiskItem[],
  riskType: ArchitectureRiskItem['riskType'],
  severity: ArchitectureRiskSeverity,
  description: string,
  evidence: string[],
): void {
  riskCounter += 1;
  risks.push({
    readOnly: true,
    riskId: `arch-risk-${riskCounter}`,
    riskType,
    severity,
    description,
    evidence,
  });
}

export function detectArchitectureRisks(input: {
  bundle: ArchitectureEvidenceBundle;
  gateInput: GenerateArchitectureBriefInput;
}): ArchitectureRiskAnalysis {
  const risks: ArchitectureRiskItem[] = [];
  const { bundle } = input;
  const planningBrief = input.gateInput.planningBrief;

  if (bundle.dataEntities.length === 0) {
    pushRisk(risks, 'UNCLEAR_OWNERSHIP', 'HIGH', 'No data entities identified for ownership modeling.', ['EMPTY_ENTITIES']);
  }

  if (bundle.userRoles.length <= 1 && bundle.workflows.some((w) => /admin|approval|permission/i.test(w))) {
    pushRisk(
      risks,
      'UNCLEAR_PERMISSIONS',
      'HIGH',
      'Admin or approval workflows referenced without a distinct permission model.',
      ['SPARSE_ROLES_WITH_ADMIN_WORKFLOW'],
    );
  }

  if (bundle.workflows.length <= 1 && bundle.screens.length >= 3) {
    pushRisk(
      risks,
      'UNCLEAR_WORKFLOWS',
      'MEDIUM',
      'Multiple screens identified with insufficient workflow architecture detail.',
      [`SCREENS_${bundle.screens.length}`, `WORKFLOWS_${bundle.workflows.length}`],
    );
  }

  if (bundle.integrations.length > 0 && !bundle.workflows.some((w) => /checkout|billing|payment|webhook/i.test(w))) {
    pushRisk(
      risks,
      'UNCLEAR_INTEGRATIONS',
      'HIGH',
      'Third-party integrations referenced without clear integration workflow boundaries.',
      ['INTEGRATIONS_WITHOUT_FLOW'],
    );
  }

  if (/SAAS|MARKETPLACE|PLATFORM/.test(bundle.productType) && bundle.scaleExpectations.includes('Initial launch')) {
    pushRisk(
      risks,
      'SCALING_AMBIGUITY',
      'MEDIUM',
      'Platform product type detected but scale expectations remain at initial launch level.',
      ['PRODUCT_TYPE_VS_SCALE'],
    );
  }

  for (const gap of planningBrief?.knownGaps.filter((g) => g.category === 'UNRESOLVED_CONFLICT') ?? []) {
    pushRisk(risks, 'UNCLEAR_WORKFLOWS', 'CRITICAL', gap.description, [gap.gapId]);
  }

  if (bundle.userRoles.length === 0) {
    pushRisk(risks, 'UNCLEAR_PERMISSIONS', 'CRITICAL', 'No user roles defined for authorization architecture.', ['EMPTY_ROLES']);
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const overallRiskLevel =
    risks.length === 0
      ? 'LOW'
      : risks.some((r) => r.severity === 'CRITICAL')
        ? 'CRITICAL'
        : risks.filter((r) => r.severity === 'HIGH').length >= 2
          ? 'HIGH'
          : risks.some((r) => r.severity === 'HIGH')
            ? 'HIGH'
            : 'MEDIUM';

  return {
    readOnly: true,
    risks: risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
    overallRiskLevel,
    riskCount: risks.length,
  };
}
