# Launch Blocker Board V1

Founder Test Strategy Reset — classify Founder Test output into founder-facing launch blockers instead of spawning endless repair phases.

## Buckets

1. **REAL_PRODUCT_GAP** — missing proof or broken product behavior customers would hit
2. **CLAIM_WORDING_GAP** — promise/claim mismatch or authority disagreement on messaging
3. **UI_UX_GAP** — founder-facing UI friction (Copy Report, screens, routes)
4. **FOUNDER_TEST_NOISE** — testing overhead (degraded runtime duration, validator churn) — **Ignore**

## Strategy Reset Rule

No new Founder Test repair phases unless typecheck fails, report generation fails, runtime crashes, result fetch fails, or data corruption occurs.

## Integration

- `server/founder-testing-handler.ts` — prepends board markdown to final report
- Consumes existing `FounderTestLaunchReadinessReport` + simulation degradation signals
- Read-only aggregation — no new scoring engine

## Pass Token

`LAUNCH_BLOCKER_BOARD_PASS`
