/**
 * Adoption risk analyzer — drop-off, churn, and fragility signals.
 */

import type {
  AdoptionRiskAnalysis,
  BehavioralIntegrationAnalysis,
  FeatureAdoptionAnalysis,
  RepeatUsageAnalysis,
} from './adoption-reality-types.js';

export function analyzeAdoptionRisk(input: {
  repeatUsage: RepeatUsageAnalysis;
  behavioralIntegration: BehavioralIntegrationAnalysis;
  featureAdoption: FeatureAdoptionAnalysis;
  postLaunchActivityObserved: boolean;
  trafficOnly?: boolean;
  signupsOnly?: boolean;
  oneTimeUsage?: boolean;
}): AdoptionRiskAnalysis {
  const riskSignals: string[] = [];
  let adoptionRiskScore = 0;

  if (!input.postLaunchActivityObserved) {
    adoptionRiskScore += 40;
    riskSignals.push('No post-launch activity — adoption risk unknown');
  }

  if (input.trafficOnly) {
    adoptionRiskScore += 35;
    riskSignals.push('Traffic-only signal — high drop-off risk without repeat usage');
  }

  if (input.signupsOnly) {
    adoptionRiskScore += 30;
    riskSignals.push('Signup-only signal — conversion without retention is fragile');
  }

  if (input.oneTimeUsage) {
    adoptionRiskScore += 40;
    riskSignals.push('One-time usage pattern — adoption not established');
  }

  if (!input.repeatUsage.repeatUsers) {
    adoptionRiskScore += 25;
    riskSignals.push('No repeat user evidence — retention risk elevated');
  }

  if (!input.repeatUsage.longTermUsage) {
    adoptionRiskScore += 15;
    riskSignals.push('Long-term usage not observed — adoption may be shallow');
  }

  if (!input.behavioralIntegration.workflowIntegration) {
    adoptionRiskScore += 10;
    riskSignals.push('No workflow integration — weak behavioral adoption');
  }

  if (!input.featureAdoption.featureStickiness) {
    adoptionRiskScore += 10;
    riskSignals.push('Feature stickiness not observed — churn indicators present');
  }

  if (input.repeatUsage.confidence === 'UNKNOWN') {
    adoptionRiskScore += 10;
    riskSignals.push('Repeat usage confidence unknown — adoption fragility');
  }

  adoptionRiskScore = Math.min(100, Math.max(0, adoptionRiskScore));

  const dropOffRisk = input.trafficOnly || input.signupsOnly || input.oneTimeUsage || !input.repeatUsage.repeatUsers;
  const retentionRisk = !input.repeatUsage.longTermUsage || !input.repeatUsage.usageConsistency;
  const churnIndicators = !input.featureAdoption.featureStickiness || !input.repeatUsage.returnFrequency;
  const weakAdoptionSignals =
    input.repeatUsage.repeatUsageScore < 30 && input.behavioralIntegration.behavioralIntegrationScore < 30;
  const adoptionFragility = adoptionRiskScore >= 60 || weakAdoptionSignals;

  return {
    readOnly: true,
    dropOffRisk,
    retentionRisk,
    churnIndicators,
    weakAdoptionSignals,
    adoptionFragility,
    adoptionRiskScore,
    riskSignals: [...new Set(riskSignals)].slice(0, 10),
  };
}
