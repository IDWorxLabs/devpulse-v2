/**
 * Planning Risk Detector — planning blockers and ambiguities (V1).
 */

import type { AssessPlanningGateInput } from './planning-gate-types.js';
import type {
  PlanningGateEvidenceSnapshot,
  PlanningRiskAnalysis,
  PlanningRiskItem,
  PlanningRiskSeverity,
} from './planning-gate-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';

function completenessGaps(completeness: RequirementCompletenessAnalysis): readonly {
  gapId: string;
  description: string;
  severity: PlanningRiskSeverity;
  domain: string;
}[] {
  const missing = completeness.missingRequirements as unknown;
  if (Array.isArray(missing)) {
    return missing.map((gap) => ({
      gapId: gap.gapId,
      description: gap.description,
      severity: (gap.severity === 'CRITICAL' ? 'CRITICAL' : gap.severity === 'HIGH' ? 'HIGH' : gap.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW') as PlanningRiskSeverity,
      domain: gap.domain,
    }));
  }
  const legacy = missing as {
    missingScreens?: readonly string[];
    missingFlows?: readonly string[];
    missingBusinessLogic?: readonly string[];
  };
  const gaps: { gapId: string; description: string; severity: PlanningRiskSeverity; domain: string }[] = [];
  for (const screen of legacy.missingScreens ?? []) {
    gaps.push({ gapId: `screen-${screen}`, description: screen, severity: 'HIGH', domain: 'UI_REQUIREMENTS' });
  }
  for (const flow of legacy.missingFlows ?? []) {
    gaps.push({ gapId: `flow-${flow}`, description: flow, severity: 'HIGH', domain: 'UI_REQUIREMENTS' });
  }
  for (const rule of legacy.missingBusinessLogic ?? []) {
    gaps.push({ gapId: `rule-${rule}`, description: rule, severity: 'HIGH', domain: 'BUSINESS_LOGIC' });
  }
  return gaps;
}

let riskCounter = 0;

export function resetPlanningRiskCounterForTests(): void {
  riskCounter = 0;
}

function nextRiskId(): string {
  riskCounter += 1;
  return `planning-risk-${riskCounter}`;
}

function pushRisk(
  risks: PlanningRiskItem[],
  riskType: PlanningRiskItem['riskType'],
  severity: PlanningRiskSeverity,
  description: string,
  evidence: string[],
): void {
  risks.push({
    readOnly: true,
    riskId: nextRiskId(),
    riskType,
    severity,
    description,
    evidence,
  });
}

export function detectPlanningRisks(input: {
  snapshot: PlanningGateEvidenceSnapshot;
  gateInput: AssessPlanningGateInput;
}): PlanningRiskAnalysis {
  const risks: PlanningRiskItem[] = [];
  const { snapshot } = input;
  const intake = input.gateInput.unifiedIntakeAnalysis;
  const completeness = input.gateInput.requirementCompletenessAnalysis;

  if (snapshot.gapCount > 0) {
    for (const gap of intake?.intakeGaps.slice(0, 4) ?? []) {
      pushRisk(risks, 'MISSING_REQUIREMENTS', 'HIGH', gap.description, [gap.gapId, gap.category]);
    }
  }

  if (completeness) {
    for (const gap of completenessGaps(completeness).slice(0, 4)) {
      pushRisk(
        risks,
        'MISSING_REQUIREMENTS',
        gap.severity,
        gap.description,
        [gap.gapId, gap.domain],
      );
    }
  }

  if (snapshot.conflictCount > 0) {
    for (const conflict of intake?.evidenceConflicts.slice(0, 3) ?? []) {
      pushRisk(
        risks,
        'CONFLICTING_EVIDENCE',
        conflict.conflictType === 'PLATFORM_CONFLICT' ? 'CRITICAL' : 'HIGH',
        conflict.description,
        [...conflict.conflictingEvidence],
      );
    }
  }

  const platformBuckets = new Set(
    snapshot.platforms.map((p) => {
      const upper = p.toUpperCase();
      if (/IOS|ANDROID|MOBILE/.test(upper)) return 'MOBILE';
      if (/WEB/.test(upper)) return 'WEB';
      if (/DESKTOP/.test(upper)) return 'DESKTOP';
      return upper;
    }),
  );
  if (platformBuckets.size > 1) {
    pushRisk(
      risks,
      'PLATFORM_AMBIGUITY',
      'HIGH',
      'Multiple platform targets detected without a single primary launch platform.',
      [...snapshot.platforms],
    );
  } else if (snapshot.platforms.length === 0) {
    pushRisk(risks, 'PLATFORM_AMBIGUITY', 'CRITICAL', 'No platform targets identified.', ['MISSING_PLATFORMS']);
  }

  if (snapshot.workflows.length <= 1 && snapshot.screens.length >= 3) {
    pushRisk(
      risks,
      'WORKFLOW_AMBIGUITY',
      'MEDIUM',
      'Several screens referenced with insufficient workflow detail.',
      [`SCREENS_${snapshot.screens.length}`, `WORKFLOWS_${snapshot.workflows.length}`],
    );
  }

  if (snapshot.userRoles.length <= 1 && snapshot.workflows.some((w) => /admin|approval|permission/i.test(w))) {
    pushRisk(
      risks,
      'ROLE_AMBIGUITY',
      'HIGH',
      'Approval or admin workflows mentioned without a distinct role model.',
      ['SPARSE_ROLES_WITH_ADMIN_WORKFLOW'],
    );
  }

  if (snapshot.integrations.some((i) => /stripe|paypal|payment/i.test(i)) && !snapshot.workflows.some((w) => /checkout|billing|payment/i.test(w))) {
    pushRisk(
      risks,
      'INTEGRATION_AMBIGUITY',
      'HIGH',
      'Payment integration referenced without checkout/billing workflow evidence.',
      ['PAYMENT_INTEGRATION_WITHOUT_FLOW'],
    );
  }

  const founderAutomation = input.gateInput.founderTestAutomationAnalysis;
  if (founderAutomation && founderAutomation.executionReadiness.executionReadinessState === 'NOT_READY') {
    pushRisk(
      risks,
      'MISSING_REQUIREMENTS',
      'MEDIUM',
      'Founder test automation indicates product is not ready, planning should account for known launch blockers.',
      ['FOUNDER_TEST_NOT_READY'],
    );
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
