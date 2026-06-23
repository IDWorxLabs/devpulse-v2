export {
  RUNTIME_UI_RENDER_PROOF_PASS,
  RUNTIME_UI_RENDER_PROOF_OWNER_MODULE,
  RUNTIME_UI_RENDER_PROOF_PHASE,
  RUNTIME_UI_RENDER_PROOF_REPORT_TITLE,
  RUNTIME_UI_RENDER_RECONCILIATION_REPORT_TITLE,
  RUNTIME_UI_RENDER_PROOF_CORE_QUESTION,
  RUNTIME_UI_RENDER_PROOF_CACHE_KEY_PREFIX,
  UI_RENDER_PROBE_TIMEOUT_MS,
  UI_RENDER_PROBE_REQUEST_TIMEOUT_MS,
  SPA_UI_FALLBACK_PROBE_PATH,
  UI_ROUTE_DISCOVERY_SCAN_FILES,
  TRUTH_RULES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  INTEGRATION_TARGETS,
} from './runtime-ui-render-proof-registry.js';

export type {
  UiRouteDiscoverySource,
  UiRouteExpectation,
  UiRenderProbeVerdict,
  UiRenderFailureClass,
  DiscoveredUiRoute,
  UiSourceFileEvidence,
  UiRenderProbeResult,
  UiRenderProbeSessionResult,
  RuntimeUiRenderProofReport,
  RuntimeUiRenderProofAssessment,
  AssessRuntimeUiRenderProofInput,
} from './runtime-ui-render-proof-types.js';

export { discoverUiRoutes, discoverUiSourceFiles } from './ui-route-discovery.js';

export {
  analyzeHtmlRender,
  isJsonContent,
  isHtmlContent,
  detectRootMount,
  detectScriptBundle,
  isUiRenderedProbe,
} from './html-render-analyzer.js';

export { runUiRenderProbeSession } from './ui-render-probe-runner.js';

export { classifyUiRender, type UiRenderClassification } from './ui-render-failure-classifier.js';

export {
  buildRuntimeUiRenderProofReportMarkdown,
  buildRuntimeUiRenderReconciliationReportMarkdown,
} from './runtime-ui-render-proof-report-builder.js';

export {
  assessRuntimeUiRenderProof,
  resetRuntimeUiRenderProofCounterForTests,
  resetRuntimeUiRenderProofModuleForTests,
} from './runtime-ui-render-proof-authority.js';
