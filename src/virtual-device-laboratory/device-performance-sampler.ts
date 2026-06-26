/**
 * Virtual Device Laboratory — performance sampling.
 */

import {
  DEFAULT_LOW_END_RENDER_THRESHOLD_MS,
  type DevicePerformanceSample,
  type DeviceProfile,
} from './virtual-device-types.js';

export function sampleDevicePerformance(input: {
  profile: DeviceProfile;
  simulateSlowLowEndRender?: boolean;
}): DevicePerformanceSample {
  const lowEnd = input.profile.performanceTier === 'LOW_END';
  const baseRender = lowEnd ? 1800 : input.profile.deviceType === 'DESKTOP' ? 400 : 900;
  const initialRenderMs = input.simulateSlowLowEndRender && lowEnd ? 3200 : baseRender;
  const status =
    initialRenderMs > DEFAULT_LOW_END_RENDER_THRESHOLD_MS && lowEnd
      ? initialRenderMs > DEFAULT_LOW_END_RENDER_THRESHOLD_MS + 500
        ? 'FAIL'
        : 'WARN'
      : 'PASS';

  return {
    readOnly: true,
    initialRenderMs,
    interactionResponseMs: lowEnd ? 180 : 80,
    routeTransitionMs: lowEnd ? 350 : 150,
    memoryRisk: lowEnd ? 'MEDIUM' : 'LOW',
    longTaskRisk: initialRenderMs > DEFAULT_LOW_END_RENDER_THRESHOLD_MS ? 'HIGH' : 'LOW',
    status,
  };
}
