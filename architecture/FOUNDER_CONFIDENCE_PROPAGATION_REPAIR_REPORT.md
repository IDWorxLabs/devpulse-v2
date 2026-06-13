# Founder Confidence Propagation Repair Report

Generated: 2026-06-13T11:02:16.438Z

## Before Behavior

- Founder Test Automation used a fixed confidence baseline (~55)
- Strong upstream chain (95→89) collapsed to ~58 without evidence
- Readiness recomputed from sweep percent with heavy arbitrary penalties

## After Behavior

- Strong chain confidence: 89 → 89
- Strong chain readiness: 90/100 (READY_FOR_EXECUTION)
- Blocked chain confidence: 72/100 with documented evidence
- Founder simulation founder-test confidence: 66

## Repaired Logic

- `computeUpstreamConfidenceAnchor` inherits latest upstream authority confidence
- `computeJustifiedConfidenceAdjustments` reduces only for documented blockers/conflicts
- `computePropagatedReadinessScore` caps drops without critical evidence
- `ConfidenceAdjustmentExplanation` exposes every delta with evidence

## Confidence Propagation Impact

- Proof score after repair: 77/100
- Founder test confidence collapse count after: 0
- Legacy-style collapse drop (for reference): 34 points
- Repaired strong-chain drop: 0

## Remaining Confidence Risks

- Chains without upstream context still fall back to baseline 55
- Critical blockers can still reduce confidence up to 25–35 points when evidenced
- Sweep-derived launch verdict BLOCK_LAUNCH still applies justified reductions

---

Pass token: FOUNDER_CONFIDENCE_PROPAGATION_REPAIR_V1_PASS
