# Multi-Source Intake Alignment Report

Generated: 2026-06-13T10:45:33.186Z

## Summary

- Total analyses: 1
- Average alignment score: 91/100
- Average aligned confidence: 77/100
- Strong alignment count: 1

## Alignment Findings

- Analysis ID: intake-alignment-1
- Alignment score: 91/100
- Alignment category: STRONG_ALIGNMENT
- Aligned confidence: 77/100
- Real conflicts: 0
- False conflicts repaired: 2

### Platform Alignment

- Platforms: MOBILE
- True platform conflict: no

### Role Alignment

- Normalized roles: END_USER, TRANSPORT_OPERATOR
- High role alignment: yes

### Semantic Agreements

- [PRODUCT_INTENT] Sources describe TRANSPORTATION product domain
- [PLATFORM] Platform evidence aligns on MOBILE
- [ROLE] Roles are complementary: END_USER, TRANSPORT_OPERATOR
- [WORKFLOW] Workflows support same product journeys: onboarding, ride_request, tracking, checkout
- [MEANING] Typed prompt and voice notes describe the same transportation marketplace actors

### Conflict Classification

- [FALSE_CONFLICT] PLATFORM_CONFLICT: Mobile visual and transportation product intent align; web signal is not primary launch target.
- [FALSE_CONFLICT] USER_ROLE_CONFLICT: Different role labels describe complementary marketplace actors, not contradictory roles.

### Recommendations

- [LOW] No action needed: Evidence is already aligned across intake sources.
- [MEDIUM] Apply alignment repair to intake confidence: 2 false conflict(s) detected; repaired confidence is justified.

---

Pass token: MULTI_SOURCE_INTAKE_ALIGNMENT_REPAIR_V1_PASS
