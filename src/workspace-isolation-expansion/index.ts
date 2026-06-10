/**
 * Workspace Isolation Expansion — public exports.
 */

import { resetWorkspaceRegistryForTests } from './workspace-registry.js';
import { resetWorkspaceCacheForTests } from './workspace-cache.js';
import { resetWorkspaceBoundariesForTests } from './workspace-boundary-manager.js';
import { resetWorkspaceOwnershipForTests } from './workspace-ownership-manager.js';
import { resetWorkspaceAccessForTests } from './workspace-access-controller.js';
import { resetWorkspaceViolationDetectorForTests } from './workspace-violation-detector.js';
import { resetWorkspaceReportCounterForTests } from './workspace-boundary-reporting.js';
import { resetWorkspaceIsolationExpansionForTests } from './workspace-isolation-expansion.js';
import { resetMultiProjectFoundationModuleForTests } from '../multi-project-foundation/index.js';

export {
  WORKSPACE_ISOLATION_EXPANSION_PASS_TOKEN,
  WORKSPACE_ISOLATION_EXPANSION_OWNER_MODULE,
  WORKSPACE_ISOLATION_QUESTION_SIGNALS,
  isWorkspaceIsolationQuestion,
} from './workspace-isolation-types.js';

export type {
  WorkspaceState,
  WorkspaceIsolationStatus,
  WorkspaceAccessResult,
  WorkspacePolicyDecision,
  ViolationSeverity,
  WorkspaceRecord,
  WorkspaceBoundary,
  WorkspaceAccessGrant,
  WorkspaceViolationReport,
  WorkspaceBoundaryReport,
  RegisterWorkspaceInput,
  WorkspaceRuntimeReport,
} from './workspace-isolation-types.js';

export {
  registerWorkspace,
  getWorkspaceRecord,
  listWorkspaces,
  listWorkspacesByOwner,
  listWorkspacesByState,
  listWorkspacesByIsolationStatus,
  updateWorkspaceRecord,
  removeWorkspace,
  getWorkspaceRegistrySize,
  resetWorkspaceRegistryForTests,
} from './workspace-registry.js';

export {
  createWorkspaceBoundary,
  getWorkspaceBoundary,
  validateWorkspaceBoundary,
  addPermittedAccess,
  removePermittedAccess,
  resetWorkspaceBoundariesForTests,
} from './workspace-boundary-manager.js';

export {
  assignWorkspaceOwner,
  getWorkspaceOwner,
  addSecondaryAuthorizedAccess,
  getSecondaryAuthorizedAccess,
  resetWorkspaceOwnershipForTests,
} from './workspace-ownership-manager.js';

export {
  requestWorkspaceAccess,
  validateWorkspaceAccess,
  grantWorkspaceAccess,
  revokeWorkspaceAccess,
  resetWorkspaceAccessForTests,
} from './workspace-access-controller.js';

export { evaluateWorkspacePolicy } from './workspace-policy-engine.js';
export { validateWorkspaceIsolation } from './workspace-isolation-validator.js';
export {
  detectWorkspaceViolations,
  getTotalWorkspaceViolationCount,
  resetWorkspaceViolationDetectorForTests,
} from './workspace-violation-detector.js';

export {
  canTransitionWorkspaceState,
  updateWorkspaceState,
} from './workspace-state-manager.js';

export {
  generateWorkspaceBoundaryReport,
  resetWorkspaceReportCounterForTests,
} from './workspace-boundary-reporting.js';

export { getWorkspaceCacheStats, resetWorkspaceCacheForTests } from './workspace-cache.js';

export { coordinateWorkspace } from './workspace-coordinator.js';
export type { CoordinateWorkspaceResult } from './workspace-coordinator.js';

export {
  getDevPulseV2WorkspaceIsolationExpansion,
  registerWorkspaceIsolationExpansionWithCentralBrain,
  registerWorkspaceIsolationExpansionWithProjectVault,
  registerWorkspaceIsolationExpansionWithTrustEngine,
  registerWorkspaceIsolationExpansionWithWorld2Coordinator,
  registerWorkspaceIsolationExpansionWithUvl,
  registerWorkspaceIsolationExpansionWithMultiProjectFoundation,
  registerWorkspaceIsolationExpansionWithAutonomousBuilder,
  registerWorkspaceIsolationExpansionWithCompletionEngine,
  coordinateWorkspaceFromProject,
  coordinateWorkspaceFromInput,
  getWorkspaceIsolationExpansionRuntimeReport,
  resetWorkspaceIsolationExpansionForTests,
} from './workspace-isolation-expansion.js';

export type { WorkspaceIsolationExpansionSystemSnapshot } from './workspace-isolation-expansion.js';

export function resetWorkspaceIsolationExpansionModuleForTests(): void {
  resetWorkspaceRegistryForTests();
  resetWorkspaceCacheForTests();
  resetWorkspaceBoundariesForTests();
  resetWorkspaceOwnershipForTests();
  resetWorkspaceAccessForTests();
  resetWorkspaceViolationDetectorForTests();
  resetWorkspaceReportCounterForTests();
  resetWorkspaceIsolationExpansionForTests();
  resetMultiProjectFoundationModuleForTests();
}
