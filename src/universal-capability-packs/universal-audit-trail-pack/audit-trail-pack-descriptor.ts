/**
 * Universal Audit Trail Pack — descriptor.
 */

import type { CapabilityPackDescriptor } from '../../universal-capability-pack-framework/universal-capability-pack-types.js';

export const UNIVERSAL_AUDIT_TRAIL_PACK_DESCRIPTOR: CapabilityPackDescriptor = {
  packId: 'universal-audit-trail-pack',
  packName: 'Universal Audit Trail Pack',
  packVersion: '1.0.0',
  engineCompatibility: '>=1.0.0',
  category: 'OBSERVABILITY',
  description: 'Generic immutable activity entries for approved mutations, actions, workflows, and relationships',
  providedCapabilities: ['audit.record-event', 'audit.query-events', 'audit.target-history', 'audit.activity-trail', 'audit.runtime-history-projection'],
  requiredCapabilities: [],
  requiredPacks: [],
  optionalPacks: [],
  incompatiblePacks: [],
  requiredB1Features: ['entity-persistence'],
  requiredB2Features: ['action-events'],
  requiredB3Features: ['workflow-transitions'],
  requiredB4Features: ['relationship-mutations'],
  requiredB5Features: ['runtime-events'],
  requiredB6Features: [],
  configurationSchema: {
    fields: [
      { name: 'redactedFields', type: 'string[]', required: false, defaultValue: ['password', 'secret', 'token'] },
      { name: 'maxEntries', type: 'number', required: false, defaultValue: 1000 },
    ],
  },
  defaultConfiguration: {
    redactedFields: ['password', 'secret', 'token'],
    maxEntries: 1000,
  },
  generatedArtifacts: ['src/universal-capability-packs/audit-trail/audit-trail-runtime.ts'],
  runtimeScopes: ['capability-audit-trail'],
  actions: ['audit.query', 'audit.clear-filters'],
  supportStatus: 'FUNCTIONAL_REFERENCE',
  productionReadiness: true,
  securityClassification: { networkRequired: false, secretAccessRequired: false, filesystemRequired: false },
  provenance: ['UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1.reference-pack'],
};
