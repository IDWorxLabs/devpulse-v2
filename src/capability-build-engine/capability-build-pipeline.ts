/**
 * Capability Build Engine — construction pipeline.
 * Generates build plans only — no execution, no file modification.
 */

import { analyzeCapabilitySimilarity } from '../capability-research-engine/capability-similarity-analyzer.js';
import type {
  BuildExecutionStrategy,
  CapabilityBuildInput,
  CapabilityBuildPlan,
  CapabilityBuildType,
  CapabilityConstructionResult,
} from './capability-build-types.js';
import { buildCapabilityModules } from './capability-module-builder.js';
import { buildCapabilityIntegrations } from './capability-integration-builder.js';
import { buildCapabilitySequence } from './capability-sequence-builder.js';
import { buildCapabilityRolloutPlan } from './capability-rollout-builder.js';
import { buildCapabilityRollbackPlan } from './capability-rollback-builder.js';
import { analyzeCapabilityBuildRisk } from './capability-build-risk-analyzer.js';
import { planCapabilityBuildValidation } from './capability-build-validation-planner.js';
import { registerCapabilityBuildPlan } from './capability-build-registry.js';
import { generateCapabilityBuildReport } from './capability-build-reporting.js';
import { recordCapabilityBuildHistory } from './capability-build-history.js';
import { getCachedBuildPlan, setCachedBuildPlan } from './capability-build-cache.js';

let buildPlansCreated = 0;
let buildPlanCounter = 0;

function resolveBuildType(input: CapabilityBuildInput): CapabilityBuildType {
  const proposed = input.proposedCapability.toLowerCase();
  if (input.planType === 'OPTIMIZATION' || proposed.includes('optimizer')) return 'OPTIMIZATION';
  if (input.planType === 'DIAGNOSTIC' || proposed.includes('diagnostic')) return 'DIAGNOSTIC';
  if (input.planType === 'CAPABILITY_EXPANSION' || proposed.includes('expansion') || proposed.includes('extend')) {
    return 'MODULE_EXTENSION';
  }
  if (proposed.includes('integration')) return 'INTEGRATION';
  return 'NEW_MODULE';
}

function resolveExecutionStrategy(input: CapabilityBuildInput, riskScore: number): BuildExecutionStrategy {
  if (input.founderApprovalRequired) return 'FOUNDER_APPROVED';
  if (input.world2Impact) return 'WORLD2_SANDBOX';
  if (riskScore >= 50) return 'ISOLATED_MODULE';
  return 'SAFE_INCREMENTAL';
}

export function buildCapabilityConstructionPlan(input: CapabilityBuildInput): CapabilityConstructionResult {
  const cacheKey = JSON.stringify({
    p: input.proposedCapability,
    t: input.planType ?? '',
    tr: input.trustImpact ?? false,
    w: input.world2Impact ?? false,
    f: input.founderApprovalRequired ?? false,
  });

  const similarity = analyzeCapabilitySimilarity({ proposedCapability: input.proposedCapability });
  if (similarity.duplicateRisk === 'DUPLICATE' || similarity.duplicateRisk === 'HIGH') {
    const buildType = resolveBuildType(input);
    const modules = buildCapabilityModules(input, buildType);
    const integrations = buildCapabilityIntegrations(input);
    const sequence = buildCapabilitySequence(input, modules, integrations);
    const rollout = buildCapabilityRolloutPlan(input);
    const rollback = buildCapabilityRollbackPlan(input, integrations);
    const risk = analyzeCapabilityBuildRisk(input, modules, integrations);
    const validation = planCapabilityBuildValidation(input, risk);

    const blockedPlan: CapabilityBuildPlan = {
      buildPlanId: 'blocked-duplicate',
      buildType,
      executionStrategy: 'FOUNDER_APPROVED',
      capabilityDomain: input.capabilityDomain ?? 'ORCHESTRATION',
      confidence: 0,
      createdAt: Date.now(),
    };

    const report = generateCapabilityBuildReport(blockedPlan, {
      modules,
      integrations,
      sequence,
      rollout,
      rollback,
      risk,
      validation,
      blocked: true,
      blockReason: 'DUPLICATE_RISK',
    });

    return { buildPlan: blockedPlan, report };
  }

  const cached = getCachedBuildPlan(cacheKey);
  if (cached) {
    const buildType = cached.buildType;
    const modules = buildCapabilityModules(input, buildType);
    const integrations = buildCapabilityIntegrations(input);
    const sequence = buildCapabilitySequence(input, modules, integrations);
    const rollout = buildCapabilityRolloutPlan(input);
    const rollback = buildCapabilityRollbackPlan(input, integrations);
    const risk = analyzeCapabilityBuildRisk(input, modules, integrations);
    const validation = planCapabilityBuildValidation(input, risk);
    const report = generateCapabilityBuildReport(cached, {
      modules, integrations, sequence, rollout, rollback, risk, validation, blocked: false,
    });
    return { buildPlan: cached, report };
  }

  const buildType = resolveBuildType(input);
  const modules = buildCapabilityModules(input, buildType);
  const integrations = buildCapabilityIntegrations(input);
  const sequence = buildCapabilitySequence(input, modules, integrations);
  const rollout = buildCapabilityRolloutPlan(input);
  const rollback = buildCapabilityRollbackPlan(input, integrations);
  const risk = analyzeCapabilityBuildRisk(input, modules, integrations);
  const validation = planCapabilityBuildValidation(input, risk);
  const executionStrategy = resolveExecutionStrategy(input, risk.riskScore);

  buildPlanCounter += 1;
  buildPlansCreated += 1;

  const buildPlan: CapabilityBuildPlan = {
    buildPlanId: `build-plan-${buildPlanCounter}`,
    buildType,
    executionStrategy,
    capabilityDomain: input.capabilityDomain ?? 'ORCHESTRATION',
    confidence: Math.round((100 - risk.riskScore + 50) / 2),
    createdAt: Date.now(),
  };

  registerCapabilityBuildPlan(buildPlan);
  setCachedBuildPlan(cacheKey, buildPlan);
  recordCapabilityBuildHistory(buildPlan, { rollout, rollback, validation });

  const report = generateCapabilityBuildReport(buildPlan, {
    modules, integrations, sequence, rollout, rollback, risk, validation, blocked: false,
  });

  return { buildPlan, report };
}

export function getBuildPlansCreatedCount(): number {
  return buildPlansCreated;
}

export function resetBuildPipelineForTests(): void {
  buildPlansCreated = 0;
  buildPlanCounter = 0;
}
