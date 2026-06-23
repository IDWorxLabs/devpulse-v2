# RUNTIME_UI_RENDER_PROOF_REPORT

Generated: 2026-06-20T03:49:08.947Z
Proof ID: runtime-ui-render-proof-1-1781927348435
Workspace: build-ready-idea-1

## Core Question

After routes are reachable, does the runtime serve a usable user-facing UI rather than JSON-only health responses?

## Gates

- applicationBootsBeforeProbe: **true**
- routesReachableBeforeProbe: **true**

## UI Source Files

- uiSourceFilesPresent: true
- hasIndexHtml: false
- hasReactApp: true
- hasViteConfig: false
- files: build-manifest.json, runtime/dev-server.mjs, src/App.tsx, package.json

## UI Route Discovery

| Path | Source | Expectation | Confidence |
| --- | --- | --- | --- |
| / | ROOT_DEFAULT | HTML_SHELL | 1 |
| /__devpulse_spa_fallback_probe__ | ROUTE_REACHABILITY_PROOF | UNKNOWN | 0.63 |
| /__devpulse_spa_ui_probe__ | VITE_SPA_FALLBACK | SPA_ENTRY | 0.7 |
| /health | ROUTE_REACHABILITY_PROOF | UNKNOWN | 0.81 |

## UI Render Probe

- baseUrl: http://127.0.0.1:3000
- probeSkipped: false

| Path | Status | Type | JSON | Mount | Bundle | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| / | 200 | text/html; charset=utf-8 | false | true | true | UI_RENDERED |
| /__devpulse_spa_fallback_probe__ | 404 | application/json; charset=utf-8 | true | false | false | NOT_FOUND |
| /__devpulse_spa_ui_probe__ | 404 | application/json; charset=utf-8 | true | false | false | NOT_FOUND |
| /health | 200 | application/json; charset=utf-8 | true | false | false | JSON_ONLY |

## Classification

- failureClass: **UI_RENDERED**
- uiRenders: **true**
- rootRouteJsonOnly: false
- uiFailureReason: At least one UI route returned HTML with root mount and script bundle (Rule 1).

## Recommended Actions

- Run founder-critical workflow proof
- Do not claim APPLICATION_PROVEN until founder flow passes (Rule 5)

Cache key: `runtime-ui-render-proof-v1:94f3790125b93977`