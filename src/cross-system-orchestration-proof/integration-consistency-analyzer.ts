/**
 * Integration Consistency Analyzer — integration preservation and drift (V1).
 */

import type { AuthorityProjectSnapshot, DriftFinding } from './orchestration-proof-types.js';
import { normalizeToken } from './project-consistency-tracker.js';

let driftCounter = 0;

export function resetIntegrationDriftCounterForTests(): void {
  driftCounter = 0;
}

function normalizeIntegration(name: string): string {
  return normalizeToken(name).replace(/_payment$|_api$|_sdk$/, '');
}

function matchesIntegration(item: string, candidates: readonly string[]): boolean {
  const norm = normalizeIntegration(item);
  return candidates.some((c) => {
    const cn = normalizeIntegration(c);
    return cn === norm || cn.includes(norm) || norm.includes(cn);
  });
}

export function analyzeIntegrationConsistency(snapshots: readonly AuthorityProjectSnapshot[]): DriftFinding[] {
  const findings: DriftFinding[] = [];
  if (snapshots.length < 2) return findings;

  const baseline = snapshots[0].integrations;
  if (baseline.length === 0) return findings;

  for (let i = 1; i < snapshots.length; i += 1) {
    const downstream = snapshots[i];
    if (!downstream.reached) continue;

    const downstreamIntegrations = downstream.integrations.filter((i) => i.length > 2);
    if (downstreamIntegrations.length === 0 && downstream.authorityId === 'BUILD_PLAN_GENERATOR') continue;

    const fabricated = downstreamIntegrations.filter(
      (item) => !matchesIntegration(item, baseline) && !isInferredIntegration(item, baseline),
    );

    const lost = baseline.filter((b) => !matchesIntegration(b, downstreamIntegrations) && downstreamIntegrations.length > 0);

    if (fabricated.length >= 1) {
      driftCounter += 1;
      findings.push({
        readOnly: true,
        driftId: `integration-drift-${driftCounter}`,
        driftType: 'INTEGRATION_DRIFT',
        upstreamAuthority: snapshots[0].authorityId,
        downstreamAuthority: downstream.authorityId,
        unexpectedItems: fabricated,
        description: `Integration(s) at ${downstream.authorityId} not grounded in upstream intake.`,
        severity: fabricated.length >= 2 ? 'CRITICAL' : 'HIGH',
        evidence: fabricated,
      });
    }

    if (lost.length >= 1 && lost.length / baseline.length >= 0.5) {
      driftCounter += 1;
      findings.push({
        readOnly: true,
        driftId: `integration-drift-${driftCounter}`,
        driftType: 'INTEGRATION_DRIFT',
        upstreamAuthority: snapshots[0].authorityId,
        downstreamAuthority: downstream.authorityId,
        unexpectedItems: lost,
        description: `${lost.length} upstream integration(s) lost at ${downstream.authorityId}.`,
        severity: 'HIGH',
        evidence: lost,
      });
    }
  }

  return findings;
}

function isInferredIntegration(item: string, baseline: readonly string[]): boolean {
  const norm = normalizeIntegration(item);
  const paymentBaseline = baseline.some((b) => /stripe|paypal|payment/i.test(b));
  if (paymentBaseline && /payment|stripe|billing/i.test(norm)) return true;
  const aiBaseline = baseline.some((b) => /openai|ai|llm/i.test(b));
  if (aiBaseline && /ai|openai|llm/i.test(norm)) return true;
  return false;
}
