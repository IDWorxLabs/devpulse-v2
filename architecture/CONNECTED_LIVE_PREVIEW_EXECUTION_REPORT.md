# Connected Live Preview Execution Report

**Phase:** 25.29 — Connected Live Preview Execution  
**Pass token:** `CONNECTED_LIVE_PREVIEW_EXECUTION_PASS`  
**Core question:** Can AiDevEngine expose a generated application through a founder-viewable preview?

---

## Summary

Phase 25.29 is the first phase where a founder can **actually view** a generated application. It moves from runtime activation to **real preview URL generation**, HTTP probing, and founder-viewable metadata — all inside disposable World 2 workspaces.

```
Execution Plan → Workspace Created → Build Executed → Runtime Activated → Live Preview Activated → Preview Evidence
```

---

## Principle

| Claim | Proof status |
|-------|----------------|
| Runtime running | Not founder-viewable |
| Preview plan | Not founder-viewable |
| Dry-run preview | Not founder-viewable |
| Preview URL + HTTP probe + content served + founder metadata | **Founder can view it** |

---

## Input Authorities

| Authority | Phase | Role |
|-----------|-------|------|
| Connected Runtime Execution | 25.28 | Activated runtime endpoint |
| Connected Live Preview Foundation | 25.22 | Preview readiness gate |
| Live Preview Reality | — | Preview infrastructure signals |
| Execution Verification Loop | — | Verification context (no launch) |
| Founder Acceptance Gate | 24G | Founder acceptance |
| Execution Proof Evolution | — | Proof regression gate |
| Connected Workspace Creation | 25.26 | Disposable workspace |
| Connected Build Execution | 25.27 bridge | Build artifacts |

---

## Preview Activation Contract

- `previewId`, `workspaceId`, `previewUrl`, `previewType`
- `previewActivationDurationMs`
- `previewArtifacts[]`, `previewEvidence[]`
- `previewWarnings[]`, `previewDiagnostics[]`
- `activationEvidence` from real inspection

Physical root: `.generated-builder-workspaces/{workspaceId}`

---

## Preview Evidence (Required)

| Field | Meaning |
|-------|---------|
| previewActivated | Preview activation completed |
| previewUrlGenerated | Founder-viewable URL created |
| previewReachable | HTTP probe succeeded |
| previewContentServed | Response body served |
| previewArtifactsPresent | Marker files written |
| previewResponseSuccessful | HTTP 2xx response |
| previewEndpointAvailable | Endpoint available for founder |

---

## Preview States

| State | Meaning |
|-------|---------|
| PREVIEW_ACTIVATED | Real preview activated with proof |
| PREVIEW_ACTIVATED_WITH_WARNINGS | Activated with warning-level gaps |
| PREVIEW_ACTIVATION_FAILED | Activation attempted but failed |
| PREVIEW_ACTIVATION_BLOCKED | Upstream blockers |
| INSUFFICIENT_EVIDENCE | Missing authority outputs |

---

## Forbidden Actions

- Modify World 1 / production workspace
- Production deployment or external infrastructure mutation
- Verification execution
- Customer traffic

---

## Runtime Safeguards

- Bounded: max 1 preview per validation run
- Automatic preview and runtime cleanup after validation
- Preview endpoints only inside `.generated-builder-workspaces/{workspaceId}`
- No World 1 mutation

---

## Founder Report Fields

- Preview Score
- Preview State
- Preview URL
- Preview Activation Duration
- Preview Evidence
- Diagnostics
- Warnings
- Blockers
- Recommended Next Actions

---

## Validation

```bash
npm run validate:connected-live-preview-execution
```

Pass token: `CONNECTED_LIVE_PREVIEW_EXECUTION_PASS`
