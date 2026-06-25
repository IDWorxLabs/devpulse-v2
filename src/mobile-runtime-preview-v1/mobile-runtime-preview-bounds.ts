/**
 * Mobile Runtime Preview V1 — bounds and pass token.
 * Platform capability for AiDevEngine mobile runtime orchestration (Phase 1).
 */

export const MOBILE_RUNTIME_PREVIEW_V1_PASS_TOKEN = 'MOBILE_RUNTIME_PREVIEW_V1_PASS';

export const MOBILE_RUNTIME_PREVIEW_V1_OWNER_MODULE = 'mobile-runtime-preview-v1';

export const MOBILE_RUNTIME_PREVIEW_V1_ARTIFACT_DIR = '.mobile-runtime-preview-v1';

export const MOBILE_RUNTIME_PREVIEW_REGISTRY_FILENAME = 'mobile-runtime-preview-registry.json';

export const MOBILE_RUNTIME_PREVIEW_V1_REPORT_FILENAME = 'MOBILE_RUNTIME_PREVIEW_V1_REPORT.md';

/** Runtimes orchestrated by this module — extends existing preview infra, does not fork it. */
export const MOBILE_RUNTIME_KINDS = [
  'BROWSER',
  'MOBILE_WEB',
  'ANDROID',
  'IOS',
  'EXPO',
] as const;

/** Existing modules this layer reuses — duplicate preview systems forbidden. */
export const REUSED_MOBILE_PREVIEW_MODULES = [
  'mobile-preview-modes',
  'mobile-preview-runtime',
  'mobile-live-preview-foundation',
  'mobile-runtime-experience-reality',
  'one-prompt-live-preview/generated-dev-server-manager',
  'playwright-adapter',
  'runtime-startup-proof-repair',
] as const;

export const COMMAND_PROBE_TIMEOUT_MS = 8_000;

export const MAX_REGISTRY_ENTRIES = 16;

export const MAX_HISTORY_ENTRIES = 32;
