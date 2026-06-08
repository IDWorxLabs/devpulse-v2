/**
 * Coordination metadata derived from observed system summaries — not intelligence decisions.
 */

import type { BrainCoordinationSummary, BrainOverallStatus, BrainSystemSummary } from './types.js';

export function buildBrainCoordinationSummary(
  systems: BrainSystemSummary[],
): BrainCoordinationSummary {
  const readySystems = systems.filter((s) => s.status === 'READY').length;
  const warningSystems = systems.filter((s) => s.status === 'WARN').length;
  const failedSystems = systems.filter((s) => s.status === 'FAIL').length;

  let overallStatus: BrainOverallStatus = 'READY';
  if (failedSystems > 0) {
    overallStatus = 'FAIL';
  } else if (warningSystems > 0 || systems.some((s) => s.status === 'UNKNOWN')) {
    overallStatus = 'WARN';
  }

  return {
    totalSystems: systems.length,
    readySystems,
    warningSystems,
    failedSystems,
    overallStatus,
  };
}
