/**
 * Scale risk analyzer — growth, infrastructure, operational, and customer experience risks.
 */

import type {
  ArchitectureScalabilityAnalysis,
  FinancialScalabilityAnalysis,
  OperationalScalabilityAnalysis,
  ReliabilityScalabilityAnalysis,
  ScaleRiskAnalysis,
  TeamScalabilityAnalysis,
} from './scale-readiness-types.js';

export function analyzeScaleRisk(input: {
  architecture: ArchitectureScalabilityAnalysis;
  operational: OperationalScalabilityAnalysis;
  team: TeamScalabilityAnalysis;
  financial: FinancialScalabilityAnalysis;
  customerSupport: import('./scale-readiness-types.js').CustomerSupportScalabilityAnalysis;
  reliability: ReliabilityScalabilityAnalysis;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
  productLaunched: boolean;
}): ScaleRiskAnalysis {
  const riskSignals: string[] = [];
  let scaleRiskScore = 0;

  if (input.revenueOnly) {
    scaleRiskScore += 40;
    riskSignals.push('Growth risk — revenue alone does not indicate scale survivability');
  }

  if (input.adoptionOnly) {
    scaleRiskScore += 35;
    riskSignals.push('Growth risk — adoption alone does not indicate scale survivability');
  }

  if (input.infrastructureOnly) {
    scaleRiskScore += 30;
    riskSignals.push('Infrastructure risk — infrastructure alone is insufficient for scale readiness');
  }

  if (input.architecture.architectureScalabilityScore < 40) {
    scaleRiskScore += 15;
    riskSignals.push('Infrastructure risk — limited architecture scalability evidence');
  }

  if (input.operational.operationalScalabilityScore < 40) {
    scaleRiskScore += 15;
    riskSignals.push('Operational risk — limited monitoring and incident response evidence');
  }

  if (input.team.teamScalabilityScore < 30) {
    scaleRiskScore += 15;
    riskSignals.push('Team risk — knowledge distribution and bus factor not assessed');
  }

  if (input.financial.financialScalabilityScore < 40) {
    scaleRiskScore += 12;
    riskSignals.push('Financial risk — scaling cost and sustainability not proven');
  }

  if (input.customerSupport.supportScalabilityScore < 30 && input.productLaunched) {
    scaleRiskScore += 12;
    riskSignals.push('Customer experience risk — support capacity not proven for growth');
  }

  if (input.reliability.reliabilityScalabilityScore < 40) {
    scaleRiskScore += 12;
    riskSignals.push('Reliability risk — failure recovery under growth not proven');
  }

  scaleRiskScore = Math.min(100, Math.max(0, scaleRiskScore));

  return {
    readOnly: true,
    growthRisk: input.revenueOnly || input.adoptionOnly || scaleRiskScore >= 50,
    infrastructureRisk: input.architecture.architectureScalabilityScore < 50 || input.infrastructureOnly === true,
    operationalRisk: input.operational.operationalScalabilityScore < 50,
    teamRisk: input.team.teamScalabilityScore < 40,
    financialRisk: input.financial.financialScalabilityScore < 50,
    customerExperienceRisk:
      input.productLaunched && input.customerSupport.supportScalabilityScore < 40,
    scaleRiskScore,
    riskSignals: [...new Set(riskSignals)].slice(0, 12),
  };
}
