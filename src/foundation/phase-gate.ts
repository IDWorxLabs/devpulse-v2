/**
 * DevPulse V2 phase gate — prevents Phase 2+ systems in Phase 1.
 */

import { DEV_PULSE_V2_LAWS, isPhase1ForbiddenSystem } from './law-registry.js';
import type { DevPulseV2Phase, PhaseGateResult, Violation } from './types.js';

function buildPhaseViolation(
  systemId: string,
  phase: DevPulseV2Phase,
): Violation {
  return {
    code: 'PHASE_FORBIDDEN_SYSTEM',
    message: `System "${systemId}" is forbidden in Phase ${phase}.`,
    lawReference: 'DEVPULSE_V2_REBUILD_BLUEPRINT',
    systemId,
    phase,
    recommendedAction:
      phase === 1
        ? `Remove "${systemId}" from the build. Phase 1 allows only: ${DEV_PULSE_V2_LAWS.phase1AllowedSystems.join(', ')}. Prove Phase 1 stability before introducing deferred systems.`
        : `Verify prior phase stability gate passed before adding "${systemId}".`,
    riskLevel: 'critical',
  };
}

/**
 * Assert a system is allowed in the given phase.
 * Phase 1 allows only foundation systems listed in the law registry.
 */
export function assertSystemAllowedInCurrentPhase(
  systemId: string,
  phase: DevPulseV2Phase,
): PhaseGateResult {
  if (phase === 1) {
    if (isPhase1ForbiddenSystem(systemId)) {
      return {
        allowed: false,
        systemId,
        phase,
        violation: buildPhaseViolation(systemId, phase),
      };
    }

    const allowed = (DEV_PULSE_V2_LAWS.phase1AllowedSystems as readonly string[]).includes(
      systemId,
    );

    if (!allowed) {
      return {
        allowed: false,
        systemId,
        phase,
        violation: {
          code: 'PHASE_UNREGISTERED_SYSTEM',
          message: `System "${systemId}" is not registered as Phase 1 allowed.`,
          lawReference: 'DEVPULSE_V2_REBUILD_BLUEPRINT',
          systemId,
          phase,
          recommendedAction: `Register system for Phase ${phase} in law registry or defer to later phase.`,
          riskLevel: 'high',
        },
      };
    }
  }

  return { allowed: true, systemId, phase };
}

/** Run phase gate for all systems in a build packet. */
export function assertAllSystemsAllowedInPhase(
  systems: string[],
  phase: DevPulseV2Phase,
): PhaseGateResult[] {
  return systems.map((systemId) => assertSystemAllowedInCurrentPhase(systemId, phase));
}
