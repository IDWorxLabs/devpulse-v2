/**
 * Authority verdict reconciliation — propagation rules 1–5 (Phase 26.88).
 */

import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { ReconciledTruthClaim } from '../founder-truth-matrix-integration/founder-truth-matrix-integration-types.js';
import { EVIDENCE_PROPAGATION_RECONCILIATION_RULES } from './evidence-propagation-reconciliation-registry.js';
import type {
  AuthorityEvidenceSource,
  AuthorityVerdictContradiction,
  AuthoritativeRuntimeTruth,
  EvidencePropagationReconciliation,
  EvidencePropagationRootCause,
  StaleEvidenceFinding,
} from './evidence-propagation-reconciliation-types.js';

function authoritativeApplicationVerdict(authoritative: AuthoritativeRuntimeTruth): ConsistencyVerdict {
  if (authoritative.finalApplicationTruth === 'APPLICATION_PROVEN') return 'PROVEN';
  if (authoritative.finalApplicationTruth === 'APPLICATION_PARTIAL') return 'PARTIAL';
  return 'NOT_PROVEN';
}

function verdictsAgree(
  sources: readonly AuthorityEvidenceSource[],
  authoritativeVerdict: ConsistencyVerdict,
): boolean {
  return sources.every(
    (source) =>
      source.applicationVerdict === 'UNKNOWN' ||
      source.applicationVerdict === authoritativeVerdict ||
      (authoritativeVerdict === 'PROVEN' && source.applicationVerdict === 'PARTIAL'),
  );
}

export function detectAuthorityContradictions(input: {
  authoritative: AuthoritativeRuntimeTruth;
  sources: readonly AuthorityEvidenceSource[];
}): AuthorityVerdictContradiction[] {
  const authoritativeVerdict = authoritativeApplicationVerdict(input.authoritative);
  if (authoritativeVerdict !== 'PROVEN') return [];

  const contradictions: AuthorityVerdictContradiction[] = [];
  for (const source of input.sources) {
    if (source.applicationVerdict === 'NOT_PROVEN' || source.applicationVerdict === 'PARTIAL') {
      contradictions.push({
        readOnly: true,
        authorityId: source.authorityId,
        displayName: source.displayName,
        authorityVerdict: source.applicationVerdict,
        authoritativeVerdict,
        rootCause: source.evidenceStale ? 'STALE_EVIDENCE' : 'EVIDENCE_PROPAGATION_FAILURE',
        detail: `${source.displayName} reports ${source.applicationVerdict} while authoritative runtime truth is APPLICATION_PROVEN`,
      });
    }
  }
  return contradictions;
}

function patchClaimForPropagation(
  claim: ReconciledTruthClaim,
  authoritative: AuthoritativeRuntimeTruth,
): ReconciledTruthClaim {
  const authoritativeVerdict = authoritativeApplicationVerdict(authoritative);
  if (authoritative.finalApplicationTruth !== 'APPLICATION_PROVEN') return claim;

  const applicationClaims = new Set([
    'APPLICATION_RUNS',
    'APPLICATION_REACHABLE',
    'APPLICATION_WORKS',
    'IDEA_TO_LAUNCH',
    'LAUNCH_READINESS_VERDICT',
  ]);

  if (!applicationClaims.has(claim.claimId) && claim.claimId !== 'BUILD_MATERIALIZATION') {
    return claim;
  }

  if (claim.truthMatrixVerdict === authoritativeVerdict) return claim;

  return {
    ...claim,
    truthMatrixVerdict: authoritativeVerdict,
    rootCause:
      claim.rootCause === 'REAL_PRODUCT_GAP' ? 'EVIDENCE_PROPAGATION_FAILURE' : claim.rootCause,
    launchImpact: claim.rootCause === 'REAL_PRODUCT_GAP' ? 'NONE' : claim.launchImpact,
    contradictionDetected: true,
    contradictionReason: `Reconciled to authoritative runtime truth (${authoritative.finalApplicationTruth})`,
    authorityVerdicts: claim.authorityVerdicts.map((record) =>
      record.verdict === 'NOT_PROVEN' || record.verdict === 'PARTIAL'
        ? { ...record, verdict: authoritativeVerdict, detail: `${record.detail} [reconciled]` }
        : record,
    ),
  };
}

export function applyEvidencePropagationReconciliationToClaims(
  claims: ReconciledTruthClaim[],
  authoritative: AuthoritativeRuntimeTruth,
): ReconciledTruthClaim[] {
  return claims.map((claim) => patchClaimForPropagation(claim, authoritative));
}

function reconcileLaunchVerdict(
  pre: LaunchReadinessVerdict | null,
  authoritative: AuthoritativeRuntimeTruth,
  staleEvidence: readonly StaleEvidenceFinding[],
): LaunchReadinessVerdict | null {
  if (!pre) return null;
  if (authoritative.finalApplicationTruth !== 'APPLICATION_PROVEN') return pre;

  const blockedOnlyByStale =
    staleEvidence.length > 0 &&
    (pre === 'NOT_LAUNCH_READY' || pre === 'INSUFFICIENT_EVIDENCE');

  if (blockedOnlyByStale || pre === 'NOT_LAUNCH_READY' || pre === 'INSUFFICIENT_EVIDENCE') {
    return 'LAUNCH_READY_WITH_WARNINGS';
  }
  return pre;
}

export function reconcileAuthorityVerdicts(input: {
  reconciliationId: string;
  authoritative: AuthoritativeRuntimeTruth;
  sources: AuthorityEvidenceSource[];
  staleEvidence: StaleEvidenceFinding[];
  contradictions: AuthorityVerdictContradiction[];
  reconciledClaims: ReconciledTruthClaim[];
  preLaunchVerdict: LaunchReadinessVerdict | null;
}): EvidencePropagationReconciliation {
  const rulesApplied: string[] = [];
  const authoritativeVerdict = authoritativeApplicationVerdict(input.authoritative);

  let postClaims = applyEvidencePropagationReconciliationToClaims(
    input.reconciledClaims,
    input.authoritative,
  );

  let rootCause: EvidencePropagationRootCause = 'NONE';
  let postApplicationTruth = input.authoritative.finalApplicationTruth;

  const preAgreement = verdictsAgree(input.sources, authoritativeVerdict);

  if (
    input.authoritative.filesExistOnDisk &&
    input.authoritative.applicationBoots &&
    input.authoritative.routesReachable &&
    input.authoritative.uiRenders &&
    input.authoritative.founderFlowProven
  ) {
    rulesApplied.push(EVIDENCE_PROPAGATION_RECONCILIATION_RULES[0]);
    postApplicationTruth = 'APPLICATION_PROVEN';
  }

  if (input.contradictions.some((c) => c.rootCause === 'EVIDENCE_PROPAGATION_FAILURE')) {
    rulesApplied.push(EVIDENCE_PROPAGATION_RECONCILIATION_RULES[1]);
    rootCause = 'EVIDENCE_PROPAGATION_FAILURE';
  }

  if (input.staleEvidence.length > 0) {
    rulesApplied.push(EVIDENCE_PROPAGATION_RECONCILIATION_RULES[2]);
    if (rootCause === 'NONE') rootCause = 'STALE_EVIDENCE';
  }

  const reconciledSources = input.sources.map((source) => {
    const contradicts = input.contradictions.some((c) => c.authorityId === source.authorityId);
    if (!contradicts || postApplicationTruth !== 'APPLICATION_PROVEN') return source;
    return {
      ...source,
      applicationVerdict: 'PROVEN' as ConsistencyVerdict,
      contradictsAuthoritativeRuntime: false,
      consumesRuntimeBridge: source.consumesRuntimeBridge || input.authoritative.runtimeBridgeConsumed,
      detail: `${source.detail} [reconciled to APPLICATION_PROVEN]`,
    };
  });

  const postAgreement = verdictsAgree(reconciledSources, 'PROVEN');

  if (postAgreement) {
    rulesApplied.push(EVIDENCE_PROPAGATION_RECONCILIATION_RULES[3]);
  }

  const postLaunchVerdict = reconcileLaunchVerdict(
    input.preLaunchVerdict,
    input.authoritative,
    input.staleEvidence,
  );
  if (postLaunchVerdict !== input.preLaunchVerdict) {
    rulesApplied.push(EVIDENCE_PROPAGATION_RECONCILIATION_RULES[4]);
  }

  if (postApplicationTruth === 'APPLICATION_PROVEN' && rootCause === 'NONE') {
    rootCause = 'APPLICATION_PROVEN';
  }

  const launchReadinessBlockedByStaleProof =
    input.staleEvidence.length > 0 &&
    input.preLaunchVerdict === 'NOT_LAUNCH_READY' &&
    postLaunchVerdict !== 'NOT_LAUNCH_READY';

  let recommendedFix = 'Authorities aligned with authoritative runtime truth.';
  if (rootCause === 'EVIDENCE_PROPAGATION_FAILURE') {
    recommendedFix =
      'Downstream authorities report failure despite APPLICATION_PROVEN runtime truth — propagate Runtime Materialization Truth Bridge verdicts.';
  } else if (rootCause === 'STALE_EVIDENCE') {
    recommendedFix =
      'Replace stale workspace/run/manifest references with authoritative runtime bridge evidence.';
  }

  return {
    readOnly: true,
    reconciliationId: input.reconciliationId,
    generatedAt: new Date().toISOString(),
    operationId: 'EVIDENCE_PROPAGATION_RECONCILIATION',
    authoritativeRuntimeTruth: input.authoritative,
    authorityEvidenceSources: reconciledSources,
    staleEvidence: input.staleEvidence,
    contradictions: input.contradictions,
    rulesApplied,
    preReconciliationApplicationTruth: input.authoritative.finalApplicationTruth,
    postReconciliationApplicationTruth: postApplicationTruth,
    preAuthorityAgreement: preAgreement,
    postAuthorityAgreement: postAgreement,
    authorityAgreement: postAgreement,
    rootCause,
    launchReadinessBlockedByStaleProof,
    reconciledClaims: postClaims,
    preLaunchVerdict: input.preLaunchVerdict,
    postLaunchVerdict,
    recommendedFix,
  };
}
