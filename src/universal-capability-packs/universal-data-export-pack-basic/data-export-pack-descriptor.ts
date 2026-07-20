/**
 * Universal Data Export Pack — Basic descriptor.
 */

import type { CapabilityPackDescriptor } from '../../universal-capability-pack-framework/universal-capability-pack-types.js';

export const UNIVERSAL_DATA_EXPORT_PACK_BASIC_DESCRIPTOR: CapabilityPackDescriptor = {
  packId: 'universal-data-export-pack-basic',
  packName: 'Universal Data Export Pack — Basic',
  packVersion: '1.0.0',
  engineCompatibility: '>=1.0.0',
  category: 'IMPORT_EXPORT',
  description: 'Generic JSON and CSV export for approved serializable entity collections — not the complete Import/Export Pack',
  providedCapabilities: ['export.json', 'export.csv', 'export.selected-records', 'export.filtered-collection'],
  requiredCapabilities: [],
  requiredPacks: [],
  optionalPacks: [],
  incompatiblePacks: [],
  requiredB1Features: ['entity-query'],
  requiredB2Features: ['export-action'],
  requiredB3Features: [],
  requiredB4Features: [],
  requiredB5Features: ['query-state'],
  requiredB6Features: ['field-inclusion-validation'],
  configurationSchema: {
    fields: [
      { name: 'approvedFields', type: 'string[]', required: true, defaultValue: ['id', 'label', 'createdAt', 'updatedAt'] },
      { name: 'filenameStem', type: 'string', required: false, defaultValue: 'export' },
      { name: 'emptyCollectionPolicy', type: 'string', required: false, defaultValue: 'RETURN_EMPTY' },
    ],
  },
  defaultConfiguration: {
    approvedFields: ['id', 'label', 'createdAt', 'updatedAt'],
    filenameStem: 'export',
    emptyCollectionPolicy: 'RETURN_EMPTY',
  },
  generatedArtifacts: ['src/universal-capability-packs/data-export-basic/data-export-runtime.ts'],
  runtimeScopes: ['capability-data-export'],
  actions: ['export.json', 'export.csv'],
  supportStatus: 'FUNCTIONAL_REFERENCE',
  productionReadiness: true,
  securityClassification: { networkRequired: false, secretAccessRequired: false, filesystemRequired: false },
  provenance: ['UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1.reference-pack'],
};
