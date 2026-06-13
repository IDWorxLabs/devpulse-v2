# Founder Test API Base URL Routing Report

## Root Cause

- Result/result-debug fetches used relative `/api/...` paths while the UI could be served from a Vite dev port.
- Browser requests never reached the Founder Reality API server on port 4321 (`Failed to fetch`, HTTP n/a, routeReached false).

## Repair

- `buildFounderTestApiUrl` resolves the same API base as runtime-status/run polling.
- Manifest publishes `apiBaseUrl`; Vite ports fall back to `http://localhost:4321`.
- Result, result-debug, runtime-status, and run endpoints all use the shared builder.
- Handoff diagnostics include frontend origin and resolved API URLs.

## Validation

- [x] file: public/founder-reality/app.js: present
- [x] file: server/founder-reality-manifest.ts: present
- [x] file: src/founder-test-runtime-monitor/founder-test-api-base-url-routing.ts: present
- [x] file: scripts/validate-founder-test-api-base-url-routing.ts: present
- [x] shared API URL builder: builder
- [x] API base resolver: resolver
- [x] result fetch uses builder: result url
- [x] result-debug uses builder: debug url
- [x] runtime-status uses builder: status url
- [x] poll uses runtime-status builder: poll status
- [x] result retry uses builder: retry result
- [x] debug fetch uses builder: debug fetch
- [x] run endpoint uses builder: run url
- [x] no hardcoded result path in fetch calls: no hardcoded result fetch
- [x] no hardcoded debug path in fetch calls: no hardcoded debug fetch
- [x] routing diagnostic lines: routing lines
- [x] handoff includes API Routing section: api routing section
- [x] handoff includes frontend origin: frontend origin
- [x] handoff includes resolved API base: resolved base
- [x] handoff includes runtime-status URL: status url line
- [x] handoff includes result URL line: result url line
- [x] handoff includes result-debug URL line: debug url line
- [x] manifest exposes apiBaseUrl: manifest base
- [x] applyManifest reads apiBaseUrl: manifest apply
- [x] vite port fallback: vite fallback
- [x] routing module token: token
- [x] no scoring edits: scoring
- [x] no verdict logic edits: verdict
- [x] no validator recursion: recursion
- [x] package script registered: script
- [x] vite port resolves API base: http://localhost:4321
- [x] result and runtime-status share base: shared base
- [x] result url absolute: http://localhost:4321/api/founder-test/result?runId=run-123
- [x] debug url uses builder: debug url
- [x] routing lines include frontend origin: origin line
- [x] routing lines include result URL: result line
- [x] same-origin relative when base empty: relative


SUCCESS: FOUNDER_TEST_API_BASE_URL_ROUTING_REPAIR_V1_PASS
