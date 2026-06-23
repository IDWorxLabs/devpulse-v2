# RUNTIME_ROUTE_REACHABILITY_PROOF_REPORT

Generated: 2026-06-20T03:49:04.495Z
Proof ID: runtime-route-reachability-proof-1-1781927343972
Workspace: build-ready-idea-1

## Core Question

After application boot, which discovered routes respond with usable HTTP success and where does route failure remain the true boundary?

## Startup Gate

- applicationBootsBeforeProbe: **true**
- startup probe health: true
- startup firstResponseStatus: 200

## Route Discovery

| Path | Source | Expectation | Confidence |
| --- | --- | --- | --- |
| / | ROOT_DEFAULT | ROOT_RESPONSE | 1 |
| /__devpulse_spa_fallback_probe__ | VITE_SPA_FALLBACK | SPA_FALLBACK | 0.7 |
| /health | DEV_SERVER | HEALTH_JSON | 0.9 |

## Route Probe Session

- baseUrl: http://127.0.0.1:3000
- port: 3000
- runtimeBootedBeforeProbe: true
- probeSkipped: false
- cleanupStatus: CLEANED

| Route | Status | Verdict | Response Type | Elapsed ms |
| --- | --- | --- | --- | --- |
| / | 200 | SUCCESS | html | 11 |
| /__devpulse_spa_fallback_probe__ | 404 | NOT_FOUND | json | 1 |
| /health | 200 | SUCCESS | json | 0 |

## Classification

- failureClass: **ROUTES_REACHABLE**
- routesReachable: **true**
- rootRouteReachable: true
- uiRenderProven: true
- routeFailureReason: Multiple discovered routes returned HTTP success.

## Recommended Actions

- Verify UI render if HTML expected
- Continue founder-critical workflow proof

Cache key: `runtime-route-reachability-proof-v1:ad04013db2490945`