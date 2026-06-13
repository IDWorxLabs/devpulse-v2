# Remove Legacy Failed To Fetch Copy Fallback Report

## Root Cause

- COMPLETE runs could still copy `# Founder Test Runtime Failure Report` with generic `Failed to fetch`.
- Legacy fallthrough paths in copy payload, report delivery, notifications, and showFounderTestError bypassed Phase 26.64 diagnostics.

## Repair

- `buildCompleteFounderTestHandoffDiagnostic` is the single COMPLETE copy fallback with fetch/debug fields.
- `buildRuntimeFailureReportText` redirects COMPLETE snapshots to handoff diagnostic output.
- Modal, Operator Feed, notification, delivery, and error handlers forbid generic Failed to fetch for COMPLETE.

## Validation

- [x] file: public/founder-reality/app.js: present
- [x] file: src/founder-test-runtime-monitor/remove-legacy-failed-to-fetch-copy-fallback.ts: present
- [x] file: scripts/validate-remove-legacy-failed-to-fetch-copy-fallback.ts: present
- [x] complete handoff builder: builder
- [x] generic fetch detector: fetch detector
- [x] runtime failure guard for COMPLETE: runtime guard
- [x] copy payload guards COMPLETE snapshot fallthrough: payload fallthrough
- [x] complete fallback uses handoff diagnostic: complete fallback
- [x] report delivery COMPLETE handoff branch: delivery branch
- [x] showFounderTestError COMPLETE branch: error branch
- [x] notification copy uses handoff resolver for COMPLETE: notification copy
- [x] modal copy uses shared handoff resolver: modal copy
- [x] copy payload does not emit runtime failure for COMPLETE in primary branch: no complete runtime failure
- [x] handoff heading present: heading
- [x] requested URL in handoff: url
- [x] routeReached in handoff: routeReached
- [x] storedRunIds in handoff: storedRunIds
- [x] hasStoredResult in handoff: hasStoredResult
- [x] hasReportMarkdown in handoff: hasReportMarkdown
- [x] reportMarkdownLength in handoff: length
- [x] fallback module token: token
- [x] no scoring edits: scoring
- [x] no verdict logic edits: verdict
- [x] no validator recursion: recursion
- [x] package script registered: script
- [x] detect generic failed to fetch: detect
- [x] block runtime failure for COMPLETE: block
- [x] use handoff when fetch failed on COMPLETE: handoff when failed
- [x] sample handoff includes required fields: fields
- [x] sample handoff excludes generic runtime failure shape: no generic failure
- [x] runtime failure heading distinct from handoff: headings
- [x] legacy failure detected as invalid complete copy: legacy invalid


SUCCESS: REMOVE_LEGACY_FAILED_TO_FETCH_COPY_FALLBACK_V1_PASS
