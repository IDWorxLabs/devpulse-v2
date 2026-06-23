/**
 * Runtime Route Reachability Proof — registry (Phase 26.83).
 */

export const RUNTIME_ROUTE_REACHABILITY_PROOF_PASS = 'RUNTIME_ROUTE_REACHABILITY_PROOF_PASS';
export const RUNTIME_ROUTE_REACHABILITY_PROOF_OWNER_MODULE =
  'devpulse_runtime_route_reachability_proof';
export const RUNTIME_ROUTE_REACHABILITY_PROOF_PHASE =
  'Phase 26.83 — Runtime Route Reachability Proof Repair V1';
export const RUNTIME_ROUTE_REACHABILITY_PROOF_REPORT_TITLE =
  'RUNTIME_ROUTE_REACHABILITY_PROOF_REPORT';
export const RUNTIME_ROUTE_REACHABILITY_RECONCILIATION_REPORT_TITLE =
  'RUNTIME_ROUTE_REACHABILITY_RECONCILIATION_REPORT';
export const RUNTIME_ROUTE_REACHABILITY_PROOF_CACHE_KEY_PREFIX =
  'runtime-route-reachability-proof-v1';

export const RUNTIME_ROUTE_REACHABILITY_PROOF_CORE_QUESTION =
  'After application boot, which discovered routes respond with usable HTTP success and where does route failure remain the true boundary?';

export const ROUTE_PROBE_TIMEOUT_MS = 4000;
export const ROUTE_PROBE_REQUEST_TIMEOUT_MS = 2500;
export const MAX_BODY_EXCERPT_CHARS = 256;
export const SPA_FALLBACK_PROBE_PATH = '/__devpulse_spa_fallback_probe__';

export const ROUTE_DISCOVERY_SCAN_FILES = [
  'build-manifest.json',
  'runtime/dev-server.mjs',
  'runtime/dev-server.js',
  'server/index.ts',
  'server/index.js',
  'server/routes.ts',
  'server/routes.js',
  'src/App.tsx',
  'src/App.jsx',
  'src/router.tsx',
  'src/router.jsx',
  'src/routes.tsx',
  'src/routes.jsx',
  'vite.config.ts',
  'vite.config.mjs',
  'package.json',
] as const;

export const TRUTH_RULES = [
  'Rule 1 — applicationBoots=true and / returns 2xx/3xx: routesReachable=true (ROOT_ROUTE_ONLY or ROUTES_REACHABLE)',
  'Rule 2 — applicationBoots=true and no route success: routesReachable=false, failureBoundary=ROUTE',
  'Rule 3 — SPA fallback 200 on unknown route: SPA_FALLBACK_PRESENT, not ROUTE_NOT_FOUND',
  'Rule 4 — JSON runtime health satisfies route proof but not UI render proof',
] as const;

export const ORCHESTRATION_FLOW = [
  'Confirm applicationBoots from startup proof',
  'Discover expected routes from workspace artifacts',
  'Run bounded HTTP route probe session after boot proof',
  'Classify route failure class and routesReachable truth',
  'Feed route proof into Runtime Materialization Truth Bridge',
] as const;

export const SAFETY_GUARANTEES = [
  'Read-only proof — no file mutation',
  'Probe only after applicationBoots=true',
  'Bounded HTTP requests with guaranteed cleanup',
  'No nested validator chains',
  'JSON route success does not imply UI render proof',
] as const;

export const INTEGRATION_TARGETS = [
  'Runtime Materialization Truth Bridge',
  'Launch Readiness Authority',
  'Founder Truth Matrix',
  'Founder Test Final Reconciler',
] as const;
