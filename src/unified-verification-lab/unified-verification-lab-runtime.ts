/**
 * Unified Verification Lab Runtime — Phase 16.7 orchestrator.
 * Provider registration and session lifecycle only — no verification execution.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { publishUvlRuntimeFeedStages } from '../operator-feed/unified-verification-lab-runtime-feed-bridge.js';
import { parseVerificationRuntimeQuery } from './verification-request-parser.js';
import {
  registerInitialProviders,
  listVerificationProviders,
} from './verification-provider-registry.js';
import {
  bootstrapVerificationSessions,
  advanceSessionLifecycle,
  listVerificationSessions,
} from './verification-lifecycle-manager.js';
import {
  evaluateVerificationRuntimeGates,
  validateVerificationRuntime,
} from './verification-runtime-validator.js';
import {
  buildVerificationRuntimeReport,
  composeVerificationRuntimeResponse,
  deriveRuntimeState,
} from './verification-runtime-report.js';
import {
  getVerificationRuntimeDiagnostics,
  updateVerificationRuntimeDiagnostics,
} from './verification-runtime-diagnostics.js';
import {
  isDuplicateUvlRuntimeQuestion,
  type PrepareVerificationRuntimeInput,
  type PrepareVerificationRuntimeResult,
  type VerificationRuntimeReport,
} from './types.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareVerificationRuntimeInput> = {},
): PrepareVerificationRuntimeInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('unified_verification_lab_runtime');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    world1Protected: true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_unified_verification_lab_runtime',
    ...overrides,
  };
}

function blockedReport(
  query: string,
  reason: string,
  partial: Partial<VerificationRuntimeReport> = {},
): PrepareVerificationRuntimeResult {
  const report = buildVerificationRuntimeReport({
    runtimeState: 'BLOCKED',
    providerCount: 0,
    sessionCount: 0,
    registeredProviders: [],
    verificationSessions: [],
    blockedReasons: [reason],
    warnings: [],
    ...partial,
  });
  updateVerificationRuntimeDiagnostics(query, 'BLOCKED', 0, 0, 0, 1);
  publishUvlRuntimeFeedStages(query, false);
  return {
    runtimeReport: report,
    diagnostics: getVerificationRuntimeDiagnostics(),
    registeredProviders: [],
    verificationSessions: [],
    responseText: composeVerificationRuntimeResponse(query, report),
  };
}

export function prepareVerificationRuntime(
  input: PrepareVerificationRuntimeInput,
): PrepareVerificationRuntimeResult {
  const query = input.query ?? 'What verification providers exist?';

  if (isDuplicateUvlRuntimeQuestion(query)) {
    return blockedReport(
      query,
      'Duplicate engine rejected — use unified_verification_lab_runtime extension only',
    );
  }

  parseVerificationRuntimeQuery(query);

  if (!input.suppressRuntimeBootstrap) {
    registerInitialProviders();
    bootstrapVerificationSessions();
    for (const session of listVerificationSessions()) {
      advanceSessionLifecycle(session.verificationSessionId);
    }
  }

  const registeredProviders = listVerificationProviders();
  const verificationSessions = listVerificationSessions();

  const gateReport = evaluateVerificationRuntimeGates(input, {
    providerCount: registeredProviders.length,
    sessionCount: verificationSessions.length,
  });

  const validation = validateVerificationRuntime({ gateReport });
  const valid = validation.valid;
  const runtimeState = deriveRuntimeState(verificationSessions, !valid);
  const completedCount = verificationSessions.filter((s) => s.sessionState === 'COMPLETED').length;
  const blockedCount = verificationSessions.filter(
    (s) => s.sessionState === 'BLOCKED' || s.sessionState === 'FAILED',
  ).length;

  const report = buildVerificationRuntimeReport({
    runtimeState,
    providerCount: registeredProviders.length,
    sessionCount: verificationSessions.length,
    registeredProviders,
    verificationSessions,
    blockedReasons: valid ? [] : validation.blockers,
    warnings: validation.warnings,
  });

  publishUvlRuntimeFeedStages(query, valid);
  updateVerificationRuntimeDiagnostics(
    query,
    runtimeState,
    registeredProviders.length,
    verificationSessions.length,
    completedCount,
    blockedCount,
  );

  return {
    runtimeReport: report,
    diagnostics: getVerificationRuntimeDiagnostics(),
    registeredProviders,
    verificationSessions,
    responseText: composeVerificationRuntimeResponse(query, report),
  };
}

export function processVerificationRuntimeRequest(query: string): PrepareVerificationRuntimeResult {
  return prepareVerificationRuntime(resolveInputFromQuery(query));
}

export function getVerificationRuntimeContext(query: string): PrepareVerificationRuntimeResult {
  return processVerificationRuntimeRequest(query);
}
