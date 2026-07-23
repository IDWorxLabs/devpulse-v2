/**
 * Contract-to-Module Traceability Authority V1 — infrastructure module registry.
 *
 * Exact module-id classification only. Compound domain modules (e.g. data-retention-policies,
 * storage-capacity-planning) must never be treated as infrastructure merely because they share
 * lexical stems with shell names like "persistence" or "storage".
 */

import { CBGA_SYSTEM_SHELL_MODULE_IDS } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { ModuleAncestryOutcome } from './contract-to-module-traceability-types.js';

export interface InfrastructureModuleDescriptor {
  readonly infrastructureModuleType: string;
  readonly ownerAuthority: string;
  readonly allowedPurpose: string;
  readonly productionSupportStatus: 'PRODUCTION_READY' | 'FUNCTIONAL_REFERENCE';
  readonly fingerprint: string;
  /** Exact module ids that belong to this infrastructure type — never substring-matched. */
  readonly moduleIds: readonly string[];
}

/** Product-facing shell names must never receive implicit infrastructure approval. */
const DISALLOWED_IMPLICIT_INFRASTRUCTURE = new Set(['dashboard']);

/**
 * Authoritative exact-id registry of infrastructure / system-shell capabilities.
 * These may appear as runtime support, but must never populate product `featureModules`.
 */
export const INFRASTRUCTURE_MODULE_REGISTRY: InfrastructureModuleDescriptor[] = [
  {
    infrastructureModuleType: 'APPLICATION_SHELL',
    ownerAuthority: 'UNIVERSAL_APP_BLUEPRINT',
    allowedPurpose: 'routing shell and layout host',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-app-shell',
    moduleIds: ['navigation-router', 'filter-ui'],
  },
  {
    infrastructureModuleType: 'RUNTIME_BOOTSTRAP',
    ownerAuthority: 'UNIVERSAL_APP_MATERIALIZATION',
    allowedPurpose: 'runtime bootstrap and index',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-runtime-bootstrap',
    moduleIds: ['runtime-bootstrap', 'preview-scaffolding'],
  },
  {
    infrastructureModuleType: 'PERSISTENCE_ADAPTER',
    ownerAuthority: 'MODULAR_FEATURE_MATERIALIZATION',
    allowedPurpose: 'local persistence adapter',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-persistence',
    moduleIds: ['persistence'],
  },
  {
    infrastructureModuleType: 'TRANSPORT_ADAPTER',
    ownerAuthority: 'UNIVERSAL_APP_MATERIALIZATION',
    allowedPurpose: 'transport / network plumbing',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-transport',
    moduleIds: ['transport-adapter'],
  },
  {
    infrastructureModuleType: 'AUTH_PLUMBING',
    ownerAuthority: 'UNIVERSAL_APP_BLUEPRINT',
    allowedPurpose: 'authentication plumbing shell',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-auth',
    moduleIds: ['auth'],
  },
  {
    infrastructureModuleType: 'SETTINGS_SHELL',
    ownerAuthority: 'UNIVERSAL_APP_BLUEPRINT',
    allowedPurpose: 'generic settings shell',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-settings',
    moduleIds: ['settings'],
  },
];

/** Exact ids from CBGA system shells + registry descriptors (deduped). */
export const INFRASTRUCTURE_SHELL_MODULE_IDS: readonly string[] = Object.freeze(
  [
    ...new Set<string>([
      ...CBGA_SYSTEM_SHELL_MODULE_IDS,
      ...INFRASTRUCTURE_MODULE_REGISTRY.flatMap((entry) => entry.moduleIds),
    ]),
  ],
);

const INFRASTRUCTURE_SHELL_ID_SET = new Set<string>(INFRASTRUCTURE_SHELL_MODULE_IDS);

/**
 * Exact-id infrastructure shell check. Never uses substring / stem matching so that
 * domain modules like `data-retention-policies` or `storage-capacity-planning` remain product features.
 */
export function isInfrastructureShellModuleId(moduleId: string): boolean {
  const id = moduleId.trim().toLowerCase();
  if (!id) return false;
  // dashboard is only infrastructure when it is an exact CBGA/system-shell id (already in the set).
  return INFRASTRUCTURE_SHELL_ID_SET.has(id);
}

export function resolveInfrastructureModuleAncestry(moduleId: string): ModuleAncestryOutcome | null {
  if (!isInfrastructureShellModuleId(moduleId)) return null;
  // Preserve prior policy: bare "dashboard" as product name is never silently approved as infra
  // unless it is already an exact CBGA system-shell id (which it is when listed).
  if (DISALLOWED_IMPLICIT_INFRASTRUCTURE.has(moduleId) && !CBGA_SYSTEM_SHELL_MODULE_IDS.includes(moduleId)) {
    return null;
  }
  return 'APPROVED_INFRASTRUCTURE_MODULE';
}

export function isRegisteredInfrastructureModule(moduleId: string): boolean {
  return resolveInfrastructureModuleAncestry(moduleId) === 'APPROVED_INFRASTRUCTURE_MODULE';
}

export interface ProductInfrastructurePartition {
  readonly productFeatureModules: string[];
  readonly infrastructureModules: string[];
}

/**
 * Split a mixed module-id list into user/domain-facing product features vs infrastructure shells.
 * Preserves input order within each partition; exact-id classification only.
 */
export function partitionProductAndInfrastructureModules(
  moduleIds: readonly string[],
): ProductInfrastructurePartition {
  const productFeatureModules: string[] = [];
  const infrastructureModules: string[] = [];
  const seenProduct = new Set<string>();
  const seenInfra = new Set<string>();

  for (const raw of moduleIds) {
    const moduleId = raw.trim();
    if (!moduleId) continue;
    if (isInfrastructureShellModuleId(moduleId)) {
      if (!seenInfra.has(moduleId)) {
        seenInfra.add(moduleId);
        infrastructureModules.push(moduleId);
      }
      continue;
    }
    if (!seenProduct.has(moduleId)) {
      seenProduct.add(moduleId);
      productFeatureModules.push(moduleId);
    }
  }

  return { productFeatureModules, infrastructureModules };
}
