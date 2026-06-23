/**
 * Runtime Materialization Truth Bridge — truth reconciler (Phase 26.76).
 * Applies reconciliation rules 1–4. Runtime evidence is authoritative over stale reporting.
 */

import { RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION } from './runtime-materialization-truth-bridge-registry.js';
import { mapApplicationVerdictToConsistency } from './runtime-proof-analyzer.js';
import type {
  ApplicationTruthContradictionKind,
  ApplicationTruthRootCause,
  ApplicationTruthVerdict,
  RuntimeEvidencePriority,
  RuntimeMaterializationFounderAnswers,
  RuntimeMaterializationTruthEvidence,
  RuntimeMaterializationTruthReconciliation,
  RuntimeApplicationClaimId,
  RuntimeTruthContradiction,
} from './runtime-materialization-truth-bridge-types.js';

function mapFounderProofToApplicationVerdict(proofLevel: string): ApplicationTruthVerdict {
  if (proofLevel === 'PROVEN') return 'APPLICATION_PROVEN';
  if (proofLevel === 'PARTIAL') return 'APPLICATION_PARTIAL';
  return 'APPLICATION_NOT_PROVEN';
}

function pushContradiction(
  contradictions: RuntimeTruthContradiction[],
  kind: ApplicationTruthContradictionKind,
  detail: string,
  founderTestClaim: string,
  runtimeEvidence: string,
  lostEvidenceAuthority: string | null,
): void {
  if (kind === 'NONE') return;
  contradictions.push({
    readOnly: true,
    kind,
    detail,
    founderTestClaim,
    runtimeEvidence,
    lostEvidenceAuthority,
  });
}

function buildFounderAnswers(input: {
  evidence: RuntimeMaterializationTruthEvidence;
  rootCause: ApplicationTruthRootCause;
  finalVerdict: ApplicationTruthVerdict;
  contradictions: readonly RuntimeTruthContradiction[];
  recommendedFix: string;
}): RuntimeMaterializationFounderAnswers {
  const { evidence, rootCause, finalVerdict, contradictions, recommendedFix } = input;
  const { startup, routes, ui, founderFlow } = evidence;
  const misreported = contradictions.some((c) => c.kind === 'APPLICATION_MISREPORTED_FAILED');

  const actions: string[] = [];
  switch (rootCause) {
    case 'RUNTIME_START_FAILURE':
      actions.push('Fix application startup — verify runtime command, process, and port binding.');
      break;
    case 'ROUTE_FAILURE':
      actions.push('Repair route reachability — verify server routes and health endpoints.');
      break;
    case 'UI_RENDER_FAILURE':
      actions.push('Fix UI render — investigate blank page, hydration, or fatal render errors.');
      break;
    case 'FOUNDER_FLOW_FAILURE':
      actions.push('Complete founder-critical workflow — project creation through final report delivery.');
      break;
    case 'EVIDENCE_PROPAGATION_FAILURE':
      actions.push(
        'Fix evidence propagation from runtime proof into Founder Test and Truth Matrix reporting.',
      );
      break;
    case 'APPLICATION_PROVEN':
      actions.push('Application proven — advance verification and launch readiness proof.');
      break;
    default:
      actions.push('Collect runtime activation and preview experience proof.');
  }

  return {
    readOnly: true,
    didApplicationStart: startup.serverStartSucceeded || startup.processStarted,
    didApplicationBecomeReachable: startup.portReachable || routes.primaryUrlReachable,
    didRoutesWork: routes.routeProofAuthoritative
      ? routes.routesReachableProof
      : routes.routesReachable > 0 && routes.routeFailures === 0,
    didUiRender: ui.uiProofAuthoritative ? ui.uiRendersProof : ui.applicationRendered,
    didFounderCriticalWorkflowsComplete: founderFlow.founderFlowProofAuthoritative
      ? founderFlow.founderFlowProven
      : founderFlow.finalReportDelivered,
    didReportingReflectRuntimeReality: !misreported && finalVerdict === 'APPLICATION_PROVEN',
    trueRootCause: rootCause,
    isBuildProblem: rootCause === 'RUNTIME_EVIDENCE_MISSING' && !evidence.snapshot.filesExistOnDisk,
    isRuntimeProblem:
      rootCause === 'RUNTIME_START_FAILURE' ||
      rootCause === 'ROUTE_FAILURE' ||
      rootCause === 'UI_RENDER_FAILURE',
    isReportingProblem: misreported,
    isEvidencePropagationProblem: rootCause === 'EVIDENCE_PROPAGATION_FAILURE',
    recommendedFix,
    recommendedNextActions: actions.slice(0, 6),
  };
}

export function reconcileRuntimeMaterializationTruth(input: {
  evidence: RuntimeMaterializationTruthEvidence;
  reconciliationId: string;
}): RuntimeMaterializationTruthReconciliation {
  const { evidence, reconciliationId } = input;
  const { proofAnalysis, snapshot, startup } = evidence;
  const contradictions: RuntimeTruthContradiction[] = [];
  const rulesApplied: string[] = [];

  const preReconciliationApplicationVerdict = mapFounderProofToApplicationVerdict(
    snapshot.founderRuntimeProofLevel,
  );

  let finalVerdict = proofAnalysis.derivedVerdict;
  let rootCause = proofAnalysis.derivedRootCause;
  let failureBoundary = proofAnalysis.failureBoundary;
  let authoritativeSource: RuntimeEvidencePriority = 'LIVE_RUNTIME_EVIDENCE';
  let founderTestVerdictReconciled = false;
  let truthMatrixVerdictUpdated = false;

  const founderReportsFailure =
    snapshot.founderRuntimeProofLevel === 'NOT_PROVEN' ||
    snapshot.founderPreviewProofLevel === 'NOT_PROVEN';
  const chainReportsFailure =
    !snapshot.executionChainRuntimeProven && !snapshot.executionChainPreviewProven;

  // Rule 3 — filesystem evidence priority for runtime: live runtime outranks stale snapshots
  rulesApplied.push('Rule 3 — live runtime evidence outranks stale proof snapshots');

  // Rule 1 — APPLICATION_PROVEN when boots + routes + UI + critical flow
  if (
    proofAnalysis.applicationBoots &&
    proofAnalysis.routesReachable &&
    proofAnalysis.uiRenders &&
    proofAnalysis.criticalFlowCompletes
  ) {
    rulesApplied.push(
      'Rule 1 — boots + routes + UI + critical flow: APPLICATION_PROVEN even if downstream reporting disagrees',
    );
    finalVerdict = 'APPLICATION_PROVEN';
    rootCause = 'APPLICATION_PROVEN';
    failureBoundary = 'NONE';
    authoritativeSource = 'LIVE_RUNTIME_EVIDENCE';

    if (founderReportsFailure || chainReportsFailure) {
      pushContradiction(
        contradictions,
        'RUNTIME_TRUTH_CONTRADICTION',
        'Runtime evidence proves application works but Founder Test or chain reports failure.',
        `founderRuntime=${snapshot.founderRuntimeProofLevel}, founderPreview=${snapshot.founderPreviewProofLevel}`,
        `boots=${proofAnalysis.applicationBoots}, routes=${proofAnalysis.routesReachable}, ui=${proofAnalysis.uiRenders}`,
        'founder-test-launch-readiness',
      );
      founderTestVerdictReconciled = true;
      truthMatrixVerdictUpdated = true;
    }
  }

  // Rule 2 — files exist but startup fails
  if (snapshot.filesExistOnDisk && !proofAnalysis.applicationBoots) {
    rulesApplied.push(
      'Rule 2 — files exist but startup fails: APPLICATION_NOT_PROVEN, rootCause=RUNTIME_START_FAILURE',
    );
    finalVerdict = 'APPLICATION_NOT_PROVEN';
    rootCause = 'RUNTIME_START_FAILURE';
    failureBoundary = 'STARTUP';
    authoritativeSource = 'STARTUP_EVIDENCE';
  }

  // Rule 3 (route) — boots but route failures
  if (
    proofAnalysis.applicationBoots &&
    !proofAnalysis.routesReachable &&
    finalVerdict !== 'APPLICATION_PROVEN'
  ) {
    rulesApplied.push(
      'Rule 3 — boots but route failures: APPLICATION_PARTIAL, rootCause=ROUTE_FAILURE',
    );
    finalVerdict = 'APPLICATION_PARTIAL';
    rootCause = 'ROUTE_FAILURE';
    failureBoundary = 'ROUTE';
  }

  // Rule 4 — runtime succeeds but Founder Test reports failure
  const runtimeProvenByEvidence =
    proofAnalysis.applicationBoots &&
    (proofAnalysis.routesReachable || proofAnalysis.uiRenders || startup.runtimeProofLevel === 'PROVEN');

  if (runtimeProvenByEvidence && founderReportsFailure && finalVerdict !== 'APPLICATION_NOT_PROVEN') {
    rulesApplied.push(
      'Rule 4 — runtime succeeds but Founder Test reports failure: EVIDENCE_PROPAGATION_FAILURE',
    );
    if (proofAnalysis.applicationBoots && proofAnalysis.routesReachable) {
      rootCause =
        finalVerdict === 'APPLICATION_PROVEN' ? 'APPLICATION_PROVEN' : 'EVIDENCE_PROPAGATION_FAILURE';
      if (rootCause === 'EVIDENCE_PROPAGATION_FAILURE') {
        failureBoundary = proofAnalysis.uiRenders ? 'REPORTING' : proofAnalysis.failureBoundary;
      }
    } else {
      rootCause = 'EVIDENCE_PROPAGATION_FAILURE';
      failureBoundary = 'EVIDENCE_PROPAGATION';
    }
    pushContradiction(
      contradictions,
      'APPLICATION_MISREPORTED_FAILED',
      'Founder Test reported application failure but runtime evidence shows startup/reachability success.',
      `founderRuntime=${snapshot.founderRuntimeProofLevel}, chainRuntime=${snapshot.executionChainRuntimeProven}`,
      `runtimeProofLevel=${startup.runtimeProofLevel}, portReachable=${startup.portReachable}`,
      'autonomous-build-execution-proof',
    );
    founderTestVerdictReconciled = true;
    truthMatrixVerdictUpdated = true;
  }

  if (
    runtimeProvenByEvidence &&
    founderReportsFailure &&
    proofAnalysis.derivedVerdict !== 'APPLICATION_NOT_PROVEN'
  ) {
    rootCause = finalVerdict === 'APPLICATION_PROVEN' ? 'APPLICATION_PROVEN' : 'EVIDENCE_PROPAGATION_FAILURE';
    if (rootCause === 'EVIDENCE_PROPAGATION_FAILURE') {
      finalVerdict =
        proofAnalysis.uiRenders &&
        proofAnalysis.routesReachable &&
        proofAnalysis.criticalFlowCompletes
          ? 'APPLICATION_PROVEN'
          : 'APPLICATION_PARTIAL';
      if (!proofAnalysis.criticalFlowCompletes) {
        failureBoundary = 'FOUNDER_FLOW';
      }
    }
  }

  let recommendedFix = proofAnalysis.boundaryReason;
  const startupFailureClass =
    evidence.startupProofRepair?.report.failureClass ??
    evidence.startup.startupFailureClass ??
    null;
  if (
    snapshot.filesExistOnDisk &&
    !proofAnalysis.applicationBoots &&
    startupFailureClass &&
    startupFailureClass !== 'NONE'
  ) {
    const depFix = evidence.dependencyMaterialization?.report.recommendedFix;
    const depState = evidence.startup.dependencyState;
    const depMissing = evidence.startup.dependencyMissingModules;
    const depInstall = evidence.startup.dependencyInstallCommand;
    if (startupFailureClass === 'MISSING_DEPENDENCIES' && depState && !evidence.startup.dependenciesReady) {
      recommendedFix = depFix ?? `Dependency state ${depState}: run ${depInstall ?? 'install'} for ${depMissing ?? 'missing modules'}`;
    } else if (startupFailureClass === 'RUNTIME_CRASH' && evidence.startup.preciseCrashClass) {
      recommendedFix =
        evidence.crashDiagnosis?.report.recommendedFix ??
        evidence.startupProofRepair?.report.recommendedFix ??
        `[${evidence.startup.preciseCrashClass}] Fix runtime crash in ${evidence.startup.crashFailingFile ?? 'entrypoint'}`;
    } else {
      recommendedFix =
        evidence.startupProofRepair?.report.recommendedFix ??
        `Startup failure class: ${startupFailureClass}`;
    }
  }
  if (rootCause === 'EVIDENCE_PROPAGATION_FAILURE') {
    recommendedFix =
      'Runtime evidence proves application activity — fix reporting propagation into Founder Test and Truth Matrix.';
  } else if (rootCause === 'APPLICATION_PROVEN') {
    recommendedFix = 'Application proven at runtime — advance verification and launch readiness.';
  }

  const founderAnswers = buildFounderAnswers({
    evidence,
    rootCause,
    finalVerdict,
    contradictions,
    recommendedFix,
  });

  return {
    readOnly: true,
    operationId: RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION,
    reconciliationId,
    generatedAt: new Date().toISOString(),
    preReconciliationApplicationVerdict,
    postReconciliationApplicationVerdict: finalVerdict,
    rootCause,
    proofAnalysisVerdict: proofAnalysis.derivedVerdict,
    contradictions,
    contradictionCount: contradictions.length,
    rulesApplied,
    truthMatrixVerdictUpdated,
    founderTestVerdictReconciled,
    authoritativeSource,
    recommendedFix,
    founderAnswers,
    failureBoundary,
    startupFailureClass,
  };
}

const RUNTIME_CLAIM_PATCH_MAP: Record<
  RuntimeApplicationClaimId,
  (reconciliation: RuntimeMaterializationTruthReconciliation) => {
    truthMatrixVerdict: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
    rootCause: 'EVIDENCE_PROPAGATION_FAILURE' | 'REAL_PRODUCT_GAP' | 'AUTHORITY_DISAGREEMENT' | 'UNKNOWN';
  }
> = {
  APPLICATION_RUNS: (rec) => ({
    truthMatrixVerdict:
      rec.founderAnswers.didApplicationStart
        ? rec.postReconciliationApplicationVerdict === 'APPLICATION_NOT_PROVEN'
          ? 'PARTIAL'
          : mapApplicationVerdictToConsistency(rec.postReconciliationApplicationVerdict)
        : 'NOT_PROVEN',
    rootCause:
      rec.rootCause === 'EVIDENCE_PROPAGATION_FAILURE'
        ? 'EVIDENCE_PROPAGATION_FAILURE'
        : rec.rootCause === 'RUNTIME_START_FAILURE'
          ? 'REAL_PRODUCT_GAP'
          : rec.rootCause === 'APPLICATION_PROVEN'
            ? 'AUTHORITY_DISAGREEMENT'
            : 'UNKNOWN',
  }),
  APPLICATION_REACHABLE: (rec) => ({
    truthMatrixVerdict: rec.founderAnswers.didApplicationBecomeReachable
      ? mapApplicationVerdictToConsistency(rec.postReconciliationApplicationVerdict)
      : 'NOT_PROVEN',
    rootCause:
      rec.rootCause === 'EVIDENCE_PROPAGATION_FAILURE'
        ? 'EVIDENCE_PROPAGATION_FAILURE'
        : rec.rootCause === 'ROUTE_FAILURE'
          ? 'REAL_PRODUCT_GAP'
          : 'UNKNOWN',
  }),
  APPLICATION_WORKS: (rec) => ({
    truthMatrixVerdict: mapApplicationVerdictToConsistency(rec.postReconciliationApplicationVerdict),
    rootCause:
      rec.rootCause === 'EVIDENCE_PROPAGATION_FAILURE'
        ? 'EVIDENCE_PROPAGATION_FAILURE'
        : rec.rootCause === 'APPLICATION_PROVEN'
          ? 'AUTHORITY_DISAGREEMENT'
          : rec.rootCause === 'RUNTIME_START_FAILURE' ||
              rec.rootCause === 'ROUTE_FAILURE' ||
              rec.rootCause === 'UI_RENDER_FAILURE'
            ? 'REAL_PRODUCT_GAP'
            : 'UNKNOWN',
  }),
  FOUNDER_CAN_USE_APPLICATION: (rec) => ({
    truthMatrixVerdict: rec.founderAnswers.didFounderCriticalWorkflowsComplete
      ? 'PROVEN'
      : mapApplicationVerdictToConsistency(rec.postReconciliationApplicationVerdict),
    rootCause:
      rec.rootCause === 'FOUNDER_FLOW_FAILURE'
        ? 'REAL_PRODUCT_GAP'
        : rec.rootCause === 'EVIDENCE_PROPAGATION_FAILURE'
          ? 'EVIDENCE_PROPAGATION_FAILURE'
          : 'UNKNOWN',
  }),
  LIVE_PREVIEW_RUNS_APPLICATIONS: (rec) => ({
    truthMatrixVerdict: mapApplicationVerdictToConsistency(rec.postReconciliationApplicationVerdict),
    rootCause:
      rec.rootCause === 'EVIDENCE_PROPAGATION_FAILURE'
        ? 'EVIDENCE_PROPAGATION_FAILURE'
        : 'UNKNOWN',
  }),
};

export function applyRuntimeMaterializationTruthToClaims<
  T extends {
    claimId: string;
    claim?: string;
    truthMatrixVerdict: string;
    rootCause: string;
    launchImpact: string;
    contradictionDetected: boolean;
    contradictionReason: string;
    authorityVerdicts?: Array<{ authorityId: string; displayName: string; verdict: string; detail: string }>;
  },
>(claims: T[], reconciliation: RuntimeMaterializationTruthReconciliation): T[] {
  const contradictionReason = reconciliation.contradictions
    .map((c) => `${c.kind}: ${c.detail}`)
    .join(' | ');
  const patchedIds = new Set<string>();

  const result = claims.map((claim) => {
    const patchFn = RUNTIME_CLAIM_PATCH_MAP[claim.claimId as RuntimeApplicationClaimId];
    if (!patchFn) return claim;
    patchedIds.add(claim.claimId);
    const patch = patchFn(reconciliation);
    const launchImpact =
      patch.rootCause === 'EVIDENCE_PROPAGATION_FAILURE'
        ? 'HIGH'
        : patch.rootCause === 'REAL_PRODUCT_GAP'
          ? claim.launchImpact
          : patch.truthMatrixVerdict === 'PROVEN'
            ? 'NONE'
            : 'MEDIUM';
    return {
      ...claim,
      truthMatrixVerdict: patch.truthMatrixVerdict,
      rootCause: patch.rootCause,
      launchImpact,
      contradictionDetected: claim.contradictionDetected || reconciliation.contradictionCount > 0,
      contradictionReason: contradictionReason || claim.contradictionReason,
    };
  });

  const injectClaims: Array<{ claimId: RuntimeApplicationClaimId; claim: string }> = [
    { claimId: 'APPLICATION_WORKS', claim: 'Application works' },
    { claimId: 'APPLICATION_RUNS', claim: 'Application runs' },
    { claimId: 'APPLICATION_REACHABLE', claim: 'Application is reachable' },
    { claimId: 'FOUNDER_CAN_USE_APPLICATION', claim: 'Founder can use application' },
  ];

  for (const inject of injectClaims) {
    if (patchedIds.has(inject.claimId)) continue;
    const patch = RUNTIME_CLAIM_PATCH_MAP[inject.claimId](reconciliation);
    result.push({
      claimId: inject.claimId,
      claim: inject.claim,
      truthMatrixVerdict: patch.truthMatrixVerdict,
      rootCause: patch.rootCause,
      launchImpact: patch.rootCause === 'EVIDENCE_PROPAGATION_FAILURE' ? 'HIGH' : 'MEDIUM',
      contradictionDetected: reconciliation.contradictionCount > 0,
      contradictionReason:
        contradictionReason || 'RUNTIME_MATERIALIZATION_TRUTH reconciliation applied.',
      authorityVerdicts: [],
    } as unknown as T);
  }

  return result;
}

export function shouldSuppressRuntimeFailureBlocker(
  reconciliation: RuntimeMaterializationTruthReconciliation,
): boolean {
  return (
    reconciliation.founderTestVerdictReconciled &&
    (reconciliation.postReconciliationApplicationVerdict === 'APPLICATION_PROVEN' ||
      reconciliation.postReconciliationApplicationVerdict === 'APPLICATION_PARTIAL') &&
    (reconciliation.rootCause === 'EVIDENCE_PROPAGATION_FAILURE' ||
      reconciliation.rootCause === 'APPLICATION_PROVEN')
  );
}
