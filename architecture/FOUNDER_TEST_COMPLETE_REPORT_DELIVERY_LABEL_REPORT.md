# Founder Test Complete Report Delivery Label Report

## Root Cause

- Runtime reached COMPLETE but Copy/Open Report still selected runtime failure diagnostics.
- `buildFounderTestCopyPayload` treated COMPLETE like RUNNING and emitted "still running" failure text.
- Result endpoint returned running diagnostic (202) for COMPLETE runs before stored result was ready.

## Repair

- COMPLETE runs prefer final `reportMarkdown` before any diagnostic copy.
- Result endpoint returns COMPLETE + `generatedAt` + `runId`; preparing response when markdown not ready.
- UI labels: Copy Final Report / Open Final Report; notification: Founder Test Report Ready.
- Retry fetch (1–2 attempts) when COMPLETE but markdown temporarily unavailable.

## Validation Proof

- Checks: 38

---

Pass token: FOUNDER_TEST_COMPLETE_REPORT_DELIVERY_LABEL_V1_PASS
