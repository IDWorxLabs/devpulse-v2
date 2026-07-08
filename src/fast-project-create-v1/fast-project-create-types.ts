/**
 * Fast Project Create V1 — types for instant USER project creation.
 */

import type { ProjectRegistryRecord, ProjectRegistrySummary } from '../project-registry-v1/index.js';
import type { ProjectSessionContext } from '../project-session-continuity-v1/index.js';

export const FAST_PROJECT_CREATE_V1_PASS_TOKEN = 'FAST_PROJECT_CREATE_V1_PASS';
export const FAST_PROJECT_CREATE_CONTRACT_VERSION = 'FAST_PROJECT_CREATE_V1';
export const FAST_PROJECT_CREATE_TRACE = 'FAST_PROJECT_CREATE_V1_COMPLETE';

export interface FastProjectCreateInput {
  name: string;
  summary?: string;
  confirmFreshCopy?: boolean;
  forceFreshProject?: boolean;
  rootDir?: string;
}

export interface FastProjectCreateDuplicateResult {
  ok: false;
  code: string;
  error: string;
  existingProjectId: string;
  existingProjectName: string;
  duplicateChoices: ['resume', 'fresh-copy', 'cancel'];
  contractVersion: typeof FAST_PROJECT_CREATE_CONTRACT_VERSION;
}

export interface FastProjectCreateSuccessResult {
  ok: true;
  projectId: string;
  projectName: string;
  activeSessionId: string;
  project: ProjectRegistryRecord;
  registrySnapshot: ProjectRegistrySummary & {
    registryPath: string;
    updatedAt: string;
  };
  projectSession: ProjectSessionContext;
  action: 'fast-create';
  contractVersion: typeof FAST_PROJECT_CREATE_CONTRACT_VERSION;
}

export type FastProjectCreateResult = FastProjectCreateSuccessResult | FastProjectCreateDuplicateResult;
