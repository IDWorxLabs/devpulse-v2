/**
 * Capability Planning Engine — plan builder pipeline.
 */

import { analyzeCapabilitySimilarity } from '../capability-research-engine/capability-similarity-analyzer.js';
import type {
  CapabilityPlan,
  CapabilityPlanResult,
  CapabilityPlanType,
  CapabilityPlanningInput,
} from './capability-planning-types.js';
import { planCapabilityScope } from './capability-scope-planner.js';
import { analyzeCapabilityImpact } from './capability-impact-analyzer.js';
import { analyzeCapabilityPlanRisk } from './capability-risk-analyzer.js';
import { planCapabilityVerification } from './capability-verification-planner.js';
import { planCapabilityDependencies } from './capability-dependency-planner.js';
import { determineCapabilityApproval } from './capability-approval-planner.js';
import { registerCapabilityPlan } from './capability-plan-registry.js';
import { generateCapabilityPlanningReport } from './capability-planning-reporting.js';
import { recordCapabilityPlanHistory } from './capability-planning-history.js';
import { getCachedPlan, setCachedPlan } from './capability-planning-cache.js';

let plansCreated = 0;
let duplicateDetections = 0;
let planCounter = 0;

function resolvePlanType(input: CapabilityPlanningInput): CapabilityPlanType {
  const proposed = input.proposedCapability.toLowerCase();
  if (input.researchDecision === 'OPTIMIZATION_REQUIRED' || proposed.includes('optimizer')) {
    return 'OPTIMIZATION';
  }
  if (input.researchDecision === 'DIAGNOSTIC_REQUIRED' || proposed.includes('diagnostic')) {
    return 'DIAGNOSTIC';
  }
  if (proposed.includes('refactor')) return 'REFACTOR';
  if (input.researchDecision === 'RESEARCH_INCONCLUSIVE' || proposed.includes('research extension')) {
    return 'RESEARCH_EXTENSION';
  }
  if (input.researchDecision === 'EXISTING_CAPABILITY_INSUFFICIENT' || proposed.includes('expansion')) {
    return 'CAPABILITY_EXPANSION';
  }
  return 'NEW_CAPABILITY';
}

export function buildCapabilityPlan(input: CapabilityPlanningInput): CapabilityPlanResult {
  const cacheKey = JSON.stringify({
    p: input.proposedCapability,
    d: input.researchDecision ?? '',
    t: input.trustImpact ?? false,
    w: input.world2Impact ?? false,
  });

  const similarity = analyzeCapabilitySimilarity({ proposedCapability: input.proposedCapability });
  const isDuplicate = similarity.duplicateRisk === 'DUPLICATE' || similarity.duplicateRisk === 'HIGH';

  if (isDuplicate) {
    duplicateDetections += 1;
    const scope = planCapabilityScope(input);
    const impact = analyzeCapabilityImpact(input, scope);
    const risk = analyzeCapabilityPlanRisk(input, scope, impact);
    const dependencies = planCapabilityDependencies(input, scope);
    const approval = determineCapabilityApproval(input, impact, risk);
    const verification = planCapabilityVerification(input, impact, risk);

    const report = generateCapabilityPlanningReport(null, {
      planType: resolvePlanType(input),
      capabilityDomain: input.capabilityDomain ?? 'ORCHESTRATION',
      scope,
      impact,
      risk,
      dependencies,
      approval,
      verification,
      duplicateRisk: similarity.duplicateRisk,
      blocked: true,
      blockReason: 'DUPLICATE_RISK',
    });

    return { plan: null, report, blocked: true, duplicateRisk: similarity.duplicateRisk };
  }

  const cachedPlan = getCachedPlan(cacheKey);
  if (cachedPlan) {
    const scope = planCapabilityScope(input);
    const impact = analyzeCapabilityImpact(input, scope);
    const risk = analyzeCapabilityPlanRisk(input, scope, impact);
    const dependencies = planCapabilityDependencies(input, scope);
    const approval = determineCapabilityApproval(input, impact, risk);
    const verification = planCapabilityVerification(input, impact, risk);
    const report = generateCapabilityPlanningReport(cachedPlan, {
      planType: cachedPlan.planType,
      capabilityDomain: cachedPlan.capabilityDomain,
      scope,
      impact,
      risk,
      dependencies,
      approval,
      verification,
      duplicateRisk: similarity.duplicateRisk,
      blocked: false,
    });
    return { plan: cachedPlan, report, blocked: false, duplicateRisk: similarity.duplicateRisk };
  }

  const scope = planCapabilityScope(input);
  const impact = analyzeCapabilityImpact(input, scope);
  const risk = analyzeCapabilityPlanRisk(input, scope, impact);
  const verification = planCapabilityVerification(input, impact, risk);
  const dependencies = planCapabilityDependencies(input, scope);
  const approval = determineCapabilityApproval(input, impact, risk);
  const planType = resolvePlanType(input);

  planCounter += 1;
  plansCreated += 1;

  const plan: CapabilityPlan = {
    planId: `plan-${planCounter}`,
    planType,
    capabilityDomain: input.capabilityDomain ?? 'ORCHESTRATION',
    approvalRequirement: approval.requirement,
    confidence: Math.round((100 - risk.riskScore + impact.impactScore) / 2),
    createdAt: Date.now(),
  };

  registerCapabilityPlan(plan);
  setCachedPlan(cacheKey, plan);
  recordCapabilityPlanHistory(plan);

  const report = generateCapabilityPlanningReport(plan, {
    planType,
    capabilityDomain: plan.capabilityDomain,
    scope,
    impact,
    risk,
    dependencies,
    approval,
    verification,
    duplicateRisk: similarity.duplicateRisk,
    blocked: false,
  });

  return { plan, report, blocked: false, duplicateRisk: similarity.duplicateRisk };
}

export function getPlansCreatedCount(): number {
  return plansCreated;
}

export function getDuplicateDetectionCount(): number {
  return duplicateDetections;
}

export function resetPlanBuilderForTests(): void {
  plansCreated = 0;
  duplicateDetections = 0;
  planCounter = 0;
}
