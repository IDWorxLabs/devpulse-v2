/**
 * Workspace Materialization Stabilizer V1 — public API.
 */

export * from './workspace-materialization-types.js';
export { stabilizeWorkspaceMaterialization } from './workspace-materialization-stabilizer.js';
export { auditWorkspaceMaterialization } from './workspace-materialization-auditor.js';
export { applyRepairs } from './workspace-materialization-repair.js';
export { buildWorkspaceMaterializationSummary } from './workspace-materialization-report.js';
export {
  checkWorkspaceCorruption,
  readManifest,
  featureModulesFromManifest,
  featureModulesFromDisk,
  fileExists,
  dirExists,
} from './workspace-materialization-validator.js';
