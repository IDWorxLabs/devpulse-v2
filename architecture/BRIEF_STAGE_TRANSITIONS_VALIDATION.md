# Brief Stage Transitions Validation

Generated: 2026-06-21T05:01:31.096Z

Pass token: BRIEF_STAGE_TRANSITIONS_PASS

## Checks

- [x] **file: src/founder-test-runtime-monitor/brief-stage-transitions.ts** — present
- [x] **file: src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts** — present
- [x] **runtime monitor wires brief stage transitions** — missing wire
- [x] **no new authority module added** — unexpected authority
- [x] **package script registered** — missing
- [x] **pass token defined** — missing token
- [x] **1. planning brief auto-complete when gate passed and brief running** — not eligible
- [x] **2. blocked when handler not alive** — unexpected eligible
- [x] **3. blocked when planning brief already passed trace exists** — unexpected eligible
- [x] **4. reconcile invokes planning brief handlers once** — 1/1
- [x] **5. live snapshot auto-completes planning brief** — PASSED, PASSED
- [x] **6. live snapshot auto-completes architecture brief** — PASSED, PASSED
- [x] **7. live snapshot auto-completes build plan and starts founder simulation** — PASSED, RUNNING
- [x] **8. planning brief passed trace emitted exactly once** — 1
- [x] **9. second snapshot does not re-emit brief passed traces** — duplicate trace detected
- [x] **10. handler duplicate complete does not re-emit planning brief passed** — 1
- [x] **11. composeSnapshot runs brief transitions before stall analysis** — ordering