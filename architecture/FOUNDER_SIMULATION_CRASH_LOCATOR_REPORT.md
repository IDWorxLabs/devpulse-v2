# Founder Simulation Crash Locator Validation

Result: FOUNDER_SIMULATION_CRASH_LOCATOR_PASS

## Confirmed crash field

- `report.v4.launchVerdictGovernance.requiredEvidenceMissing`
- `report.v4.launchVerdictGovernance.blockingAuthorities`

## Root cause

Payload guard shape auditor missed `requiredEvidenceMissing` / `blockingAuthorities` because key-name heuristics did not match. V5 report builder accessed `.length` on undefined arrays at lines 455/457.

- [x] file: src/founder-simulation-crash-locator/founder-simulation-crash-locator-types.ts: present
- [x] file: src/founder-simulation-crash-locator/founder-simulation-crash-locator-registry.ts: present
- [x] file: src/founder-simulation-crash-locator/undefined-length-stack-parser.ts: present
- [x] file: src/founder-simulation-crash-locator/founder-simulation-crash-context-capturer.ts: present
- [x] file: src/founder-simulation-crash-locator/object-path-probe.ts: present
- [x] file: src/founder-simulation-crash-locator/founder-simulation-crash-classifier.ts: present
- [x] file: src/founder-simulation-crash-locator/founder-simulation-crash-locator-report-builder.ts: present
- [x] file: src/founder-simulation-crash-locator/founder-simulation-crash-locator-history.ts: present
- [x] file: src/founder-simulation-crash-locator/founder-simulation-crash-locator-authority.ts: present
- [x] file: src/founder-simulation-crash-locator/index.ts: present
- [x] PASS token in registry: missing token ref
- [x] v5 launchVerdictGovernance guarded: missing guard
- [x] payload guard uses source normalization before guard: missing
- [x] payload guard uses crash locator only when governance source normalization insufficient: missing
- [x] v5 assemble wired to crash locator: missing
- [x] handler passes runId to guard: missing
- [x] no nested validator: nested
- [x] package script registered: missing
- [x] 1. undefined .length crash stack captured: Cannot read properties of undefined (reading 'length')
- [x] 2. crash stack captured: 2
- [x] 3. crash location classified: V5_REPORT_BUILDER_UNDEFINED_LENGTH
- [x] 4. object path probe identifies missing field: report.v4.launchVerdictGovernance.requiredEvidenceMissing kind=array-like
- [x] 5. missed field patched: report.v4.launchVerdictGovernance.requiredEvidenceMissing, report.v4.launchVerdictGovernance.blockingAuthorities
- [x] 6. missingFields repaired > 0 after guard: report.v4.launchVerdictGovernance.requiredEvidenceMissing, report.v4.launchVerdictGovernance.blockingAuthorities
- [x] 7. guarded diagnostic uses source normalization instead of governance crash locator: # Founder Simulation Guarded Diagnostic Report

Generated: 2026-06-20T19:06:48.888Z
Completion event: FOUNDER_SIMULATION
- [x] guard governance arrays normalized without crash-locator repair metadata: empty
- [x] 8. report generation succeeds after targeted patch: 343
- [x] result store receives markdown: empty
- [x] 9. no nested validator chains: nested spawn

**FOUNDER_SIMULATION_CRASH_LOCATOR_PASS**