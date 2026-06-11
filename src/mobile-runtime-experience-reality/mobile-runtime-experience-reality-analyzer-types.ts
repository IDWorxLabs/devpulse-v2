/**
 * Mobile Runtime Experience Reality — analyzer level types.
 */

export type DeviceFrameRealityLevel =
  | 'DEVICE_FRAME_PROVEN'
  | 'DEVICE_FRAME_PARTIAL'
  | 'DEVICE_FRAME_MISSING';

export type MobileSimulationRealityLevel =
  | 'SIMULATION_PROVEN'
  | 'SIMULATION_PARTIAL'
  | 'SIMULATION_MISSING';

export type AndroidRuntimeRealityLevel =
  | 'ANDROID_RUNTIME_PROVEN'
  | 'ANDROID_RUNTIME_PARTIAL'
  | 'ANDROID_RUNTIME_MISSING';

export type IosRuntimeRealityLevel =
  | 'IOS_RUNTIME_PROVEN'
  | 'IOS_RUNTIME_PARTIAL'
  | 'IOS_RUNTIME_MISSING';

export type ExpoRuntimeRealityLevel =
  | 'EXPO_RUNTIME_PROVEN'
  | 'EXPO_RUNTIME_PARTIAL'
  | 'EXPO_RUNTIME_MISSING';

export type CloudRuntimeRealityLevel =
  | 'CLOUD_RUNTIME_PROVEN'
  | 'CLOUD_RUNTIME_PARTIAL'
  | 'CLOUD_RUNTIME_MISSING';

export type MobileExperienceCompletenessLevel =
  | 'MOBILE_EXPERIENCE_PROVEN'
  | 'MOBILE_EXPERIENCE_PARTIAL'
  | 'MOBILE_EXPERIENCE_MISSING';

export type MobileRuntimeAreaId =
  | 'DEVICE_FRAME_PREVIEW'
  | 'MOBILE_SIMULATION'
  | 'ANDROID_RUNTIME'
  | 'IOS_RUNTIME'
  | 'EXPO_RUNTIME'
  | 'CLOUD_DEVICE_RUNTIME'
  | 'TESTFLIGHT_RUNTIME';
