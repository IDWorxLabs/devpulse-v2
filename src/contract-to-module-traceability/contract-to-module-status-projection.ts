/** Contract-to-Module Traceability Authority V1 — canonical build status projection. */
import type { CanonicalBuildOutcome } from './contract-to-module-traceability-types.js';

export interface CanonicalBuildStatusProjection {
  readonly buildOutcome: CanonicalBuildOutcome;
  readonly executionStatus: 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'IN_PROGRESS';
  readonly currentStage: string;
  readonly nextStep: string;
  readonly previewAvailable: boolean;
  readonly completionWording: string;
  readonly heartbeat: string;
}

export function projectBuildStatusFromTraceabilityOutcome(outcome: CanonicalBuildOutcome): CanonicalBuildStatusProjection {
  switch (outcome) {
    case 'BUILD_SUCCEEDED':
      return {
        buildOutcome: outcome,
        executionStatus: 'COMPLETED',
        currentStage: 'Build complete',
        nextStep: 'Your app is ready to preview',
        previewAvailable: true,
        completionWording: 'Build completed successfully',
        heartbeat: 'ready',
      };
    case 'BUILD_BLOCKED_TRACEABILITY':
      return {
        buildOutcome: outcome,
        executionStatus: 'BLOCKED',
        currentStage: 'Traceability validation',
        nextStep: 'Resolve module ancestry or regenerate from the first broken boundary',
        previewAvailable: false,
        completionWording: 'Build blocked — traceability incomplete',
        heartbeat: 'blocked',
      };
    case 'BUILD_REGENERATION_REQUIRED':
      return {
        buildOutcome: outcome,
        executionStatus: 'BLOCKED',
        currentStage: 'Regeneration required',
        nextStep: 'Regenerate from the stage where approved concepts were lost',
        previewAvailable: false,
        completionWording: 'Build blocked — regeneration required',
        heartbeat: 'blocked',
      };
    case 'BUILD_REQUIRES_NEW_CAPABILITY':
      return {
        buildOutcome: outcome,
        executionStatus: 'BLOCKED',
        currentStage: 'Capability gap',
        nextStep: 'Required capability is not yet implemented',
        previewAvailable: false,
        completionWording: 'Build blocked — new capability required',
        heartbeat: 'blocked',
      };
    case 'BUILD_REQUIRES_HUMAN_DECISION':
      return {
        buildOutcome: outcome,
        executionStatus: 'BLOCKED',
        currentStage: 'Human decision required',
        nextStep: 'Architectural decision required before generation can continue',
        previewAvailable: false,
        completionWording: 'Build blocked — human decision required',
        heartbeat: 'blocked',
      };
    default:
      return {
        buildOutcome: outcome,
        executionStatus: 'FAILED',
        currentStage: 'Build failed',
        nextStep: 'Review traceability findings and retry',
        previewAvailable: false,
        completionWording: 'Build failed',
        heartbeat: 'failed',
      };
  }
}

export function mergeTraceabilityBuildOutcome(
  existing: CanonicalBuildOutcome | null,
  traceability: CanonicalBuildOutcome,
): CanonicalBuildOutcome {
  if (existing === 'BUILD_SUCCEEDED' && traceability === 'BUILD_BLOCKED_TRACEABILITY') return traceability;
  if (traceability !== 'BUILD_SUCCEEDED') return traceability;
  return existing ?? traceability;
}
