/**
 * Reference capability packs — bootstrap registration list.
 */

export { UNIVERSAL_PREFERENCES_PACK_DESCRIPTOR, materializePreferencesPack } from './universal-preferences-pack/index.js';
export { UNIVERSAL_AUDIT_TRAIL_PACK_DESCRIPTOR, materializeAuditTrailPack } from './universal-audit-trail-pack/index.js';
export { UNIVERSAL_DATA_EXPORT_PACK_BASIC_DESCRIPTOR, materializeDataExportPackBasic } from './universal-data-export-pack-basic/index.js';
export { UNIVERSAL_SCHEDULING_PACK_DESCRIPTOR, materializeSchedulingPack } from './universal-scheduling-pack/index.js';
export {
  UNIVERSAL_SYNCHRONIZATION_PACK_DESCRIPTOR,
  materializeSynchronizationPack,
} from './universal-synchronization-pack/index.js';

import { UNIVERSAL_PREFERENCES_PACK_DESCRIPTOR } from './universal-preferences-pack/index.js';
import { UNIVERSAL_AUDIT_TRAIL_PACK_DESCRIPTOR } from './universal-audit-trail-pack/index.js';
import { UNIVERSAL_DATA_EXPORT_PACK_BASIC_DESCRIPTOR } from './universal-data-export-pack-basic/index.js';
import { UNIVERSAL_SCHEDULING_PACK_DESCRIPTOR } from './universal-scheduling-pack/index.js';
import { UNIVERSAL_SYNCHRONIZATION_PACK_DESCRIPTOR } from './universal-synchronization-pack/index.js';
import type { CapabilityPackDescriptor } from '../universal-capability-pack-framework/universal-capability-pack-types.js';

export const REFERENCE_CAPABILITY_PACK_DESCRIPTORS: readonly CapabilityPackDescriptor[] = [
  UNIVERSAL_PREFERENCES_PACK_DESCRIPTOR,
  UNIVERSAL_AUDIT_TRAIL_PACK_DESCRIPTOR,
  UNIVERSAL_DATA_EXPORT_PACK_BASIC_DESCRIPTOR,
  UNIVERSAL_SCHEDULING_PACK_DESCRIPTOR,
  UNIVERSAL_SYNCHRONIZATION_PACK_DESCRIPTOR,
];
