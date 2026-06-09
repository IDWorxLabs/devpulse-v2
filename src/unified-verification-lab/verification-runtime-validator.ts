/**
 * Verification runtime validator — gate evaluation without verification execution.
 */

import type { PrepareVerificationRuntimeInput } from './types.js';
import { getVerificationProvider, listVerificationProviders } from './verification-provider-registry.js';
import { listVerificationSessions } from './verification-session-manager.js';

export interface VerificationRuntimeGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface VerificationRuntimeValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateVerificationRuntimeGates(
  input: PrepareVerificationRuntimeInput,
  opts: { providerCount: number; sessionCount: number },
): VerificationRuntimeGateReport {
  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists ?? true,
      summary: 'Project must exist for verification runtime association',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists ?? true,
      summary: 'Workspace must exist for verification runtime isolation',
    },
    {
      name: 'Providers Registered',
      satisfied: opts.providerCount > 0,
      summary: 'At least one verification provider must be registered',
    },
    {
      name: 'Sessions Created',
      satisfied: opts.sessionCount > 0,
      summary: 'At least one verification session must exist',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid ?? true,
      summary: 'Unified Verification Lab Runtime ownership must be registered',
    },
    {
      name: 'World 1 Protection',
      satisfied: input.world1Protected ?? true,
      summary: 'World 1 protection must be maintained',
    },
  ];

  const blockers = gates.filter((g) => !g.satisfied).map((g) => `Gate unsatisfied: ${g.name} — ${g.summary}`);
  return { gates, blockers };
}

export function validateVerificationRuntime(opts: {
  gateReport: VerificationRuntimeGateReport;
}): VerificationRuntimeValidationResult {
  const blockers = [...opts.gateReport.blockers];
  const warnings: string[] = [
    'Phase 16.7 — provider registration and session lifecycle only',
    'No verification execution, evidence generation, report orchestration, or auto-fix',
    'No project scoring or verification orchestration',
  ];

  return { valid: blockers.length === 0, blockers, warnings };
}

export function validateProviderRegistration(providerId: string): {
  valid: boolean;
  error: string | null;
} {
  const provider = getVerificationProvider(providerId);
  if (!provider) return { valid: false, error: 'Missing provider' };
  if (!provider.ownerModule.startsWith('devpulse_v2_')) {
    return { valid: false, error: 'Invalid ownership module' };
  }
  return { valid: true, error: null };
}

export function validateSessionUniqueness(providerId: string, verificationType: string): {
  unique: boolean;
  error: string | null;
} {
  const duplicate = listVerificationSessions().some(
    (s) => s.providerId === providerId && s.verificationType === verificationType,
  );
  if (duplicate) return { unique: false, error: 'Duplicate session' };
  return { unique: true, error: null };
}
