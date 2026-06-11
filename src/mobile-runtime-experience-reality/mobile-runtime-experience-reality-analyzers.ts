/**
 * Mobile Runtime Experience Reality — read-only analyzers (Phase 24C.5).
 * Phone image / phone frame / roadmap / Android/iOS/Expo mention in code ≠ proof.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AssessMobileRuntimeExperienceRealityInput,
  MobileRuntimeAnalyzerResults,
  MobileRuntimeEvidence,
  MobileRuntimeModulePresenceEvidence,
  MobileRuntimeWorkspaceSignals,
} from './mobile-runtime-experience-reality-types.js';

const BOUNDED_SCAN_PATHS = [
  'src/mobile-preview-runtime/mobile-preview-types.ts',
  'src/mobile-preview-runtime/mobile-preview-device-policy.ts',
  'src/product-reality-verification/visual-qa-engine/mobile-visual-analyzer.ts',
  'public/founder-reality/app.js',
  'public/founder-reality/styles.css',
  'src/controlled-builder-execution-engine/controlled-builder-execution-engine-bounds.ts',
  'src/autonomous-builder-execution-foundation/builder-execution-evidence.ts',
] as const;

function readBounded(rootDir: string, rel: string, maxBytes = 96_000): string {
  const fullPath = join(rootDir, rel);
  if (!existsSync(fullPath)) return '';
  const buf = readFileSync(fullPath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
}

export function detectMobileRuntimeModulePresenceEvidence(rootDir: string): MobileRuntimeModulePresenceEvidence {
  const pathExists = (rel: string) => existsSync(join(rootDir, rel));
  const mobileTypes = readBounded(rootDir, 'src/mobile-preview-runtime/mobile-preview-types.ts', 64_000);
  const mobilePolicy = readBounded(rootDir, 'src/mobile-preview-runtime/mobile-preview-device-policy.ts', 48_000);
  const builderBounds = readBounded(
    rootDir,
    'src/controlled-builder-execution-engine/controlled-builder-execution-engine-bounds.ts',
    16_000,
  );
  const foundationEvidence = readBounded(
    rootDir,
    'src/autonomous-builder-execution-foundation/builder-execution-evidence.ts',
    16_000,
  );

  return {
    hasMobilePreviewRuntime: pathExists('src/mobile-preview-runtime/index.ts'),
    hasMobileRuntimeExperienceReality: pathExists('src/mobile-runtime-experience-reality/index.ts'),
    hasVisualQaMobileAnalyzer: pathExists(
      'src/product-reality-verification/visual-qa-engine/mobile-visual-analyzer.ts',
    ),
    hasLivePreviewGatekeeper: pathExists(
      'src/product-reality-verification/live-preview-gatekeeper/live-preview-gatekeeper.ts',
    ),
    hasFounderInteractionSimulation: pathExists('src/founder-interaction-simulation/index.ts'),
    hasControlledBuilderExecutionEngine: pathExists('src/controlled-builder-execution-engine/index.ts'),
    hasExecutionFoundation: pathExists('src/autonomous-builder-execution-foundation/index.ts'),
    hasFounderRealityUi: pathExists('public/founder-reality/app.js'),
    mobilePreviewPolicyMetadata:
      mobilePolicy.includes('MobilePreviewDevicePolicy') && mobileTypes.includes('FOUNDER_MOBILE_PREVIEW'),
    mobileExtensionPointsReserved:
      builderBounds.includes('ANDROID_BUILD_SESSION') &&
      foundationEvidence.includes('FUTURE_MOBILE_RUNTIME_EVIDENCE_TYPES'),
  };
}

/** Leaf-validator workspace signals — no snapshot, brain, emulator, or runtime launch. */
export function buildMobileRuntimeWorkspaceSignalsForValidation(
  overrides: Partial<MobileRuntimeWorkspaceSignals> = {},
): MobileRuntimeWorkspaceSignals {
  return {
    deviceFramePreviewActive: false,
    touchSimulationEvidence: false,
    mobilePreviewLaunchEvidence: false,
    androidRuntimeLaunchEvidence: false,
    iosRuntimeLaunchEvidence: false,
    expoRuntimeLaunchEvidence: false,
    cloudDeviceSessionEvidence: false,
    testflightRuntimeEvidence: false,
    executionConnected: false,
    ...overrides,
  };
}

export function analyzeDeviceFrameReality(input: AssessMobileRuntimeExperienceRealityInput) {
  const { workspace, moduleEvidence } = input;
  if (
    workspace.deviceFramePreviewActive &&
    workspace.mobilePreviewLaunchEvidence &&
    moduleEvidence.hasMobilePreviewRuntime
  ) {
    return 'DEVICE_FRAME_PROVEN' as const;
  }
  if (
    moduleEvidence.hasMobilePreviewRuntime &&
    moduleEvidence.mobilePreviewPolicyMetadata &&
    moduleEvidence.hasLivePreviewGatekeeper
  ) {
    return 'DEVICE_FRAME_PARTIAL' as const;
  }
  return 'DEVICE_FRAME_MISSING' as const;
}

export function analyzeMobileSimulationReality(input: AssessMobileRuntimeExperienceRealityInput) {
  const { workspace, moduleEvidence } = input;
  if (workspace.touchSimulationEvidence && workspace.mobilePreviewLaunchEvidence) {
    return 'SIMULATION_PROVEN' as const;
  }
  const partialSignals = [
    moduleEvidence.hasFounderInteractionSimulation,
    moduleEvidence.hasVisualQaMobileAnalyzer,
    moduleEvidence.hasFounderRealityUi,
  ].filter(Boolean).length;
  if (partialSignals >= 2 || workspace.touchSimulationEvidence) {
    return 'SIMULATION_PARTIAL' as const;
  }
  return 'SIMULATION_MISSING' as const;
}

export function analyzeAndroidRuntimeReality(input: AssessMobileRuntimeExperienceRealityInput) {
  const { workspace } = input;
  if (workspace.androidRuntimeLaunchEvidence) return 'ANDROID_RUNTIME_PROVEN' as const;
  if (input.moduleEvidence.mobileExtensionPointsReserved) return 'ANDROID_RUNTIME_PARTIAL' as const;
  return 'ANDROID_RUNTIME_MISSING' as const;
}

export function analyzeIosRuntimeReality(input: AssessMobileRuntimeExperienceRealityInput) {
  const { workspace } = input;
  if (workspace.iosRuntimeLaunchEvidence) return 'IOS_RUNTIME_PROVEN' as const;
  if (input.moduleEvidence.mobileExtensionPointsReserved) return 'IOS_RUNTIME_PARTIAL' as const;
  return 'IOS_RUNTIME_MISSING' as const;
}

export function analyzeExpoRuntimeReality(input: AssessMobileRuntimeExperienceRealityInput) {
  const { workspace } = input;
  if (workspace.expoRuntimeLaunchEvidence) return 'EXPO_RUNTIME_PROVEN' as const;
  if (input.moduleEvidence.mobileExtensionPointsReserved) return 'EXPO_RUNTIME_PARTIAL' as const;
  return 'EXPO_RUNTIME_MISSING' as const;
}

export function analyzeCloudDeviceRuntimeReality(input: AssessMobileRuntimeExperienceRealityInput) {
  const { workspace, moduleEvidence } = input;
  if (workspace.cloudDeviceSessionEvidence) return 'CLOUD_RUNTIME_PROVEN' as const;
  if (moduleEvidence.hasMobilePreviewRuntime && readBounded(input.rootDir, 'src/mobile-preview-runtime/mobile-preview-cloud-bridge.ts', 8_000).includes('cloud')) {
    return 'CLOUD_RUNTIME_PARTIAL' as const;
  }
  return 'CLOUD_RUNTIME_MISSING' as const;
}

export function analyzeMobileExperienceCompleteness(input: AssessMobileRuntimeExperienceRealityInput) {
  const deviceFrame = analyzeDeviceFrameReality(input);
  const simulation = analyzeMobileSimulationReality(input);
  const android = analyzeAndroidRuntimeReality(input);
  const ios = analyzeIosRuntimeReality(input);
  const expo = analyzeExpoRuntimeReality(input);
  const cloud = analyzeCloudDeviceRuntimeReality(input);

  if (
    deviceFrame === 'DEVICE_FRAME_PROVEN' &&
    simulation === 'SIMULATION_PROVEN' &&
    (android === 'ANDROID_RUNTIME_PROVEN' || ios === 'IOS_RUNTIME_PROVEN' || expo === 'EXPO_RUNTIME_PROVEN')
  ) {
    return 'MOBILE_EXPERIENCE_PROVEN' as const;
  }
  const partialCount = [deviceFrame, simulation, android, ios, expo, cloud].filter(
    (l) => l.includes('PARTIAL') || l.includes('PROVEN'),
  ).length;
  if (partialCount >= 2) return 'MOBILE_EXPERIENCE_PARTIAL' as const;
  return 'MOBILE_EXPERIENCE_MISSING' as const;
}

export function runAllMobileRuntimeAnalyzers(
  input: AssessMobileRuntimeExperienceRealityInput,
): MobileRuntimeAnalyzerResults {
  const deviceFrameReality = analyzeDeviceFrameReality(input);
  const mobileSimulationReality = analyzeMobileSimulationReality(input);
  const androidRuntimeReality = analyzeAndroidRuntimeReality(input);
  const iosRuntimeReality = analyzeIosRuntimeReality(input);
  const expoRuntimeReality = analyzeExpoRuntimeReality(input);
  const cloudRuntimeReality = analyzeCloudDeviceRuntimeReality(input);
  const mobileExperienceCompleteness = analyzeMobileExperienceCompleteness(input);

  return {
    deviceFrameReality,
    mobileSimulationReality,
    androidRuntimeReality,
    iosRuntimeReality,
    expoRuntimeReality,
    cloudRuntimeReality,
    mobileExperienceCompleteness,
  };
}

export function collectMobileRuntimeEvidence(
  input: AssessMobileRuntimeExperienceRealityInput,
): MobileRuntimeEvidence[] {
  const evidence: MobileRuntimeEvidence[] = [];
  let counter = 0;
  const push = (
    area: MobileRuntimeEvidence['area'],
    level: MobileRuntimeEvidence['level'],
    description: string,
    source: string,
  ) => {
    counter += 1;
    evidence.push({ id: `mobile-runtime-evidence-${counter}`, area, level, description, source });
  };

  const { moduleEvidence, workspace } = input;

  if (moduleEvidence.hasMobilePreviewRuntime) {
    push(
      'DEVICE_FRAME_PREVIEW',
      'OBSERVED',
      'Mobile preview runtime foundation module exists — metadata/policy integration points only',
      'src/mobile-preview-runtime',
    );
  }
  if (moduleEvidence.hasVisualQaMobileAnalyzer) {
    push(
      'MOBILE_SIMULATION',
      'OBSERVED',
      'Mobile visual analyzer evaluates responsive layout signals — not device runtime proof',
      'mobile-visual-analyzer',
    );
  }
  if (moduleEvidence.mobileExtensionPointsReserved) {
    push(
      'ANDROID_RUNTIME',
      'CLAIMED',
      'Future Android/iOS/Expo build session extension points reserved — not runtime execution',
      'controlled-builder-execution-engine',
    );
  }
  if (workspace.androidRuntimeLaunchEvidence) {
    push('ANDROID_RUNTIME', 'PROVEN', 'Android runtime launch evidence collected', 'workspace.androidRuntime');
  }
  if (workspace.iosRuntimeLaunchEvidence) {
    push('IOS_RUNTIME', 'PROVEN', 'iOS runtime launch evidence collected', 'workspace.iosRuntime');
  }
  if (workspace.expoRuntimeLaunchEvidence) {
    push('EXPO_RUNTIME', 'PROVEN', 'Expo runtime launch evidence collected', 'workspace.expoRuntime');
  }
  if (workspace.cloudDeviceSessionEvidence) {
    push('CLOUD_DEVICE_RUNTIME', 'PROVEN', 'Cloud device runtime session evidence collected', 'workspace.cloudDevice');
  }
  if (workspace.testflightRuntimeEvidence) {
    push('TESTFLIGHT_RUNTIME', 'PROVEN', 'TestFlight-style runtime evidence collected', 'workspace.testflight');
  }
  if (workspace.mobilePreviewLaunchEvidence) {
    push(
      'DEVICE_FRAME_PREVIEW',
      'PROVEN',
      'Mobile preview launch evidence collected',
      'workspace.mobilePreviewLaunch',
    );
  }

  push(
    'MOBILE_SIMULATION',
    'CLAIMED',
    'Phone image / responsive CSS / nav toggle alone are never proof of mobile runtime experience',
    'mobile-runtime-experience-reality-bounds',
  );

  return evidence.slice(0, 24);
}

export function getMobileRuntimeBoundedScanPaths(): readonly string[] {
  return BOUNDED_SCAN_PATHS;
}
