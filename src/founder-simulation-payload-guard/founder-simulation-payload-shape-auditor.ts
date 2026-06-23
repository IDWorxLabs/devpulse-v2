/**
 * Phase 26.97 — Founder simulation payload shape auditor.
 */

import { detectUndefinedLengthRisks } from './undefined-length-access-detector.js';
import type { FounderSimulationPayloadFieldRepair } from './founder-simulation-payload-guard-types.js';

export function auditFounderSimulationPayloadShape(raw: unknown): {
  readOnly: true;
  risks: ReturnType<typeof detectUndefinedLengthRisks>;
  missingSimulationResult: boolean;
} {
  if (raw == null) {
    return {
      readOnly: true,
      risks: [
        {
          readOnly: true,
          path: 'result',
          failureClass: 'MISSING_SIMULATION_RESULT',
          detail: 'Founder simulation result is null',
        },
      ],
      missingSimulationResult: true,
    };
  }

  return {
    readOnly: true,
    risks: detectUndefinedLengthRisks(raw),
    missingSimulationResult: false,
  };
}

export function repairsFromRisks(
  risks: ReturnType<typeof detectUndefinedLengthRisks>,
): FounderSimulationPayloadFieldRepair[] {
  return risks.map((risk) => ({
    readOnly: true,
    path: risk.path,
    failureClass: risk.failureClass,
    defaultApplied:
      risk.failureClass === 'UNDEFINED_STRING_FIELD'
        ? "''"
        : risk.failureClass === 'UNDEFINED_OBJECT_FIELD'
          ? '{}'
          : '[]',
  }));
}
