/**
 * Universal CRUD Generation Engine V1 — domain-agnostic types.
 *
 * Every entity is described structurally from ApprovedProductionBuildEnvelope handoffs —
 * never from hardcoded product domains.
 */

export const UNIVERSAL_CRUD_GENERATION_ENGINE_VERSION = '1.0.0' as const;

export const UNIVERSAL_CRUD_GENERATION_ENGINE_SOURCE = 'UNIVERSAL_CRUD_GENERATION_ENGINE_V1' as const;

export type CrudPersistenceProviderKind =
  | 'memory'
  | 'localStorage'
  | 'indexedDB'
  | 'sqlite'
  | 'remoteApi';

/** Base entity shape every generated module shares. */
export interface UniversalCrudEntityDescriptor {
  readonly entityId: string;
  readonly entityKey: string;
  readonly displayName: string;
  readonly contractId: string;
  readonly route: string;
  readonly persistenceProvider: CrudPersistenceProviderKind;
}

export interface UniversalCrudEntityGenerationInput {
  readonly descriptor: UniversalCrudEntityDescriptor;
  readonly appTitle: string;
  readonly promptTerms: readonly string[];
}

export interface UniversalCrudGeneratedArtifactPaths {
  readonly componentPath: string;
  readonly typesPath: string;
  readonly repositoryPath: string;
  readonly servicePath: string;
  readonly validationPath: string;
  readonly runtimeStatePath: string;
  readonly cssPath: string;
  readonly indexPath: string;
}

export interface UniversalCrudBehaviorVerificationResult {
  readonly readOnly: true;
  readonly entityId: string;
  readonly passed: boolean;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
}

export interface UniversalCrudGenerationReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_CRUD_GENERATION_ENGINE_VERSION;
  readonly entityCount: number;
  readonly sharedRuntimeFiles: readonly string[];
  readonly entities: readonly UniversalCrudEntityDescriptor[];
  readonly behaviorVerifications: readonly UniversalCrudBehaviorVerificationResult[];
  readonly allPassed: boolean;
}

/** Maps an approved module plan entry to a generic entity descriptor — no domain logic. */
export function entityDescriptorFromApprovedModule(input: {
  moduleId: string;
  displayName: string;
  route: string;
  contractId?: string;
  persistenceProvider?: CrudPersistenceProviderKind;
}): UniversalCrudEntityDescriptor {
  return {
    entityId: input.moduleId,
    entityKey: input.moduleId.replace(/-/g, '_'),
    displayName: input.displayName,
    contractId: input.contractId ?? `feature-${input.moduleId}`,
    route: input.route,
    persistenceProvider: input.persistenceProvider ?? 'memory',
  };
}

export function moduleIdToPascalCase(moduleId: string): string {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function escTsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}
