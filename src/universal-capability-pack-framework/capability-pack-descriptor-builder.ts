/**
 * Universal Capability Pack Framework V1 — pack descriptor builder (reference + catalog assembly).
 */

import { REFERENCE_CAPABILITY_PACK_DESCRIPTORS } from '../universal-capability-packs/index.js';
import { FUTURE_CAPABILITY_PACK_CATALOG } from './future-capability-pack-catalog.js';
import type { CapabilityPackDescriptor } from './universal-capability-pack-types.js';

export function buildAllPackDescriptors(): readonly CapabilityPackDescriptor[] {
  return [...REFERENCE_CAPABILITY_PACK_DESCRIPTORS, ...FUTURE_CAPABILITY_PACK_CATALOG];
}
