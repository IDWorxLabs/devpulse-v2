/** Canonical status projection from BuildOutcome. */
import { isBlockedBuildOutcome } from './build-outcome.js';
import type { BuildOutcome, BuildStatusProjection } from './build-context-types.js';

export function projectBuildStatusFromBuildOutcome(outcome: BuildOutcome): BuildStatusProjection {
  if (outcome === 'BUILD_SUCCEEDED') {
    return {
      buildOutcome: outcome,
      executionStatus: 'COMPLETED',
      currentStage: 'Build complete',
      heartbeat: 'ready',
      nextStep: 'Your app is ready to preview',
      previewAvailable: true,
      completionWording: 'Build completed successfully',
      retryWording: 'No retry required',
      successBanner: 'Ready to preview',
      engineeringSummary: 'Build succeeded with current build-context ownership intact.',
    };
  }
  if (outcome === 'BUILD_BLOCKED_GPCA') {
    return {
      buildOutcome: outcome,
      executionStatus: 'BLOCKED',
      currentStage: 'Generation compliance validation',
      heartbeat: 'Generation stopped because unapproved input reached a generator',
      nextStep: 'Correct or regenerate the approved generation input',
      previewAvailable: false,
      completionWording: 'Build blocked before successful completion',
      retryWording: 'Retry only after correcting the approved generation input',
      successBanner: null,
      engineeringSummary: 'Generation pipeline compliance blocked this build before successful completion.',
    };
  }
  const reason = outcome
    .replace(/^BUILD_/, '')
    .replace(/_/g, ' ')
    .toLowerCase();
  return {
    buildOutcome: outcome,
    executionStatus: isBlockedBuildOutcome(outcome) ? 'BLOCKED' : 'FAILED',
    currentStage: reason.includes('preview') ? 'Preview blocked' : 'Build integrity validation',
    heartbeat: 'blocked',
    nextStep: 'Resolve current build-context blockers before preview activation',
    previewAvailable: false,
    completionWording: `Build blocked — ${reason}`,
    retryWording: 'Retry only after stale or foreign build evidence is removed',
    successBanner: null,
    engineeringSummary: `Build is not ready: ${reason}.`,
  };
}

export function blockedProjectionContainsNoSuccessWording(projection: BuildStatusProjection): boolean {
  if (projection.buildOutcome === 'BUILD_SUCCEEDED') return true;
  const surface = [
    projection.currentStage,
    projection.heartbeat,
    projection.nextStep,
    projection.completionWording,
    projection.retryWording,
    projection.successBanner ?? '',
    projection.engineeringSummary,
  ].join(' ').toLowerCase();
  return !/(build completed successfully|ready to preview|testing live preview|preview ready|execution completed|build succeeded)/.test(
    surface,
  );
}
