/**
 * ASE — live preview router.
 */

import type { LivePreviewGateResult } from '../live-preview-gate/live-preview-gate-types.js';
import type { LaunchReadinessPipelineResult } from '../launch-readiness-authority-v2/launch-readiness-types.js';

export function routeAseLivePreview(input: {
  launchReadiness: LaunchReadinessPipelineResult;
  livePreviewGate: LivePreviewGateResult;
}): {
  readOnly: true;
  previewUnlocked: boolean;
  bypassAttempted: boolean;
  launchAuthorityDecides: boolean;
  previewGateDecides: boolean;
  previewState: string;
} {
  const launchReady = input.launchReadiness.verdict.verdict === 'LAUNCH_READY';
  const previewUnlocked = input.livePreviewGate.isPreviewAvailable && launchReady;

  return {
    readOnly: true,
    previewUnlocked,
    bypassAttempted: false,
    launchAuthorityDecides: true,
    previewGateDecides: true,
    previewState: input.livePreviewGate.state,
  };
}
