/**
 * Runtime UI Render Proof — core models (Phase 26.84).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type { RuntimeRouteReachabilityProofReport } from '../runtime-route-reachability-proof/runtime-route-reachability-proof-types.js';
import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
} from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

export type UiRouteDiscoverySource =
  | 'ROOT_DEFAULT'
  | 'ROUTE_REACHABILITY_PROOF'
  | 'BUILD_MANIFEST'
  | 'INDEX_HTML'
  | 'DEV_SERVER'
  | 'REACT_ENTRYPOINT'
  | 'VITE_SPA_FALLBACK'
  | 'PACKAGE_MANIFEST'
  | 'VERIFICATION_CONTRACT';

export type UiRouteExpectation =
  | 'HTML_SHELL'
  | 'SPA_ENTRY'
  | 'REACT_MOUNT'
  | 'JSON_RUNTIME'
  | 'UNKNOWN';

export type UiRenderProbeVerdict =
  | 'UI_RENDERED'
  | 'JSON_ONLY'
  | 'HTML_INCOMPLETE'
  | 'BLANK_HTML'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'NO_RESPONSE'
  | 'SKIPPED';

export type UiRenderFailureClass =
  | 'UI_RENDERED'
  | 'JSON_ONLY_RUNTIME'
  | 'HTML_WITHOUT_ROOT_MOUNT'
  | 'HTML_WITHOUT_BUNDLE'
  | 'BLANK_HTML'
  | 'UI_ROUTE_NOT_FOUND'
  | 'SPA_ENTRY_MISSING'
  | 'CLIENT_BUNDLE_MISSING'
  | 'RUNTIME_NOT_ROUTE_READY'
  | 'UNKNOWN_UI_RENDER_FAILURE';

export interface DiscoveredUiRoute {
  readOnly: true;
  path: string;
  source: UiRouteDiscoverySource;
  expectation: UiRouteExpectation;
  confidence: number;
}

export interface UiSourceFileEvidence {
  readOnly: true;
  hasIndexHtml: boolean;
  hasReactApp: boolean;
  hasViteConfig: boolean;
  hasReactEntrypoint: boolean;
  uiSourceFilesPresent: boolean;
  discoveredFiles: readonly string[];
}

export interface UiRenderProbeResult {
  readOnly: true;
  path: string;
  statusCode: number | null;
  contentType: string | null;
  bodyExcerpt: string | null;
  isHtml: boolean;
  isJsonOnly: boolean;
  hasRootMount: boolean;
  hasScriptBundle: boolean;
  hasVisibleText: boolean;
  blankHtml: boolean;
  verdict: UiRenderProbeVerdict;
  elapsedMs: number;
}

export interface UiRenderProbeSessionResult {
  readOnly: true;
  baseUrl: string | null;
  port: number | null;
  probeResults: readonly UiRenderProbeResult[];
  applicationBootsBeforeProbe: boolean;
  routesReachableBeforeProbe: boolean;
  probeSkipped: boolean;
  skipReason: string | null;
  cleanupStatus: 'CLEANED' | 'NOT_STARTED' | 'CLEANUP_FAILED';
  elapsedMs: number;
  fatalErrors: string[];
}

export interface RuntimeUiRenderProofReport {
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
  routeReachabilityProof: RuntimeRouteReachabilityProofReport | null;
  applicationBootsBeforeProbe: boolean;
  routesReachableBeforeProbe: boolean;
  discoveredUiRoutes: readonly DiscoveredUiRoute[];
  uiSourceFiles: UiSourceFileEvidence;
  probeSession: UiRenderProbeSessionResult;
  failureClass: UiRenderFailureClass;
  uiRenders: boolean;
  rootRouteJsonOnly: boolean;
  uiFailureReason: string;
  recommendedFix: string;
  recommendedNextActions: string[];
  cacheKey: string;
}

export interface RuntimeUiRenderProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'RUNTIME_UI_RENDER_PROOF_COMPLETE';
  report: RuntimeUiRenderProofReport;
  cacheKey: string;
}

export interface AssessRuntimeUiRenderProofInput {
  rootDir?: string;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  workspacePath?: string | null;
  workspaceId?: string | null;
  startupProbe?: RuntimeStartupProbeResult | null;
  routeReachabilityProof?: RuntimeRouteReachabilityProofReport | null;
  entrypoint?: RuntimeEntrypointCandidate | null;
  resolvedCommand?: ResolvedStartupCommand | null;
  skipProbe?: boolean;
  skipHistoryRecording?: boolean;
}
