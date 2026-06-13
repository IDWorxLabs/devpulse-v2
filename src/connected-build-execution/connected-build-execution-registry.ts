/**
 * Connected Build Execution — constants and registry.
 */

export const CONNECTED_BUILD_EXECUTION_PASS_TOKEN = 'CONNECTED_BUILD_EXECUTION_PASS';
export const CONNECTED_BUILD_EXECUTION_OWNER_MODULE = 'devpulse_connected_build_execution';
export const CONNECTED_BUILD_EXECUTION_PHASE =
  'Phase 26.8 — Connected Build Execution Materialization';
export const CONNECTED_BUILD_EXECUTION_REPORT_TITLE = 'CONNECTED_BUILD_EXECUTION_REPORT';
export const CONNECTED_BUILD_EXECUTION_CACHE_KEY_PREFIX = 'connected-build-execution-v1';
export const MAX_CONNECTED_BUILD_EXECUTION_HISTORY = 16;
export const MAX_SCAN_DEPTH = 6;
export const MAX_SCAN_FILES = 256;

export const CONNECTED_BUILD_EXECUTION_CORE_QUESTION =
  'Can AiDevEngine prove that a build-ready contract materialized into real project artifacts with traceable linkage?';

export const WORKSPACE_ROOT_DIR = '.generated-builder-workspaces';

export const ORCHESTRATION_FLOW = [
  'Build-Ready Execution Contract',
  'Build Contract Materializer (expected evidence)',
  'Generated File Analyzer (filesystem scan)',
  'Build Manifest Analyzer (contract linkage)',
  'Artifact Evidence Analyzer',
  'Workspace Materialization Analyzer',
  'Build Output Linkage Analyzer',
  'Autonomous Build Execution Proof (BUILD stage)',
] as const;

export const SAFETY_GUARANTEES = [
  'Bounded writes only under .generated-builder-workspaces/ when gap materialization runs',
  'No .env, credentials, or secret files generated during materialization',
  'PROVEN requires observed non-empty files on disk with full traceability',
  'No synthetic runtime/preview/verify execution claims',
  'PARTIAL reports exact missing artifacts and broken links',
] as const;
