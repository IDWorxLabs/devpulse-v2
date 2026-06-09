/**
 * Code Generation Runtime Foundation diagnostics.
 */

import type { CodeGenerationPlan, CodeGenerationRuntimeDiagnostics } from './code-generation-runtime-types.js';

let diagnostics: CodeGenerationRuntimeDiagnostics = {
  codeGenerationRuntimeActive: false,
  codeGenerationPlanCount: 0,
  blockedGenerationCount: 0,
  readyForFutureGenerationCount: 0,
  lastCodeGenerationQuery: null,
  lastCodeGenerationReadiness: null,
};

export function getCodeGenerationRuntimeDiagnostics(): CodeGenerationRuntimeDiagnostics {
  return { ...diagnostics };
}

export function updateCodeGenerationRuntimeDiagnostics(query: string, plan: CodeGenerationPlan): void {
  diagnostics = {
    codeGenerationRuntimeActive: true,
    codeGenerationPlanCount: diagnostics.codeGenerationPlanCount + 1,
    blockedGenerationCount: diagnostics.blockedGenerationCount + (plan.blocked ? 1 : 0),
    readyForFutureGenerationCount:
      diagnostics.readyForFutureGenerationCount +
      (plan.state === 'READY_FOR_FUTURE_GENERATION' ? 1 : 0),
    lastCodeGenerationQuery: query,
    lastCodeGenerationReadiness: plan.readiness,
  };
}

export function resetCodeGenerationRuntimeDiagnostics(): void {
  diagnostics = {
    codeGenerationRuntimeActive: false,
    codeGenerationPlanCount: 0,
    blockedGenerationCount: 0,
    readyForFutureGenerationCount: 0,
    lastCodeGenerationQuery: null,
    lastCodeGenerationReadiness: null,
  };
}

export function codeGenerationRuntimeKey(): string {
  const d = diagnostics;
  return [
    String(d.codeGenerationRuntimeActive),
    String(d.codeGenerationPlanCount),
    String(d.blockedGenerationCount),
    String(d.readyForFutureGenerationCount),
    d.lastCodeGenerationQuery ?? 'none',
    d.lastCodeGenerationReadiness ?? 'none',
  ].join('|');
}
