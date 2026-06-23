# BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT

Generated: 2026-06-19T14:55:25.728Z

## Objective

Reconcile Founder Test BUILD verdicts with filesystem evidence from Build Materialization Reality.

## Reconciliation rules

- Rule 1 — missingArtifacts=0 + existingArtifacts>0 + workspaceExists: ARTIFACTS_NOT_GENERATED cannot be root cause
- Rule 2 — BUILD_MATERIALIZATION_PROVEN: Truth Matrix must not classify BUILD as NOT_PROVEN without contradictory evidence
- Rule 3 — Filesystem evidence outranks stale proof snapshots
- Rule 4 — Files exist but downstream proof cannot see them: EVIDENCE_PROPAGATION_FAILURE not ARTIFACTS_NOT_GENERATED

## Pre vs post reconciliation

| Field | Pre | Post |
|-------|-----|------|
| BUILD truth | BUILD_PARTIAL | **BUILD_PROVEN** |
| Root cause | — | **BUILD_MATERIALIZATION_PROVEN** |
| Materialization verdict | — | **BUILD_MATERIALIZATION_PROVEN** |

## Filesystem evidence vs Founder Test

| Signal | Value |
|--------|-------|
| workspaceCount | 2991 |
| existingArtifacts | 88 |
| missingArtifacts | 0 |
| workspaceExists | true |
| materializationVerdict | BUILD_MATERIALIZATION_PROVEN |
| founderBuildProofLevel | PARTIAL |
| founderFirstBrokenLink | artifacts→files |
| truthMatrixBuildVerdict | n/a |

## Contradictions

- **ARTIFACTS_MISREPORTED_MISSING**: Founder Test reported artifacts→files broken but disk evidence shows files exist with missingArtifacts=0.
  - Founder: BUILD PARTIAL, firstBrokenLink=artifacts→files
  - Disk: existingArtifacts=88, missingArtifacts=0, workspaceCount=2991
- **PROOF_STALE_VS_DISK**: Connected build proof stale relative to disk — downstream authorities cannot see existing files.
  - Founder: connectedBuildProofLevel=PROVEN, firstBrokenLink=artifacts→files
  - Disk: existingArtifacts=88, materializationVerdict=BUILD_MATERIALIZATION_PROVEN

## Final BUILD truth

**BUILD_PROVEN** (rootCause=BUILD_MATERIALIZATION_PROVEN)

## Recommended fix

Build materialization proven on disk — advance RUNTIME execution proof.
