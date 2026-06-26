/**
 * Autonomous Debugging Engine — responsible subsystem resolution.
 */

import type { RootCauseResult, ResponsibleSubsystem } from './autonomous-debugging-types.js';

export function resolveResponsibleSubsystem(rootCause: RootCauseResult): ResponsibleSubsystem {
  return rootCause.responsibleSubsystem;
}

export function subsystemAllowsAutonomousPatch(_subsystem: ResponsibleSubsystem): boolean {
  return true;
}
