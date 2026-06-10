/**
 * Multi Project Foundation — public exports.
 */

import { resetProjectRegistryForTests } from './project-registry.js';
import { resetProjectIdentityForTests } from './project-identity-manager.js';
import { resetProjectWorkspaceMapperForTests } from './project-workspace-mapper.js';
import { resetProjectContextForTests } from './project-context-manager.js';
import { resetProjectHistoryForTests } from './project-history-manager.js';
import { resetProjectRegistryCacheForTests } from './project-registry-cache.js';
import { resetProjectReportCounterForTests } from './project-reporting.js';
import { resetMultiProjectFoundationForTests } from './multi-project-foundation.js';
import { resetAutonomousCompletionEngineModuleForTests } from '../autonomous-completion-engine/index.js';

export {
  MULTI_PROJECT_FOUNDATION_PASS_TOKEN,
  MULTI_PROJECT_FOUNDATION_OWNER_MODULE,
  DEFAULT_MAX_PROJECT_HISTORY_SIZE,
  MULTI_PROJECT_QUESTION_SIGNALS,
  isMultiProjectQuestion,
} from './multi-project-types.js';

export type {
  MultiProjectState,
  ProjectLifecycleStatus,
  IsolationStatus,
  ProjectEventType,
  MultiProjectRecord,
  ProjectIdentity,
  ProjectContext,
  ProjectHistoryEntry,
  ProjectLifecycleSummary,
  ProjectIsolationResult,
  ProjectReport,
  RegisterProjectInput,
  ProjectRuntimeReport,
} from './multi-project-types.js';

export {
  registerProject,
  getProject,
  listProjects,
  listProjectsByWorkspace,
  listProjectsByState,
  listProjectsByType,
  updateProjectRecord,
  removeProject,
  getProjectRegistrySize,
  resetProjectRegistryForTests,
} from './project-registry.js';

export {
  createProjectIdentity,
  isProjectIdAvailable,
  reserveProjectIdentity,
  resetProjectIdentityForTests,
} from './project-identity-manager.js';

export {
  canTransitionProjectState,
  updateProjectState,
  listAllowedTransitions,
} from './project-state-manager.js';

export {
  assignWorkspace,
  getWorkspace,
  getProjectForWorkspace,
  listWorkspaceMappings,
  removeWorkspaceMapping,
  resetProjectWorkspaceMapperForTests,
} from './project-workspace-mapper.js';

export {
  storeProjectContext,
  getProjectContext,
  removeProjectContext,
  getProjectContextCount,
  resetProjectContextForTests,
} from './project-context-manager.js';

export {
  recordProjectEvent,
  getProjectHistory,
  getTotalProjectHistorySize,
  setMaxProjectHistorySize,
  getMaxProjectHistorySize,
  resetProjectHistoryForTests,
} from './project-history-manager.js';

export { evaluateProjectLifecycle } from './project-lifecycle-manager.js';
export { validateProjectIsolation } from './project-isolation-policy.js';

export {
  coordinateProject,
  coordinateProjectStateChange,
  getCoordinatedProjectSummary,
} from './project-coordinator.js';
export type { CoordinateProjectResult } from './project-coordinator.js';

export { generateProjectReport, resetProjectReportCounterForTests } from './project-reporting.js';

export {
  getProjectRegistryCacheStats,
  resetProjectRegistryCacheForTests,
} from './project-registry-cache.js';

export {
  getDevPulseV2MultiProjectFoundation,
  registerMultiProjectFoundationWithCentralBrain,
  registerMultiProjectFoundationWithProjectVault,
  registerMultiProjectFoundationWithTrustEngine,
  registerMultiProjectFoundationWithWorld2Coordinator,
  registerMultiProjectFoundationWithUvl,
  registerMultiProjectFoundationWithAutonomousBuilder,
  registerMultiProjectFoundationWithBuildStrategyEngine,
  registerMultiProjectFoundationWithCompletionEngine,
  registerAndReportProject,
  getMultiProjectFoundationRuntimeReport,
  resetMultiProjectFoundationForTests,
} from './multi-project-foundation.js';

export type { MultiProjectFoundationSystemSnapshot } from './multi-project-foundation.js';

export function resetMultiProjectFoundationModuleForTests(): void {
  resetProjectRegistryForTests();
  resetProjectIdentityForTests();
  resetProjectWorkspaceMapperForTests();
  resetProjectContextForTests();
  resetProjectHistoryForTests();
  resetProjectRegistryCacheForTests();
  resetProjectReportCounterForTests();
  resetMultiProjectFoundationForTests();
  resetAutonomousCompletionEngineModuleForTests();
}
