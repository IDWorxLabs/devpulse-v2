# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1783405348715
- **Created:** 2026-07-07T06:22:28.662Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Calculator App
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `633a33453b755d90723ce426408c8bc1f3e5dd11d7d62b87f9ef4d6903054076`
- **Workspace hash:** `862e774f8d2ef26ae47cddce70f652bef1787d1f1ae50217e78f0bf8cf1bc2d7`
- **Comparison fingerprint:** `7285c2e10814a1d08489774037d9b93ceb5b0266b30b2af059ddc3a88a14534c`

## Prompt

Build a calculator app with addition, subtraction, multiplication, and division.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/calculator-app-1783405328375-9/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/calculator-app-1783405328375-9/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/calculator-app-1783405328375-9/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/calculator-app-1783405328375-9/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1783405348715

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=80 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 57 files, 16 directories |
| Manifest written | PASS | manifestHash=633a33453b75… |
| Feature modules generated | PASS | 1 modules |
| Build executed | PASS | npmBuildDurationMs=2985 |
| Preview verified | FAIL | http://127.0.0.1:5176/ |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PASS | PASS — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
