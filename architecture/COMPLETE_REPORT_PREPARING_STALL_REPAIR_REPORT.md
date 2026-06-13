# Complete Report Preparing Stall Repair Report

## Root Cause

- COMPLETE UI stayed on "preparing report" / "Fetching Report..." indefinitely when result fetch hung or handoff never reached client cache.
- No bounded stall guard or debug endpoint to expose which handoff boundary failed.

## Repair

- Server emits handoff traces after Stage 10/11 and persists result before COMPLETE.
- `GET /api/founder-test/result-debug?runId=` exposes store/endpoint diagnostics.
- Client 10s stall guard calls result-debug and surfaces handoff diagnostic on Copy/Open.
- Result fetch uses AbortController timeout to avoid infinite Fetching.

## Files Changed

- `src/founder-test-runtime-monitor/complete-report-preparing-stall.ts`
- `server/founder-testing-handler.ts` — traces + result-debug
- `server/founder-reality-server.ts` — route
- `public/founder-reality/app.js` — stall guard + diagnostics

## Validation

- [x] file: server/founder-testing-handler.ts: present
- [x] file: server/founder-reality-server.ts: present
- [x] file: src/founder-test-runtime-monitor/complete-report-preparing-stall.ts: present
- [x] file: public/founder-reality/app.js: present
- [x] file: scripts/validate-complete-report-preparing-stall.ts: present
- [x] handoff trace markdown built: trace
- [x] handoff trace stored by runId: trace
- [x] handoff trace handoff ready: trace
- [x] store before finish: order
- [x] result-debug handler: debug handler
- [x] result-debug route: debug route
- [x] 10s stall constant: stall ms
- [x] stall guard scheduler: guard
- [x] stall trigger: trigger
- [x] result-debug client fetch: debug fetch
- [x] debug endpoint path: debug path
- [x] handoff stalled header: header
- [x] missing boundary in diagnostic: boundary
- [x] debug fields requested runId: runId
- [x] debug fields hasStoredResult: stored
- [x] debug fields hasReportMarkdown: markdown
- [x] debug fields reportMarkdownLength: length
- [x] debug fields storedRunIds: run ids
- [x] debug fields endpoint status: endpoint
- [x] fetch timeout guard: fetch timeout
- [x] client cache trace: cache trace
- [x] notification trace: notification trace
- [x] cannot stay preparing forever: stall flag
- [x] no scoring edits: scoring
- [x] no verdict logic edits: verdict
- [x] no validator recursion: recursion
- [x] package script registered: script
- [x] stall ms is 10s: 10s
- [x] trace boundaries count: boundaries
- [x] missing boundary when store empty: markdown built
- [x] debug exposes requested runId: runId
- [x] debug exposes hasStoredResult: stored
- [x] debug exposes endpoint status: endpoint
- [x] debug exposes storedRunIds: ids
- [x] debug marks handoff stalled: stalled


SUCCESS: COMPLETE_REPORT_PREPARING_STALL_REPAIR_V1_PASS
