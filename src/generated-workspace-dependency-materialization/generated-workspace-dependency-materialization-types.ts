/**
 * Generated Workspace Dependency Materialization — core models (Phase 26.78).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';

export type DependencyState =
  | 'DEPENDENCIES_READY'
  | 'DEPENDENCIES_MISSING'
  | 'PACKAGE_MANIFEST_MISSING'
  | 'LOCKFILE_MISSING'
  | 'MODULE_RESOLUTION_FAILED'
  | 'INSTALL_REQUIRED'
  | 'UNKNOWN_DEPENDENCY_STATE';

export type LockfileType = 'pnpm-lock.yaml' | 'yarn.lock' | 'package-lock.json' | 'none';

export type PackageManagerId = 'npm' | 'pnpm' | 'yarn';

export type PackageManagerEvidenceSource =
  | 'PACKAGE_JSON_PACKAGE_MANAGER_FIELD'
  | 'PNPM_LOCKFILE'
  | 'YARN_LOCKFILE'
  | 'NPM_LOCKFILE'
  | 'NPM_FALLBACK';

export type RepairRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WorkspacePackageManifest {
  readOnly: true;
  packageJsonExists: boolean;
  packageName: string | null;
  packageManagerField: string | null;
  declaredDependencies: readonly string[];
  declaredDevDependencies: readonly string[];
  scripts: readonly string[];
  parseError: string | null;
}

export interface PackageManagerResolution {
  readOnly: true;
  packageManager: PackageManagerId;
  evidenceSource: PackageManagerEvidenceSource;
  evidenceDetail: string;
  lockfileType: LockfileType;
  installCommand: string;
}

export interface DependencyPresenceScan {
  readOnly: true;
  packageJsonExists: boolean;
  declaredDependencies: readonly string[];
  declaredDevDependencies: readonly string[];
  lockfileType: LockfileType;
  nodeModulesExists: boolean;
  missingRuntimeDependencies: readonly string[];
  missingDevDependencies: readonly string[];
  importGraphMissingModules: readonly string[];
  dependencyState: DependencyState;
  dependencyStateReason: string;
}

export interface ModuleResolutionProbeResult {
  readOnly: true;
  probedFiles: readonly string[];
  extractedImports: readonly string[];
  unresolvedModules: readonly string[];
  resolvedModules: readonly string[];
  probeSucceeded: boolean;
  probeReason: string;
}

export interface DependencyMaterializationRepairPlan {
  readOnly: true;
  installCommand: string;
  installCwd: string;
  packageManager: PackageManagerId;
  reason: string;
  expectedEffect: string;
  riskLevel: RepairRiskLevel;
  shouldAutoRun: boolean;
  missingModulesSummary: string;
}

export interface GeneratedWorkspaceDependencyMaterializationReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  coreQuestion: string;
  workspaceRoot: string;
  workspaceId: string;
  manifest: WorkspacePackageManifest;
  packageManager: PackageManagerResolution;
  presence: DependencyPresenceScan;
  moduleProbe: ModuleResolutionProbeResult;
  repairPlan: DependencyMaterializationRepairPlan;
  dependencyState: DependencyState;
  dependenciesReady: boolean;
  connectedBuildProofLevel: string | null;
  startupProbeLogHints: readonly string[];
  recommendedFix: string;
  cacheKey: string;
}

export interface GeneratedWorkspaceDependencyMaterializationAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'DEPENDENCY_MATERIALIZATION_COMPLETE';
  report: GeneratedWorkspaceDependencyMaterializationReport;
  cacheKey: string;
}

export interface AssessGeneratedWorkspaceDependencyMaterializationInput {
  rootDir?: string;
  workspacePath?: string | null;
  workspaceId?: string | null;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  startupProbeLogs?: readonly string[];
  startupFatalErrors?: readonly string[];
  allowAutoInstall?: boolean;
  skipModuleProbe?: boolean;
  skipHistoryRecording?: boolean;
}

export interface GeneratedWorkspaceDependencyMaterializationHistoryEntry {
  readOnly: true;
  assessmentId: string;
  generatedAt: string;
  dependencyState: DependencyState;
  dependenciesReady: boolean;
  workspaceId: string;
  cacheKey: string;
}
