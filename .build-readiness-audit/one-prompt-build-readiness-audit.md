# AiDevEngine One-Prompt Build Readiness Audit

**Audited at:** 2026-06-30T17:02:37.264Z
**Production path:** production-orchestrator-via-runOnePromptLivePreviewBuild

## Executive summary

This audit exercises the real production build spine (`runOnePromptLivePreviewBuild` with `source: api`) for six canonical app categories. It does not rely on leaf-mode pipeline tracers alone.

**Matrix pass rate:** 6/6 READY · 6/6 npm build PASS · 6/6 live preview unlocked · 6/6 promoted

### Key findings

- **Build spine:** 6/6 apps reached READY with npm install/build passing on the production orchestrator path.
- **Preview:** 6/6 apps have live preview available (including degraded interaction proof when route probe succeeds).
- **AutoFix:** AEE Build AutoFix loop is wired on the spine; 0 app(s) triggered repair during this audit (successful builds do not require AutoFix).
- **Stale blockers:** 0 AUTOFIX_NOT_EXECUTING · 0 MODULE_INJECTION in top blockers.
- **Module contract:** Comparisons use Engineering Intelligence final module contract and workspace modules, not stale pre-EI approved modules alone.

## Top 10 blockers stopping real builds today

## Per-app matrix results

| App | Intent | Plan | Modules | Workspace | npm i | npm build | AutoFix avail | AutoFix trig | MCE | Preview | Recovery | Promoted | Response | Status |
|-----|--------|------|---------|-----------|-------|-----------|---------------|--------------|-----|---------|----------|----------|----------|--------|
| Assistive / Mobile Accessibility App | Y | Y | Y | Y | Y | Y | Y | N | N | Y | Y | Y | Y | READY |
| Expense Tracker | Y | Y | Y | Y | Y | Y | Y | N | N | Y | Y | Y | Y | READY |
| SaaS CRM | Y | Y | Y | Y | Y | Y | Y | N | N | Y | Y | Y | Y | READY |
| E-Commerce Store | Y | Y | Y | Y | Y | Y | Y | N | N | Y | Y | Y | Y | READY |
| AI Chat App | Y | Y | Y | Y | Y | Y | Y | N | N | Y | Y | Y | Y | READY |
| Internal HR / Admin Tool | Y | Y | Y | Y | Y | Y | Y | N | N | Y | Y | Y | Y | READY |

## Recommended fix order

1. Unblock ASE→AEE continuation for named-profile apps (expense, CRM, HR) so materialization runs on source:api path
2. Wire AutoFix (or bounded npm-build repair) on the one-prompt orchestrator spine after npm run build failures
3. Ensure AEE post-build coordination always runs after preview recovery (no stale STOP from pre-build)
4. Harden preview gate + dev-server lifecycle on Windows (port cleanup between builds)
5. Keep Command Center chips registry-authoritative (purge stale multiProjectWorkspaces on empty registry)
6. Align UI build-progress detection with shared classifyBuildIntentRequest route parity contract
7. Expand Missing Capability Evolution triggers for preview-gate CAPABILITY_PLANNING blockers
8. Promote workspace on npm PASS + degraded preview (BUILD_COMPLETED_WITH_DEGRADED_PREVIEW)
9. Profile guard: block ExpenseTracker/CRM misroutes for GENERIC_CUSTOM prompts
10. Module injection policy: block auth/filter/export without explicit prompt evidence
11. Truthful final response: AEE_CONTROLLED_RESULT envelope must match npm/preview evidence

## Minimum path to first successful app preview

- Pick one simple GENERIC_CUSTOM prompt (e-commerce or AI chat) with 3–4 modules
- Run POST /api/brain/respond with build intent on a clean registry project
- Verify workspace materialization + npm install + npm build PASS
- Accept degraded preview if gate locked; ensure recovery loop runs and reports truthfully
- Confirm persistent promotion + registry sync for the project
- Command Center shows READY build with diagnostic preview URL when gate locked

## Minimum path to stable AiDevEngine 1.0

- AutoFix or bounded repair on npm build + TypeScript route wiring failures
- Reliable preview unlock or degraded-preview success contract across 6 matrix apps
- Windows dev-server/process cleanup between builds
- Registry ↔ Command Center ↔ Live Preview single source of truth
- AEE controls all stop/continue decisions with evidence-backed final reports
- Matrix regression: 6 categories build npm PASS with prompt-faithful modules
- No manual “run Autonomous Debugging” unless recovery budget exhausted

## Per-app detail

### Assistive / Mobile Accessibility App (`assistive-mobile-accessibility`)

- **Expected profile:** ASSISTIVE_COMMUNICATION_APP_V1
- **Selected profile:** ASSISTIVE_COMMUNICATION_APP_V1
- **Module contract:** EI_CONTRACT_SATISFIED
- **Final modules (EI/workspace):** accessibility-layer, accessibility-settings, blink-input-engine, caregiver-dashboard, communication-history, emergency-speech, eye-tracking-board, filter-ui, gaze-keyboard, navigation-router, onboarding-calibration, quick-phrases, text-to-speech
- **AutoFix:** available=true triggered=false
- **AEE decision / outcome:** CONTINUE / BUILD_COMPLETED_WITH_PREVIEW
- **Failure reason:** none
- **Duration:** 30553ms

### Expense Tracker (`expense-tracker`)

- **Expected profile:** EXPENSE_TRACKER_WEB_V1
- **Selected profile:** EXPENSE_TRACKER_WEB_V1
- **Module contract:** EI_CONTRACT_SATISFIED
- **Final modules (EI/workspace):** categories, charts, csv-export, dashboard, expenses, filter-ui, income, navigation-router, reports, settings
- **AutoFix:** available=true triggered=false
- **AEE decision / outcome:** CONTINUE / BUILD_COMPLETED_WITH_PREVIEW
- **Failure reason:** none
- **Duration:** 17601ms

### SaaS CRM (`saas-crm`)

- **Expected profile:** CRM_WEB_V1
- **Selected profile:** CRM_WEB_V1
- **Module contract:** EI_CONTRACT_SATISFIED
- **Final modules (EI/workspace):** contacts, customers, dashboard, deals, follow-ups, navigation-router, pipeline, reports, settings, activities
- **AutoFix:** available=true triggered=false
- **AEE decision / outcome:** CONTINUE / BUILD_COMPLETED_WITH_PREVIEW
- **Failure reason:** none
- **Duration:** 21561ms

### E-Commerce Store (`e-commerce-store`)

- **Expected profile:** GENERIC_CUSTOM_APP_V1
- **Selected profile:** GENERIC_CUSTOM_APP_V1
- **Module contract:** EI_CONTRACT_SATISFIED
- **Final modules (EI/workspace):** cart, checkout, dashboard, navigation-router, orders, payments, products, settings
- **AutoFix:** available=true triggered=false
- **AEE decision / outcome:** CONTINUE / BUILD_COMPLETED_WITH_PREVIEW
- **Failure reason:** none
- **Duration:** 17785ms

### AI Chat App (`ai-chat-app`)

- **Expected profile:** GENERIC_CUSTOM_APP_V1
- **Selected profile:** GENERIC_CUSTOM_APP_V1
- **Module contract:** EI_CONTRACT_SATISFIED
- **Final modules (EI/workspace):** chat-input, conversations, dashboard, history, navigation-router, responses, settings
- **AutoFix:** available=true triggered=false
- **AEE decision / outcome:** CONTINUE / BUILD_COMPLETED_WITH_PREVIEW
- **Failure reason:** none
- **Duration:** 16173ms

### Internal HR / Admin Tool (`internal-hr-admin`)

- **Expected profile:** CRM_WEB_V1
- **Selected profile:** CRM_WEB_V1
- **Module contract:** EI_CONTRACT_SATISFIED
- **Final modules (EI/workspace):** contacts, customers, dashboard, employees, follow-ups, navigation-router, onboarding, payroll, pipeline, reports, settings, time-off
- **AutoFix:** available=true triggered=false
- **AEE decision / outcome:** CONTINUE / BUILD_COMPLETED_WITH_PREVIEW
- **Failure reason:** none
- **Duration:** 15894ms
