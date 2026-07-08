/**
 * Workspace Materialization Stabilizer V1 — types.
 *
 * Product Stabilization Phase 3: immediately after materialization, and BEFORE npm install /
 * npm build / preview begin, audit the generated workspace for completeness and internal
 * consistency, and apply small, targeted, evidence-driven repairs where safe. This eliminates
 * preventable workspace-generation failures that would otherwise only surface later as a
 * confusing npm install/build failure.
 *
 * Everything here operates purely from generated workspace evidence (files on disk + the
 * materialization manifest, when present) — no application-specific logic.
 */

export const WORKSPACE_MATERIALIZATION_STABILIZER_V1_CONTRACT =
  'WORKSPACE_MATERIALIZATION_STABILIZER_V1' as const;

export type WorkspaceMaterializationStatus =
  | 'WORKSPACE_COMPLETE'
  | 'WORKSPACE_REPAIRED'
  | 'WORKSPACE_INCOMPLETE'
  | 'WORKSPACE_CORRUPTED'
  | 'WORKSPACE_BLOCKED';

export type WorkspaceMaterializationFindingKind =
  | 'MISSING_PACKAGE_JSON'
  | 'MISSING_TSCONFIG'
  | 'MISSING_VITE_CONFIG'
  | 'MISSING_INDEX_HTML'
  | 'MISSING_ROOT_ENTRY'
  | 'MISSING_APP_ENTRY'
  | 'MISSING_FEATURE_ROUTER'
  | 'MISSING_REQUIRED_FILE'
  | 'MISSING_BARREL_EXPORT'
  | 'BROKEN_IMPORT'
  | 'MISSING_ROUTE_REGISTRATION'
  | 'MISSING_MANIFEST'
  | 'MANIFEST_INCONSISTENCY'
  | 'MISSING_ASSET';

export interface WorkspaceMaterializationFinding {
  readOnly: true;
  id: string;
  kind: WorkspaceMaterializationFindingKind;
  /** BLOCKING findings can never be repaired safely and stop the pipeline before npm install. */
  severity: 'BLOCKING' | 'REPAIRABLE';
  /** Path relative to the workspace root, when applicable. */
  path: string | null;
  message: string;
}

export interface WorkspaceMaterializationRepairAction {
  readOnly: true;
  findingId: string;
  kind: WorkspaceMaterializationFindingKind;
  path: string | null;
  description: string;
  applied: boolean;
  detail: string;
}

/** A single generated feature module, resolved either from the manifest or from disk evidence. */
export interface WorkspaceFeatureModuleEvidence {
  id: string;
  name: string;
  route: string;
  componentPath: string;
  servicePath: string;
  typesPath: string;
  validationPath: string;
}

export interface WorkspaceMaterializationAuditInput {
  workspaceDir: string;
  prompt?: string;
}

export interface WorkspaceMaterializationAuditEvidence {
  readOnly: true;
  workspaceDir: string;
  workspaceExists: boolean;
  corrupted: boolean;
  corruptionReasons: string[];
  manifestFound: boolean;
  manifestParseError: string | null;
  featureModules: WorkspaceFeatureModuleEvidence[];
  findings: WorkspaceMaterializationFinding[];
  filesChecked: number;
}

export interface WorkspaceMaterializationPlainEnglishSummary {
  readOnly: true;
  headline: string;
  repaired: string[];
  stillMissing: string[];
  whatToDoNext: string;
}

export interface WorkspaceMaterializationReport {
  readOnly: true;
  contractVersion: typeof WORKSPACE_MATERIALIZATION_STABILIZER_V1_CONTRACT;
  status: WorkspaceMaterializationStatus;
  evidence: WorkspaceMaterializationAuditEvidence;
  repairActions: WorkspaceMaterializationRepairAction[];
  summary: WorkspaceMaterializationPlainEnglishSummary;
  durationMs: number;
}
