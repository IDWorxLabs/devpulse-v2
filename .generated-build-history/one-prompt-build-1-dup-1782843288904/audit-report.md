# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782843288904
- **Created:** 2026-06-30T18:14:48.862Z
- **Profile:** EXPENSE_TRACKER_WEB_V1
- **App:** New Project
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `ac0f132ff603e300f3321971f68c7154fbf9ef4bd3e5ad66ff511989d541ce19`
- **Workspace hash:** `78d75bbe3f577060be914601c3373b0ebd620103ef93ef9a24da2a02d87316a4`
- **Comparison fingerprint:** `1838d729149cad2eb7d7d3afc47d7dde2c36355e67eed545bda4692f06017e4f`

## Prompt

Build a mobile-first personal budget tracker with income, expenses, categories, charts, monthly summaries, CSV export, and a live preview.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/new-project-1/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/new-project-1/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/new-project-1/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/new-project-1/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782843288904

## Failure Reasons

- registry missing modules: auth

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=138 |
| Profile selected | INFO | EXPENSE_TRACKER_WEB_V1 |
| Workspace generated | PASS | 105 files, 24 directories |
| Manifest written | PASS | manifestHash=ac0f132ff603… |
| Feature modules generated | PASS | 10 modules |
| Build executed | PASS | npmBuildDurationMs=2079 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
