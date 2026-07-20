/**
 * Universal Capability Pack Framework V1 — future pack catalog.
 *
 * Catalog identities are registered with truthful NOT_IMPLEMENTED status.
 * They must not emit fake runtime behavior or count toward behavioral coverage.
 */

import type { CapabilityPackDescriptor } from './universal-capability-pack-types.js';

function futurePack(partial: Pick<CapabilityPackDescriptor, 'packId' | 'packName' | 'category' | 'description' | 'providedCapabilities'>): CapabilityPackDescriptor {
  return {
    packId: partial.packId,
    packName: partial.packName,
    packVersion: '0.0.0',
    engineCompatibility: '>=1.0.0',
    category: partial.category,
    description: partial.description,
    providedCapabilities: partial.providedCapabilities,
    requiredCapabilities: [],
    requiredPacks: [],
    optionalPacks: [],
    incompatiblePacks: [],
    requiredB1Features: [],
    requiredB2Features: [],
    requiredB3Features: [],
    requiredB4Features: [],
    requiredB5Features: [],
    requiredB6Features: [],
    configurationSchema: { fields: [] },
    defaultConfiguration: {},
    generatedArtifacts: [],
    runtimeScopes: [],
    actions: [],
    supportStatus: 'NOT_IMPLEMENTED',
    productionReadiness: false,
    securityClassification: { networkRequired: false, secretAccessRequired: false, filesystemRequired: false },
    provenance: ['UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1.future-catalog'],
  };
}

export const FUTURE_CAPABILITY_PACK_CATALOG: readonly CapabilityPackDescriptor[] = [
  // universal-scheduling-pack is now a fully-implemented reference pack (see
  // src/universal-capability-packs/universal-scheduling-pack) providing scheduling.availability
  // and scheduling.slot-selection — it must not also appear here or bootstrapCapabilityPackRegistry
  // would register the same packId twice.
  futurePack({ packId: 'universal-reporting-pack', packName: 'Universal Reporting Pack', category: 'REPORTING', description: 'Future reporting and dashboard capability', providedCapabilities: ['reporting.metric', 'reporting.dashboard'] }),
  futurePack({ packId: 'universal-analytics-pack', packName: 'Universal Analytics Pack', category: 'ANALYTICS', description: 'Future analytics capability', providedCapabilities: ['analytics.aggregate'] }),
  futurePack({ packId: 'universal-authentication-pack', packName: 'Universal Authentication Pack', category: 'AUTHENTICATION', description: 'Future authentication capability', providedCapabilities: ['authentication.session'] }),
  futurePack({ packId: 'universal-authorization-pack', packName: 'Universal Authorization Pack', category: 'AUTHORIZATION', description: 'Future authorization capability', providedCapabilities: ['authorization.rbac'] }),
  futurePack({ packId: 'universal-notification-pack', packName: 'Universal Notification Pack', category: 'NOTIFICATION', description: 'Future notification delivery capability', providedCapabilities: ['notification.email', 'notification.push'] }),
  futurePack({ packId: 'universal-file-management-pack', packName: 'Universal File Management Pack', category: 'FILE_MANAGEMENT', description: 'Future file upload and storage capability', providedCapabilities: ['file.storage'] }),
  futurePack({ packId: 'universal-search-pack', packName: 'Universal Search Pack', category: 'SEARCH', description: 'Future full-text search capability', providedCapabilities: ['search.full-text-ranking'] }),
  futurePack({ packId: 'universal-import-export-pack', packName: 'Universal Import Export Pack', category: 'IMPORT_EXPORT', description: 'Future full import/export capability', providedCapabilities: ['import.csv', 'export.advanced-binary'] }),
  futurePack({ packId: 'universal-external-integration-pack', packName: 'Universal External Integration Pack', category: 'EXTERNAL_INTEGRATION', description: 'Future external API integration capability', providedCapabilities: ['integration.external-api'] }),
  futurePack({ packId: 'universal-background-processing-pack', packName: 'Universal Background Processing Pack', category: 'BACKGROUND_PROCESSING', description: 'Future background job capability', providedCapabilities: ['background.job'] }),
  futurePack({ packId: 'universal-realtime-pack', packName: 'Universal Realtime Pack', category: 'REALTIME', description: 'Future real-time synchronization capability', providedCapabilities: ['realtime.sync'] }),
  // offline.sync is provided by PRODUCTION_READY universal-synchronization-pack (reference packs).
  futurePack({ packId: 'universal-observability-pack', packName: 'Universal Observability Pack', category: 'OBSERVABILITY', description: 'Future observability service capability', providedCapabilities: ['observability.metrics'] }),
  futurePack({ packId: 'universal-accessibility-pack', packName: 'Universal Accessibility Pack', category: 'ACCESSIBILITY', description: 'Future accessibility automation capability', providedCapabilities: ['accessibility.automation'] }),
  futurePack({ packId: 'universal-internationalization-pack', packName: 'Universal Internationalization Pack', category: 'INTERNATIONALIZATION', description: 'Future i18n capability', providedCapabilities: ['i18n.translation'] }),
];
