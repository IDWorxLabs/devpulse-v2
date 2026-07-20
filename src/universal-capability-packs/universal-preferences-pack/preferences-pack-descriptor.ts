/**
 * Universal Preferences Pack — descriptor.
 */

import type { CapabilityPackDescriptor } from '../../universal-capability-pack-framework/universal-capability-pack-types.js';

export const UNIVERSAL_PREFERENCES_PACK_DESCRIPTOR: CapabilityPackDescriptor = {
  packId: 'universal-preferences-pack',
  packName: 'Universal Preferences Pack',
  packVersion: '1.0.0',
  engineCompatibility: '>=1.0.0',
  category: 'DATA',
  description: 'Generic persisted user-approved preferences with B1 persistence, B6 validation, B5 runtime, and B2 reset action',
  providedCapabilities: ['preferences.schema', 'preferences.read', 'preferences.update', 'preferences.reset', 'preferences.persisted-setting'],
  requiredCapabilities: [],
  requiredPacks: [],
  optionalPacks: [],
  incompatiblePacks: [],
  requiredB1Features: ['entity-persistence'],
  requiredB2Features: ['reset-action'],
  requiredB3Features: [],
  requiredB4Features: [],
  requiredB5Features: ['runtime-sync'],
  requiredB6Features: ['validation'],
  configurationSchema: {
    fields: [
      { name: 'namespace', type: 'string', required: true, defaultValue: 'app.preferences' },
      { name: 'allowedKeys', type: 'string[]', required: true, defaultValue: ['display.pageSize', 'display.sortDirection'] },
      { name: 'defaults', type: 'string[]', required: false, defaultValue: ['display.pageSize=10', 'display.sortDirection=asc'] },
    ],
  },
  defaultConfiguration: {
    namespace: 'app.preferences',
    allowedKeys: ['display.pageSize', 'display.sortDirection'],
    defaults: ['display.pageSize=10', 'display.sortDirection=asc'],
  },
  generatedArtifacts: ['src/universal-capability-packs/preferences/preferences-runtime.ts'],
  runtimeScopes: ['capability-preferences'],
  actions: ['preferences.reset', 'preferences.update'],
  supportStatus: 'FUNCTIONAL_REFERENCE',
  productionReadiness: true,
  securityClassification: { networkRequired: false, secretAccessRequired: false, filesystemRequired: false },
  provenance: ['UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1.reference-pack'],
};
