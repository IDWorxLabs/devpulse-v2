export {
  RUNTIME_ROUTE_REACHABILITY_PROOF_PASS,
  RUNTIME_ROUTE_REACHABILITY_PROOF_OWNER_MODULE,
  RUNTIME_ROUTE_REACHABILITY_PROOF_PHASE,
  RUNTIME_ROUTE_REACHABILITY_PROOF_REPORT_TITLE,
  RUNTIME_ROUTE_REACHABILITY_RECONCILIATION_REPORT_TITLE,
  RUNTIME_ROUTE_REACHABILITY_PROOF_CORE_QUESTION,
  RUNTIME_ROUTE_REACHABILITY_PROOF_CACHE_KEY_PREFIX,
  ROUTE_PROBE_TIMEOUT_MS,
  ROUTE_PROBE_REQUEST_TIMEOUT_MS,
  SPA_FALLBACK_PROBE_PATH,
  ROUTE_DISCOVERY_SCAN_FILES,
  TRUTH_RULES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  INTEGRATION_TARGETS,
} from './runtime-route-reachability-proof-registry.js';

export type {
  RouteDiscoverySource,
  RouteExpectation,
  RouteProbeVerdict,
  RouteFailureClass,
  DiscoveredRoute,
  RouteProbeResult,
  RouteProbeSessionResult,
  RuntimeRouteReachabilityProofReport,
  RuntimeRouteReachabilityProofAssessment,
  AssessRuntimeRouteReachabilityProofInput,
} from './runtime-route-reachability-proof-types.js';

export { discoverExpectedRoutes } from './route-discovery.js';

export {
  runRouteProbeSession,
  isSuccessfulRouteProbe,
  isJsonRouteResponse,
} from './route-probe-runner.js';

export {
  classifyRouteReachability,
  type RouteReachabilityClassification,
} from './route-failure-classifier.js';

export {
  buildRuntimeRouteReachabilityProofReportMarkdown,
  buildRuntimeRouteReachabilityReconciliationReportMarkdown,
} from './runtime-route-reachability-report-builder.js';

export {
  assessRuntimeRouteReachabilityProof,
  resetRuntimeRouteReachabilityProofCounterForTests,
  resetRuntimeRouteReachabilityProofModuleForTests,
} from './runtime-route-reachability-proof-authority.js';
