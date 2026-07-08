# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1783444416336
- **Created:** 2026-07-07T17:13:36.334Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** My Existing App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `736e8d990e4cef513ee4ac78c6fb613dc1796d1347fc0f5dd8b64bb2794f4bd3`
- **Workspace hash:** `6adb6febf05c73c9e15797d7224a988e5291bcb8d30fcacbc59494febd4f5484`
- **Comparison fingerprint:** `1985263e53a8ee0b8d05e59dee77f37b1fdefc35f0e4a1d1f92a94b02147d260`

## Prompt

Make it nicer.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/my-existing-app-1783444416261-9/.generated-app-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1783444416336

## Failure Reasons

- Planning did not produce a build-ready contract
- Planning did not produce a build-ready contract
- Planning did not produce a build-ready contract

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=14 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 1 files, 0 directories |
| Manifest written | PASS | manifestHash=736e8d990e4c… |
| Feature modules generated | FAIL | 0 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
