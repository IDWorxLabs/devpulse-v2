/**
 * Universal Production Readiness Verification V1 — deterministic report builder.
 */

import type { ProductionReadinessInput, ProductionReadinessReport, UniversalProductionReadinessDescriptor } from './universal-production-readiness-types.js';
import { diagnoseProductionReadiness } from './production-readiness-diagnostics.js';

export function generateProductionReadinessReport(
  evaluation: UniversalProductionReadinessDescriptor,
  input: ProductionReadinessInput,
): ProductionReadinessReport {
  const blockers = evaluation.blockingFindings;
  const warnings = evaluation.warningFindings;
  const aeoDiagnoses = diagnoseProductionReadiness({
    verdict: evaluation.readinessVerdict,
    releaseDecision: evaluation.releaseDecision,
    blockers,
    warnings,
    readinessInput: input,
  });

  return {
    ...evaluation,
    aeoDiagnoses: aeoDiagnoses.map((d) => ({ code: d.code, detail: d.detail, priority: d.priority })),
  };
}
