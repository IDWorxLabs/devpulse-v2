# CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_REPORT

**Phase:** 26.74 — Connected Runtime Activation Proof Repair V1  
**Pass token:** `CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS`

## Root cause

The execution chain reached **BUILD = PROVEN** after Phase 26.71 materialization, but **RUNTIME = NOT_PROVEN** because:

1. Materialized workspace `package.json` lacked runtime scripts (`dev` / `start`).
2. No `runtime/dev-server.mjs` entry existed to launch a bounded HTTP server.
3. `assessConnectedRuntimeActivationProof()` analyzed evidence only — it never attempted bounded activation when no fixture was injected.
4. Participating authorities still received `executionConnected=false` from full-chain founder execution proof, causing stale **BUILD blocked** messaging even when build materialization was PROVEN.

## Runtime chain model

```
workspace → command → process → port → health
     ↓          ↓         ↓        ↓       ↓
 package.json  npm run   spawn    HTTP    200 JSON
 + dev-server  dev/start  pid     probe   response
```

**RUNTIME PROVEN** requires all five links connected. The first broken link is reported explicitly.

## Workspace → command proof

- `build-proof-gap-materializer.ts` now materializes `package.json` with workspace-appropriate scripts:
  - `"dev": "node runtime/dev-server.mjs"`
  - `"start": "node runtime/dev-server.mjs"`
- Also materializes `runtime/dev-server.mjs` (minimal ESM HTTP server, no fake npm packages).
- `runtime-command-resolver.ts` reads scripts from disk — no synthetic command injection.

## Command → process proof

- New `runtime-proof-gap-activator.ts` + `runtime-proof-gap-probe.mjs` perform bounded activation under `.generated-builder-workspaces/` only.
- Spawns `node runtime/dev-server.mjs` with `RUNTIME_PORT` / `WORKSPACE_ID` env.
- Records `processId`, `observedStartTime`, `processState`, `exitCode`.

## Process → port proof

- Probe waits for JSON ready signal on stdout (`{ ready: true, port }`).
- HTTP GET to `http://127.0.0.1:{port}/` verifies reachability.
- Records `expectedPort`, `detectedPort`, `portReachable`, `portCheckedAt`.

## Port → health proof

- Successful HTTP 200 JSON response marks health **HEALTHY**.
- Records `healthUrl`, `healthChecked`, `healthResponded`, `responseCode`, `healthCheckedAt`.

## Authority synchronization

- New `connected-execution-chain-stage-resolver.ts` reads connected-build-execution materialization proof.
- `founder-test-integration-orchestrator.ts` passes `builderMaterializationConnected` to participating authorities when BUILD is PROVEN.
- `runtime-founder-execution-proof-hydration.ts` derives `stageProven.build` / `stageProven.runtime` from materialization + activation proof when session assessments are absent.

Authorities updated to stop stale BUILD blockers:

- Founder Reality (via orchestrator `executionConnected` signal)
- Requirement Reality
- Live Preview Reality
- Verification Reality
- Founder Execution Proof Hydration

## RuntimeActivationEvidence contract

New proof object on `RuntimeActivationProofReport`:

- `workspaceId`, `workspacePath`, `runtimeCommand`, `commandExists`, `packageJsonDetected`, `scriptDetected`
- `activationAttempted`, `activationSucceeded`, `generatedAt`
- Process, port, and health fields with `proofLevel` and `firstBrokenRuntimeLink`

Founder Test / launch readiness reports include **Runtime Activation Proof** and **First Broken Runtime Link** sections via report builder.

## Files changed

| File | Change |
|------|--------|
| `src/connected-build-execution/build-proof-gap-materializer.ts` | Runtime scripts + dev-server materialization |
| `src/connected-runtime-activation-proof/runtime-proof-gap-activator.ts` | Bounded activation engine |
| `src/connected-runtime-activation-proof/runtime-proof-gap-probe.mjs` | Sync probe subprocess |
| `src/connected-runtime-activation-proof/connected-runtime-activation-proof-types.ts` | `RuntimeActivationEvidence` |
| `src/connected-runtime-activation-proof/connected-runtime-activation-proof-authority.ts` | Auto-activation hook |
| `src/connected-runtime-activation-proof/connected-runtime-activation-proof-registry.ts` | Port/timeout constants |
| `src/connected-runtime-activation-proof/connected-runtime-activation-proof-report-builder.ts` | Founder visibility |
| `src/connected-runtime-activation-proof/index.ts` | Exports |
| `src/founder-test-integration/connected-execution-chain-stage-resolver.ts` | Chain stage context |
| `src/founder-test-integration/founder-test-integration-orchestrator.ts` | Authority sync |
| `src/founder-test-integration/founder-test-integration-types.ts` | Chain context types |
| `src/founder-test-integration/runtime-founder-execution-proof-hydration.ts` | Build/runtime stage proven |
| `scripts/validate-connected-runtime-activation-proof.ts` | Repair validator |

## Remaining downstream blockers

| Stage | Status | Next action |
|-------|--------|-------------|
| PREVIEW | NOT_PROVEN | Connect runtime session to live preview activation proof |
| VERIFY | NOT_PROVEN | Run connected verification execution after preview |
| LAUNCH | NOT_PROVEN | Launch readiness proof after verification |

## Safety guarantees

- No synthetic runtime claims — activation spawns real process in bounded workspace only.
- No scoring or launch verdict manipulation.
- Fixture injection preserved via `skipRuntimeProofGapActivation` / `runtimeSessionEvidence` for partial-chain tests.
- PREVIEW / VERIFY / LAUNCH remain NOT_PROVEN until their respective authorities prove them.

---

Pass token: `CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS`
