/** Preview surface — BuildOutcome + BuildContext only. */
import type { BuildContext, BuildOutcome } from '../build-context-integrity/build-context-types.js';
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';
import { isBlockedBuildOutcome } from '../build-context-integrity/build-outcome.js';
import { projectProductionSurfaceStatus } from './status-surface.js';
import type { PreviewSurface } from './production-surface-types.js';

export function resolvePreviewSurface(buildContext: BuildContext, outcome: BuildOutcome): PreviewSurface {
  const status = projectProductionSurfaceStatus(outcome);
  const blocked = isBlockedBuildOutcome(outcome);
  const base = {
    buildOutcome: outcome,
    buildContextId: buildContext.buildContextId,
    previewAvailable: !blocked && status.previewAvailable,
    previewSummary: blocked ? status.completionWording : status.nextStep,
    blockedReason: blocked ? status.engineeringSummary : null,
  };
  return { readOnly: true, ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export function previewSurfacesAgreeWhenBlocked(surfaces: readonly PreviewSurface[]): boolean {
  const blocked = surfaces.filter((surface) => isBlockedBuildOutcome(surface.buildOutcome));
  if (blocked.length === 0) return true;
  const first = blocked[0]!;
  return blocked.every(
    (surface) =>
      surface.previewAvailable === false &&
      surface.previewAvailable === first.previewAvailable &&
      surface.blockedReason !== null,
  );
}

export function previewCannotClaimReadinessWhileBlocked(surface: PreviewSurface): boolean {
  if (!isBlockedBuildOutcome(surface.buildOutcome)) return true;
  return surface.previewAvailable === false && !/ready to preview|testing live preview|preview ready/i.test(surface.previewSummary);
}
