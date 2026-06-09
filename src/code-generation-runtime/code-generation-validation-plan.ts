/**
 * Code generation validation plan — proof criteria without running generation.
 */

import type { CodeGenerationValidationPlan } from './code-generation-runtime-types.js';

export function createCodeGenerationValidationPlan(query: string): CodeGenerationValidationPlan {
  const lower = query.toLowerCase();

  const checks = [
    'Code generation request parsed and scoped correctly',
    'Artifact proposals created in-memory only — no disk writes',
    'Change proposals describe targets without applied patches',
    'Generation strategy selected with documented rationale',
    'Risks evaluated from dependency and project understanding sources',
    'Build task plan linked — build task remains blocked',
    'Execution packet linked — executionAllowed remains false',
    'No child_process, spawn, exec, or shell commands invoked',
  ];

  const proofCriteria = [
    'All proposed artifacts have inMemoryOnly and proposalOnly flags',
    'All change proposals have applied: false',
    'Validation script passes with 1600+ scenarios',
    'typecheck passes without writing generated code to src/',
    'Command Center routes code generation questions to CODE_GENERATION_RUNTIME_FOUNDATION',
    'Operator feed publishes full generation planning stage sequence',
  ];

  const rollbackConsiderations = [
    'Proposals can be discarded without runtime mutation — no files were modified',
    'In-memory artifacts are not persisted to project source',
    'Future apply phase must use verification-gated apply with rollback engine',
    'Build task and execution packet states can revert to BLOCKED if gates fail',
  ];

  if (lower.includes('prove') || lower.includes('validation')) {
    proofCriteria.unshift('Operator-visible proof criteria defined before any governed generation');
  }

  return {
    planId: `cgval-${Date.now().toString(36).slice(-6)}`,
    checks,
    proofCriteria,
    rollbackConsiderations,
    proposalOnly: true,
  };
}
