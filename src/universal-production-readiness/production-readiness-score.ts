/**
 * Universal Production Readiness Verification V1 — deterministic scoring.
 */

import type { ProductionReadinessScores, ReadinessDimensionResult } from './universal-production-readiness-types.js';

export function calculateReadinessScore(dimensionResults: readonly ReadinessDimensionResult[]): ProductionReadinessScores {
  const byId = new Map(dimensionResults.map((d) => [d.dimensionId, d.score]));
  const avg = (ids: string[]) => {
    const vals = ids.map((id) => byId.get(id as never) ?? 100);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 100;
  };

  const contractFaithfulnessScore = byId.get('CONTRACT_FAITHFULNESS') ?? 100;
  const compositionScore = byId.get('COMPOSITION_READINESS') ?? 100;
  const materializationScore = byId.get('MATERIALIZATION_READINESS') ?? 100;
  const runtimeScore = byId.get('RUNTIME_READINESS') ?? 100;
  const behavioralScore = byId.get('BEHAVIORAL_READINESS') ?? 100;
  const capabilityCoverageScore = byId.get('CAPABILITY_READINESS') ?? 100;
  const persistenceScore = byId.get('PERSISTENCE_READINESS') ?? 100;
  const dataIntegrityScore = byId.get('DATA_INTEGRITY_READINESS') ?? 100;
  const navigationScore = byId.get('NAVIGATION_READINESS') ?? 100;
  const buildScore = byId.get('BUILD_READINESS') ?? 100;
  const evidenceIntegrityScore = byId.get('EVIDENCE_INTEGRITY') ?? 100;
  const traceabilityScore = byId.get('TRACEABILITY_READINESS') ?? 100;

  const behavioralReadinessScore = avg(['BEHAVIORAL_READINESS', 'CRUD_READINESS', 'ACTION_READINESS', 'WORKFLOW_READINESS', 'RELATIONSHIP_READINESS', 'BUSINESS_RULE_READINESS']);
  const capabilityReadinessScore = capabilityCoverageScore;
  const materializationReadinessScore = materializationScore;
  const dataReadinessScore = avg(['PERSISTENCE_READINESS', 'DATA_INTEGRITY_READINESS']);
  const runtimeReadinessScore = runtimeScore;

  const overallReadinessScore = Math.round(
    dimensionResults.reduce((sum, d) => sum + d.score, 0) / Math.max(dimensionResults.length, 1),
  );

  return {
    contractFaithfulnessScore,
    compositionScore,
    materializationScore,
    runtimeScore,
    behavioralScore,
    capabilityCoverageScore,
    persistenceScore,
    dataIntegrityScore,
    navigationScore,
    buildScore,
    evidenceIntegrityScore,
    traceabilityScore,
    overallReadinessScore,
    behavioralReadinessScore,
    capabilityReadinessScore,
    materializationReadinessScore,
    dataReadinessScore,
    runtimeReadinessScore,
  };
}
