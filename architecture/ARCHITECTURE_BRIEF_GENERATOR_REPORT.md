# Architecture Brief Generator Report

Generated: 2026-06-13T10:22:37.842Z

## Summary

- Total briefs: 32
- Average confidence: 86/100
- Architecture ready count: 0
- High confidence count: 32

## System Overview

- Brief ID: architecture-brief-1
- Planning brief ID: planning-brief-fixture
- Product type: MOBILE_APP
- Objective: Subscription revenue through mobile checkout
- Platforms:
- MOBILE
- Scale expectations: Medium-scale product with multiple user journeys and service modules.

## Frontend Summary

- Web UI: no
- Mobile UI: yes
- Tablet UI: no
- Desktop UI: no
- Detected needs:
- Native or cross-platform mobile UI
- Screen inventory: onboarding, dashboard, checkout, settings, profile

## Backend Summary

- APIs: yes
- Business services: yes
- Background jobs: yes
- Workflow orchestration: yes
- Detected needs:
- REST or GraphQL APIs backing client screens
- Domain business services for core workflows
- Background jobs for notifications and async processing
- Workflow orchestration for multi-step processes

## Data Model Summary

- Entities:
- user
- order
- product
- Relationships:
- user owns orders
- products belong to catalog accessible by users
- orders linked to checkout workflow
- Ownership models:
- Admin-managed resource ownership
- Role-based resource ownership
- Approval-gated ownership transitions

## Integration Summary

- [PAYMENT] Stripe
- [AI] OpenAI
- [COMMUNICATION] Twilio

## Security Summary

- Authentication:
- OAuth
- Authorization:
- Role-based access control
- User roles:
- admin
- user
- customer

## Risk Analysis

- Overall risk level: LOW
- Risk count: 0
- none

## Confidence & Readiness

- Architecture brief confidence: 92/100
- Architecture brief quality: HIGH_CONFIDENCE
- Architecture brief readiness: ARCHITECTURE_READY

---

Pass token: ARCHITECTURE_BRIEF_GENERATOR_V1_PASS
