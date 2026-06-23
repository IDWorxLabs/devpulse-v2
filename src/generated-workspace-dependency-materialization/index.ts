export {
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS,
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_OWNER_MODULE,
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PHASE,
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_REPORT_TITLE,
  GENERATED_WORKSPACE_DEPENDENCY_REPAIR_PLAN_REPORT_TITLE,
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CORE_QUESTION,
  GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CACHE_KEY_PREFIX,
  PACKAGE_MANAGER_RESOLUTION_PRIORITY,
  IMPORT_PROBE_FILES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  MAX_IMPORT_PROBE_FILES,
  MAX_EXTRACTED_IMPORTS,
} from './generated-workspace-dependency-materialization-registry.js';

export type {
  DependencyState,
  LockfileType,
  PackageManagerId,
  PackageManagerEvidenceSource,
  RepairRiskLevel,
  WorkspacePackageManifest,
  PackageManagerResolution,
  DependencyPresenceScan,
  ModuleResolutionProbeResult,
  DependencyMaterializationRepairPlan,
  GeneratedWorkspaceDependencyMaterializationReport,
  GeneratedWorkspaceDependencyMaterializationAssessment,
  AssessGeneratedWorkspaceDependencyMaterializationInput,
  GeneratedWorkspaceDependencyMaterializationHistoryEntry,
} from './generated-workspace-dependency-materialization-types.js';

export { readWorkspacePackageManifest } from './workspace-package-manifest-reader.js';
export { resolvePackageManager, installCommandForLockfile } from './package-manager-resolver.js';
export {
  scanDependencyPresence,
  dependenciesReadyFromScan,
} from './dependency-presence-scanner.js';
export {
  probeModuleResolution,
  extractMissingModulesFromLogs,
} from './module-resolution-probe.js';
export { buildDependencyMaterializationRepairPlan } from './dependency-materialization-repair-planner.js';
export {
  buildGeneratedWorkspaceDependencyMaterializationReportMarkdown,
  buildGeneratedWorkspaceDependencyRepairPlanMarkdown,
} from './generated-workspace-dependency-materialization-report-builder.js';
export {
  resetGeneratedWorkspaceDependencyMaterializationHistoryForTests,
  recordGeneratedWorkspaceDependencyMaterializationAssessment,
  getGeneratedWorkspaceDependencyMaterializationHistorySize,
  getLatestGeneratedWorkspaceDependencyMaterializationHistoryEntry,
  getGeneratedWorkspaceDependencyMaterializationHistory,
} from './generated-workspace-dependency-materialization-history.js';
export {
  assessGeneratedWorkspaceDependencyMaterialization,
  resetGeneratedWorkspaceDependencyMaterializationCounterForTests,
  resetGeneratedWorkspaceDependencyMaterializationModuleForTests,
} from './generated-workspace-dependency-materialization-authority.js';
