/**
 * Contract-to-Module Traceability Authority V1 — infrastructure module registry.
 */

import { CBGA_SYSTEM_SHELL_MODULE_IDS } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { ModuleAncestryOutcome } from './contract-to-module-traceability-types.js';

export interface InfrastructureModuleDescriptor {
  readonly infrastructureModuleType: string;
  readonly ownerAuthority: string;
  readonly allowedPurpose: string;
  readonly productionSupportStatus: 'PRODUCTION_READY' | 'FUNCTIONAL_REFERENCE';
  readonly fingerprint: string;
}

/** Product-facing shell names must never receive implicit infrastructure approval. */
const DISALLOWED_IMPLICIT_INFRASTRUCTURE = new Set(['dashboard']);

export const INFRASTRUCTURE_MODULE_REGISTRY: InfrastructureModuleDescriptor[] = [
  {
    infrastructureModuleType: 'APPLICATION_SHELL',
    ownerAuthority: 'UNIVERSAL_APP_BLUEPRINT',
    allowedPurpose: 'routing shell and layout host',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-app-shell',
  },
  {
    infrastructureModuleType: 'RUNTIME_BOOTSTRAP',
    ownerAuthority: 'UNIVERSAL_APP_MATERIALIZATION',
    allowedPurpose: 'runtime bootstrap and index',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-runtime-bootstrap',
  },
  {
    infrastructureModuleType: 'PERSISTENCE_ADAPTER',
    ownerAuthority: 'MODULAR_FEATURE_MATERIALIZATION',
    allowedPurpose: 'local persistence adapter',
    productionSupportStatus: 'PRODUCTION_READY',
    fingerprint: 'infra-persistence',
  },
];

export function resolveInfrastructureModuleAncestry(moduleId: string): ModuleAncestryOutcome | null {
  if (DISALLOWED_IMPLICIT_INFRASTRUCTURE.has(moduleId)) return null;
  if (CBGA_SYSTEM_SHELL_MODULE_IDS.includes(moduleId)) return 'APPROVED_INFRASTRUCTURE_MODULE';
  return null;
}

export function isRegisteredInfrastructureModule(moduleId: string): boolean {
  return resolveInfrastructureModuleAncestry(moduleId) === 'APPROVED_INFRASTRUCTURE_MODULE';
}
