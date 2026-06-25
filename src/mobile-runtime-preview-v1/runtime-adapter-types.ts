/**
 * Mobile Runtime Preview V1 — runtime adapter interface.
 */

import type {
  MobileRuntimeAdapterStatus,
  MobileRuntimeCapabilityMatrix,
  MobileRuntimeKind,
  MobileRuntimeLaunchInput,
  MobileRuntimeLaunchResult,
  MobileRuntimeVerificationResult,
} from './mobile-runtime-preview-types.js';

export interface MobileRuntimeAdapter {
  readonly runtimeId: MobileRuntimeKind;
  getStatus(capabilities: MobileRuntimeCapabilityMatrix): MobileRuntimeAdapterStatus;
  launch(input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeLaunchResult>;
  verify(input: MobileRuntimeLaunchInput, capabilities: MobileRuntimeCapabilityMatrix): Promise<MobileRuntimeVerificationResult>;
  shutdown(): Promise<void>;
}

export interface MobileRuntimeAdapterRegistry {
  adapters: MobileRuntimeAdapter[];
  getAdapter(runtimeId: MobileRuntimeKind): MobileRuntimeAdapter | undefined;
  getAllStatuses(capabilities: MobileRuntimeCapabilityMatrix): MobileRuntimeAdapterStatus[];
}
