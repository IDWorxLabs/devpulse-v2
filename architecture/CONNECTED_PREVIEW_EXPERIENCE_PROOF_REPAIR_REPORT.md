# CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_REPORT

**Phase:** 26.75 — Connected Preview Experience Proof Repair V1  
**Pass token:** `CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS`

## Root cause

After Phase 26.74, **RUNTIME = PROVEN** but **PREVIEW = NOT_PROVEN** because:

1. `assessConnectedPreviewExperienceProof()` analyzed evidence only — no bounded HTTP preview probe when no fixture was injected.
2. PROVEN rules required interaction evidence and full extended linkage, not just runtime→url→reachable→render.
3. Participating authorities still reported preview unavailable when connected preview proof was not consumed.

## Preview chain model

```
runtime → url → reachable → render
    ↓       ↓        ↓          ↓
 port    preview   HTTP 200   JSON/HTML
 URL      URL      probe     response
```

**PREVIEW PROVEN** requires runtime PROVEN plus all four core links. First broken link is reported explicitly.

## Runtime → URL proof

- `preview-proof-gap-activator.ts` requires upstream runtime activation PROVEN.
- Derives preview URL from live runtime port (`http://127.0.0.1:{port}/`).
- Records `workspaceId`, `workspacePath`, `previewUrl`, `runtimePort`, `previewDetected`.

## URL → reachable proof

- `preview-proof-gap-probe.mjs` performs bounded HTTP GET (no browser automation).
- Records `urlChecked`, `httpStatus`, `reachable`, `checkedAt`.

## Reachable → render proof

- Probe reads response body and content-type.
- Accepts JSON index response (`status: ok`, `workspaceId`) or HTML document markers.
- Records `renderEvidenceType`, `renderObserved`, `responseLength`, `contentType`, `renderCheckedAt`.
- No screenshots or synthetic captures.

## PreviewActivationEvidence contract

New proof object on `PreviewExperienceProofReport` with step-by-step fields and `firstBrokenPreviewLink`.

## Authority synchronization

- `connected-execution-chain-stage-resolver.ts` extended with `previewProven` and `previewExperienceConnected`.
- `founder-test-integration-orchestrator.ts` passes preview-connected signals to Live Preview and Verification Reality.
- `runtime-founder-execution-proof-hydration.ts` derives `stageProven.preview` from connected preview proof.

## Files changed

| File | Change |
|------|--------|
| `src/connected-preview-experience-proof/preview-proof-gap-activator.ts` | Bounded preview probe |
| `src/connected-preview-experience-proof/preview-proof-gap-probe.mjs` | Sync probe subprocess |
| `src/connected-preview-experience-proof/connected-preview-experience-proof-types.ts` | `PreviewActivationEvidence` |
| `src/connected-preview-experience-proof/connected-preview-experience-proof-authority.ts` | Auto-activation hook |
| `src/connected-preview-experience-proof/preview-linkage-analyzer.ts` | Core runtime→render links |
| `src/connected-preview-experience-proof/preview-render-analyzer.ts` | Response-based render proof |
| `src/connected-preview-experience-proof/preview-session-analyzer.ts` | Gap session observation |
| `src/autonomous-build-execution-proof/preview-stage-analyzer.ts` | Render-based PROVEN |
| `src/founder-test-integration/connected-execution-chain-stage-resolver.ts` | Preview stage context |
| `src/founder-test-integration/founder-test-integration-orchestrator.ts` | Authority sync |
| `scripts/validate-connected-preview-experience-proof.ts` | Repair validator |

## Remaining downstream blockers

| Stage | Status | Next action |
|-------|--------|-------------|
| VERIFY | NOT_PROVEN | Run connected verification execution proof |
| LAUNCH | NOT_PROVEN | Launch readiness proof after verification |

## Safety guarantees

- No synthetic screenshots or browser automation.
- No scoring or launch verdict manipulation.
- Fixture injection preserved via `skipPreviewProofGapActivation` / `previewSessionEvidence`.
- VERIFY and LAUNCH remain NOT_PROVEN until their authorities prove them.

---

Pass token: `CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS`
