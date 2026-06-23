/**
 * Runtime Startup Proof Repair — constants and registry (Phase 26.77).
 */

export const RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS =
  'RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS';

export const RUNTIME_STARTUP_PROOF_REPAIR_PASS = 'RUNTIME_STARTUP_PROOF_REPAIR_PASS';
export const RUNTIME_STARTUP_PROOF_REPAIR_OWNER_MODULE = 'devpulse_runtime_startup_proof_repair';
export const RUNTIME_STARTUP_PROOF_REPAIR_PHASE =
  'Phase 26.77 — Runtime Startup Proof Repair V1';
export const RUNTIME_STARTUP_PROOF_REPAIR_REPORT_TITLE = 'RUNTIME_STARTUP_PROOF_REPAIR_REPORT';
export const RUNTIME_STARTUP_FAILURE_CLASSIFICATION_REPORT_TITLE =
  'RUNTIME_STARTUP_FAILURE_CLASSIFICATION_REPORT';
export const RUNTIME_STARTUP_PROOF_REPAIR_CACHE_KEY_PREFIX = 'runtime-startup-proof-repair-v1';
export const MAX_RUNTIME_STARTUP_PROOF_REPAIR_HISTORY = 16;

export const RUNTIME_STARTUP_PROOF_REPAIR_CORE_QUESTION =
  'Which command boots the generated app, and did bounded startup proof confirm APPLICATION_BOOTS?';

export const DEFAULT_STARTUP_PROBE_PORT = 4173;
export const RUNTIME_STARTUP_PROBE_TIMEOUT_MS = 8_000;
export const MAX_STARTUP_LOG_LINES = 12;

export const FRAMEWORK_DEFAULT_PORTS: Record<string, number> = {
  VITE: 5173,
  REACT: 3000,
  NEXT: 3000,
  EXPRESS: 4173,
  EXPO: 8081,
  NODE: 4173,
  UNKNOWN: 4173,
};

export const STARTUP_COMMAND_RESOLUTION_PRIORITY = [
  'explicit generated build manifest command',
  'package.json dev/start/preview script',
  'known framework default',
  'server entrypoint fallback',
  'no-command-found failure',
] as const;

export const ORCHESTRATION_FLOW = [
  'Resolve primary generated workspace',
  'Runtime entrypoint discovery',
  'Startup command resolution (evidence-backed)',
  'Bounded runtime startup probe',
  'Startup failure classification',
  'Feed into Runtime Materialization Truth Bridge',
] as const;

export const SAFETY_GUARANTEES = [
  'Bounded probe only — strict timeout',
  'No orphan processes — probe kills child on completion',
  'Only probes under .generated-builder-workspaces/',
  'Never starts main AiDevEngine server as generated app',
  'No nested validator chains',
  'Every selected command includes evidence source',
] as const;

export const ENTRYPOINT_MARKERS = [
  'package.json',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  'next.config.mjs',
  'server/index.ts',
  'server/index.js',
  'runtime/dev-server.mjs',
  'src/App.tsx',
  'src/main.tsx',
  'index.js',
] as const;

export const SCRIPT_CANDIDATES = ['dev', 'start', 'serve', 'preview'] as const;
