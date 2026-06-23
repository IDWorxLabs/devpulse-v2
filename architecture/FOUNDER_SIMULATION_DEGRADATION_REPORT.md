# Founder Simulation Degradation Report

Generated: 2026-06-21T10:07:23.723Z
Investigation ID: founder-simulation-degradation-2-1782036443723

## Core Question

Why does Founder Simulation complete with warnings instead of clean completion, and what consumed the runtime budget?

## Rules

- Rule 1 — capture full Founder Simulation timeline from runtime monitor stages and trace events
- Rule 2 — rank authorities and substeps by elapsedMs with runtime percentage
- Rule 3 — flag degradation when warning completion, budget exceedance, fallback, or repair planner activates
- Rule 4 — classify root cause before any repair attempt
- Rule 5 — identify exact authority that emitted FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS
- Rule 6 — produce repair recommendation without mutating simulation behavior

## Summary

- Run ID: **degradation-root-cause-test**
- Total runtime: **257s** (257000ms)
- Completion event: **FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS**
- Degraded: **yes**
- Slowest authority: **Founder Testing V5 Assessment** (0s)
- Slowest substep: **Founder simulation V5 in progress** (0s)

## Ranked Authority Runtime

1. **Founder Testing V5 Assessment** — Elapsed: 0s (0.0%)
2. **Founder Test Integration** — Elapsed: 0s (0.0%)
3. **Founder Test Runtime Monitor** — Elapsed: 0s (0.0%)
4. **Planning Brief Authority** — Elapsed: 0s (0.0%)
5. **Founder Execution Proof Input** — Elapsed: 0s (0.0%)
6. **Product Readiness Simulation** — Elapsed: 0s (0.0%)
7. **Planning Gate Authority** — Elapsed: 0s (0.0%)
8. **Architecture Brief Authority** — Elapsed: 0s (0.0%)
9. **Build Plan Authority** — Elapsed: 0s (0.0%)
10. **Founder Simulation Completion Boundary** — Elapsed: 0s (0.0%)

## Ranked Substep Runtime

1. **Founder simulation V5 in progress** — Elapsed: 0s (0.0%)
2. **Product readiness simulation complete** — Elapsed: 0s (0.0%)
3. **Hydrating founder execution proof input** — Elapsed: 0s (0.0%)
4. **Founder input hydrated** — Elapsed: 0s (0.0%)
5. **Running product readiness simulation** — Elapsed: 0s (0.0%)
6. **Founder Simulation Engine running** — Elapsed: 0s (0.0%)
7. **Founder simulation running** — Elapsed: 0s (0.0%)
8. **Founder Simulation Complete** — Elapsed: 0s (0.0%)

## Degradation Signals

- **WARNING_COMPLETION**: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS emitted
- **DEGRADED_COMPLETION_PATH**: Founder simulation marked degraded on completion
- **PAYLOAD_GUARD_DEGRADED**: Founder simulation payload guard marked result degraded

## Integration Targets

- Founder Simulation Completion Boundary Repair
- Founder Test Runtime Monitor
- Founder Test Integration
- Founder Truth Matrix
- Runtime Status Reporting

Pass token: **FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS**