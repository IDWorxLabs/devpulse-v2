/**
 * Interaction Proof Engine — device coverage proof.
 */

import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { InteractionDeviceCoverageProof, InteractionSurface } from './interaction-proof-types.js';

export function proveInteractionDeviceCoverage(input: {
  surface: InteractionSurface;
  virtualDeviceLaboratory?: VirtualDevicePipelineResult;
  simulateDeviceSpecificFailure?: boolean;
}): InteractionDeviceCoverageProof[] {
  const profiles = input.virtualDeviceLaboratory?.matrix ?? [];
  if (!profiles.length) {
    return [
      {
        readOnly: true,
        interactionId: input.surface.interactionId,
        deviceProfileId: 'default',
        reachable: true,
        passed: true,
      },
    ];
  }

  return profiles.map((entry) => {
    const profile = input.virtualDeviceLaboratory!.profiles.find((p) => p.deviceId === entry.deviceId);
    const phoneExportFail =
      input.simulateDeviceSpecificFailure &&
      /export/i.test(input.surface.label) &&
      profile?.deviceType === 'PHONE';
    const reachable = !phoneExportFail && (input.virtualDeviceLaboratory!.profileResults.find((r) => r.profileId === entry.profileId)?.passed ?? true);
    return {
      readOnly: true,
      interactionId: input.surface.interactionId,
      deviceProfileId: entry.profileId,
      reachable,
      passed: reachable,
    };
  });
}
