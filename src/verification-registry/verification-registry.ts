/**
 * Verification Registry — Phase 16.8 orchestrator.
 * Central registry metadata only — no verification execution.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { publishVerificationRegistryFeedStages } from '../operator-feed/verification-registry-feed-bridge.js';
import { registerInitialTargets, listVerificationTargets } from './verification-target-registry.js';
import { registerInitialOwners, listVerificationOwners } from './verification-owner-registry.js';
import {
  registerInitialDependencies,
  listVerificationDependencies,
} from './verification-dependency-registry.js';
import {
  registerInitialRequirements,
  listVerificationRequirements,
} from './verification-requirement-registry.js';
import {
  registerInitialCapabilities,
  listVerificationCapabilities,
} from './verification-capability-registry.js';
import {
  evaluateVerificationRegistryGates,
  validateVerificationRegistry,
} from './verification-registry-validator.js';
import {
  buildVerificationRegistryReport,
  composeVerificationRegistryResponse,
  deriveRegistryState,
} from './verification-registry-report.js';
import {
  getVerificationRegistryDiagnostics,
  updateVerificationRegistryDiagnostics,
} from './verification-registry-diagnostics.js';
import {
  isDuplicateVerificationRegistryQuestion,
  type PrepareVerificationRegistryInput,
  type PrepareVerificationRegistryResult,
  type VerificationRegistryReport,
} from './types.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareVerificationRegistryInput> = {},
): PrepareVerificationRegistryInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('verification_registry');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    world1Protected: true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_verification_registry',
    ...overrides,
  };
}

function blockedReport(
  query: string,
  reason: string,
  partial: Partial<VerificationRegistryReport> = {},
): PrepareVerificationRegistryResult {
  const report = buildVerificationRegistryReport({
    registryState: 'BLOCKED',
    targetCount: 0,
    dependencyCount: 0,
    requirementCount: 0,
    capabilityCount: 0,
    verificationTargets: [],
    verificationDependencies: [],
    verificationRequirements: [],
    blockedReasons: [reason],
    warnings: [],
    ...partial,
  });
  updateVerificationRegistryDiagnostics(query, 'BLOCKED', 0, 0, 0);
  publishVerificationRegistryFeedStages(query, false);
  return {
    registryReport: report,
    diagnostics: getVerificationRegistryDiagnostics(),
    verificationTargets: [],
    verificationDependencies: [],
    verificationRequirements: [],
    responseText: composeVerificationRegistryResponse(query, report),
  };
}

export function prepareVerificationRegistry(
  input: PrepareVerificationRegistryInput,
): PrepareVerificationRegistryResult {
  const query = input.query ?? 'What can be verified?';

  if (isDuplicateVerificationRegistryQuestion(query)) {
    return blockedReport(
      query,
      'Duplicate engine rejected — use verification_registry extension only',
    );
  }

  if (!input.suppressRuntimeBootstrap) {
    registerInitialTargets();
    registerInitialOwners();
    registerInitialDependencies();
    registerInitialRequirements();
    registerInitialCapabilities();
  }

  const verificationTargets = listVerificationTargets();
  const verificationDependencies = listVerificationDependencies();
  const verificationRequirements = listVerificationRequirements();
  const capabilities = listVerificationCapabilities();
  const owners = listVerificationOwners();

  const gateReport = evaluateVerificationRegistryGates(input, {
    targetCount: verificationTargets.length,
    ownerCount: owners.length,
    dependencyCount: verificationDependencies.length,
  });

  const validation = validateVerificationRegistry({ gateReport });
  const valid = validation.valid;
  const registryState = deriveRegistryState(!valid, verificationTargets.length);

  const report = buildVerificationRegistryReport({
    registryState,
    targetCount: verificationTargets.length,
    dependencyCount: verificationDependencies.length,
    requirementCount: verificationRequirements.length,
    capabilityCount: capabilities.length,
    verificationTargets,
    verificationDependencies,
    verificationRequirements,
    blockedReasons: valid ? [] : validation.blockers,
    warnings: validation.warnings,
  });

  publishVerificationRegistryFeedStages(query, valid);
  updateVerificationRegistryDiagnostics(
    query,
    registryState,
    verificationTargets.length,
    verificationDependencies.length,
    verificationRequirements.length,
  );

  return {
    registryReport: report,
    diagnostics: getVerificationRegistryDiagnostics(),
    verificationTargets,
    verificationDependencies,
    verificationRequirements,
    responseText: composeVerificationRegistryResponse(query, report),
  };
}

export function processVerificationRegistryRequest(query: string): PrepareVerificationRegistryResult {
  return prepareVerificationRegistry(resolveInputFromQuery(query));
}

export function getVerificationRegistryContext(query: string): PrepareVerificationRegistryResult {
  return processVerificationRegistryRequest(query);
}
