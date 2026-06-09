/**
 * Preview capability analyzer — evaluates tracked capabilities without implementing them.
 */

import type { PreviewCapabilityType, PreviewSession } from '../live-preview-runtime/types.js';
import { capabilitiesForTargetType, TRACKED_PREVIEW_CAPABILITIES } from '../live-preview-runtime/types.js';
import type { PreviewContextAnalysis } from './preview-context-analyzer.js';
import type { PreviewCapabilitySummary, PreviewLimitationRecord } from './types.js';

const FUTURE_PHASE_CAPABILITIES: readonly PreviewCapabilityType[] = [
  'SCREEN_CAPTURE',
  'INTERACTION_TESTING',
  'SELF_VISION',
  'VISUAL_VERIFICATION',
] as const;

export function analyzePreviewCapabilities(
  context: PreviewContextAnalysis,
  session: PreviewSession | null,
  limitations: PreviewLimitationRecord[],
): PreviewCapabilitySummary[] {
  const trackedForTarget = capabilitiesForTargetType(context.targetType);
  const sessionCaps = session?.previewCapabilities ?? trackedForTarget;
  const limitationSet = new Set(limitations.map((l) => l.limitation));

  return TRACKED_PREVIEW_CAPABILITIES.map((capability) => {
    const inTarget = trackedForTarget.includes(capability);
    const inSession = sessionCaps.includes(capability);
    const futureRequired = FUTURE_PHASE_CAPABILITIES.includes(capability);

    let blockedReason: string | null = null;
    if (!context.hasSession) {
      blockedReason = 'Missing preview session';
    } else if (!context.hasTarget) {
      blockedReason = 'Missing preview target';
    } else if (!inTarget) {
      blockedReason = `Not applicable for ${context.targetType}`;
    } else if (capability === 'SCREEN_CAPTURE' && limitationSet.has('NO_SCREEN_CAPTURE')) {
      blockedReason = 'Screen capture not available in Phase 16.2';
    } else if (capability === 'INTERACTION_TESTING' && limitationSet.has('NO_INTERACTION_LAYER')) {
      blockedReason = 'Interaction layer not available in Phase 16.2';
    } else if (capability === 'SELF_VISION' && limitationSet.has('NO_SELF_VISION_RUNTIME')) {
      blockedReason = 'Self Vision runtime not connected in Phase 16.2';
    } else if (capability === 'VISUAL_VERIFICATION' && limitationSet.has('NO_VISUAL_VERIFICATION')) {
      blockedReason = 'Visual verification not available in Phase 16.2';
    } else if (capability === 'LIVE_VIEW' && !context.previewUrl && context.isVisualTarget) {
      blockedReason = 'No preview URL for live view';
    } else if (context.isNonVisualTarget && (capability === 'SCREEN_CAPTURE' || capability === 'VISUAL_VERIFICATION')) {
      blockedReason = 'Non-visual target';
    }

    const available = inSession && inTarget && blockedReason === null && context.hasSession;
    const missing = inTarget && !available;

    return {
      capability,
      available,
      missing,
      futureRequired,
      blockedReason,
    };
  });
}
