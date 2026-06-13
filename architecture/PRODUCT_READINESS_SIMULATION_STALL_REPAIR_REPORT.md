# Product Readiness Simulation Stall Repair Report

## Confirmed Blocker

- Stage 2 froze inside `running-product-readiness-simulation` because chat stress ran up to 50+ LLM scenarios with concurrency 6 and no timeout/budget guards.
- `assessFounderTestIntegration` could run twice (product readiness + launch readiness).

## Root Causes

- **Too much work:** full chat stress registry (50+) when `chatStressMaxScenarios` unset in Founder Test.
- **Unbounded chat stress:** no per-scenario timeout or total simulation budget.
- **Repeated fixtures:** shell HTML/app.js and product memory loaded on every simulation build pass.
- **No honest partial path:** long runs appeared as a silent stall instead of SIMULATION_SLOW/STALLED/BUDGET_EXCEEDED.

## Repairs

- Founder Test default chat stress cap: **12** scenarios.
- Total simulation budget: **60s** with SLOW at 15s and STALLED at 45s.
- Per-scenario timeout: **10s**.
- Partial/degraded chat stress and product readiness reports with explicit budget notes.
- Fixture cache for shell + product memory within a run.
- Single hoisted `founderTestAssessment` in launch readiness artifact build.

## Files Changed

- src/founder-test-product-readiness/product-readiness-simulation-budget.ts
- src/founder-test-product-readiness/product-readiness-fixture-cache.ts
- src/founder-test-product-readiness/product-readiness-types.ts
- src/founder-test-product-readiness/product-readiness-orchestrator.ts
- src/founder-test-product-readiness/index.ts
- src/founder-test-chat-stress-simulation/chat-stress-simulation-types.ts
- src/founder-test-chat-stress-simulation/chat-response-simulator.ts
- src/founder-test-chat-stress-simulation/chat-stress-authority.ts
- src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts

## Remaining Risks

- Even bounded chat stress may approach budget when LLM latency is high.
- Full 50+ scenario validation still requires explicit `maxScenarios` outside Founder Test.

---

Pass token: PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS
