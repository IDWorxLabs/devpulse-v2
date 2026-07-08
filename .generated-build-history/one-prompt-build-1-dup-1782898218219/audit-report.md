# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1782898218219
- **Created:** 2026-07-01T09:30:18.143Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Calculator App
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `e6f363b317776d37c10eccd24ec6195c4e9e73d28088e7147094d23db755f819`
- **Workspace hash:** `a014645469e1315d015a3313c3310d24d36e0ceb29a94c7463f19fcbb096df21`
- **Comparison fingerprint:** `4af338a85b18cc21eff27f3cc4c5843b9f0a18c85586fd53e16a6fa6609e85c1`

## Prompt

build a calculator app

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898209789/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898209789/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898209789/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V2/.generated-builder-workspaces/calculator-build-readiness-1782898209789/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1782898218219

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=22 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 57 files, 16 directories |
| Manifest written | PASS | manifestHash=e6f363b31777… |
| Feature modules generated | PASS | 1 modules |
| Build executed | PASS | npmBuildDurationMs=2362 |
| Preview verified | PASS | http://127.0.0.1:5181/ |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PASS | PASS — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
