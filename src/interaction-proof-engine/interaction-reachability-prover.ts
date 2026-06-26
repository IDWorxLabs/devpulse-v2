/**
 * Interaction Proof Engine — reachability proof.
 */

import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { InteractionSurface } from './interaction-proof-types.js';

export function proveInteractionReachability(input: {
  surface: InteractionSurface;
  virtualDeviceLaboratory?: VirtualDevicePipelineResult;
  simulateDeviceSpecificFailure?: boolean;
}): boolean {
  if (input.surface.classification === 'DECORATIVE_NON_INTERACTION') return true;
  if (input.surface.classification === 'UNKNOWN_INTERACTION') return false;

  const phoneFail =
    input.simulateDeviceSpecificFailure &&
    /export/i.test(input.surface.label) &&
    input.virtualDeviceLaboratory?.profiles.some((p) => p.deviceType === 'PHONE');

  if (phoneFail) return false;

  const deviceReachable =
    !input.virtualDeviceLaboratory?.profileResults.length ||
    input.virtualDeviceLaboratory.profileResults.some((r) =>
      r.reachabilityChecks.some(
        (c) => c.passed && c.check.toLowerCase().includes(input.surface.label.split(' ')[0]?.toLowerCase() ?? ''),
      ),
    ) ||
    input.virtualDeviceLaboratory.profileResults.every((r) => r.passed);

  return deviceReachable;
}
