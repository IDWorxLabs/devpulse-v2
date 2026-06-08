/** DevPulse V2 Build Package Generator — types. */

export type BuildPackageStatus = 'READY' | 'WARN' | 'BLOCKED';

export interface BuildPackage {
  packageId: string;
  createdAt: number;
  blueprintId: string;
  objective: string;
  modules: string[];
  dependencies: string[];
  validationRequirements: string[];
  risks: string[];
  duplicateRisks: string[];
  rollbackRequirements: string[];
  status: BuildPackageStatus;
  warnings: string[];
  errors: string[];
}

export interface BuildPackageGenerationResult {
  generationId: string;
  packageCount: number;
  packages: BuildPackage[];
  warnings: string[];
  errors: string[];
}

export interface PackageSummary {
  generationId: string;
  blueprintId: string;
  packageCount: number;
  summary: string;
  publishedAt: number;
}

export interface BuildPackageGeneratorState {
  generatorId: string;
  generationCount: number;
  warnings: string[];
  errors: string[];
}

export interface BuildPackageReport {
  ownerModule: string;
  packageCount: number;
  readyCount: number;
  warnCount: number;
  blockedCount: number;
  duplicateRiskCount: number;
  latestPackage: BuildPackage | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface PackageDuplicateContext {
  brainSummaries: string[];
  vaultCapabilities: string[];
  architectDuplicateWarnings: string[];
}

export const GENERATOR_OWNER_MODULE = 'devpulse_v2_build_package_generator_authority';
export const GENERATOR_PASS_TOKEN = 'DEVPULSE_V2_BUILD_PACKAGE_GENERATOR_FOUNDATION_V1_PASS';
export const DUPLICATE_RISK_PREFIX = 'DUPLICATE_RISK';
