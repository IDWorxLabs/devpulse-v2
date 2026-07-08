# Build History Audit Report

- **Run ID:** general-application-2-1783398914561-6
- **Created:** 2026-07-07T04:35:15.371Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Custom App
- **Status:** validation=FAIL production=PENDING
- **Immutable:** true
- **Manifest hash:** `c49ffba3a5394434432f76ee5b4203f2978caa4fa9136fa564c2dc1b9fd73247`
- **Workspace hash:** `03a81868f648da6fdd36d4e70198440a51215e0a5056ab24104baf6dae7fab7e`
- **Comparison fingerprint:** `efb89482a06b20524ed0f6a8b75db56a13568c9047a438f01577ef1a97a75acd`

## Prompt

A simple app where I can keep a list of items, mark them done, and remove them.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-2-1783398914561-6/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-2-1783398914561-6/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-2-1783398914561-6/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/general-application-2-1783398914561-6/blueprint-manifest.json
- .generated-build-history/general-application-2-1783398914561-6

## Failure Reasons

- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.
- Generated app materialization validation failed: Only 7/9 required UI terms detected in generated source.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=79 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 68 files, 18 directories |
| Manifest written | PASS | manifestHash=c49ffba3a539… |
| Feature modules generated | FAIL | 3 modules |
| Build executed | FAIL | npmBuildDurationMs=0 |
| Preview verified | PENDING | no preview URL recorded |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PENDING | PENDING — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=FAIL validation=FAIL |
