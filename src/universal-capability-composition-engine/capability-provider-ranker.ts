/**
 * Universal Capability Composition Engine V1 — deterministic provider ranking.
 */

import type { ProviderAssignmentCandidate } from './universal-capability-composition-types.js';

export interface RankingContext {
  readonly exactMatch: boolean;
  readonly productionReady: boolean;
  readonly dependencyCost: number;
  readonly configurationComplete: boolean;
  readonly securityFit: boolean;
  readonly runtimeFit: boolean;
  readonly persistenceFit: boolean;
  readonly collisionRisk: number;
  readonly unresolvedDependencyCount: number;
}

export function rankProviderCandidates(
  candidates: readonly ProviderAssignmentCandidate[],
  context: Partial<RankingContext>,
): ProviderAssignmentCandidate[] {
  return [...candidates]
    .map((c) => {
      let score = c.rankingScore;
      const evidence = [...c.rankingEvidence];

      if (context.exactMatch && c.selected) {
        score += 10;
        evidence.push('exact_capability_match');
      }
      if (context.productionReady && c.selected) {
        score += 5;
        evidence.push('production_readiness_confirmed');
      }
      if (context.configurationComplete) {
        score += 3;
        evidence.push('configuration_complete');
      }
      if (context.securityFit) {
        score += 2;
        evidence.push('security_fit');
      }
      if (context.runtimeFit) {
        score += 2;
        evidence.push('runtime_fit');
      }
      if (context.persistenceFit) {
        score += 2;
        evidence.push('persistence_fit');
      }
      if (context.dependencyCost !== undefined) {
        score -= context.dependencyCost;
        evidence.push(`dependency_cost:${context.dependencyCost}`);
      }
      if (context.collisionRisk !== undefined) {
        score -= context.collisionRisk;
        evidence.push(`collision_risk:${context.collisionRisk}`);
      }
      if (context.unresolvedDependencyCount !== undefined) {
        score -= context.unresolvedDependencyCount * 5;
        evidence.push(`unresolved_deps:${context.unresolvedDependencyCount}`);
      }

      return { ...c, rankingScore: score, rankingEvidence: evidence };
    })
    .sort((a, b) => {
      if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
      return a.providerId.localeCompare(b.providerId);
    });
}

export function selectTopCandidate(
  ranked: readonly ProviderAssignmentCandidate[],
): ProviderAssignmentCandidate | null {
  return ranked.find((c) => c.selected) ?? null;
}
