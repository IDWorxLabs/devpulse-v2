# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1783370173339
- **Created:** 2026-07-06T20:36:13.279Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Simple Counter App
- **Status:** validation=PASS production=PENDING
- **Immutable:** true
- **Manifest hash:** `efdca64168a27e2562372f17f690eb8a34d039169ea81352d51129aa8ccf653e`
- **Workspace hash:** `c28daeec9f1ee68c921b88298561a719e6ab6e5d5540583f03659eb40928cd86`
- **Comparison fingerprint:** `4e90b3b3bf82317e70c74ef3fd5e940d482a19c5467e64bae12de263bcc60180`

## Prompt

Build a simple counter app with increment and decrement buttons and a reset button.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-counter-app-1783370149961-2/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-counter-app-1783370149961-2/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-counter-app-1783370149961-2/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-counter-app-1783370149961-2/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1783370173339

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=83 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 57 files, 16 directories |
| Manifest written | PASS | manifestHash=efdca64168a2… |
| Feature modules generated | PASS | 1 modules |
| Build executed | PASS | npmBuildDurationMs=4447 |
| Preview verified | FAIL | http://127.0.0.1:5174/ |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | PASS | PASS — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PASS |
