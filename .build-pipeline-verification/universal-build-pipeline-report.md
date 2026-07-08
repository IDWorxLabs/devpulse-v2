# Universal Build Pipeline Report

Generated: 2026-06-30T11:00:07.042Z
Owner: devpulse_v2_universal_build_pipeline_verification
Prompts tested: 12

## Summary

| Signal | Value |
|--------|-------|
| LISA included | yes |
| Generic custom profile accepted | yes |
| Feature reality fallback is warning | yes |
| ExpenseTracker contamination | none |

## Blockers by Class

### LEGITIMATE_BLOCKER (14)
- [PROMPT_FAITHFULNESS] Prompt faithfulness score below threshold.
- [PROMPT_FAITHFULNESS] Prompt faithfulness score below threshold.
- [ASE_AUTHORIZATION] Human review required: Payment Processing
- [PROMPT_FAITHFULNESS] Prompt faithfulness score below threshold.
- [PROMPT_FAITHFULNESS] Prompt faithfulness score below threshold.
- [PROMPT_FAITHFULNESS] Prompt faithfulness score below threshold.
- [PROMPT_FAITHFULNESS] Prompt faithfulness score below threshold.
- [PROFILE_RESOLUTION] Profile BOOKING_WEB_V1 not accepted for this prompt.
- [PROMPT_FAITHFULNESS] Prompt faithfulness score below threshold.
- [PROMPT_FAITHFULNESS] Prompt faithfulness score below threshold.
- … and 4 more

### OVERSTRICT_BLOCKER (0)
- none

### WRONG_STAGE_BLOCKER (0)
- none

### STALE_EVIDENCE_BLOCKER (0)
- none

### MISSING_FALLBACK_BLOCKER (0)
- none

### PROFILE_MISROUTE_BLOCKER (0)
- none

### AUTH_INJECTION_BUG (0)
- none

### PREVIEW_GATE_BUG (0)
- none

### REPORTING_ONLY_BUG (0)
- none

## Systemic Patterns

- none

## Profile Misroute Patterns

- none

## Over-Strict Gate Patterns

- none

## Recommended Fixes (by priority)

## Per-Category Results

### Assistive / Mobile Accessibility App (`assistive-mobile-accessibility`)
- Profile: GENERIC_CUSTOM_APP_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 0

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | WARN | no | — |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### Expense Tracker (`expense-tracker`)
- Profile: EXPENSE_TRACKER_WEB_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 1

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### E-Commerce Store (`e-commerce-store`)
- Profile: GENERIC_CUSTOM_APP_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 2

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | WARN | no | Human review required: Payment Processing |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### SaaS CRM (`saas-crm`)
- Profile: CRM_WEB_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 1

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### Social / Community App (`social-community`)
- Profile: GENERIC_CUSTOM_APP_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 1

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### AI Chat App (`ai-chat-app`)
- Profile: GENERIC_CUSTOM_APP_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 1

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### Education / LMS App (`education-lms`)
- Profile: SCHOOL_MANAGEMENT_WEB_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 1

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### Healthcare / Patient Portal (`healthcare-patient-portal`)
- Profile: BOOKING_WEB_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 2

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | FAIL | yes | Profile BOOKING_WEB_V1 not accepted for this prompt. |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### Marketplace App (`marketplace-app`)
- Profile: GENERIC_CUSTOM_APP_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 2

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | WARN | no | Human review required: Payment Processing |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### Developer Tool / API Dashboard (`developer-api-dashboard`)
- Profile: GENERIC_CUSTOM_APP_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 1

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### Internal HR / Admin Tool (`internal-hr-admin`)
- Profile: CRM_WEB_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 1

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |

### Simple Game / Puzzle App (`simple-game-puzzle`)
- Profile: GENERIC_CUSTOM_APP_V1
- Outcome: BUILD_BLOCKED_BEFORE_MATERIALIZATION
- Prompt faithfulness: FAIL
- Workspace materialized: no
- Feature reality: n/a
- npm install: no
- npm build: no
- preview: no
- report: yes
- Blockers: 1

| Stage | Decision | Blocks | Reason |
|-------|----------|--------|--------|
| Prompt Intake | PASS | no | — |
| Intent Understanding | PASS | no | — |
| Profile Resolution | PASS | no | — |
| Prompt Faithfulness | FAIL | yes | Prompt faithfulness score below threshold. |
| Module Extraction | PASS | no | — |
| Plan Contract | PASS | no | — |
| ASE Authorization | PASS | no | — |
| Workspace Generation | SKIP | no | — |
| Feature Reality | SKIP | no | — |
| Materialization Quality | SKIP | no | — |
| Persistent Promotion | SKIP | no | — |
| npm install | SKIP | no | — |
| npm build | SKIP | no | — |
| AutoFix Eligibility | SKIP | no | — |
| Preview Startup | SKIP | no | — |
| Device / Viewport Preview | SKIP | no | — |
| Final Report | SKIP | no | — |
