/**
 * Founder Flow Runtime Proof — core models (Phase 26.86).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type { RuntimeRouteReachabilityProofReport } from '../runtime-route-reachability-proof/runtime-route-reachability-proof-types.js';
import type { RuntimeUiRenderProofReport } from '../runtime-ui-render-proof/runtime-ui-render-proof-types.js';
import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
} from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

export type FounderFlowCandidateSource =
  | 'UI_RENDER_PROOF'
  | 'ROUTE_REACHABILITY_PROOF'
  | 'VERIFICATION_CONTRACT'
  | 'RESULT_ENDPOINT'
  | 'RESULT_STORE'
  | 'CLIENT_CACHE'
  | 'RUNTIME_BRIDGE';

export type FounderFlowStepExpectation =
  | 'OPEN_RUNTIME'
  | 'LOAD_UI'
  | 'INTERACT'
  | 'START_FLOW'
  | 'COMPLETE_FLOW'
  | 'DELIVER_RESULT';

export type FounderFlowFailureClass =
  | 'FOUNDER_FLOW_PROVEN'
  | 'NO_INTERACTIVE_ELEMENTS'
  | 'FLOW_START_NOT_PROVEN'
  | 'FLOW_COMPLETION_NOT_PROVEN'
  | 'REPORT_GENERATED_NOT_DELIVERED'
  | 'FINAL_RESULT_NOT_DELIVERED'
  | 'RESULT_STORE_MISSING'
  | 'RESULT_ENDPOINT_UNREACHABLE'
  | 'CLIENT_CACHE_NOT_UPDATED'
  | 'EVIDENCE_PROPAGATION_FAILURE'
  | 'UNKNOWN_FOUNDER_FLOW_FAILURE'
  | 'UI_RENDER_NOT_READY';

export interface DiscoveredFounderFlowCandidate {
  readOnly: true;
  stepId: string;
  path: string | null;
  source: FounderFlowCandidateSource;
  expectation: FounderFlowStepExpectation;
  confidence: number;
}

export interface FounderFlowInteractiveScan {
  readOnly: true;
  interactiveElementCount: number;
  hasButton: boolean;
  hasInput: boolean;
  hasLink: boolean;
  hasForm: boolean;
  hasOnClickHandler: boolean;
  scanSource: string;
}

export interface FounderFlowProbeResult {
  readOnly: true;
  founderRuntimeOpen: boolean;
  uiLoadedAsApp: boolean;
  flowStartProven: boolean;
  interactiveScan: FounderFlowInteractiveScan;
  probeSkipped: boolean;
  skipReason: string | null;
}

export interface FounderFlowResultStoreCheck {
  readOnly: true;
  resultStorePresent: boolean;
  resultStoreRunIds: readonly string[];
  latestRunId: string | null;
  reportGenerated: boolean;
  finalResultDelivered: boolean;
  clientCacheUpdated: boolean;
  resultEndpointRegistered: boolean;
  resultEndpointPath: string | null;
  finalReportMarkdownPresent: boolean;
  partialReportOnly: boolean;
  evidencePropagationAligned: boolean;
  checkDetail: string;
}

export interface FounderFlowRuntimeProofReport {
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
  uiRenderProof: RuntimeUiRenderProofReport | null;
  filesExistOnDisk: boolean;
  dependenciesReady: boolean;
  applicationBootsBeforeProbe: boolean;
  routesReachableBeforeProbe: boolean;
  uiRendersBeforeProbe: boolean;
  discoveredCandidates: readonly DiscoveredFounderFlowCandidate[];
  flowProbe: FounderFlowProbeResult;
  resultStoreCheck: FounderFlowResultStoreCheck;
  failureClass: FounderFlowFailureClass;
  founderFlowProven: boolean;
  founderFlowFailureReason: string;
  recommendedFix: string;
  recommendedNextActions: string[];
  cacheKey: string;
}

export interface FounderFlowRuntimeProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_FLOW_RUNTIME_PROOF_COMPLETE';
  report: FounderFlowRuntimeProofReport;
  cacheKey: string;
}

export interface AssessFounderFlowRuntimeProofInput {
  rootDir?: string;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  workspacePath?: string | null;
  workspaceId?: string | null;
  startupProbe?: RuntimeStartupProbeResult | null;
  routeReachabilityProof?: RuntimeRouteReachabilityProofReport | null;
  uiRenderProof?: RuntimeUiRenderProofReport | null;
  entrypoint?: RuntimeEntrypointCandidate | null;
  resolvedCommand?: ResolvedStartupCommand | null;
  filesExistOnDisk?: boolean;
  dependenciesReady?: boolean;
  bridgeFounderFlow?: import('../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js').RuntimeFounderFlowEvidence | null;
  skipProbe?: boolean;
  skipHistoryRecording?: boolean;
}
