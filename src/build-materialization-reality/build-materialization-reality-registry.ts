/**
 * Build Materialization Reality — constants and registry (Phase 26.74).
 */

export const BUILD_MATERIALIZATION_REALITY_PASS = 'BUILD_MATERIALIZATION_REALITY_PASS';
export const BUILD_MATERIALIZATION_REALITY_OWNER_MODULE = 'devpulse_build_materialization_reality';
export const BUILD_MATERIALIZATION_REALITY_PHASE =
  'Phase 26.74 — Build Materialization Reality Authority V1';
export const BUILD_MATERIALIZATION_REALITY_REPORT_TITLE = 'BUILD_MATERIALIZATION_REALITY_REPORT';
export const BUILD_MATERIALIZATION_REALITY_CACHE_KEY_PREFIX = 'build-materialization-reality-v1';
export const MAX_BUILD_MATERIALIZATION_REALITY_HISTORY = 16;
export const MAX_WORKSPACES_DEEP_SCAN = 8;

export const WORKSPACE_ROOT_DIR = '.generated-builder-workspaces';

export const BUILD_MATERIALIZATION_REALITY_CORE_QUESTION =
  'Did AiDevEngine actually generate build files, and can proof locate and propagate that evidence?';

export const MATERIALIZATION_CHAIN_STAGES = [
  'idea',
  'requirements',
  'plan',
  'artifact manifest',
  'artifact files',
  'workspace files',
  'runtime contract',
  'preview contract',
  'verification contract',
] as const;

export const FOUNDER_MATERIALIZATION_QUESTIONS = [
  'Did AiDevEngine actually generate build files?',
  'Did AiDevEngine actually create workspace files?',
  'What exact file is the first broken link?',
  'What exact authority lost the evidence?',
  'Is this a product gap or a proof gap?',
  'What must be fixed next?',
] as const;

export const ORCHESTRATION_FLOW = [
  'Requirements-to-Plan Execution Contract',
  'Artifact Reality Scanner (filesystem)',
  'Workspace Reality Scanner',
  'Materialization Chain Linker',
  'Materialization Verdict Analyzer',
  'Connected Build Execution comparison (read-only)',
  'Founder Materialization Answers',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only — no file mutation',
  'No synthetic evidence generation',
  'Evidence from disk scan and upstream authorities only',
  'Single primary root-cause verdict',
  'File-level missing evidence with exact paths',
] as const;
