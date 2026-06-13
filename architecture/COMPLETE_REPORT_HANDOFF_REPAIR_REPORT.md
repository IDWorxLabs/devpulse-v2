# Complete Report Handoff Repair Report

## Root Cause

- Final report was stored after `finishFounderTestRuntime()`, creating a race where COMPLETE runtime was visible before result persistence.
- Result store kept only a single global `pendingResult`, so runId-specific fetch could miss the final markdown.
- Client treated COMPLETE without cached markdown as failure/preparing indefinitely.

## Server Result Persistence Proof

- `founderTestRunResultsByRunId` stores results keyed by runId.
- `storeFounderTestRunResult` runs before and after `finishFounderTestRuntime()` with final `reportMarkdown`.
- `resolveStoredFounderTestReportMarkdown` resolves markdown from report payload.

## Endpoint Proof

- `GET /api/founder-test/result?runId=` returns HTTP 200 with `state: COMPLETE`, `reportMarkdown`, `generatedAt`, `runId` when stored.
- COMPLETE without stored result returns 202 preparing response (bounded), not Runtime Failure Report.

## Client Handoff Proof

- Copy/Open Final Report uses `resolveActiveFounderTestRunId()` and retries 3 times.
- After retries, shows COMPLETE handoff diagnostic — not infinite preparing.

## Notification Proof

- `fetchFounderTestResultWithRetry` delivers `Founder Test Report Ready` with full markdown when result arrives.

## Manual UI Verification Steps

1. Run Founder Test and wait for all 11 stages PASSED + Founder Test Complete.
2. Click **Copy Final Report** — clipboard should contain full founder report markdown (not failure/preparing).
3. Click **Open Final Report** — modal shows the same final markdown.
4. Open Notifications — entry titled **Founder Test Report Ready** with working Copy Report.
5. Refresh page, click Copy Final Report again — result fetch by runId still returns final markdown.

---

Pass token: COMPLETE_REPORT_HANDOFF_REPAIR_V1_PASS
