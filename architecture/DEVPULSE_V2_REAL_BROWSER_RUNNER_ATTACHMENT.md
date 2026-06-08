# DevPulse V2 — Real Browser Runner Attachment

**GF7 OMEGA — Playwright Attachment V1**  
**System ID:** `real_browser_runner_attachment`  
**Phase:** 1

---

## Purpose

Upgrades Phase 1 browser verification from simulated HTML-string checks to **real browser reality checks** via Playwright — attached to the **existing** Browser Verification Harness only.

Does **not** replace the harness, create a second harness, or build Phase 2 systems.

---

## Adapter Status

| Status | Meaning |
|--------|---------|
| `ATTACHED` | Playwright available; Chromium launches; RB checks run |
| `PACKAGE_REQUIRED` | Playwright not installed — honest fallback to simulated DOM |
| `FAILED` | Playwright present but launch failed — fallback with error disclosure |

---

## Real Browser Checks (RB-01–RB-09)

When attached, the harness runs:

1. Shell visible
2. Chat input visible
3. Send button clickable
4. User message appears
5. Assistant `visibleAnswerText` appears
6. Inline feed appears
7. Five feed events appear
8. Feed is not assistant answer
9. Page remains clickable after submit

Supplemental constitutional checks (BV-10–BV-13) still run from shell/registry state.

---

## Harness Runner Selection

```
Playwright probe → ATTACHED? → real-browser (RB checks)
                 → else      → simulated-html (BV checks + honest warning)
```

Report includes `runnerUsed` and `realBrowserRunnerStatus`.

---

## Validation

```bash
npm run validate:real-browser
npm run validate:phase-1-soak
npm run validate:browser-harness
# ... all other validate:* scripts
```

Pass token:

```
DEVPULSE_V2_REAL_BROWSER_RUNNER_ATTACHMENT_V1_PASS
```

Passes in **Mode A** (real attached) or **Mode B** (`REAL_BROWSER_PACKAGE_REQUIRED` + fallback).

---

## Install Playwright (optional but recommended)

```bash
npm install playwright --save-dev
npx playwright install chromium
```

Without Playwright, the system honestly reports `REAL_BROWSER_PACKAGE_REQUIRED`.
