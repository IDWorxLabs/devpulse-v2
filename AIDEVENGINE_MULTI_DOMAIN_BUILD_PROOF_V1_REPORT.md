# AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1

Generated: 2026-06-25T08:39:43.794Z

## Verdict: **PARTIAL**



## Summary

- Scenarios executed: **5/5**
- Build success rate: **5/5** (100%)
- Launch-ready rate: **0/5** (0%)
- Average CQI confidence before clarification: **31**
- Average CQI confidence after clarification: **88**
- Average UVL coverage/confidence: **98% / 98**
- Average AFLA score: **100**
- AiDevEngine generalizes beyond Task Tracker: **NO (honest assessment)**

## Scenario-by-scenario results

| Scenario | Domain | Verdict | Build | Runtime | UVL | AFLA | Launch blockers |
|----------|--------|---------|-------|---------|-----|------|-----------------|
| crm-lite | CRM Lite | **PARTIAL** | OK | 11/11 | 98%/98 | NOT_LAUNCH_READY (100) | UVL hub insufficient for launch (1 critical gap(s): Requirement); AFLA verdict NOT_LAUNCH_READY (score 100) |
| booking-system | Booking System | **PARTIAL** | OK | 11/11 | 99%/99 | NOT_LAUNCH_READY (100) | UVL hub insufficient for launch (1 critical gap(s): General: Founder Review failed: Founder review incomplete or blocked); AFLA verdict NOT_LAUNCH_READY (score 100) |
| inventory-manager | Inventory Manager | **PARTIAL** | OK | 9/9 | 98%/98 | NOT_LAUNCH_READY (100) | UVL hub insufficient for launch (1 critical gap(s): Requirement); AFLA verdict NOT_LAUNCH_READY (score 100) |
| client-portal | Client Portal | **PARTIAL** | OK | 11/11 | 98%/98 | NOT_LAUNCH_READY (100) | UVL hub insufficient for launch (1 critical gap(s): Requirement); AFLA verdict NOT_LAUNCH_READY (score 100) |
| field-service | Field Service App | **PARTIAL** | OK | 9/9 | 99%/99 | NOT_LAUNCH_READY (100) | UVL hub insufficient for launch (1 critical gap(s): General: Founder Review failed: Founder review incomplete or blocked); AFLA verdict NOT_LAUNCH_READY (score 100) |

## Common blockers

- (5x) AFLA verdict NOT_LAUNCH_READY (score 100)
- (5x) Founder prerequisite: Requirement Discovery incomplete
- (5x) Founder prerequisite: Verification Hub incomplete
- (3x) UVL hub insufficient for launch (1 critical gap(s): Requirement)
- (2x) UVL hub insufficient for launch (1 critical gap(s): General: Founder Review failed: Founder review incomplete or blocked)

## Next improvements

- **crm-lite**: UVL hub insufficient for launch (1 critical gap(s): Requirement)
- **booking-system**: UVL hub insufficient for launch (1 critical gap(s): General: Founder Review failed: Founder review incomplete or blocked)
- **inventory-manager**: UVL hub insufficient for launch (1 critical gap(s): Requirement)
- **client-portal**: UVL hub insufficient for launch (1 critical gap(s): Requirement)
- **field-service**: UVL hub insufficient for launch (1 critical gap(s): General: Founder Review failed: Founder review incomplete or blocked)

## Validation checks

| Check | Status | Detail |
|-------|--------|--------|
| all 5 scenarios executed | PASS | 5/5 |
| scenario crm-lite produced workspace or exact failure reason | PASS | C:\Users\Richa\Desktop\DevPulse-V2\.generated-builder-workspaces\rbep-crm-web-v1 |
| scenario crm-lite attempted requirements enrichment | PASS | initial=29 enriched=85 |
| scenario crm-lite attempted build | PASS | build ok |
| scenario crm-lite attempted runtime/visual verification | PASS | 11/11 checks |
| scenario crm-lite produced product architecture evidence | PASS | 14/14 items |
| scenario crm-lite produced UVL/AFLA/final verdict | PASS | NOT_LAUNCH_READY |
| scenario crm-lite not falsely marked LAUNCH_READY | PASS | PARTIAL |
| scenario booking-system produced workspace or exact failure reason | PASS | C:\Users\Richa\Desktop\DevPulse-V2\.generated-builder-workspaces\rbep-appointment-booking-web-v1 |
| scenario booking-system attempted requirements enrichment | PASS | initial=33 enriched=93 |
| scenario booking-system attempted build | PASS | build ok |
| scenario booking-system attempted runtime/visual verification | PASS | 11/11 checks |
| scenario booking-system produced product architecture evidence | PASS | 15/15 items |
| scenario booking-system produced UVL/AFLA/final verdict | PASS | NOT_LAUNCH_READY |
| scenario booking-system not falsely marked LAUNCH_READY | PASS | PARTIAL |
| scenario inventory-manager produced workspace or exact failure reason | PASS | C:\Users\Richa\Desktop\DevPulse-V2\.generated-builder-workspaces\rbep-inventory-web-v1 |
| scenario inventory-manager attempted requirements enrichment | PASS | initial=33 enriched=85 |
| scenario inventory-manager attempted build | PASS | build ok |
| scenario inventory-manager attempted runtime/visual verification | PASS | 9/9 checks |
| scenario inventory-manager produced product architecture evidence | PASS | 14/14 items |
| scenario inventory-manager produced UVL/AFLA/final verdict | PASS | NOT_LAUNCH_READY |
| scenario inventory-manager not falsely marked LAUNCH_READY | PASS | PARTIAL |
| scenario client-portal produced workspace or exact failure reason | PASS | C:\Users\Richa\Desktop\DevPulse-V2\.generated-builder-workspaces\rbep-customer-support-web-v1 |
| scenario client-portal attempted requirements enrichment | PASS | initial=25 enriched=85 |
| scenario client-portal attempted build | PASS | build ok |
| scenario client-portal attempted runtime/visual verification | PASS | 11/11 checks |
| scenario client-portal produced product architecture evidence | PASS | 14/14 items |
| scenario client-portal produced UVL/AFLA/final verdict | PASS | NOT_LAUNCH_READY |
| scenario client-portal not falsely marked LAUNCH_READY | PASS | PARTIAL |
| scenario field-service produced workspace or exact failure reason | PASS | C:\Users\Richa\Desktop\DevPulse-V2\.generated-builder-workspaces\rbep-fleet-management-web-v1 |
| scenario field-service attempted requirements enrichment | PASS | initial=36 enriched=93 |
| scenario field-service attempted build | PASS | build ok |
| scenario field-service attempted runtime/visual verification | PASS | 9/9 checks |
| scenario field-service produced product architecture evidence | PASS | 15/15 items |
| scenario field-service produced UVL/AFLA/final verdict | PASS | NOT_LAUNCH_READY |
| scenario field-service not falsely marked LAUNCH_READY | PASS | PARTIAL |

## Artifacts

`.aidevengine-multi-domain-build-proof-v1/`
