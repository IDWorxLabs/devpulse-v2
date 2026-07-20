/**
 * Universal Synchronization Pack — descriptor (domain-neutral Synchronization Engine).
 */

import type { CapabilityPackDescriptor } from '../../universal-capability-pack-framework/universal-capability-pack-types.js';

export const UNIVERSAL_SYNCHRONIZATION_PACK_DESCRIPTOR: CapabilityPackDescriptor = {
  packId: 'universal-synchronization-pack',
  packName: 'Universal Synchronization Pack',
  packVersion: '1.0.0',
  engineCompatibility: '>=1.0.0',
  category: 'OFFLINE',
  description:
    'Domain-neutral Synchronization Engine: offline-first local change queue, online/offline detection, versioned conflict detection, retry policies, incremental sync scheduling, and sync health diagnostics — composable into any application that requires synchronization',
  providedCapabilities: [
    'offline.sync',
    'sync.engine',
    'sync.conflict-resolution',
    'sync.retry-queue',
    'sync.health',
  ],
  requiredCapabilities: [],
  requiredPacks: [],
  optionalPacks: [],
  incompatiblePacks: [],
  requiredB1Features: ['entity-persistence'],
  requiredB2Features: [],
  requiredB3Features: [],
  requiredB4Features: [],
  requiredB5Features: ['runtime-sync'],
  requiredB6Features: ['validation'],
  configurationSchema: {
    fields: [
      { name: 'maxQueueSize', type: 'number', required: false, defaultValue: 500 },
      { name: 'retryBaseDelayMs', type: 'number', required: false, defaultValue: 1000 },
      { name: 'retryMaxAttempts', type: 'number', required: false, defaultValue: 5 },
      { name: 'conflictStrategy', type: 'string', required: false, defaultValue: 'last-write-wins' },
      { name: 'backgroundSyncIntervalMs', type: 'number', required: false, defaultValue: 15000 },
    ],
  },
  defaultConfiguration: {
    maxQueueSize: 500,
    retryBaseDelayMs: 1000,
    retryMaxAttempts: 5,
    conflictStrategy: 'last-write-wins',
    backgroundSyncIntervalMs: 15000,
  },
  generatedArtifacts: [
    'src/universal-capability-packs/synchronization/synchronization-runtime.ts',
    'src/universal-capability-packs/synchronization/synchronization-pack.json',
  ],
  runtimeScopes: ['capability-synchronization'],
  actions: ['sync.enqueue', 'sync.flush', 'sync.resolve-conflict', 'sync.diagnose'],
  supportStatus: 'PRODUCTION_READY',
  productionReadiness: true,
  securityClassification: { networkRequired: false, secretAccessRequired: false, filesystemRequired: false },
  provenance: ['UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1.reference-pack', 'SYNCHRONIZATION_ENGINE_V1'],
};
