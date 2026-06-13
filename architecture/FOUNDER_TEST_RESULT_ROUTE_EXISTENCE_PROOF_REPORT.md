# Founder Test Result Route Existence Proof Report (Phase 26.70A)

## Objective

Prove which boundary fails — without repairing handoff yet.

## Failure Boundary Matrix

| Symptom | Boundary | Proof step |
| --- | --- | --- |
| `Failed to fetch`, ping fails | **C/D — route unreachable or wrong base** | `GET /api/founder-test/ping` from browser + compare resolved API base |
| ping OK, result-debug 404 route | **C — route missing** | Startup log must list routes; static registration in `founder-reality-server.ts` |
| ping OK, debug `routeReached: false` | **C — route missing** | Should not happen if handler reached |
| ping OK, debug `hasStoredResult: false` | **B/E — store empty or server restarted** | Compare `serverStartedAt` vs run `completedAt` |
| `serverStartedAt` > run `completedAt` | **E — server restarted / memory loss** | In-memory store cleared on process exit |
| debug `hasStoredResult: true`, no markdown | **A/B — report never persisted** | Generation succeeded but store payload empty |
| Vite port 5173 fetching relative `/api/...` | **D — wrong API base** | Must resolve to `http://localhost:4321` |

## Static Proof — Route Registration

Registered in `server/founder-reality-server.ts`:

- `GET /api/founder-test/ping` → `handleFounderTestPingRequest` (temporary diagnostic)
- `GET /api/founder-test/result` → `handleFounderTestResultRequest`
- `GET /api/founder-test/result-debug` → `handleFounderTestResultDebugRequest`
- `GET /api/founder-test/runtime-status` → `handleFounderTestRuntimeStatusRequest`

Startup logs now print listening port, pid, serverStartedAt, and registered Founder Test routes.

## Static Proof — Result Store

- `founderTestRunResultsByRunId` is a **process-local `Map`** (`founder-test-run-result-store.ts`).
- **No disk persistence.** Process exit or restart = total store loss (boundary **E**).
- Max 16 entries; oldest trimmed by `completedAt`.

## Static Proof — Frontend API Base

Resolution order in `public/founder-reality/app.js` → `resolveFounderTestApiBaseUrl()`:

1. `founderTestApiBaseUrlOverride`
2. `manifestData.apiBaseUrl`
3. `window.__DEVPULSE_FOUNDER_TEST_API_BASE__`
4. `founderTestApiResolvedOrigin` (from prior successful fetch)
5. Vite ports `5173|5174|3000` → **`http://localhost:4321`**
6. Else `window.location.origin`

Active server port: **4321** (`FOUNDER_REALITY_PORT` in `founder-reality-manifest.ts`).

## Temporary Diagnostic — GET /api/founder-test/ping

```json
{
  "routeReached": true,
  "serverStartedAt": "<ISO>",
  "processId": <number>,
  "uptimeSeconds": <number>,
  "listeningPort": 4321,
  "listeningHost": "0.0.0.0"
}
```

`GET /api/founder-test/result-debug?runId=<runId>` also returns `serverStartedAt`, `processId`, `uptimeSeconds` for restart comparison.

## Observed Runtime Evidence (Terminal)

Prior dev session showed **process crash** during `handleFounderTestResultRequest`:

- `RangeError: Invalid string length` at `JSON.stringify` in `sendFounderTestJson`
- Node process exited → in-memory result store lost → subsequent fetches fail
- This is boundary **E** (server restart / memory loss), compounded by oversized result payload (**A** generation size).

## Manual Verification Steps

1. Start server: `npm run dev` — confirm startup log lists ping/result/result-debug and pid.
2. `curl http://localhost:4321/api/founder-test/ping` — expect `routeReached: true`.
3. Run Founder Test; note runId from Operator Feed.
4. `curl "http://localhost:4321/api/founder-test/result-debug?runId=<runId>"` — check `hasStoredResult`, `hasReportMarkdown`, `serverStartedAt`.
5. If UI served from Vite (5173), open browser devtools → verify result URL host is **4321**, not 5173.
6. If `serverStartedAt` is **after** run completion time → boundary **E** confirmed.

## Verdict Guidance (proof only — no repair in this phase)

- **A** report generation: debug shows no markdown ever stored for runId
- **B** store persistence: run completed but `hasStoredResult: false` on same process
- **C** route registration: ping fails on 4321 while server claims running
- **D** API base mismatch: ping OK on 4321 but client fetches 5173/origin
- **E** restart/memory: `serverStartedAt` after run completion OR process crash in logs

---

Pass token: FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_V1_PASS
