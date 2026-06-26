/**
 * Virtual Device Laboratory — bounded device matrix construction.
 */

import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';
import {
  DEFAULT_DEVICE_TIMEOUT_MS,
  DEFAULT_MAX_DEVICE_MATRIX_ENTRIES,
  type DeviceMatrixEntry,
  type DeviceProfile,
} from './virtual-device-types.js';

let matrixCounter = 0;

export function resetDeviceMatrixBuilderForTests(): void {
  matrixCounter = 0;
}

export function buildDeviceMatrix(input: {
  profiles: readonly DeviceProfile[];
  virtualUserSimulation?: VirtualUserPipelineResult;
  behaviorSimulation?: BehaviorSimulationPipelineResult;
}): DeviceMatrixEntry[] {
  const entries: DeviceMatrixEntry[] = input.profiles.slice(0, DEFAULT_MAX_DEVICE_MATRIX_ENTRIES).map((profile) => {
    matrixCounter += 1;
    const label = `${profile.deviceType} ${profile.orientation} — ${profile.themeMode}`;
    const virtualUserLinks =
      profile.requiredVirtualUserIds.length > 0
        ? [...profile.requiredVirtualUserIds]
        : (input.virtualUserSimulation?.profiles.slice(0, 1).map((p) => p.userId) ?? []);
    const behaviorScenarioLinks =
      input.behaviorSimulation?.scenarios.slice(0, 3).map((s) => s.scenarioId) ?? [];

    return {
      readOnly: true,
      profileId: `matrix-${matrixCounter}`,
      deviceId: profile.deviceId,
      reasonIncluded: `${label} — ${profile.performanceTier} tier, scaling ${profile.accessibilityScaling}x`,
      sourceRequirementIds: [],
      virtualUserLinks,
      behaviorScenarioLinks,
      validationScope: [
        'RENDER',
        'RESPONSIVE',
        'NAVIGATION',
        'REACHABILITY',
        'ACCESSIBILITY',
        'THEME',
        'PERFORMANCE',
      ],
      timeoutBudgetMs: DEFAULT_DEVICE_TIMEOUT_MS,
      passCriteria: [
        'App renders without blank screen',
        'Critical workflows reachable',
        'No blocking layout or performance failures',
      ],
    };
  });

  return entries;
}
