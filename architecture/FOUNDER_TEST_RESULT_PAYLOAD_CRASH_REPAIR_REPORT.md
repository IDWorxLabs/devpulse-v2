# Founder Test Result Payload Crash Repair Report

## Root Cause

- `handleFounderTestResultRequest` called `JSON.stringify` on `buildFounderTestResultResponse` which spread the entire stored payload (`...payload`) including massive `reportMarkdown`.
- Oversized reports triggered `RangeError: Invalid string length`, crashing the Node process.
- In-memory result store was wiped on crash → client stuck on Fetching Report.

## Crash Proof

```
RangeError: Invalid string length
  at sendFounderTestJson
  at handleFounderTestResultRequest
```

## Before / After Payload Model

| Endpoint | Before | After |
| --- | --- | --- |
| `/result` | Full payload + markdown in JSON | Bounded metadata; inline markdown only if ≤ 96KB |
| `/result-report` | n/a | Full markdown as `text/markdown` |
| `/result-download` | n/a | Attachment `.md` download |
| `/result-debug` | Could include large fields | Length/preview only; no full markdown |

## Files Changed

- `src/founder-test-runtime-monitor/founder-test-result-payload-crash-repair.ts`
- `server/founder-testing-handler.ts` — safe JSON + split endpoints
- `server/founder-reality-server.ts` — route registration
- `server/founder-test-server-process-metadata.ts` — store volatility on ping
- `public/founder-reality/app.js` — metadata-first + markdown endpoint fetch

## Manual Verification

```bash
curl http://localhost:4321/api/founder-test/result?runId=<runId>
curl http://localhost:4321/api/founder-test/result-report?runId=<runId>
curl -I http://localhost:4321/api/founder-test/result-download?runId=<runId>
curl "http://localhost:4321/api/founder-test/result-debug?runId=<runId>"
```

## Remaining Limitation

- Result store remains **volatile in-memory** (`storeVolatile: true`). Disk persistence not added in this phase.

---

Pass token: FOUNDER_TEST_RESULT_PAYLOAD_CRASH_REPAIR_V1_PASS
