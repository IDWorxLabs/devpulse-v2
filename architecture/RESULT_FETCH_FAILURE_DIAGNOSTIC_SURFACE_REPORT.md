# Result Fetch Failure Diagnostic Surface Report

## Root Cause

- Copy/Open handoff diagnostics only showed generic "Failed to fetch" with no proof of URL, HTTP status, content-type, or store state.

## Repair

- `/api/founder-test/result-debug` returns routeReached, store fields, runtimeState, generatedAt, contentTypeExpected.
- Client records requested URL/runId, HTTP status, content-type, JSON parse preview, and result-debug response.
- On fetch failure, client immediately calls result-debug with the same runId and embeds output in Copy Handoff Diagnostic.

## Files Changed

- `src/founder-test-runtime-monitor/result-fetch-failure-diagnostic-surface.ts`
- `src/founder-test-runtime-monitor/complete-report-preparing-stall.ts`
- `public/founder-reality/app.js`

## Validation

- [x] file: server/founder-testing-handler.ts: present
- [x] file: server/founder-reality-server.ts: present
- [x] file: src/founder-test-runtime-monitor/result-fetch-failure-diagnostic-surface.ts: present
- [x] file: public/founder-reality/app.js: present
- [x] file: scripts/validate-result-fetch-failure-diagnostic-surface.ts: present
- [x] result-debug handler: handler
- [x] result-debug route: route
- [x] routeReached in debug builder: builder
- [x] client records requested URL: url
- [x] client records requested runId: runId
- [x] client records HTTP status: status
- [x] client records content-type: content-type
- [x] JSON parse failure preview: preview
- [x] parse helper: parse helper
- [x] debug after fetch failure: debug attach
- [x] fetch retry calls debug attach: retry debug
- [x] handoff diagnostic includes fetch section: fetch section
- [x] handoff diagnostic includes debug section: debug section
- [x] diagnostic storedRunIds: storedRunIds
- [x] diagnostic reportMarkdownLength: length
- [x] result-debug URL builder: debug url
- [x] no scoring edits: scoring
- [x] no verdict logic edits: verdict
- [x] no validator recursion: recursion
- [x] package script registered: script
- [x] debug routeReached true: routeReached
- [x] debug contentTypeExpected: content type
- [x] debug generatedAt present: generatedAt
- [x] debug storedRunIds array: storedRunIds
- [x] debug reportMarkdownLength number: length
- [x] non-json preview capped: preview cap
- [x] debug url includes runId: debug url runId
- [x] fetch lines include url: url line
- [x] fetch lines include status: status line
- [x] debug lines include routeReached: route line
- [x] debug lines include reportMarkdownLength: length line


SUCCESS: RESULT_FETCH_FAILURE_DIAGNOSTIC_SURFACE_V1_PASS
