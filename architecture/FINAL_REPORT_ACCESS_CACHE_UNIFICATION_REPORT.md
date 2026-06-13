# Final Report Access Cache Unification Report

## Root Cause

- Notifications received the final report markdown, but Operator Feed Copy/Open bypassed the delivered cache.
- Buttons always attempted `/api/founder-test/result` fetch for COMPLETE runs, showing Fetching/Failed even when markdown was already local.

## Cache Unification

- `founderTestFinalReportsByRunId[runId]` is the local source of truth.
- Notification delivery writes to this cache immediately.
- Result payload application also writes to this cache.

## Operator Feed Priority

1. Local final report cache by runId
2. `lastFounderTestReport.reportMarkdown`
3. Notification report markdown by runId
4. Result endpoint fetch (bounded retries)
5. COMPLETE handoff diagnostic fallback

## Manual UI Verification Steps

1. Run Founder Test to COMPLETE — confirm notification **Founder Test Report Ready** appears.
2. Without refreshing, click **Copy Final Report** on Operator Feed — clipboard should fill immediately (no Fetching).
3. Click **Open Final Report** — modal shows full markdown immediately.
4. Disconnect network or stop server, click Copy again — cached report still copies (no Failed to fetch).

---

Pass token: FINAL_REPORT_ACCESS_CACHE_UNIFICATION_V1_PASS
