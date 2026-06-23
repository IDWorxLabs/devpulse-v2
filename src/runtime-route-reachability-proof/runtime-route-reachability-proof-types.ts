/**
 * Runtime Route Reachability Proof — core models (Phase 26.83).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
} from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

export type RouteDiscoverySource =
  | 'ROOT_DEFAULT'
  | 'BUILD_MANIFEST'
  | 'DEV_SERVER'
  | 'SERVER_ROUTES'
  | 'REACT_ROUTER'
  | 'VITE_SPA_FALLBACK'
  | 'PACKAGE_MANIFEST'
  | 'VERIFICATION_CONTRACT';

export type RouteExpectation =
  | 'ROOT_RESPONSE'
  | 'HEALTH_JSON'
  | 'HTML_PAGE'
  | 'SPA_FALLBACK'
  | 'API_JSON'
  | 'UNKNOWN';

export type RouteProbeVerdict =
  | 'SUCCESS'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'NO_RESPONSE'
  | 'SKIPPED';

export type RouteFailureClass =
  | 'ROUTES_REACHABLE'
  | 'ROOT_ROUTE_ONLY'
  | 'HEALTH_ONLY'
  | 'ROUTE_NOT_FOUND'
  | 'ROUTE_SERVER_ERROR'
  | 'ROUTE_TIMEOUT'
  | 'SPA_FALLBACK_PRESENT'
  | 'ROUTE_DISCOVERY_MISSING'
  | 'RUNTIME_NOT_BOOTED'
  | 'UNKNOWN_ROUTE_FAILURE';

export interface DiscoveredRoute {
  readOnly: true;
  path: string;
  source: RouteDiscoverySource;
  expectation: RouteExpectation;
  confidence: number;
}

export interface RouteProbeResult {
  readOnly: true;
  routePath: string;
  statusCode: number | null;
  responded: boolean;
  responseType: 'json' | 'html' | 'text' | 'unknown' | 'none';
  bodyExcerpt: string | null;
  elapsedMs: number;
  verdict: RouteProbeVerdict;
}

export interface RouteProbeSessionResult {
  readOnly: true;
  baseUrl: string | null;
  port: number | null;
  probeResults: readonly RouteProbeResult[];
  runtimeBootedBeforeProbe: boolean;
  probeSkipped: boolean;
  skipReason: string | null;
  cleanupStatus: 'CLEANED' | 'NOT_STARTED' | 'CLEANUP_FAILED';
  elapsedMs: number;
  fatalErrors: string[];
}

export interface RuntimeRouteReachabilityProofReport {
  readOnly: true;
  advisoryOnly: true;
  proofId: string;
  generatedAt: string;
  coreQuestion: string;
  workspaceId: string;
  workspaceRoot: string;
  entrypoint: RuntimeEntrypointCandidate;
  resolvedCommand: ResolvedStartupCommand;
  startupProbe: RuntimeStartupProbeResult | null;
  applicationBootsBeforeProbe: boolean;
  discoveredRoutes: readonly DiscoveredRoute[];
  probeSession: RouteProbeSessionResult;
  failureClass: RouteFailureClass;
  routesReachable: boolean;
  rootRouteReachable: boolean;
  uiRenderProven: boolean;
  routeFailureReason: string;
  recommendedFix: string;
  recommendedNextActions: string[];
  cacheKey: string;
}

export interface RuntimeRouteReachabilityProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'RUNTIME_ROUTE_REACHABILITY_PROOF_COMPLETE';
  report: RuntimeRouteReachabilityProofReport;
  cacheKey: string;
}

export interface AssessRuntimeRouteReachabilityProofInput {
  rootDir?: string;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  workspacePath?: string | null;
  workspaceId?: string | null;
  startupProbe?: RuntimeStartupProbeResult | null;
  entrypoint?: RuntimeEntrypointCandidate | null;
  resolvedCommand?: ResolvedStartupCommand | null;
  skipProbe?: boolean;
  skipHistoryRecording?: boolean;
}
