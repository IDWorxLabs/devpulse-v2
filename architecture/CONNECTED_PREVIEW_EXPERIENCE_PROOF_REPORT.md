# Connected Preview Experience Proof

**Phase 26.10** — Prove a founder can see, access, and interact with the generated application preview.

## Core Question

Can AiDevEngine prove that a founder can open and interact with the generated application preview?

## Problem

After Phase 26.9, RUNTIME can be PROVEN, but PREVIEW was NOT_PROVEN because no connected preview experience evidence existed.

## Architecture

```
Runtime Activation Proof Report (upstream PROVEN)
  → Preview Session Analyzer
  → Preview URL Analyzer
  → Preview Render Analyzer
  → Preview Interaction Analyzer
  → Preview Capture Analyzer
  → Preview Manifest Analyzer
  → Preview Linkage Analyzer
  → Autonomous Build Execution Proof (PREVIEW stage)
```

## Module

`src/connected-preview-experience-proof/`

| Component | Role |
|-----------|------|
| `preview-session-analyzer.ts` | Preview session id, workspace/runtime linkage |
| `preview-url-analyzer.ts` | Preview URL existence and reachability |
| `preview-render-analyzer.ts` | HTML/DOM/render evidence |
| `preview-interaction-analyzer.ts` | Clickable elements, navigation, forms |
| `preview-capture-analyzer.ts` | Screenshots and capture artifacts |
| `preview-manifest-analyzer.ts` | contract → workspace → runtime → preview linkage |
| `preview-linkage-analyzer.ts` | Full chain with firstBrokenPreviewLink |
| `connected-preview-experience-proof-authority.ts` | `assessConnectedPreviewExperienceProof()` |

## Preview State

| State | Meaning |
|-------|---------|
| NOT_STARTED | No preview evidence |
| SESSION_OBSERVED | Preview session linked to runtime |
| URL_REACHABLE | Founder can open preview URL |
| RENDERED | Application content rendered |
| INTERACTIVE | Founder can interact with UI |

## Proof Rules

| Level | Criteria |
|-------|----------|
| **PROVEN** | Runtime PROVEN + session + reachable URL + render + interaction + linkageConnected |
| **PARTIAL** | URL only, render without interaction, or incomplete linkage |
| **NOT_PROVEN** | No preview session or evidence |

## Precise Failure Messages

- "Preview URL reachable but render evidence missing"
- "Application rendered but interaction evidence missing"
- "First broken preview link: url→render"

## Integration

- **PREVIEW stage** consumes this authority (foundation module still used for verification chain)
- **Founder Test** includes CONNECTED PREVIEW EXPERIENCE PROOF before verdict
- With full fixture: PREVIEW=PROVEN, `firstBrokenStage=VERIFY`

## Safety

- Read-only — does not launch preview
- No screenshot-only proof without render + interaction
- No synthetic preview claims

## Validation

```bash
npm run validate:connected-preview-experience-proof
```

Pass token: `CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS`

---

`CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS`
