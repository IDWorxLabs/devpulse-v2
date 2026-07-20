/**
 * Universal Scheduling Pack — descriptor.
 */

import type { CapabilityPackDescriptor } from '../../universal-capability-pack-framework/universal-capability-pack-types.js';

export const UNIVERSAL_SCHEDULING_PACK_DESCRIPTOR: CapabilityPackDescriptor = {
  packId: 'universal-scheduling-pack',
  packName: 'Universal Scheduling Pack',
  packVersion: '1.0.0',
  engineCompatibility: '>=1.0.0',
  category: 'SCHEDULING',
  description:
    'Generic domain-neutral time-window availability: computes free bookable slots from approved availability windows minus reserved intervals, with B1 persistence, B6 validation, B5 runtime, and B2 reserve/release actions',
  providedCapabilities: ['scheduling.availability', 'scheduling.slot-selection'],
  requiredCapabilities: [],
  requiredPacks: [],
  optionalPacks: [],
  incompatiblePacks: [],
  requiredB1Features: ['entity-persistence'],
  requiredB2Features: ['reserve-action'],
  requiredB3Features: [],
  requiredB4Features: [],
  requiredB5Features: ['runtime-sync'],
  requiredB6Features: ['validation'],
  configurationSchema: {
    fields: [
      { name: 'slotDurationMinutes', type: 'number', required: true, defaultValue: 30 },
      { name: 'granularityMinutes', type: 'number', required: false, defaultValue: 15 },
      { name: 'windowStartMinutes', type: 'number', required: false, defaultValue: 540 },
      { name: 'windowEndMinutes', type: 'number', required: false, defaultValue: 1020 },
    ],
  },
  defaultConfiguration: {
    slotDurationMinutes: 30,
    granularityMinutes: 15,
    windowStartMinutes: 540,
    windowEndMinutes: 1020,
  },
  generatedArtifacts: ['src/universal-capability-packs/scheduling/scheduling-runtime.ts'],
  runtimeScopes: ['capability-scheduling'],
  actions: ['scheduling.reserve', 'scheduling.release'],
  supportStatus: 'PRODUCTION_READY',
  productionReadiness: true,
  securityClassification: { networkRequired: false, secretAccessRequired: false, filesystemRequired: false },
  provenance: ['UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1.reference-pack'],
};
