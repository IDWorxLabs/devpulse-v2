/**
 * Verification orchestrator validator — gate evaluation and cycle detection.
 */

import type { PrepareVerificationOrchestrationInput } from './types.js';
import type { DependencyResolution } from './verification-dependency-resolver.js';
import type { BlockerAnalysis } from './verification-blocker-analyzer.js';

export interface OrchestratorGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface OrchestratorValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateOrchestratorGates(
  input: PrepareVerificationOrchestrationInput,
  opts: { targetCount: number; planCount: number; hasCycle: boolean },
): OrchestratorGateReport {
  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists ?? true,
      summary: 'Project must exist for orchestration context',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists ?? true,
      summary: 'Workspace must exist for orchestration isolation',
    },
    {
      name: 'Targets Available',
      satisfied: opts.targetCount > 0,
      summary: 'At least one verification target required from registry',
    },
    {
      name: 'Plans Generated',
      satisfied: opts.planCount > 0,
      summary: 'At least one execution plan must be generated',
    },
    {
      name: 'No Dependency Cycle',
      satisfied: !opts.hasCycle,
      summary: 'Dependency graph must be acyclic',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid ?? true,
      summary: 'Verification orchestrator ownership must be registered',
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

export function validateVerificationOrchestration(opts: {
  gateReport: OrchestratorGateReport;
  blockerAnalysis: BlockerAnalysis;
  resolution: DependencyResolution;
}): OrchestratorValidationResult {
  const blockers = [...opts.gateReport.blockers, ...opts.blockerAnalysis.blockerReasons.slice(0, 5)];
  const warnings: string[] = [
    'Phase 16.9 — verification orchestration planning only',
    'No verification execution, evidence generation, report orchestration, or auto-fix',
    'No provider execution or runtime mutation',
  ];

  if (opts.resolution.hasCycle) {
    blockers.push('Dependency cycle detected — orchestration blocked');
  }

  const valid = blockers.length === 0;
  return { valid, blockers: valid ? [] : blockers, warnings };
}
