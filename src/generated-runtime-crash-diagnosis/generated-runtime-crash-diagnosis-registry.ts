/**
 * Generated Runtime Crash Diagnosis — registry (Phase 26.81).
 */

export const GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS = 'GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS';
export const GENERATED_RUNTIME_CRASH_DIAGNOSIS_OWNER_MODULE =
  'devpulse_generated_runtime_crash_diagnosis';
export const GENERATED_RUNTIME_CRASH_DIAGNOSIS_PHASE =
  'Phase 26.81 — Generated Runtime Crash Diagnosis V1';
export const GENERATED_RUNTIME_CRASH_DIAGNOSIS_REPORT_TITLE =
  'GENERATED_RUNTIME_CRASH_DIAGNOSIS_REPORT';
export const GENERATED_RUNTIME_CRASH_REPAIR_PLAN_REPORT_TITLE =
  'GENERATED_RUNTIME_CRASH_REPAIR_PLAN';
export const GENERATED_RUNTIME_CRASH_DIAGNOSIS_CACHE_KEY_PREFIX =
  'generated-runtime-crash-diagnosis-v1';

export const GENERATED_RUNTIME_CRASH_DIAGNOSIS_CORE_QUESTION =
  'What precise runtime crash class and repair action explain startup failure after dependencies are ready?';

export const MAX_RAW_ERROR_EXCERPT_CHARS = 512;
export const MAX_CRASH_LOG_LINES = 24;

export const CRASH_PATTERN_IDS = [
  'SYNTAX_ERROR',
  'MISSING_IMPORT',
  'MODULE_FORMAT_MISMATCH',
  'ENTRYPOINT_NOT_FOUND',
  'BAD_SERVER_EXPORT',
  'BAD_VITE_CONFIG',
  'PORT_BIND_FAILURE',
  'GENERATED_CODE_RUNTIME_ERROR',
  'PROCESS_EXITED_EARLY',
  'PROBE_FALSE_POSITIVE',
] as const;

export const ENTRYPOINT_PROBE_FILES = [
  'runtime/dev-server.mjs',
  'runtime/dev-server.js',
  'server/index.ts',
  'server/index.js',
  'src/main.tsx',
  'src/App.tsx',
  'vite.config.ts',
  'vite.config.mjs',
] as const;

export const ORCHESTRATION_FLOW = [
  'Collect startup probe stdout/stderr and fatal errors',
  'Map runtime entrypoint and attempted command',
  'Extract bounded crash signals from logs',
  'Classify precise crash class with confidence',
  'Generate safe repair plan (shouldAutoRepair=false)',
  'Feed into Runtime Startup Proof Repair and Truth Bridge',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only diagnosis — no file mutation',
  'shouldAutoRepair=false by default',
  'Bounded log excerpt only',
  'No nested validator chains',
] as const;

export const MAX_CRASH_DIAGNOSIS_HISTORY = 32;
