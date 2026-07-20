/**
 * Production Pipeline Constitution V1 — Repair Reality taxonomy.
 *
 * Production Pipeline Constitution Adoption Phase 9 — Repair Reality Alignment V1.
 *
 * Every production "repair" must belong to exactly one primary constitutional class. These types
 * distinguish evidence-only updates from real workspace/source mutations so downstream authorities
 * never infer mutations heuristically and never report a repair that did not actually occur.
 */

/** Primary constitutional repair classification — every repair entry uses exactly one. */
export type ConstitutionalRepairType =
  | 'REPORT_ONLY'
  | 'EVIDENCE_ONLY'
  | 'DIAGNOSTIC_ONLY'
  | 'MANIFEST_ONLY'
  | 'WORKSPACE_MUTATION'
  | 'SOURCE_MUTATION'
  | 'GENERATOR_REGENERATION'
  | 'AUTOFIX_COMPILATION'
  | 'AUTOFIX_RUNTIME'
  | 'CAPABILITY_EVOLUTION'
  | 'PREVIEW_RECOVERY'
  | 'PIPELINE_RESTART'
  | 'CONTRACT_REPAIR'
  | 'IDENTITY_REPAIR'
  | 'NAVIGATION_REPAIR'
  | 'MODULE_REPAIR'
  | 'METADATA_REPAIR'
  | 'SAMPLE_DATA_REPAIR'
  | 'PROVENANCE_REPAIR';

export const CONSTITUTIONAL_REPAIR_TYPES: readonly ConstitutionalRepairType[] = [
  'REPORT_ONLY',
  'EVIDENCE_ONLY',
  'DIAGNOSTIC_ONLY',
  'MANIFEST_ONLY',
  'WORKSPACE_MUTATION',
  'SOURCE_MUTATION',
  'GENERATOR_REGENERATION',
  'AUTOFIX_COMPILATION',
  'AUTOFIX_RUNTIME',
  'CAPABILITY_EVOLUTION',
  'PREVIEW_RECOVERY',
  'PIPELINE_RESTART',
  'CONTRACT_REPAIR',
  'IDENTITY_REPAIR',
  'NAVIGATION_REPAIR',
  'MODULE_REPAIR',
  'METADATA_REPAIR',
  'SAMPLE_DATA_REPAIR',
  'PROVENANCE_REPAIR',
];

export interface ConstitutionalRepairMutationFlags {
  readonly filesMutated: boolean;
  readonly artifactsMutated: boolean;
  readonly workspaceMutated: boolean;
  readonly runtimeMutated: boolean;
  readonly previewMutated: boolean;
  readonly manifestMutated: boolean;
  readonly contractAffected: boolean;
}

/** Deterministic mutation flags every repair type must carry — no heuristic inference downstream. */
export function expectedMutationFlagsForRepairType(
  repairType: ConstitutionalRepairType,
): ConstitutionalRepairMutationFlags {
  switch (repairType) {
    case 'REPORT_ONLY':
      return {
        filesMutated: false,
        artifactsMutated: false,
        workspaceMutated: false,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'EVIDENCE_ONLY':
      return {
        filesMutated: false,
        artifactsMutated: true,
        workspaceMutated: false,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'DIAGNOSTIC_ONLY':
      return {
        filesMutated: false,
        artifactsMutated: false,
        workspaceMutated: false,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'MANIFEST_ONLY':
      return {
        filesMutated: false,
        artifactsMutated: true,
        workspaceMutated: false,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: true,
        contractAffected: false,
      };
    case 'WORKSPACE_MUTATION':
      return {
        filesMutated: true,
        artifactsMutated: true,
        workspaceMutated: true,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'SOURCE_MUTATION':
      return {
        filesMutated: true,
        artifactsMutated: true,
        workspaceMutated: true,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'GENERATOR_REGENERATION':
      return {
        filesMutated: true,
        artifactsMutated: true,
        workspaceMutated: true,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'AUTOFIX_COMPILATION':
      return {
        filesMutated: true,
        artifactsMutated: true,
        workspaceMutated: true,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'AUTOFIX_RUNTIME':
      return {
        filesMutated: false,
        artifactsMutated: false,
        workspaceMutated: false,
        runtimeMutated: true,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'CAPABILITY_EVOLUTION':
      return {
        filesMutated: true,
        artifactsMutated: true,
        workspaceMutated: true,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'PREVIEW_RECOVERY':
      return {
        filesMutated: false,
        artifactsMutated: false,
        workspaceMutated: false,
        runtimeMutated: true,
        previewMutated: true,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'PIPELINE_RESTART':
      return {
        filesMutated: false,
        artifactsMutated: false,
        workspaceMutated: false,
        runtimeMutated: true,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: false,
      };
    case 'CONTRACT_REPAIR':
    case 'IDENTITY_REPAIR':
    case 'NAVIGATION_REPAIR':
    case 'MODULE_REPAIR':
    case 'METADATA_REPAIR':
    case 'SAMPLE_DATA_REPAIR':
    case 'PROVENANCE_REPAIR':
      return {
        filesMutated: false,
        artifactsMutated: false,
        workspaceMutated: false,
        runtimeMutated: false,
        previewMutated: false,
        manifestMutated: false,
        contractAffected: true,
      };
    default: {
      const _exhaustive: never = repairType;
      return _exhaustive;
    }
  }
}

/** Repair types that constitutionally require full revalidation before preview activation. */
export const FULL_REVALIDATION_REPAIR_TYPES: readonly ConstitutionalRepairType[] = [
  'SOURCE_MUTATION',
  'WORKSPACE_MUTATION',
  'GENERATOR_REGENERATION',
  'CONTRACT_REPAIR',
  'IDENTITY_REPAIR',
  'NAVIGATION_REPAIR',
  'MODULE_REPAIR',
  'METADATA_REPAIR',
  'SAMPLE_DATA_REPAIR',
  'PROVENANCE_REPAIR',
  'AUTOFIX_COMPILATION',
  'CAPABILITY_EVOLUTION',
];

export function repairTypeRequiresFullConstitutionalRevalidation(
  repairType: ConstitutionalRepairType,
): boolean {
  return FULL_REVALIDATION_REPAIR_TYPES.includes(repairType);
}

export function repairTypeRequiresGpcaRerun(repairType: ConstitutionalRepairType): boolean {
  return (
    repairType === 'WORKSPACE_MUTATION' ||
    repairType === 'SOURCE_MUTATION' ||
    repairType === 'GENERATOR_REGENERATION' ||
    repairType === 'AUTOFIX_COMPILATION' ||
    repairType === 'CAPABILITY_EVOLUTION'
  );
}

export function repairTypeRequiresProductFaithfulnessRerun(
  repairType: ConstitutionalRepairType,
): boolean {
  return repairTypeRequiresFullConstitutionalRevalidation(repairType);
}

export function repairEntryMutationFlagsMatchType(input: {
  repairType: ConstitutionalRepairType;
  filesMutated: boolean;
  artifactsMutated: boolean;
  workspaceMutated: boolean;
  runtimeMutated: boolean;
  previewMutated: boolean;
  manifestMutated: boolean;
  contractAffected: boolean;
}): boolean {
  const expected = expectedMutationFlagsForRepairType(input.repairType);
  return (
    input.filesMutated === expected.filesMutated &&
    input.artifactsMutated === expected.artifactsMutated &&
    input.workspaceMutated === expected.workspaceMutated &&
    input.runtimeMutated === expected.runtimeMutated &&
    input.previewMutated === expected.previewMutated &&
    input.manifestMutated === expected.manifestMutated &&
    input.contractAffected === expected.contractAffected
  );
}
