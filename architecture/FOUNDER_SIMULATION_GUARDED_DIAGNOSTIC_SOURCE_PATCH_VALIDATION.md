# Founder Simulation Guarded Diagnostic Source Patch Validation

Generated: 2026-06-20T19:08:26.096Z

Pass token: FOUNDER_SIMULATION_GUARDED_DIAGNOSTIC_SOURCE_PATCH_PASS

## Checks

- [x] **file: src/founder-simulation-payload-guard/founder-simulation-guarded-diagnostic-source-patch.ts** — present
- [x] **file: src/founder-simulation-payload-guard/founder-simulation-payload-guard-authority.ts** — present
- [x] **guard normalizes raw before diagnostic markdown** — missing source normalize before guard
- [x] **guard no longer uses crash-locator governance fallback** — crash-locator governance fallback still present
- [x] **handler passes reportBuildError for length crashes** — missing reportBuildError wire
- [x] **package script registered** — missing
- [x] **no new broad authority directory added** — unexpected authority directory
- [x] **1. raw degraded result governance arrays normalized before diagnostic** — report.v4.launchVerdictGovernance.requiredEvidenceMissing, report.v4.launchVerdictGovernance.blockingAuthorities, report.v4.launchVerdictGovernance.satisfiedRules, report.v4.launchVerdictGovernance.failedRules, report.v4.launchVerdictGovernance.governanceReasoning
- [x] **2. guarded diagnostic does not report Missing fields repaired: 2** — - Missing fields repaired: 0
- [x] **3. crash locator not required for requiredEvidenceMissing** — # Founder Simulation Guarded Diagnostic Report

Generated: 2026-06-20T19:08:26.095Z
Completion event: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS
Degraded: yes
Elapsed: 252460ms

## Warning Metadata

- Original error: Cannot read properties of undefined (reading 'length')
- Missing fields repaired: 0
- Patch applied: no
- none

## Repairs Applied

- None

## Partial Report

# Degraded partial report
- [x] **4. crash locator not required for blockingAuthorities** — # Founder Simulation Guarded Diagnostic Report

Generated: 2026-06-20T19:08:26.095Z
Completion event: FOUNDER_SIMULATION_COMPLETE_WITH_WARNINGS
Degraded: yes
Elapsed: 252460ms

## Warning Metadata

- Original error: Cannot read properties of undefined (reading 'length')
- Missing fields repaired: 0
- Patch applied: no
- none

## Repairs Applied

- None

## Partial Report

# Degraded partial report
- [x] **5. diagnostic does not include Patch applied: yes for governance fields** — - Patch applied: no
- [x] **governance arrays materialized on guarded result** — {"launchVerdictReady":false,"launchVerdict":"NOT_READY","governanceVerdict":"BLOCKED","requiredEvidenceMissing":[],"blockingAuthorities":[],"satisfiedRules":[],"failedRules":[],"governanceReasoning":[],"recommendations":[],"ruleEvaluations":[]}
- [x] **governance fields absent from guard missingFields after source patch** — 
- [x] **6. founder simulation can still complete with warnings for unrelated reasons** — V5 exceeded stage budget
- [x] **founder simulation clean completion still available** — FOUNDER_SIMULATION_COMPLETE