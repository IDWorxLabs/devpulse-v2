/**
 * Capability Planning Engine — report generation.
 */

import type {
  CapabilityApprovalPlan,
  CapabilityDependencyPlan,
  CapabilityImpactAnalysis,
  CapabilityPlan,
  CapabilityPlanType,
  CapabilityPlanningReport,
  CapabilityRiskAnalysis,
  CapabilityScopePlan,
  CapabilityVerificationPlan,
} from './capability-planning-types.js';
import type { DuplicateRisk } from '../capability-research-engine/capability-research-types.js';

let reportCounter = 0;

const PLAN_ACTIONS: Record<CapabilityPlanType, string> = {
  NEW_CAPABILITY: 'Design new module with isolated ownership; do not execute yet',
  CAPABILITY_EXPANSION: 'Plan extension module; preserve single-owner boundaries',
  OPTIMIZATION: 'Plan performance optimization scope; verify with QUICK depth',
  DIAGNOSTIC: 'Plan diagnostic instrumentation; no capability creation',
  REFACTOR: 'Plan refactor boundaries; maintain extension-only posture',
  RESEARCH_EXTENSION: 'Extend research coverage before planning execution',
};

export function generateCapabilityPlanningReport(
  plan: CapabilityPlan | null,
  context: {
    planType: CapabilityPlanType;
    capabilityDomain: string;
    scope: CapabilityScopePlan;
    impact: CapabilityImpactAnalysis;
    risk: CapabilityRiskAnalysis;
    dependencies: CapabilityDependencyPlan;
    approval: CapabilityApprovalPlan;
    verification: CapabilityVerificationPlan;
    duplicateRisk: DuplicateRisk;
    blocked: boolean;
    blockReason?: string;
  },
): CapabilityPlanningReport {
  reportCounter += 1;

  let recommendedAction = PLAN_ACTIONS[context.planType] ?? 'Review planning report';
  if (context.blocked) {
    recommendedAction = 'Block plan creation — duplicate capability detected; enhance existing capability instead';
  }

  return {
    reportId: `planning-report-${reportCounter}`,
    planId: plan?.planId ?? 'blocked',
    planType: context.planType,
    capabilityDomain: context.capabilityDomain,
    scope: context.scope,
    impact: context.impact,
    risk: context.risk,
    dependencies: context.dependencies,
    approval: context.approval,
    verification: context.verification,
    duplicateRisk: context.duplicateRisk,
    blocked: context.blocked,
    blockReason: context.blockReason,
    recommendedAction,
    generatedAt: Date.now(),
  };
}

export function resetCapabilityPlanningReportCounterForTests(): void {
  reportCounter = 0;
}
