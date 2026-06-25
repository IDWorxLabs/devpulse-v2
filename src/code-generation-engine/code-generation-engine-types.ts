/**
 * Code Generation Engine V1 — types.
 */

import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';

export type GeneratedAppProfile =
  | 'TASK_TRACKER_WEB_V1'
  | 'CRM_WEB_V1'
  | 'INVENTORY_WEB_V1'
  | 'SCHOOL_MANAGEMENT_WEB_V1'
  | 'PROJECT_MANAGEMENT_WEB_V1'
  | 'EXPENSE_TRACKER_WEB_V1'
  | 'FINANCE_TRACKER_WEB_V1'
  | 'QR_APP';

export interface TaskTrackerRequirements {
  readOnly: true;
  profile: GeneratedAppProfile;
  addTask: boolean;
  completeTask: boolean;
  deleteTask: boolean;
  filterAllActiveCompleted: boolean;
  activeTaskCount: boolean;
  cleanModernUi: boolean;
  browserRuntime: boolean;
}

export interface GeneratedWorkspaceFile {
  relativePath: string;
  content: string;
}

export interface CodeGenerationEngineResult {
  readOnly: true;
  generated: boolean;
  profile: GeneratedAppProfile | null;
  workspaceId: string;
  generatedFiles: string[];
  skippedReason: string | null;
}

export interface MaterializeGeneratedAppInput {
  projectRootDir: string;
  workspaceId: string;
  contract: BuildReadyExecutionContract;
  rawPrompt: string;
  profileOverride?: GeneratedAppProfile | null;
}
