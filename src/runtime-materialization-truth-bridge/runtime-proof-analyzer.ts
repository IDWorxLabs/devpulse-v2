/**
 * Runtime Materialization Truth Bridge — proof boundary analyzer (Phase 26.76).
 * Identifies where reality breaks: build, startup, runtime, route, UI, founder flow, reporting.
 */

import type {
  ApplicationTruthRootCause,
  ApplicationTruthVerdict,
  RuntimeFounderFlowEvidence,
  RuntimeRouteEvidence,
  RuntimeStartupEvidence,
  RuntimeUiEvidence,
} from './runtime-materialization-truth-bridge-types.js';

export type RuntimeFailureBoundary =
  | 'NONE'
  | 'BUILD'
  | 'STARTUP'
  | 'RUNTIME'
  | 'ROUTE'
  | 'UI'
  | 'FOUNDER_FLOW'
  | 'REPORTING'
  | 'EVIDENCE_PROPAGATION';

export interface RuntimeProofAnalysis {
  readOnly: true;
  applicationBoots: boolean;
  routesReachable: boolean;
  uiRenders: boolean;
  criticalFlowCompletes: boolean;
  runtimeEvidencePresent: boolean;
  compileEvidencePresent: boolean;
  derivedVerdict: ApplicationTruthVerdict;
  derivedRootCause: ApplicationTruthRootCause;
  failureBoundary: RuntimeFailureBoundary;
  boundaryReason: string;
}

export function analyzeRuntimeProofBoundaries(input: {
  startup: RuntimeStartupEvidence;
  routes: RuntimeRouteEvidence;
  ui: RuntimeUiEvidence;
  founderFlow: RuntimeFounderFlowEvidence;
  filesExistOnDisk: boolean;
  applicationBootsFromProbe?: boolean;
  startupProofAuthoritative?: boolean;
}): RuntimeProofAnalysis {
  const { startup, routes, ui, founderFlow, filesExistOnDisk } = input;

  const runtimeEvidencePresent =
    input.startupProofAuthoritative === true
      ? input.applicationBootsFromProbe === true || startup.runtimeProofLevel !== 'NOT_PROVEN'
      : startup.runtimeProofLevel !== 'NOT_PROVEN' ||
        startup.processStarted ||
        startup.portReachable ||
        input.applicationBootsFromProbe === true;
  const applicationBoots = input.startupProofAuthoritative
    ? input.applicationBootsFromProbe === true
    : input.applicationBootsFromProbe === true ||
      startup.serverStartSucceeded ||
      startup.processStarted;
  const routesReachable = routes.routeProofAuthoritative
    ? routes.routesReachableProof
    : routes.primaryUrlReachable || routes.routesReachable > 0;
  const uiRenders = ui.uiProofAuthoritative
    ? ui.uiRendersProof
    : ui.applicationRendered || ui.renderSucceeded;
  const criticalFlowCompletes = founderFlow.founderFlowProofAuthoritative
    ? founderFlow.founderFlowProven
    : founderFlow.finalReportDelivered;
  const dependenciesReady = startup.dependenciesReady;
  const fullApplicationChainProven =
    filesExistOnDisk &&
    dependenciesReady &&
    applicationBoots &&
    routesReachable &&
    uiRenders &&
    criticalFlowCompletes;
  const compileEvidencePresent = filesExistOnDisk || founderFlow.buildMaterializationProven;

  let derivedVerdict: ApplicationTruthVerdict = 'APPLICATION_NOT_PROVEN';
  let derivedRootCause: ApplicationTruthRootCause = 'RUNTIME_EVIDENCE_MISSING';
  let failureBoundary: RuntimeFailureBoundary = 'RUNTIME';
  let boundaryReason = 'No runtime evidence observed.';

  if (!runtimeEvidencePresent && !filesExistOnDisk) {
    derivedRootCause = 'RUNTIME_EVIDENCE_MISSING';
    failureBoundary = 'RUNTIME';
    boundaryReason = 'Neither runtime evidence nor build files available.';
  } else if (filesExistOnDisk && !applicationBoots) {
    derivedVerdict = 'APPLICATION_NOT_PROVEN';
    derivedRootCause = 'RUNTIME_START_FAILURE';
    failureBoundary = 'STARTUP';
    boundaryReason = startup.fatalStartupError
      ? 'Build files exist but startup failed with fatal error.'
      : 'Build files exist but application did not start.';
  } else if (applicationBoots && !routesReachable) {
    derivedVerdict = 'APPLICATION_PARTIAL';
    derivedRootCause = 'ROUTE_FAILURE';
    failureBoundary = 'ROUTE';
    boundaryReason = 'Application boots but primary routes are not reachable.';
  } else if (applicationBoots && routesReachable && !uiRenders) {
    derivedVerdict = 'APPLICATION_PARTIAL';
    derivedRootCause = 'UI_RENDER_FAILURE';
    failureBoundary = 'UI';
    boundaryReason = ui.blankPageDetected
      ? 'Routes respond but UI renders blank.'
      : 'Routes respond but application UI did not render.';
  } else if (
    fullApplicationChainProven
  ) {
    derivedVerdict = 'APPLICATION_PROVEN';
    derivedRootCause = 'APPLICATION_PROVEN';
    failureBoundary = 'NONE';
    boundaryReason =
      'Full chain proven: files, dependencies, boot, routes, UI, founder flow (Rule 5).';
  } else if (applicationBoots && routesReachable && uiRenders && !criticalFlowCompletes) {
    derivedVerdict = 'APPLICATION_PARTIAL';
    derivedRootCause = 'FOUNDER_FLOW_FAILURE';
    failureBoundary = 'FOUNDER_FLOW';
    boundaryReason = 'Application runs and renders but founder-critical workflow incomplete.';
  } else if (
    applicationBoots &&
    routesReachable &&
    uiRenders &&
    criticalFlowCompletes &&
    !fullApplicationChainProven
  ) {
    derivedVerdict = 'APPLICATION_PARTIAL';
    derivedRootCause = 'FOUNDER_FLOW_FAILURE';
    failureBoundary = 'FOUNDER_FLOW';
    boundaryReason = 'Founder flow signal present but full application chain not satisfied (Rule 5).';
  } else if (applicationBoots && routesReachable) {
    derivedVerdict = 'APPLICATION_PARTIAL';
    derivedRootCause = 'FOUNDER_FLOW_FAILURE';
    failureBoundary = 'FOUNDER_FLOW';
    boundaryReason = 'Partial runtime success — founder flow not fully proven.';
  } else if (!compileEvidencePresent) {
    failureBoundary = 'BUILD';
    derivedRootCause = 'RUNTIME_EVIDENCE_MISSING';
    boundaryReason = 'No build materialization evidence to assess runtime.';
  }

  return {
    readOnly: true,
    applicationBoots,
    routesReachable,
    uiRenders,
    criticalFlowCompletes,
    runtimeEvidencePresent,
    compileEvidencePresent,
    derivedVerdict,
    derivedRootCause,
    failureBoundary,
    boundaryReason,
  };
}

export function mapApplicationVerdictToConsistency(
  verdict: ApplicationTruthVerdict,
): 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN' {
  if (verdict === 'APPLICATION_PROVEN') return 'PROVEN';
  if (verdict === 'APPLICATION_PARTIAL') return 'PARTIAL';
  return 'NOT_PROVEN';
}
