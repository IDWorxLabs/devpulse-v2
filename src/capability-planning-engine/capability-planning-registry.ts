/**
 * Capability Planning Engine Era 3 — permanent capability universe registry.
 */

import type { CapabilityRecord, CapabilityStatus, RiskLevel } from './capability-planning-types.js';

const CAPABILITY_UNIVERSE: CapabilityRecord[] = [
  cap('cap-crud', 'CRUD Operations', 'VALIDATED', 'universal-prompt-to-app-materialization', 'src/features', ['FUNCTIONAL', 'DATA_MODEL'], ['CUSTOM_APPLICATION', 'EXPENSE_TRACKER', 'CRM'], ['WEB', 'RESPONSIVE'], [], 0.95, 'LOW'),
  cap('cap-auth', 'Authentication', 'VALIDATED', 'features/auth', 'src/features/auth', ['AUTHENTICATION', 'SECURITY'], ['*'], ['WEB'], [], 0.92, 'MEDIUM'),
  cap('cap-reporting', 'Reporting Dashboard', 'VALIDATED', 'universal-app-blueprint', 'src/blueprint', ['FUNCTIONAL', 'UI'], ['EXPENSE_TRACKER', 'DASHBOARD'], ['WEB'], ['cap-crud'], 0.88, 'LOW'),
  cap('cap-local-storage', 'Local Storage Persistence', 'VALIDATED', 'universal-prompt-to-app-materialization', 'src/data', ['STORAGE', 'OFFLINE_BEHAVIOR'], ['*'], ['WEB', 'OFFLINE'], [], 0.9, 'LOW'),
  cap('cap-blink-input', 'Blink Communication Input', 'AVAILABLE_WITH_LIMITATIONS', 'blink-input-engine', 'src/features/blink-input-engine', ['INTERACTION', 'ACCESSIBILITY'], ['ASSISTIVE_COMMUNICATION'], ['WEB', 'PHONE_FIRST'], ['cap-eye-tracking'], 0.82, 'MEDIUM'),
  cap('cap-eye-tracking', 'Eye Tracking Board', 'VALIDATED', 'eye-tracking-board', 'src/features/eye-tracking-board', ['INTERACTION', 'ACCESSIBILITY'], ['ASSISTIVE_COMMUNICATION'], ['WEB', 'PHONE_FIRST'], [], 0.9, 'MEDIUM'),
  cap('cap-tts', 'Speech Output', 'VALIDATED', 'text-to-speech', 'src/features/text-to-speech', ['INTERACTION', 'FUNCTIONAL'], ['ASSISTIVE_COMMUNICATION'], ['WEB'], [], 0.93, 'LOW'),
  cap('cap-emergency-speech', 'Emergency Phrase Workflow', 'COMPOSED', 'emergency-speech', 'src/features/emergency-speech', ['FUNCTIONAL', 'USER_WORKFLOW'], ['ASSISTIVE_COMMUNICATION'], ['WEB', 'PHONE_FIRST'], ['cap-tts', 'cap-quick-phrases'], 0.85, 'MEDIUM'),
  cap('cap-quick-phrases', 'Quick Phrases', 'VALIDATED', 'quick-phrases', 'src/features/quick-phrases', ['FUNCTIONAL'], ['ASSISTIVE_COMMUNICATION'], ['WEB'], [], 0.9, 'LOW'),
  cap('cap-message-history', 'Message History', 'VALIDATED', 'communication-history', 'src/features/communication-history', ['STORAGE', 'USER_WORKFLOW'], ['ASSISTIVE_COMMUNICATION', 'CRM'], ['WEB'], ['cap-local-storage'], 0.91, 'LOW'),
  cap('cap-a11y-settings', 'Accessibility Settings', 'VALIDATED', 'accessibility-settings', 'src/features/accessibility-settings', ['ACCESSIBILITY'], ['ASSISTIVE_COMMUNICATION'], ['WEB'], [], 0.94, 'LOW'),
  cap('cap-a11y-interaction', 'Accessibility-First Interaction', 'VALIDATED', 'accessibility-understanding', 'src/intent-understanding-engine', ['ACCESSIBILITY', 'INTERACTION'], ['ASSISTIVE_COMMUNICATION'], ['WEB', 'PHONE_FIRST'], ['cap-a11y-settings'], 0.92, 'LOW'),
  cap('cap-large-touch', 'Large Touch Targets', 'VALIDATED', 'universal-app-blueprint-visual', 'src/universal-app-blueprint-visual', ['ACCESSIBILITY', 'UI'], ['ASSISTIVE_COMMUNICATION'], ['WEB', 'PHONE_FIRST'], ['cap-a11y-interaction'], 0.89, 'LOW'),
  cap('cap-keyboard-nav', 'Keyboard Navigation', 'VALIDATED', 'universal-app-blueprint', 'src/blueprint', ['ACCESSIBILITY', 'NAVIGATION'], ['*'], ['WEB'], [], 0.87, 'LOW'),
  cap('cap-caregiver-workflow', 'Caregiver Communication Workflow', 'VALIDATED', 'caregiver-dashboard', 'src/features/caregiver-dashboard', ['USER_WORKFLOW'], ['ASSISTIVE_COMMUNICATION'], ['WEB'], ['cap-message-history'], 0.88, 'LOW'),
  cap('cap-settings-persist', 'Settings Persistence', 'VALIDATED', 'accessibility-settings', 'src/features/accessibility-settings', ['STORAGE'], ['*'], ['WEB'], ['cap-local-storage'], 0.86, 'LOW'),
  // Synchronization Engine family — domain-neutral, backed by universal-synchronization-pack.
  // Exact names match prompt-capability-mapper chains so Capability Planning REUSE_EXISTING.
  cap('cap-sync-engine', 'Synchronization Engine', 'VALIDATED', 'universal-synchronization-pack', 'src/universal-capability-packs/universal-synchronization-pack', ['SYNCHRONIZATION', 'OFFLINE_BEHAVIOR'], ['*'], ['OFFLINE', 'WEB'], ['cap-local-storage'], 0.94, 'LOW'),
  cap('cap-conflict-resolution', 'Conflict Resolution', 'VALIDATED', 'universal-synchronization-pack', 'src/universal-capability-packs/universal-synchronization-pack', ['SYNCHRONIZATION'], ['*'], ['OFFLINE', 'WEB'], ['cap-sync-engine'], 0.93, 'LOW'),
  cap('cap-retry-queue', 'Retry Queue', 'VALIDATED', 'universal-synchronization-pack', 'src/universal-capability-packs/universal-synchronization-pack', ['SYNCHRONIZATION'], ['*'], ['OFFLINE', 'WEB'], ['cap-sync-engine'], 0.93, 'LOW'),
  cap('cap-offline-persistence', 'Offline Persistence', 'VALIDATED', 'universal-synchronization-pack', 'src/universal-capability-packs/universal-synchronization-pack', ['OFFLINE_BEHAVIOR', 'STORAGE'], ['*'], ['OFFLINE', 'WEB'], ['cap-local-storage', 'cap-sync-engine'], 0.92, 'LOW'),
  cap('cap-cloud-sync', 'Cloud Synchronization', 'VALIDATED', 'universal-synchronization-pack', 'src/universal-capability-packs/universal-synchronization-pack', ['SYNCHRONIZATION'], ['*'], ['WEB'], ['cap-sync-engine'], 0.9, 'LOW'),
  cap('cap-offline-sync', 'Offline Sync', 'VALIDATED', 'universal-synchronization-pack', 'src/universal-capability-packs/universal-synchronization-pack', ['OFFLINE_BEHAVIOR', 'SYNCHRONIZATION'], ['*'], ['OFFLINE', 'WEB'], ['cap-local-storage', 'cap-sync-engine'], 0.92, 'LOW'),
  cap('cap-local-storage-alias', 'Local Storage', 'VALIDATED', 'universal-prompt-to-app-materialization', 'src/data', ['STORAGE', 'OFFLINE_BEHAVIOR'], ['*'], ['WEB', 'OFFLINE'], [], 0.9, 'LOW'),
  cap('cap-csv-export', 'CSV Export', 'VALIDATED', 'universal-data-export-pack-basic', 'src/universal-capability-packs/universal-data-export-pack-basic', ['API', 'IMPORT_EXPORT'], ['*'], ['WEB'], ['cap-crud'], 0.92, 'LOW'),
  cap('cap-payment-processing', 'Payment Processing', 'REQUIRES_HUMAN_REVIEW', 'external', 'n/a', ['SECURITY', 'FUNCTIONAL'], ['FINANCE'], ['WEB'], [], 0.3, 'HIGH'),
];

const dynamicRegistry = new Map<string, CapabilityRecord>();

function cap(
  capabilityId: string,
  name: string,
  status: CapabilityStatus,
  source: string,
  sourceModule: string,
  categories: string[],
  domains: string[],
  platforms: string[],
  dependencies: string[],
  reuseConfidence: number,
  riskLevel: RiskLevel,
): CapabilityRecord {
  return {
    readOnly: true,
    capabilityId,
    name,
    version: '1.0.0',
    status,
    source,
    ownerModule: source,
    supportedRequirementCategories: categories,
    supportedProductDomains: domains,
    supportedPlatforms: platforms,
    dependencies,
    interfaces: [`${capabilityId}-api`],
    validationCoverage: status === 'VALIDATED' ? ['STATIC', 'INTEGRATION', 'BEHAVIOR'] : ['STATIC'],
    riskLevel,
    reuseConfidence,
    lastValidationStatus: status === 'VALIDATED' ? 'PASS' : status === 'REQUIRES_HUMAN_REVIEW' ? 'HUMAN_REVIEW' : 'PARTIAL',
    description: `${name} capability`,
    sourceModule,
  };
}

export function resetCapabilityPlanningRegistryForTests(): void {
  dynamicRegistry.clear();
}

export function listCapabilityUniverse(): readonly CapabilityRecord[] {
  return [...CAPABILITY_UNIVERSE, ...dynamicRegistry.values()];
}

export function getCapabilityRecord(capabilityId: string): CapabilityRecord | null {
  return listCapabilityUniverse().find((c) => c.capabilityId === capabilityId) ?? null;
}

export function registerCapabilityRecord(record: CapabilityRecord): void {
  dynamicRegistry.set(record.capabilityId, record);
}

export function searchCapabilityUniverse(query: string): CapabilityRecord[] {
  const lower = query.toLowerCase();
  return listCapabilityUniverse().filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.capabilityId.includes(lower) ||
      c.description.toLowerCase().includes(lower) ||
      c.supportedRequirementCategories.some((cat) => lower.includes(cat.toLowerCase())),
  );
}
