# RUNTIME_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT

Generated: 2026-06-20T04:01:49.284Z

## Objective

Extend proof from BUILD_PROVEN to APPLICATION_PROVEN using runtime evidence.

## Reconciliation rules

- Rule 1 — boots + routes + UI + critical flow: APPLICATION_PROVEN even if downstream reporting disagrees
- Rule 2 — files exist but startup fails: APPLICATION_NOT_PROVEN, rootCause=RUNTIME_START_FAILURE
- Rule 3 — boots but route failures: APPLICATION_PARTIAL, rootCause=ROUTE_FAILURE
- Rule 4 — runtime succeeds but Founder Test reports failure: EVIDENCE_PROPAGATION_FAILURE not APPLICATION_NOT_PROVEN

## Pre vs post reconciliation

| Field | Pre | Post |
|-------|-----|------|
| APPLICATION truth | APPLICATION_PARTIAL | **APPLICATION_PARTIAL** |
| Root cause | — | **EVIDENCE_PROPAGATION_FAILURE** |
| Failure boundary | — | **FOUNDER_FLOW** |

## FILES_EXIST vs APPLICATION_WORKS

| Signal | Value |
|--------|-------|
| filesExistOnDisk | true |
| applicationBoots | true |
| routesReachable | true |
| uiRenders | true |
| runtimeProofLevel | PARTIAL |
| founderRuntimeProofLevel | PARTIAL |

## Final APPLICATION truth

**APPLICATION_PARTIAL** (rootCause=EVIDENCE_PROPAGATION_FAILURE, boundary=FOUNDER_FLOW)

## Recommended fix

Runtime evidence proves application activity — fix reporting propagation into Founder Test and Truth Matrix.
