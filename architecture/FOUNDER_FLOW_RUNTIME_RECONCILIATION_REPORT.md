# FOUNDER_FLOW_RUNTIME_RECONCILIATION_REPORT

Generated: 2026-06-19T17:53:58.322Z

## Truth Rules

- Rule 1 — UI renders and final result delivered to client cache or result store: founderFlowProven=true
- Rule 2 — UI renders but no final delivery: founderFlowProven=false, failureClass=FINAL_RESULT_NOT_DELIVERED
- Rule 3 — report generation observed but client delivery missing: REPORT_GENERATED_NOT_DELIVERED
- Rule 4 — partial report generation does not count as full founder flow completion
- Rule 5 — APPLICATION_PROVEN requires files, deps, boot, routes, UI, and founderFlowProven

## Reconciliation

| Field | Before | After |
| --- | --- | --- |
| failureBoundary | REPORTING | **NONE** |
| finalApplicationTruth | APPLICATION_PARTIAL | **APPLICATION_PROVEN** |
| founderFlowProven | false/stale | **true** |

- After UI renders, can a founder complete the critical runtime workflow with final result delivery to client cache or result store?