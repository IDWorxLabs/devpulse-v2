/**
 * Lifecycle risk analyzer — cross-stage lifecycle risks.
 */

import type {
  LifecycleRiskAnalysis,
  LifecycleSignalCollection,
  ProductLifecycleInputSnapshot,
} from './product-lifecycle-reality-types.js';

export function analyzeLifecycleRisk(input: {
  signals: LifecycleSignalCollection;
  inputSnapshot: ProductLifecycleInputSnapshot;
  overallLifecycleScore: number;
}): LifecycleRiskAnalysis {
  const riskSignals: string[] = [];
  const founder = input.inputSnapshot.founderLaunchDecision;
  const postLaunch = input.inputSnapshot.postLaunchReality;
  const adoption = input.inputSnapshot.adoptionReality;
  const revenue = input.inputSnapshot.revenueReality;
  const evolution = input.inputSnapshot.productEvolutionReality;

  const launchRisk =
    input.signals.launchReadinessEvidencePresent &&
    (!input.signals.launchDecisionSupportPresent || (founder?.proofSignals.criticalBlockerCount ?? 0) > 0);
  if (launchRisk) riskSignals.push('Launch risk — readiness or blockers unresolved');

  const adoptionRisk =
    input.signals.postLaunchActivityPresent &&
    !input.signals.adoptionEvidencePresent &&
    (postLaunch?.overallPostLaunchScore ?? 0) < 50;
  if (adoptionRisk) riskSignals.push('Adoption risk — post-launch activity without repeat usage');

  const revenueRisk =
    input.signals.adoptionEvidencePresent &&
    !input.signals.revenueEvidencePresent &&
    (adoption?.overallAdoptionScore ?? 0) >= 50;
  if (revenueRisk) riskSignals.push('Revenue risk — adoption without monetization evidence');

  const evolutionRisk =
    input.signals.revenueEvidencePresent &&
    !input.signals.evolutionEvidencePresent &&
    (revenue?.overallRevenueScore ?? 0) >= 50;
  if (evolutionRisk) riskSignals.push('Evolution risk — revenue without learning signals');

  const operationalRisk = Boolean(
    postLaunch?.reliability.runtimeErrors || postLaunch?.reliability.crashEvidence,
  );
  if (operationalRisk) riskSignals.push('Operational risk — runtime errors or crash evidence');

  const lifecycleStagnationRisk =
    input.signals.revenueEvidencePresent &&
    !input.signals.evolutionEvidencePresent &&
    (evolution?.evolutionRisk?.stagnationRisk ?? false);
  if (lifecycleStagnationRisk) riskSignals.push('Lifecycle stagnation — product not evolving from reality');

  const evidenceConfidenceRisk = input.overallLifecycleScore < 30 && input.signals.ideaEvidencePresent;
  if (evidenceConfidenceRisk) riskSignals.push('Evidence confidence risk — early lifecycle with sparse proof');

  const riskCount = [
    launchRisk,
    adoptionRisk,
    revenueRisk,
    evolutionRisk,
    operationalRisk,
    lifecycleStagnationRisk,
    evidenceConfidenceRisk,
  ].filter(Boolean).length;

  const lifecycleRiskScore = Math.min(100, riskCount * 14 + (founder?.proofSignals.criticalBlockerCount ?? 0) * 8);

  return {
    readOnly: true,
    launchRisk,
    adoptionRisk,
    revenueRisk,
    evolutionRisk,
    operationalRisk,
    lifecycleStagnationRisk,
    evidenceConfidenceRisk,
    lifecycleRiskScore,
    riskSignals: [...new Set(riskSignals)].slice(0, 10),
  };
}
