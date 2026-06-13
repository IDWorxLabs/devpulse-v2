/**
 * Project Consistency Tracker — tracks project facts across authorities (V1).
 */

import type { AuthorityId, AuthorityProjectSnapshot, ProveOrchestrationInput } from './orchestration-proof-types.js';

export function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeTokens(values: readonly string[]): string[] {
  return [...new Set(values.map(normalizeToken).filter(Boolean))].sort();
}

function platformItemPreserved(upstream: string, downstreamItems: readonly string[]): boolean {
  if (downstreamItems.includes(upstream)) return true;
  if (downstreamItems.some((d) => d.includes(upstream) || upstream.includes(d))) return true;

  if (upstream === 'ios' || upstream === 'android') {
    return downstreamItems.includes(upstream);
  }
  if (upstream === 'ipad' || upstream === 'android_tablet') {
    return downstreamItems.includes(upstream);
  }
  if (upstream === 'mobile') {
    return (
      downstreamItems.includes('mobile') ||
      (downstreamItems.includes('ios') && downstreamItems.includes('android'))
    );
  }
  if (upstream === 'tablet') {
    return (
      downstreamItems.includes('tablet') ||
      (downstreamItems.includes('ipad') && downstreamItems.includes('android_tablet'))
    );
  }
  return false;
}

function itemPreserved(
  field: import('./orchestration-proof-types.js').InformationLossItem['field'],
  upstream: string,
  downstreamItems: readonly string[],
): boolean {
  if (field === 'platforms') return platformItemPreserved(upstream, downstreamItems);
  if (downstreamItems.includes(upstream)) return true;
  return downstreamItems.some((d) => d.includes(upstream) || upstream.includes(d));
}

function snapshot(
  authorityId: AuthorityId,
  reached: boolean,
  data: Omit<AuthorityProjectSnapshot, 'readOnly' | 'authorityId' | 'reached'>,
): AuthorityProjectSnapshot {
  return {
    readOnly: true,
    authorityId,
    reached,
    productType: data.productType,
    platforms: normalizeTokens(data.platforms),
    workflows: normalizeTokens(data.workflows),
    screens: normalizeTokens(data.screens),
    roles: normalizeTokens(data.roles),
    integrations: normalizeTokens(data.integrations),
    businessRules: normalizeTokens(data.businessRules),
    confidence: data.confidence,
    readiness: data.readiness,
    evidenceSources: [...data.evidenceSources],
  };
}

export function extractAuthoritySnapshots(input: ProveOrchestrationInput): AuthorityProjectSnapshot[] {
  const snapshots: AuthorityProjectSnapshot[] = [];

  if (input.unifiedIntakeAnalysis) {
    const intake = input.unifiedIntakeAnalysis;
    snapshots.push(
      snapshot('UNIFIED_INTAKE_INTELLIGENCE', true, {
        productType: intake.projectUnderstanding.productType,
        platforms: intake.projectUnderstanding.platforms,
        workflows: intake.projectUnderstanding.workflows,
        screens: intake.projectUnderstanding.screens,
        roles: intake.projectUnderstanding.userRoles,
        integrations: intake.projectUnderstanding.integrations,
        businessRules: intake.projectUnderstanding.businessRules,
        confidence: intake.unifiedIntakeConfidence,
        readiness: intake.intakeReadinessCategory,
        evidenceSources: intake.evidence.activeSources,
      }),
    );
  }

  if (input.planningGateAnalysis) {
    const gate = input.planningGateAnalysis;
    const intake = input.unifiedIntakeAnalysis;
    snapshots.push(
      snapshot('PLANNING_GATE_AUTHORITY', true, {
        productType: intake?.projectUnderstanding.productType ?? null,
        platforms: intake?.projectUnderstanding.platforms ?? [],
        workflows: intake?.projectUnderstanding.workflows ?? [],
        screens: intake?.projectUnderstanding.screens ?? [],
        roles: intake?.projectUnderstanding.userRoles ?? [],
        integrations: intake?.projectUnderstanding.integrations ?? [],
        businessRules: intake?.projectUnderstanding.businessRules ?? [],
        confidence: gate.planningGateExplanation.confidence,
        readiness: gate.planningReadiness.planningReadinessCategory,
        evidenceSources: gate.planningGateExplanation.evidenceUsed,
      }),
    );
  }

  if (input.planningBrief) {
    const brief = input.planningBrief;
    snapshots.push(
      snapshot('PLANNING_BRIEF_GENERATOR', true, {
        productType: brief.projectSummary.productType,
        platforms: brief.platformTargets,
        workflows: brief.workflowInventory.map((w) => w.name),
        screens: brief.screenInventory.map((s) => s.name),
        roles: brief.userRoles,
        integrations: brief.integrations,
        businessRules: brief.businessRules,
        confidence: brief.planningBriefConfidence,
        readiness: brief.planningBriefReadiness,
        evidenceSources: brief.evidenceSources,
      }),
    );
  }

  if (input.architectureBrief) {
    const arch = input.architectureBrief;
    snapshots.push(
      snapshot('ARCHITECTURE_BRIEF_GENERATOR', true, {
        productType: arch.systemOverview.productType,
        platforms: arch.systemOverview.platforms,
        workflows: arch.backendSummary.detectedNeeds.filter((n) => /workflow|onboard|checkout|auth|billing|ride|order/i.test(n)),
        screens: arch.frontendSummary.detectedNeeds,
        roles: arch.securitySummary.userRoles,
        integrations: arch.integrationSummary.integrations.map((i) => i.name),
        businessRules: arch.dataModelSummary.ownershipModels,
        confidence: arch.architectureBriefConfidence,
        readiness: arch.architectureBriefReadiness,
        evidenceSources: arch.evidenceSources,
      }),
    );
  }

  if (input.buildPlan) {
    const plan = input.buildPlan;
    const workflowHints = [
      ...plan.phases.map((p) => p.name),
      ...plan.milestones.map((m) => m.name),
      ...plan.milestones.map((m) => m.description),
    ];
    snapshots.push(
      snapshot('BUILD_PLAN_GENERATOR', true, {
        productType: plan.projectSummary.product,
        platforms: plan.projectSummary.platforms,
        workflows: workflowHints,
        screens: plan.milestones.map((m) => m.name),
        roles: [],
        integrations: plan.buildPlanRisks
          .filter((r) => r.category === 'INTEGRATION_RISK')
          .map((r) => r.description),
        businessRules: [],
        confidence: plan.buildPlanConfidence,
        readiness: plan.buildPlanReadiness,
        evidenceSources: plan.evidenceSources,
      }),
    );
  }

  if (input.founderTestAnalysis) {
    const test = input.founderTestAnalysis;
    snapshots.push(
      snapshot('FOUNDER_TEST_AUTOMATION', true, {
        productType: null,
        platforms: [],
        workflows: [],
        screens: [],
        roles: [],
        integrations: [],
        businessRules: [],
        confidence: test.executionReadiness.confidenceScore,
        readiness: test.executionReadiness.executionReadinessState,
        evidenceSources: test.prioritizedBlockers.map((b) => b.sourceAuthority).filter(Boolean),
      }),
    );
  }

  return snapshots;
}

export function detectInformationLosses(
  snapshots: readonly AuthorityProjectSnapshot[],
): import('./orchestration-proof-types.js').InformationLossItem[] {
  const losses: import('./orchestration-proof-types.js').InformationLossItem[] = [];
  if (snapshots.length < 2) return losses;

  const baseline = snapshots[0];
  let lossCounter = 0;

  const fields: Array<{
    field: import('./orchestration-proof-types.js').InformationLossItem['field'];
    getter: (s: AuthorityProjectSnapshot) => readonly string[];
    threshold: number;
  }> = [
    { field: 'workflows', getter: (s) => s.workflows, threshold: 1 },
    { field: 'screens', getter: (s) => s.screens, threshold: 1 },
    { field: 'roles', getter: (s) => s.roles, threshold: 1 },
    { field: 'integrations', getter: (s) => s.integrations, threshold: 1 },
    { field: 'businessRules', getter: (s) => s.businessRules, threshold: 1 },
    { field: 'platforms', getter: (s) => s.platforms, threshold: 1 },
  ];

  for (let i = 1; i < snapshots.length; i += 1) {
    const downstream = snapshots[i];
    if (!downstream.reached) continue;
    if (downstream.authorityId === 'FOUNDER_TEST_AUTOMATION') continue;

    for (const { field, getter, threshold } of fields) {
      const upstreamItems = getter(baseline);
      const downstreamItems = getter(downstream);
      if (upstreamItems.length < threshold) continue;
      if (
        downstreamItems.length === 0 &&
        (downstream.authorityId === 'BUILD_PLAN_GENERATOR' ||
          downstream.authorityId === 'PLANNING_GATE_AUTHORITY')
      ) {
        continue;
      }

      const lost = upstreamItems.filter((item) => !itemPreserved(field, item, downstreamItems));

      if (lost.length === 0) continue;
      const lossRatio = lost.length / upstreamItems.length;
      if (lossRatio < 0.25 && lost.length < 2) continue;

      lossCounter += 1;
      losses.push({
        readOnly: true,
        lossId: `loss-${lossCounter}`,
        field,
        upstreamAuthority: baseline.authorityId,
        downstreamAuthority: downstream.authorityId,
        lostItems: lost,
        upstreamCount: upstreamItems.length,
        downstreamCount: downstreamItems.length,
        severity: lossRatio >= 0.5 ? 'CRITICAL' : lossRatio >= 0.3 ? 'HIGH' : 'MEDIUM',
        evidence: [`UPSTREAM_${upstreamItems.length}`, `DOWNSTREAM_${downstreamItems.length}`, `LOST_${lost.length}`],
      });
    }
  }

  return losses;
}
