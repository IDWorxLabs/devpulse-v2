/**
 * DevPulse V2 build gate — unified pre-build approval checkpoint.
 */

import { runDevPulseV2ConstitutionalValidation } from './constitutional-validator.js';
import { assertSingleOwner, listDevPulseV2Owners } from './ownership-registry.js';
import { assertAllSystemsAllowedInPhase } from './phase-gate.js';
import type { BuildGateResult, BuildPacket, Violation } from './types.js';

export function runDevPulseV2BuildGate(buildPacket: BuildPacket): BuildGateResult {
  const phase = buildPacket.phase ?? 1;
  const violations: Violation[] = [];
  const warnings = [];

  // 1. Phase gate for all intended systems
  const phaseResults = assertAllSystemsAllowedInPhase(buildPacket.systems, phase);
  for (const result of phaseResults) {
    if (!result.allowed && result.violation) {
      violations.push(result.violation);
    }
  }

  // 2. Ownership registry integrity — all domains must have single owner
  for (const owner of listDevPulseV2Owners()) {
    if (owner.phase > phase) {
      continue;
    }
    const check = assertSingleOwner(owner.domain);
    if (!check.ok && check.violation) {
      violations.push(check.violation);
    }
  }

  // 3. Packet-level duplicate authority checks via constitutional validator
  const constitutional = runDevPulseV2ConstitutionalValidation({
    ...buildPacket,
    phase,
  });

  violations.push(...constitutional.violations);
  warnings.push(...constitutional.warnings);

  const passed = violations.length === 0;
  const summary = passed
    ? `Build gate PASS for phase ${phase}: ${buildPacket.systems.join(', ') || '(no systems)'}.`
    : `Build gate FAIL for phase ${phase}: ${violations.length} violation(s) block approval.`;

  return {
    passed,
    violationCount: violations.length,
    warningCount: warnings.length,
    violations,
    warnings,
    summary,
    phaseResults,
    buildAllowed: passed,
  };
}
