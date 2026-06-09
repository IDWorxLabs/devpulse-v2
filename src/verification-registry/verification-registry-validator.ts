/**
 * Verification registry validator — gate evaluation without execution.
 */

import type { PrepareVerificationRegistryInput } from './types.js';
import { listVerificationTargets } from './verification-target-registry.js';
import { listVerificationOwners } from './verification-owner-registry.js';
import { listVerificationDependencies } from './verification-dependency-registry.js';

export interface VerificationRegistryGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface VerificationRegistryValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateVerificationRegistryGates(
  input: PrepareVerificationRegistryInput,
  opts: { targetCount: number; ownerCount: number; dependencyCount: number },
): VerificationRegistryGateReport {
  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists ?? true,
      summary: 'Project must exist for registry association',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists ?? true,
      summary: 'Workspace must exist for registry isolation',
    },
    {
      name: 'Targets Registered',
      satisfied: opts.targetCount > 0,
      summary: 'At least one verification target must be registered',
    },
    {
      name: 'Owners Registered',
      satisfied: opts.ownerCount > 0,
      summary: 'At least one verification owner must be registered',
    },
    {
      name: 'Dependencies Registered',
      satisfied: opts.dependencyCount > 0,
      summary: 'At least one verification dependency must be registered',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid ?? true,
      summary: 'Verification registry ownership must be registered',
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

export function validateVerificationRegistry(opts: {
  gateReport: VerificationRegistryGateReport;
}): VerificationRegistryValidationResult {
  const blockers = [...opts.gateReport.blockers];
  const warnings: string[] = [
    'Phase 16.8 — verification registry metadata only',
    'No verification execution, orchestration, evidence generation, or auto-fix',
    'No report orchestration or project scoring',
  ];

  for (const target of listVerificationTargets()) {
    if (!target.ownerModule.startsWith('devpulse_v2_')) {
      blockers.push(`Invalid ownership for target ${target.verificationTargetId}`);
    }
  }

  return { valid: blockers.length === 0, blockers, warnings };
}

export function validateDependencyRegistration(targetId: string): {
  valid: boolean;
  error: string | null;
} {
  const target = listVerificationTargets().find((t) => t.verificationTargetId === targetId);
  if (!target) return { valid: false, error: 'Invalid dependency — target not found' };
  const deps = listVerificationDependencies().filter((d) => d.targetId === targetId);
  for (const dep of deps) {
    for (const upstream of dep.upstreamDependencies) {
      const upstreamTarget = listVerificationTargets().find(
        (t) => t.verificationCategory === upstream,
      );
      if (upstream && !upstreamTarget) {
        return { valid: false, error: `Invalid upstream dependency: ${upstream}` };
      }
    }
  }
  return { valid: true, error: null };
}

export function validateOwnerExists(ownerModule: string): boolean {
  return listVerificationOwners().some((o) => o.ownerModule === ownerModule);
}
