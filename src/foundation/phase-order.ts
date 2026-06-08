/** Numeric ordering for DevPulse V2 phase values (supports sub-phases like '10.3.1'). */

import type { DevPulseV2Phase } from './types.js';

export function devPulsePhaseOrder(phase: DevPulseV2Phase | number): number {
  if (typeof phase === 'string') return parseFloat(phase);
  return phase;
}

export function formatDevPulsePhase(phase: DevPulseV2Phase): string {
  return String(phase);
}
