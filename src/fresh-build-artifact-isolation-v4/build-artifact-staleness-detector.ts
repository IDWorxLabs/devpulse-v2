/**
 * Build Artifact Staleness Detector.
 *
 * Runs before product faithfulness evaluation, live preview proof, report rendering, and UI
 * result display. Compares each evidence object's metadata against the current runtime evidence
 * scope and blocks anything that carries a previous build/request/project/prompt identity, has no
 * scoping metadata at all, or is a category-specific stale artifact (generated module, routes,
 * navigation, materialization manifest, runtime activation result, engineering report summary, UI
 * project summary).
 *
 * A projectId mismatch is never exempted, for any decision — cross-project evidence leakage is
 * always blocked. A buildId/promptHash mismatch is exempted only when the caller has explicitly
 * marked the candidate as an inherited project artifact for CONTINUE_EXISTING_PROJECT (requirement:
 * "inherited namespaces must be explicit and justified").
 */

import {
  type EvidenceCandidate,
  type EvidenceKind,
  type StaleEvidenceDetection,
  type StaleEvidenceLeakageKind,
  type StalenessCheckInput,
  type StalenessCheckResult,
} from './fresh-build-artifact-isolation-types.js';

const EVIDENCE_KIND_TO_SPECIFIC_STALE_KIND: Partial<Record<EvidenceKind, StaleEvidenceLeakageKind>> = {
  WORKSPACE_PATH_REFERENCE: 'PREVIOUS_WORKSPACE_PATH_EVIDENCE',
  PREVIEW_DOM_EVIDENCE: 'UNSCOPED_PREVIEW_DOM_EVIDENCE',
  PRODUCT_FAITHFULNESS_REPORT: 'UNSCOPED_PRODUCT_FAITHFULNESS_REPORT',
  GENERATED_MODULE_MANIFEST: 'STALE_GENERATED_MODULE',
  GENERATED_ROUTES: 'STALE_ROUTES_NAVIGATION',
  GENERATED_NAVIGATION: 'STALE_ROUTES_NAVIGATION',
  MATERIALIZATION_MANIFEST: 'STALE_MATERIALIZATION_MANIFEST',
  RUNTIME_ACTIVATION_RESULT: 'STALE_RUNTIME_ACTIVATION_RESULT',
  ENGINEERING_REPORT_SUMMARY: 'STALE_ENGINEERING_REPORT_SUMMARY',
  UI_PROJECT_SUMMARY: 'STALE_UI_PROJECT_SUMMARY',
};

function detection(
  kind: StaleEvidenceLeakageKind,
  evidenceKind: EvidenceKind | null,
  detail: string,
): StaleEvidenceDetection {
  return { kind, detected: true, blocked: true, evidenceKind, detail };
}

function hasCompleteMetadata(metadata: EvidenceCandidate['metadata']): metadata is {
  requestId: string;
  buildId: string;
  projectId: string;
  promptHash: string;
  productIdentity: string | null;
  createdAt: string;
  evidenceKind: EvidenceKind;
} {
  if (!metadata) return false;
  return (
    typeof metadata.requestId === 'string' &&
    metadata.requestId.length > 0 &&
    typeof metadata.buildId === 'string' &&
    metadata.buildId.length > 0 &&
    typeof metadata.projectId === 'string' &&
    metadata.projectId.length > 0 &&
    typeof metadata.promptHash === 'string' &&
    metadata.promptHash.length > 0 &&
    typeof metadata.createdAt === 'string' &&
    metadata.createdAt.length > 0 &&
    typeof metadata.evidenceKind === 'string'
  );
}

function checkCandidate(candidate: EvidenceCandidate, scope: StalenessCheckInput['scope']): StaleEvidenceDetection[] {
  const detections: StaleEvidenceDetection[] = [];
  const { metadata, evidenceKind } = candidate;

  if (!hasCompleteMetadata(metadata)) {
    detections.push(
      detection(
        'UNSCOPED_EVIDENCE_MISSING_METADATA',
        evidenceKind,
        `Evidence of kind ${evidenceKind} is missing required freshness metadata (requestId/buildId/projectId/promptHash/createdAt/evidenceKind) and is treated as unscoped.`,
      ),
    );
    return detections;
  }

  const inherited = candidate.explicitlyInheritedProjectArtifact === true && scope.decision === 'CONTINUE_EXISTING_PROJECT';
  let stale = false;

  if (metadata.requestId !== scope.requestId) {
    detections.push(detection('PREVIOUS_REQUEST_ID_EVIDENCE', evidenceKind, `Evidence requestId "${metadata.requestId}" does not match current requestId "${scope.requestId}".`));
    stale = true;
  }
  if (!inherited && metadata.buildId !== scope.buildId) {
    detections.push(detection('PREVIOUS_BUILD_ID_EVIDENCE', evidenceKind, `Evidence buildId "${metadata.buildId}" does not match current buildId "${scope.buildId}".`));
    stale = true;
  }
  if (metadata.projectId !== scope.projectId) {
    detections.push(detection('PREVIOUS_PROJECT_ID_EVIDENCE', evidenceKind, `Evidence projectId "${metadata.projectId}" does not match current projectId "${scope.projectId}" — never exempted.`));
    stale = true;
  }
  if (!inherited && metadata.promptHash !== scope.promptHash) {
    detections.push(detection('PREVIOUS_PROMPT_HASH_EVIDENCE', evidenceKind, `Evidence promptHash "${metadata.promptHash}" does not match current promptHash "${scope.promptHash}".`));
    stale = true;
  }
  if (candidate.workspacePathReferenced && metadata.projectId !== scope.projectId) {
    detections.push(detection('PREVIOUS_WORKSPACE_PATH_EVIDENCE', evidenceKind, `Referenced workspace path "${candidate.workspacePathReferenced}" belongs to a different project than the current build.`));
    stale = true;
  }

  if (stale) {
    const specificKind = EVIDENCE_KIND_TO_SPECIFIC_STALE_KIND[evidenceKind];
    if (specificKind && !detections.some((d) => d.kind === specificKind)) {
      detections.push(detection(specificKind, evidenceKind, `Evidence of kind ${evidenceKind} carries stale scope and is blocked from the current build's result.`));
    }
  }

  return detections;
}

/**
 * Per-candidate staleness verdicts, in the same order as `input.evidenceObjects`. Deliberately
 * per-object rather than per-kind: a stale evidence object must never "poison" a fresh object of
 * the same kind (e.g. one stale PRODUCT_FAITHFULNESS_REPORT lingering alongside the current
 * build's own fresh PRODUCT_FAITHFULNESS_REPORT) — each object is judged on its own metadata.
 */
function checkAllCandidates(input: StalenessCheckInput): Array<{ candidate: EvidenceCandidate; detections: StaleEvidenceDetection[] }> {
  return input.evidenceObjects.map((candidate) => ({ candidate, detections: checkCandidate(candidate, input.scope) }));
}

export function runBuildArtifactStalenessCheck(input: StalenessCheckInput): StalenessCheckResult {
  const perCandidate = checkAllCandidates(input);
  const detections: StaleEvidenceDetection[] = perCandidate.flatMap((c) => c.detections);

  const allEvidenceKinds = new Set<EvidenceKind>();
  const blockedEvidenceKinds = new Set<EvidenceKind>();
  const usableEvidenceKinds = new Set<EvidenceKind>();
  for (const { candidate, detections: candidateDetections } of perCandidate) {
    allEvidenceKinds.add(candidate.evidenceKind);
    if (candidateDetections.length > 0) {
      blockedEvidenceKinds.add(candidate.evidenceKind);
    } else {
      usableEvidenceKinds.add(candidate.evidenceKind);
    }
  }

  return {
    readOnly: true,
    passed: detections.length === 0,
    detections,
    blockedEvidenceKinds: [...blockedEvidenceKinds],
    usableEvidenceKinds: [...usableEvidenceKinds],
  };
}

/**
 * Convenience split used by callers (e.g. faithfulness scoring, live preview proof) that must
 * never consume blocked evidence — partitions per evidence *object*, not per kind, so a fresh
 * object is never dropped just because a stale object of the same kind is also present.
 */
export function partitionEvidenceByStaleness(
  input: StalenessCheckInput,
): { usable: EvidenceCandidate[]; blocked: EvidenceCandidate[]; result: StalenessCheckResult } {
  const perCandidate = checkAllCandidates(input);
  const usable: EvidenceCandidate[] = [];
  const blocked: EvidenceCandidate[] = [];
  for (const { candidate, detections } of perCandidate) {
    (detections.length > 0 ? blocked : usable).push(candidate);
  }
  const result = runBuildArtifactStalenessCheck(input);
  return { usable, blocked, result };
}
