# Validation Runtime Governance V1

**Generated:** 2026-07-07T12:52:11.194Z  
**Governance Active:** YES  
**Audit Baseline:** `VALIDATION_RUNTIME_AUDIT_V1_PASS`  
**Pass Token:** `VALIDATION_RUNTIME_GOVERNANCE_V1_PASS`

---

## Executive Summary

Validation Runtime Governance V1 transforms validation from **Run Everything** to **Run What Is Necessary** using evidence from Validation Runtime Audit V1.

| Principle | Status |
|-----------|--------|
| Bounded | Tier runtime targets enforced |
| Cached | Build output cache active |
| Reusable | Preview + Playwright pools active |
| Tiered | FAST / STANDARD / FULL / LAUNCH |
| Targeted | Capability impact graph active |

### Governance Metrics

| Validation Overhead | 63.8% → 16.7% (target <20%) |
| Duplicate Work | 96% → 22.8% (target <25%) |
| Cache Hit % | 65% |
| Preview Reuse % | 72% |
| Build Reuse % | 58% |

---

## Validation Tiers

| Tier | Validators Assigned |
|------|---------------------|
| FAST | 343 |
| STANDARD | 142 |
| FULL | 44 |
| LAUNCH | 13 |

### Tier Targets

| Tier | Target Runtime | Use Case |
|------|----------------|----------|
| FAST | < 60s | During implementation |
| STANDARD | < 5 min | After feature completion |
| FULL | < 15 min | Milestone completion |
| LAUNCH | Maximum confidence | Launch candidate only |

**LAUNCH validators:** `validate:afla-trust-calibration-v1`, `validate:autonomous-founder-launch-authority-v1`, `validate:capability-audit-v1`, `validate:capability-audit-v2`, `validate:capability-audit-v3`, `validate:capability-audit-v3-1`, `validate:founder-launch-decision-authority`, `validate:large-scale-multi-app-validation-v1`

---

## Governance Rules

| ID | Rule | Status | Description |
|----|------|--------|-------------|
| RULE_1 | Validation Tiers | ACTIVE | FAST / STANDARD / FULL / LAUNCH tier enforcement |
| RULE_2 | Preview Server Reuse | ACTIVE | Single shared preview runtime pool; new server requires justification |
| RULE_3 | Build Output Cache | ACTIVE | Build once, reuse dist/ via workspace fingerprint |
| RULE_4 | Playwright Session Reuse | ACTIVE | Shared browser session pool across validators |
| RULE_5 | AFLA Tiering | ACTIVE | AFLA only in FULL and LAUNCH tiers |
| RULE_6 | Affected Capability Validation | ACTIVE | Capability impact graph maps changed files to validators |
| RULE_7 | Validation Artifact Reuse | ACTIVE | Reuse execution/verification/build/blueprint/AFLA proofs when valid |
| RULE_8 | Regression Budget | ACTIVE | Runtime budget per validator; breaches become audit findings |
| RULE_9 | Duplicate Validation Prevention | ACTIVE | Block repeated expensive operations when reusable evidence exists |
| RULE_10 | Governance Metrics | ACTIVE | Track overhead, duplicate work, cache/reuse hit rates |

---

## Capability Impact Graph

**Example: CQI file changed**

| Categories | Validators to Run | Excluded |
|------------|-------------------|----------|
| CQI | validate:clarifying-question-intelligence, validate:clarifying-question-intelligence-maturity-v1, validate:clarifying-question-live-gate, validate:cqi-integration-repair-v1 | validate:autonomous-founder-launch-authority-v1, validate:uvl-verification-execution-v1, validate:capability-audit-v3, validate:large-scale-multi-app-validation-v1 |

FAST tier plan for CQI change: 1 validators, ~0s

---

## Reuse Strategy

| Strategy | Enabled | Est. Savings |
|----------|---------|--------------|
| Preview server reuse | true | 59 min |
| Build output cache | true | 16 min |
| Playwright session reuse | true | 18 min |
| Artifact reuse | true | — |

---

## Duplicate Prevention

| Operation | Affected Validators | Action |
|-----------|---------------------|--------|
| Repeated npm install | 19 | BLOCK |
| Repeated npm build | 54 | BLOCK |
| Repeated preview startup | 90 | BLOCK |
| Repeated UVL execution | 3 | BLOCK |
| Repeated AFLA execution | 4 | BLOCK |
| Repeated Playwright execution | 17 | BLOCK |

---

## AFLA Tiering

**STANDARD tier + AFLA:** BLOCKED — Tier STANDARD policy

---

## Answers

| Question | Answer |
|----------|--------|
| What validation should run? | Use tier + capability impact graph — e.g. FAST runs only affected validators |
| Why should it run? | Changed file → capability → validator mapping |
| Can existing evidence be reused? | Yes — build cache, preview pool, artifact registry |
| Can runtime be reduced without reducing confidence? | Yes — LAUNCH tier retains full UVL/PAI/AFLA confidence |

---

## Artifacts

- `.validation-runtime-governance-v1/governance-policy.json`
- `.validation-runtime-governance-v1/tier-registry.json`
- `.validation-runtime-governance-v1/capability-impact-graph.json`
- `.validation-runtime-governance-v1/runtime-budget-registry.json`
- `.validation-runtime-governance-v1/reuse-strategy.json`
- `.validation-runtime-governance-v1/governance-metrics.json`
