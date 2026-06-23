# RUNTIME_ROUTE_REACHABILITY_RECONCILIATION_REPORT

Generated: 2026-06-20T03:49:04.495Z
Workspace: build-ready-idea-1

## Truth Rules Applied

- Rule 1 — applicationBoots=true and / returns 2xx/3xx: routesReachable=true (ROOT_ROUTE_ONLY or ROUTES_REACHABLE)
- Rule 2 — applicationBoots=true and no route success: routesReachable=false, failureBoundary=ROUTE
- Rule 3 — SPA fallback 200 on unknown route: SPA_FALLBACK_PRESENT, not ROUTE_NOT_FOUND
- Rule 4 — JSON runtime health satisfies route proof but not UI render proof

## Reconciliation

| Field | Before | After |
| --- | --- | --- |
| failureBoundary | ROUTE | **FOUNDER_FLOW** |
| rootCause | ROUTE_FAILURE | **EVIDENCE_PROPAGATION_FAILURE** |
| routesReachable | false (stale) | **true** |
| failureClass | ROUTE (generic) | **ROUTES_REACHABLE** |

## Route Proof Summary

- After application boot, which discovered routes respond with usable HTTP success and where does route failure remain the true boundary?
- routesReachable=true
- uiRenderProven=true (JSON health ≠ UI proof)
- root route usable: true

Failure boundary advances beyond ROUTE when routes are reachable.