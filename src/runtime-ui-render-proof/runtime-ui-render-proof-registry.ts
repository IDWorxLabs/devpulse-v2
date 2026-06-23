/**
 * Runtime UI Render Proof — registry (Phase 26.84).
 */

export const RUNTIME_UI_RENDER_PROOF_PASS = 'RUNTIME_UI_RENDER_PROOF_PASS';
export const RUNTIME_UI_RENDER_PROOF_OWNER_MODULE = 'devpulse_runtime_ui_render_proof';
export const RUNTIME_UI_RENDER_PROOF_PHASE = 'Phase 26.84 — Runtime UI Render Proof Repair V1';
export const RUNTIME_UI_RENDER_PROOF_REPORT_TITLE = 'RUNTIME_UI_RENDER_PROOF_REPORT';
export const RUNTIME_UI_RENDER_RECONCILIATION_REPORT_TITLE = 'RUNTIME_UI_RENDER_RECONCILIATION_REPORT';
export const RUNTIME_UI_RENDER_PROOF_CACHE_KEY_PREFIX = 'runtime-ui-render-proof-v1';

export const RUNTIME_UI_RENDER_PROOF_CORE_QUESTION =
  'After routes are reachable, does the runtime serve a usable user-facing UI rather than JSON-only health responses?';

export const UI_RENDER_PROBE_TIMEOUT_MS = 8000;
export const UI_RENDER_PROBE_REQUEST_TIMEOUT_MS = 2500;
export const MAX_UI_BODY_EXCERPT_CHARS = 512;
export const SPA_UI_FALLBACK_PROBE_PATH = '/__devpulse_spa_ui_probe__';

export const UI_ROUTE_DISCOVERY_SCAN_FILES = [
  'index.html',
  'build-manifest.json',
  'runtime/dev-server.mjs',
  'runtime/dev-server.js',
  'src/App.tsx',
  'src/App.jsx',
  'src/main.tsx',
  'src/main.jsx',
  'src/index.tsx',
  'src/index.jsx',
  'vite.config.ts',
  'vite.config.mjs',
  'package.json',
] as const;

export const TRUTH_RULES = [
  'Rule 1 — HTML with root mount and script bundle: uiRenders=true',
  'Rule 2 — JSON-only runtime health: uiRenders=false, failureClass=JSON_ONLY_RUNTIME',
  'Rule 3 — routesReachable=true must not imply uiRenders=true',
  'Rule 4 — React/Vite UI source exists but runtime serves JSON: JSON_ONLY_RUNTIME (not build failure)',
  'Rule 5 — do not claim APPLICATION_PROVEN until UI render and founder flow proof pass',
] as const;

export const ORCHESTRATION_FLOW = [
  'Confirm applicationBoots=true and routesReachable=true',
  'Discover UI candidate routes and source-file evidence',
  'Run bounded HTTP UI render probe session',
  'Analyze HTML for mount element, bundles, and visible content',
  'Feed UI render proof into Runtime Materialization Truth Bridge',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only proof — no file mutation',
  'Probe only after startup and route proof pass',
  'JSON health responses do not count as UI render',
  'No nested validator chains',
] as const;

export const INTEGRATION_TARGETS = [
  'Runtime Materialization Truth Bridge',
  'Launch Readiness Authority',
  'Founder Truth Matrix',
  'Founder Test Final Reconciler',
] as const;
