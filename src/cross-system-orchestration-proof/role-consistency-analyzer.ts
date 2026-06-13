/**
 * Role Consistency Analyzer — role continuity and drift (V1).
 */

import type { AuthorityProjectSnapshot, DriftFinding } from './orchestration-proof-types.js';

let driftCounter = 0;

export function resetRoleDriftCounterForTests(): void {
  driftCounter = 0;
}

function matchesRole(item: string, candidates: readonly string[]): boolean {
  return candidates.some((c) => c === item || c.includes(item) || item.includes(c));
}

const ROLE_SYNONYMS: Record<string, string[]> = {
  user: ['customer', 'member', 'end_user', 'rider'],
  admin: ['administrator', 'owner', 'operator'],
  vendor: ['seller', 'provider', 'driver'],
  buyer: ['customer', 'rider', 'shopper'],
  driver: ['courier', 'transport_operator', 'vendor'],
  rider: ['passenger', 'customer', 'end_user'],
};

function rolesEquivalent(a: string, b: string): boolean {
  if (a === b || a.includes(b) || b.includes(a)) return true;
  for (const [canonical, synonyms] of Object.entries(ROLE_SYNONYMS)) {
    const group = [canonical, ...synonyms];
    if (group.includes(a) && group.includes(b)) return true;
  }
  return false;
}

export function analyzeRoleConsistency(snapshots: readonly AuthorityProjectSnapshot[]): DriftFinding[] {
  const findings: DriftFinding[] = [];
  if (snapshots.length < 2) return findings;

  const baseline = snapshots[0].roles;
  if (baseline.length === 0) return findings;

  for (let i = 1; i < snapshots.length; i += 1) {
    const downstream = snapshots[i];
    if (!downstream.reached || downstream.roles.length === 0) continue;

    const unexpected = downstream.roles.filter(
      (r) => !baseline.some((b) => rolesEquivalent(r, b)) && !matchesRole(r, baseline),
    );

    const lost = baseline.filter((b) => !downstream.roles.some((r) => rolesEquivalent(r, b)));

    if (unexpected.length >= 1 && downstream.authorityId !== 'BUILD_PLAN_GENERATOR') {
      driftCounter += 1;
      findings.push({
        readOnly: true,
        driftId: `role-drift-${driftCounter}`,
        driftType: 'ROLE_DRIFT',
        upstreamAuthority: snapshots[0].authorityId,
        downstreamAuthority: downstream.authorityId,
        unexpectedItems: unexpected,
        description: `Role drift at ${downstream.authorityId}: roles appeared without upstream evidence.`,
        severity: unexpected.length >= 2 ? 'HIGH' : 'MEDIUM',
        evidence: unexpected,
      });
    }

    if (lost.length >= 1 && lost.length === baseline.length && downstream.roles.length === 0) {
      driftCounter += 1;
      findings.push({
        readOnly: true,
        driftId: `role-drift-${driftCounter}`,
        driftType: 'ROLE_DRIFT',
        upstreamAuthority: snapshots[0].authorityId,
        downstreamAuthority: downstream.authorityId,
        unexpectedItems: lost,
        description: `All upstream roles lost at ${downstream.authorityId}.`,
        severity: 'HIGH',
        evidence: lost,
      });
    }
  }

  return findings;
}
