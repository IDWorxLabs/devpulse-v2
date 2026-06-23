/**
 * Generated Workspace Dependency Materialization — registry (Phase 26.78).
 */

export const GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS =
  'GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PASS';
export const GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_OWNER_MODULE =
  'devpulse_generated_workspace_dependency_materialization';
export const GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_PHASE =
  'Phase 26.78 — Generated Workspace Dependency Materialization Repair V1';
export const GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_REPORT_TITLE =
  'GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_REPORT';
export const GENERATED_WORKSPACE_DEPENDENCY_REPAIR_PLAN_REPORT_TITLE =
  'GENERATED_WORKSPACE_DEPENDENCY_REPAIR_PLAN';
export const GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CACHE_KEY_PREFIX =
  'generated-workspace-dependency-materialization-v1';

export const GENERATED_WORKSPACE_DEPENDENCY_MATERIALIZATION_CORE_QUESTION =
  'Are generated workspace dependencies installed and resolvable before runtime startup?';

export const PACKAGE_MANAGER_RESOLUTION_PRIORITY = [
  'packageManager field in package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'npm fallback',
] as const;

export const IMPORT_PROBE_FILES = [
  'runtime/dev-server.mjs',
  'src/App.tsx',
  'src/main.tsx',
  'server/index.ts',
  'server/index.js',
  'index.js',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve generated workspace path',
  'Read package manifest',
  'Resolve package manager (evidence-backed)',
  'Scan dependency presence',
  'Probe module resolution (bounded)',
  'Generate safe repair plan',
  'Feed into Runtime Startup Proof Repair',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only by default — shouldAutoRun=false',
  'No mutation of main AiDevEngine project',
  'No deletion or rewrite of generated source files',
  'Bounded module resolution probe only',
  'Install only when explicitly allowed via allowAutoInstall',
  'No nested validator chains',
] as const;

export const MAX_IMPORT_PROBE_FILES = 6;
export const MAX_EXTRACTED_IMPORTS = 24;
