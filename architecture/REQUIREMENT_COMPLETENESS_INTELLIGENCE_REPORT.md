# Requirement Completeness Intelligence Report

Generated: 2026-06-13T09:57:39.045Z

## Summary

- Total analyses: 32
- Average completeness score: 32/100
- Average readiness score: 6/100
- Ready for planning count: 0

## Completeness Findings

- Analysis ID: req-completeness-2
- Completeness score: 81/100 (READY_WITH_GAPS)
- Readiness score: 93/100
- Confidence score: 95/100
- Risk level: LOW
- Safe to proceed: yes
- Evidence sources: TYPED_PROMPT, TYPED_SCREENS, TYPED_WORKFLOWS, VOICE_NOTES_INTELLIGENCE, VISUAL_REFERENCE_INTELLIGENCE, PROJECT_VAULT_CONTEXT

## Readiness Findings

- Project requirement readiness: READY_WITH_GAPS

## Domain Analysis

### UI_REQUIREMENTS (92/100)
- Covered:
- SCREENS_DEFINED
- NAVIGATION_DEFINED
- ONBOARDING_DEFINED
- SETTINGS_DEFINED
- Gaps:
- none

### BUSINESS_LOGIC (95/100)
- Covered:
- WORKFLOWS_DEFINED
- PERMISSIONS_DEFINED
- APPROVAL_LOGIC_DEFINED
- BUSINESS_RULES_PRESENT
- Gaps:
- none

### AUTHENTICATION (98/100)
- Covered:
- LOGIN_DEFINED
- SIGNUP_DEFINED
- ROLES_DEFINED
- SOCIAL_AUTH_DEFINED
- Gaps:
- none

### DATA_MODEL (51/100)
- Covered:
- ENTITIES_DEFINED
- MULTI_ENTITY_MODEL
- Gaps:
- OWNERSHIP_NOT_DEFINED

### NOTIFICATIONS (60/100)
- Covered:
- EMAIL_DEFINED
- PUSH_DEFINED
- Gaps:
- none

### INTEGRATIONS (70/100)
- Covered:
- INTEGRATION_STRIPE
- INTEGRATION_PAYPAL
- INTEGRATION_STRIPE_PAYMENTS
- Gaps:
- none

### PLATFORM_TARGETS (100/100)
- Covered:
- PLATFORM_TARGETS_DEFINED
- PLATFORM_IOS
- PLATFORM_ANDROID
- PLATFORM_WEB
- PLATFORM_MOBILE APP
- PLATFORM_IOS
- PLATFORM_ANDROID
- PLATFORM_CROSS_PLATFORM
- PLATFORM_MOBILE
- PLATFORM_IOS AND ANDROID MOBILE LAUNCH
- PRODUCT_TYPE_MOBILE_APP
- Gaps:
- none

## Missing Requirement Categories

- [MEDIUM] DATA_MODEL: OWNERSHIP_NOT_DEFINED

## Clarifying Questions

- [HIGH] (DATA_MODEL) Who owns each data entity, and how is access scoped per user or organization?

## Risk Assessment

- Overall risk: LOW
- Missing requirement count: 1
- Critical questions: 0

---

Pass token: REQUIREMENT_COMPLETENESS_INTELLIGENCE_V1_PASS
