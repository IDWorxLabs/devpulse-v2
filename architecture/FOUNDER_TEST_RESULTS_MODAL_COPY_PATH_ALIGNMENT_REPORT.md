# Founder Test Results Modal Copy Path Alignment Report

## Root Cause

- Founder Test Results panel copy used a modal-only path that could fall back to generic Runtime Failure Report text.
- Operator Feed already used the shared handoff resolver with Phase 26.64 fetch/debug diagnostics.

## Repair

- `copyFounderTestReportHandoffShared` and `openFounderTestReportHandoffShared` unify modal, Operator Feed, and notifications copy/open.
- Results panel labels use `resolveFounderTestResultsPanelReportActionLabels` (Final Report / Handoff Diagnostic / Runtime Diagnostic).
- COMPLETE handoff stalls route through `buildResultFetchFailureHandoffDiagnostic` instead of `buildRuntimeFailureReportText`.

## Validation

- [x] file: public/founder-reality/app.js: present
- [x] file: public/founder-reality/index.html: present
- [x] file: src/founder-test-runtime-monitor/founder-test-results-modal-copy-path-alignment.ts: present
- [x] file: scripts/validate-founder-test-results-modal-copy-path-alignment.ts: present
- [x] shared copy resolver: shared copy
- [x] shared open resolver: shared open
- [x] shared handoff text resolver: handoff text
- [x] modal copy uses shared resolver: modal copy
- [x] operator feed copy uses shared resolver: operator copy
- [x] modal open uses shared resolver: modal open
- [x] results panel open uses shared resolver: panel open
- [x] results panel open button: open button
- [x] panel label resolver: panel labels
- [x] handoff diagnostic helper: handoff helper
- [x] fetch failure handoff builder: handoff builder
- [x] modal copy includes requested URL: requested url
- [x] modal copy includes requested runId: requested runId
- [x] modal copy includes runtime card runId: runtime card runId
- [x] modal copy includes resolved active runId: resolved runId
- [x] modal copy includes HTTP status: http status
- [x] modal copy includes content-type: content-type
- [x] modal copy includes parse preview: parse preview
- [x] modal copy includes routeReached: routeReached
- [x] modal copy includes storedRunIds: storedRunIds
- [x] modal copy includes hasStoredResult: hasStoredResult
- [x] modal copy includes hasReportMarkdown: hasReportMarkdown
- [x] modal copy includes reportMarkdownLength: report length
- [x] complete handoff avoids runtime failure report: complete guard
- [x] copyFounderTestReport does not call buildRuntimeFailureReportText: no runtime failure in modal copy
- [x] handoff diagnostic button label: handoff label
- [x] runtime diagnostic button label: runtime label
- [x] alignment module token: token
- [x] no scoring edits: scoring
- [x] no verdict logic edits: verdict
- [x] no validator recursion: recursion
- [x] package script registered: script
- [x] handoff diagnostic when stalled: stalled
- [x] avoid runtime failure for complete handoff: avoid runtime failure
- [x] panel handoff label when stalled: handoff label
- [x] panel runtime diagnostic label: runtime label


SUCCESS: FOUNDER_TEST_RESULTS_MODAL_COPY_PATH_ALIGNMENT_V1_PASS
