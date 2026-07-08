# Preview Authority Audit Report

## Problem

`END_TO_END_BUILD_REALITY_ENGINE_V1` issued `READY_FOR_FOUNDER_TESTING` while the engineering contract described **Calculator** but the visible Live Preview iframe showed a **Sign In** page.

This is a **false-positive READY** caused by preview authority drift:

- Playwright inspected a **diagnostic/dev-server URL** or stale Vite instance
- The **iframe** loaded a different URL (gate-unlocked preview or founder host shell)
- **Workspace identity meta tags** were missing from served HTML, so stale detection could not fire

## Root Cause

| Gap | Effect |
|-----|--------|
| `previewProbeUrl` fell back to `diagnosticPreviewUrl` / `devServer.url` | Playwright validated a URL the founder never sees in Live Preview |
| No `PREVIEW_AUTHORITY` stage | READY could pass when Playwright and iframe disagreed |
| Missing `aidevengine-workspace-hash` in `index.html` | `STALE_PREVIEW_WORKSPACE` never fired |
| No initial DOM contract check | Playwright navigated past Sign In; founder sees Sign In at root |

## Fix

### New modules

- `preview-authority-audit.ts` — answers all 10 audit questions and enforces invariants
- `preview-workspace-identity.ts` — stamps/reads workspace hash + App.tsx checksum in served HTML

### New stage: `PREVIEW_AUTHORITY`

Runs **before** DOM/interaction validation. Blocks downstream inspection when authority is inconsistent.

### Invariants (all must pass for READY)

```
served preview workspace
  == registered preview workspace
  == active project workspace
  == Vite serving workspace
  == Playwright inspected workspace (via hash meta)

gate-unlocked preview URL
  == Playwright URL
  == iframe URL
  == registered preview URL

initial visible DOM (before navigation)
  == contract-derived feature surface (not Sign In / auth shell)
```

Failure code: **`PREVIEW_AUTHORITY_MISMATCH`**

### URL policy

- E2E and orchestrator now use **gate-unlocked `previewUrl` only**
- Diagnostic/dev-server URLs are tracked but **never** satisfy READY alone

### Workspace identity stamping

After materialization completes, `index.html` receives:

```html
<meta name="aidevengine-workspace-hash" content="..." />
<meta name="aidevengine-project-id" content="..." />
<meta name="aidevengine-app-tsx-checksum" content="..." />
```

## Audit Questions (answered in `preview-authority-audit.json`)

| # | Question | Field |
|---|----------|-------|
| 1 | Which workspace was generated? | `generatedWorkspace` (preview-serving dir) |
| 2 | Which workspace was built? | `builtWorkspace` |
| 3 | Which workspace Vite is serving? | `viteServingWorkspace` (resolved from dev-server registry by preview URL port) |
| 4 | Which preview URL is registered? | `registeredPreviewUrl` |
| 5 | Which preview URL the iframe displays? | `iframePreviewUrl` |
| 6 | Which DOM Playwright inspected? | `playwrightPreviewUrl` |
| 7 | Playwright same as Live Preview? | `playwrightSameAsLivePreview` |
| 8 | Session registry matches iframe? | `sessionRegistryMatchesIframe` |
| 9 | Stale preview registration? | `staleRegistrationDetected` |
| 10 | App.tsx checksum matches bundle? | `appTsxChecksumMatch` |

Evidence path: `.end-to-end-build-reality/<projectId>/preview-authority-audit.json`

## Root cause of Calculator / Sign In false-positive

The false READY had **two independent authority gaps**:

### A. URL authority drift
Playwright could inspect `diagnosticPreviewUrl` or a stale dev-server URL while the Live Preview iframe showed the gate-unlocked URL — or the founder host Sign In shell.

**Fix:** E2E and orchestrator now use **gate-unlocked `previewUrl` only**. Diagnostic URLs are tracked but never satisfy READY alone. Playwright initial DOM check detects `data-founder-sign-in` / Sign In copy before any navigation.

### B. Workspace path drift (promotion split)
After persistent-project promotion, `build.workspacePath` pointed to `.aidev-projects/<id>/source` while Vite continued serving `.generated-builder-workspaces/<id>`. Expectations read a path-hash fallback (`83f999de77fe`) instead of the served content hash (`742c64c9dafc`), causing false `PREVIEW_AUTHORITY_MISMATCH` — and in production, the inverse: READY could pass on the wrong workspace identity.

**Fix:** `preview-workspace-resolver.ts` resolves the **preview-serving workspace** from the dev-server registry (by preview URL port). Preview authority compares:
- served workspace hash (HTML meta) vs manifest hash on **serving** dir
- active project vs serving dir (path equality OR matching hash + App.tsx checksum)

## Remaining gaps

- Founder `app.js` session-client override can still force iframe URL without re-running preview authority — requires UI-side reconciliation
- After promotion, Vite physically remains on builder workspace until restart; content sync is verified via hash + App.tsx checksum, not path equality alone
- Production `npm run build` dist bundles need the same identity meta injection (currently stamped on dev `index.html` only)
