# Validation Runtime Audit V1

**Generated:** 2026-07-07T12:52:14.000Z  
**Mode:** READ ONLY — MEASUREMENT ONLY  
**Pass Token:** `VALIDATION_RUNTIME_AUDIT_V1_PASS`

---

## Executive Summary

AiDevEngine validation ecosystem runtime audit. This phase measures where time is spent before Validation Runtime Governance V1.

| Metric | Value |
|--------|-------|
| Total validators scanned | 629 |
| Registered in package.json | 542 |
| Measured baselines used | 12 |
| Aggregate duplicate work | 95% |
| Sum of registered validator estimates | 441.4 min (26486s) |

### Typical Phase Overhead

| Phase | Minutes |
|-------|---------|
| Implementation (typical) | 5 |
| Regression validation | 8.8 |
| **Validation overhead ratio** | **63.8%** |

Phase validators: `validate:capability-audit-v3`, `validate:real-build-execution-pipeline-v1`, `validate:real-build-execution-pipeline-v1-1`, `validate:uvl-verification-execution-v1`, `validate:clarifying-question-intelligence-maturity-v1`, `validate:afla-trust-calibration-v1`, `validate:product-architect-intelligence-v1`, `validate:autonomous-founder-launch-authority-v1`

---

## Category Runtime Breakdown

| Category | Validators | Est. Runtime | Est. Minutes |
|----------|------------|--------------|--------------|
| OTHER | 414 | 18646s | 310.8 min |
| BLUEPRINT | 3 | 2018s | 33.6 min |
| FEATURE_REALITY | 3 | 1885s | 31.4 min |
| FOUNDATION | 32 | 1206s | 20.1 min |
| WORLD2 | 28 | 855s | 14.3 min |
| AFLA | 3 | 437s | 7.3 min |
| OPERATOR | 20 | 422s | 7 min |
| CONNECTED_PIPELINE | 8 | 249s | 4.2 min |
| UVL | 5 | 191s | 3.2 min |
| ENGINEERING | 2 | 183s | 3.1 min |
| LAUNCH | 12 | 121s | 2 min |
| CQI | 4 | 111s | 1.9 min |
| REAL_BUILD_EXECUTION | 2 | 83s | 1.4 min |
| CAPABILITY_AUDIT | 5 | 78s | 1.3 min |
| PAI | 1 | 1s | 0 min |

---

## Top 20 Slowest Validators

### Slowest (by runtime seconds)

| Rank | Validator | Runtime (s) | Runtime (min) | Cost | Dup % | Category |
|------|-----------|-------------|---------------|------|-------|----------|
| 1 | `validate:build-reality-autofix-engine-v1` | 2433s | 40.55 min | CRITICAL | 98% | OTHER |
| 2 | `validate:universal-app-blueprint-visual-v1` | 1702s | 28.37 min | CRITICAL | 50% | BLUEPRINT |
| 3 | `validate:universal-feature-contract-intelligence-v1` | 1652s | 27.53 min | CRITICAL | 98% | FEATURE_REALITY |
| 4 | `validate:validation-runtime-governance-v1` | 1328s | 22.13 min | CRITICAL | 33% | OTHER |
| 5 | `validate:product-stabilization-phase-2-v1` | 1173s | 19.55 min | CRITICAL | 98% | OTHER |
| 6 | `validate:general-purpose-code-generation-v1` | 840s | 14 min | CRITICAL | 98% | OTHER |
| 7 | `validate:multi-project-concurrent-execution-v1` | 840s | 14 min | CRITICAL | 0% | OTHER |
| 8 | `validate:product-stabilization-phase-4-v1` | 738s | 12.3 min | CRITICAL | 98% | OTHER |
| 9 | `validate:cloud-execution-path-v1` | 630s | 10.5 min | CRITICAL | 0% | OTHER |
| 10 | `validate:mobile-runtime-validation-at-scale-v1` | 630s | 10.5 min | CRITICAL | 0% | OTHER |
| 11 | `validate:self-evolution-execution-v1` | 630s | 10.5 min | CRITICAL | 0% | OTHER |
| 12 | `validate:world2-real-instantiation-v1` | 630s | 10.5 min | CRITICAL | 0% | WORLD2 |
| 13 | `validate:product-stabilization-phase-5-v1` | 579s | 9.65 min | CRITICAL | 98% | OTHER |
| 14 | `validate:failed-build-forensic-manifest` | 428s | 7.13 min | CRITICAL | 98% | OTHER |
| 15 | `validate:autonomous-founder-launch-authority-v1` | 426s | 7.1 min | CRITICAL | 17% | AFLA |
| 16 | `validate:production-readiness-gate-v1` | 420s | 7 min | CRITICAL | 50% | OTHER |
| 17 | `validate:product-stabilization-phase-3-v1` | 318s | 5.3 min | CRITICAL | 98% | OTHER |
| 18 | `validate:code-generation-engine-v1` | 312s | 5.2 min | CRITICAL | 75% | OTHER |
| 19 | `validate:universal-app-blueprint-v1` | 263s | 4.38 min | HIGH | 67% | BLUEPRINT |
| 20 | `validate:product-stabilization-phase-1-v1` | 252s | 4.2 min | HIGH | 67% | OTHER |


## Top 20 Most Expensive Validators

### Most expensive (cost tier × runtime)

| Rank | Validator | Runtime (s) | Runtime (min) | Cost | Dup % | Category |
|------|-----------|-------------|---------------|------|-------|----------|
| 1 | `validate:build-reality-autofix-engine-v1` | 2433s | 40.55 min | CRITICAL | 98% | OTHER |
| 2 | `validate:universal-app-blueprint-visual-v1` | 1702s | 28.37 min | CRITICAL | 50% | BLUEPRINT |
| 3 | `validate:universal-feature-contract-intelligence-v1` | 1652s | 27.53 min | CRITICAL | 98% | FEATURE_REALITY |
| 4 | `validate:validation-runtime-governance-v1` | 1328s | 22.13 min | CRITICAL | 33% | OTHER |
| 5 | `validate:product-stabilization-phase-2-v1` | 1173s | 19.55 min | CRITICAL | 98% | OTHER |
| 6 | `validate:general-purpose-code-generation-v1` | 840s | 14 min | CRITICAL | 98% | OTHER |
| 7 | `validate:multi-project-concurrent-execution-v1` | 840s | 14 min | CRITICAL | 0% | OTHER |
| 8 | `validate:product-stabilization-phase-4-v1` | 738s | 12.3 min | CRITICAL | 98% | OTHER |
| 9 | `validate:cloud-execution-path-v1` | 630s | 10.5 min | CRITICAL | 0% | OTHER |
| 10 | `validate:mobile-runtime-validation-at-scale-v1` | 630s | 10.5 min | CRITICAL | 0% | OTHER |
| 11 | `validate:self-evolution-execution-v1` | 630s | 10.5 min | CRITICAL | 0% | OTHER |
| 12 | `validate:world2-real-instantiation-v1` | 630s | 10.5 min | CRITICAL | 0% | WORLD2 |
| 13 | `validate:product-stabilization-phase-5-v1` | 579s | 9.65 min | CRITICAL | 98% | OTHER |
| 14 | `validate:failed-build-forensic-manifest` | 428s | 7.13 min | CRITICAL | 98% | OTHER |
| 15 | `validate:autonomous-founder-launch-authority-v1` | 426s | 7.1 min | CRITICAL | 17% | AFLA |
| 16 | `validate:production-readiness-gate-v1` | 420s | 7 min | CRITICAL | 50% | OTHER |
| 17 | `validate:product-stabilization-phase-3-v1` | 318s | 5.3 min | CRITICAL | 98% | OTHER |
| 18 | `validate:code-generation-engine-v1` | 312s | 5.2 min | CRITICAL | 75% | OTHER |
| 19 | `validate:engineering-reality-v1` | 180s | 3 min | CRITICAL | 0% | ENGINEERING |
| 20 | `validate:feature-reality-v1` | 180s | 3 min | CRITICAL | 98% | FEATURE_REALITY |


## Top 20 Highest Duplicate Validators

### Highest duplicate work %

| Rank | Validator | Runtime (s) | Runtime (min) | Cost | Dup % | Category |
|------|-----------|-------------|---------------|------|-------|----------|
| 1 | `validate:action-visibility-engine` | 27s | 0.45 min | MEDIUM | 98% | OTHER |
| 2 | `validate:afla-trust-calibration-v1` | 8s | 0.13 min | CRITICAL | 98% | AFLA |
| 3 | `validate:auto-fix-runtime-foundation` | 62s | 1.03 min | MEDIUM | 98% | FOUNDATION |
| 4 | `validate:autonomous-build-execution-proof` | 73s | 1.22 min | MEDIUM | 98% | OTHER |
| 5 | `validate:autonomous-builder-reality` | 68s | 1.13 min | MEDIUM | 98% | OTHER |
| 6 | `validate:autonomous-fixing` | 108s | 1.8 min | HIGH | 98% | OTHER |
| 7 | `validate:blueprint-purity` | 53s | 0.88 min | MEDIUM | 98% | BLUEPRINT |
| 8 | `validate:brain-memory-visibility-stack` | 27s | 0.45 min | MEDIUM | 98% | OTHER |
| 9 | `validate:build-history-integrity` | 53s | 0.88 min | MEDIUM | 98% | OTHER |
| 10 | `validate:build-materialization-reality` | 53s | 0.88 min | MEDIUM | 98% | OTHER |
| 11 | `validate:build-materialization-truth-bridge` | 53s | 0.88 min | MEDIUM | 98% | OTHER |
| 12 | `validate:build-proof-gap-materialization` | 138s | 2.3 min | HIGH | 98% | OTHER |
| 13 | `validate:build-reality-autofix-engine-v1` | 2433s | 40.55 min | CRITICAL | 98% | OTHER |
| 14 | `validate:build-result-conversational-intelligence` | 38s | 0.63 min | MEDIUM | 98% | OTHER |
| 15 | `validate:build-task-runtime-foundation` | 27s | 0.45 min | MEDIUM | 98% | FOUNDATION |
| 16 | `validate:capability-research-engine` | 38s | 0.63 min | MEDIUM | 98% | OTHER |
| 17 | `validate:chat-operational-truth-source-synchronization` | 53s | 0.88 min | MEDIUM | 98% | OTHER |
| 18 | `validate:chat-routing-consistency` | 53s | 0.88 min | MEDIUM | 98% | OTHER |
| 19 | `validate:cloud-monitoring-foundation` | 73s | 1.22 min | MEDIUM | 98% | FOUNDATION |
| 20 | `validate:cloud-recovery-foundation` | 97s | 1.62 min | MEDIUM | 98% | FOUNDATION |


---

## Duplicate Work Analysis

| Validator | Dup % | Duplicated Operations | Overlapping Validators |
|-----------|-------|----------------------|------------------------|
| `validate:action-visibility-engine` | 98% | preview server startup | validate:brain-memory-visibility-stack, validate:build-intent-routing-v1, validate:chat-to-build-execution-bridge-v1 |
| `validate:afla-trust-calibration-v1` | 98% | AFLA execution | validate:autonomous-founder-launch-authority-v1 |
| `validate:auto-fix-runtime-foundation` | 98% | npm build, preview server startup | validate:build-task-runtime-foundation, validate:cloud-monitoring-foundation, validate:cloud-recovery-foundation |
| `validate:autonomous-build-execution-proof` | 98% | npm build | validate:autonomous-builder-reality, validate:autonomous-fixing, validate:build-intent-classification-recovery-v1 |
| `validate:autonomous-builder-reality` | 98% | npm build | validate:autonomous-build-execution-proof, validate:autonomous-fixing, validate:build-intent-classification-recovery-v1 |
| `validate:autonomous-fixing` | 98% | npm build | validate:autonomous-build-execution-proof, validate:autonomous-builder-reality, validate:build-intent-classification-recovery-v1 |
| `validate:blueprint-purity` | 98% | workspace materialization | validate:universal-app-blueprint-v1, validate:universal-app-blueprint-visual-v1 |
| `validate:brain-memory-visibility-stack` | 98% | preview server startup | validate:action-visibility-engine, validate:build-intent-routing-v1, validate:chat-to-build-execution-bridge-v1 |
| `validate:build-history-integrity` | 98% | workspace materialization | validate:build-materialization-reality, validate:build-materialization-truth-bridge, validate:build-proof-gap-materialization |
| `validate:build-intent-classification-recovery-v1` | 98% | npm build | validate:autonomous-build-execution-proof, validate:autonomous-builder-reality, validate:autonomous-fixing |
| `validate:build-intent-routing-v1` | 98% | npm build, preview server startup | validate:chat-to-build-execution-bridge-v1, validate:action-visibility-engine, validate:autonomous-build-execution-proof |
| `validate:build-materialization-reality` | 98% | workspace materialization | validate:build-history-integrity, validate:build-materialization-truth-bridge, validate:build-proof-gap-materialization |
| `validate:build-materialization-truth-bridge` | 98% | workspace materialization | validate:build-history-integrity, validate:build-materialization-reality, validate:build-proof-gap-materialization |
| `validate:build-proof-gap-materialization` | 98% | npm build, workspace materialization | validate:code-generation-engine-v1, validate:autonomous-build-execution-proof, validate:autonomous-builder-reality |
| `validate:build-reality-autofix-engine-v1` | 98% | Playwright execution | validate:execution-proof-evolution, validate:interaction-testing-engine, validate:live-preview-runtime |

---

## Runtime Bottlenecks

| Rank | Bottleneck | Affected Validators | Est. Aggregate | Impact |
|------|------------|---------------------|----------------|--------|
| 1 | Repeated Playwright suites | 17 | 231 min | 265 |
| 2 | Repeated preview server startup | 99 | 41.2 min | 239 |
| 3 | Repeated npm builds | 64 | 61.8 min | 190 |
| 4 | Repeated workspace materialization | 31 | 30.4 min | 92 |
| 5 | Repeated npm installs | 19 | 43.5 min | 82 |
| 6 | Repeated AFLA execution | 5 | 58 min | 68 |
| 7 | Nested validator chains | 21 | 10.5 min | 53 |
| 8 | Repeated real build pipeline execution | 4 | 9 min | 17 |
| 9 | Repeated UVL execution | 4 | 4.7 min | 13 |

---

## Validation Dependency Graph

### Nested Chains

| Type | Chain |
|------|-------|
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:production-readiness-gate-v1 → validate:validation-runtime-governance-v1 → validate:autonomous-founder-launch-authority-v1 → validate:validation-runtime-audit-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:production-readiness-gate-v1 → validate:capability-audit-v3-1 → validate:validation-runtime-governance-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:general-purpose-code-generation-v1 → validate:cloud-execution-path-v1 → validate:production-readiness-gate-v1 → validate:validation-runtime-governance-v1 → validate:autonomous-founder-launch-authority-v1 → validate:validation-runtime-audit-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:general-purpose-code-generation-v1 → validate:cloud-execution-path-v1 → validate:production-readiness-gate-v1 → validate:capability-audit-v3-1 → validate:validation-runtime-governance-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:general-purpose-code-generation-v1 → validate:cloud-execution-path-v1 → validate:validation-runtime-governance-v1 → validate:autonomous-founder-launch-authority-v1 → validate:validation-runtime-audit-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:general-purpose-code-generation-v1 → validate:cloud-execution-path-v1 → validate:production-readiness-gate-v1 → validate:uvl-verification-execution-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:general-purpose-code-generation-v1 → validate:production-readiness-gate-v1 → validate:validation-runtime-governance-v1 → validate:autonomous-founder-launch-authority-v1 → validate:validation-runtime-audit-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:general-purpose-code-generation-v1 → validate:production-readiness-gate-v1 → validate:capability-audit-v3-1 → validate:validation-runtime-governance-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:general-purpose-code-generation-v1 → validate:validation-runtime-governance-v1 → validate:autonomous-founder-launch-authority-v1 → validate:validation-runtime-audit-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:general-purpose-code-generation-v1 → validate:cloud-execution-path-v1 → validate:production-readiness-gate-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:cloud-execution-path-v1 → validate:production-readiness-gate-v1 → validate:validation-runtime-governance-v1 → validate:autonomous-founder-launch-authority-v1 → validate:validation-runtime-audit-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:cloud-execution-path-v1 → validate:production-readiness-gate-v1 → validate:capability-audit-v3-1 → validate:validation-runtime-governance-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:cloud-execution-path-v1 → validate:validation-runtime-governance-v1 → validate:autonomous-founder-launch-authority-v1 → validate:validation-runtime-audit-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:cloud-execution-path-v1 → validate:production-readiness-gate-v1 → validate:uvl-verification-execution-v1 |
| nested | validate:canonical-ownership-v2 → validate:self-evolution-execution-v1 → validate:world2-real-instantiation-v1 → validate:large-scale-pipeline-integration-v1 → validate:validation-runtime-governance-v1 → validate:autonomous-founder-launch-authority-v1 → validate:validation-runtime-audit-v1 |

### Circular Validation Paths

- `validate:continuous-deployment-pipeline-v1 → validate:production-observability-platform-v1 → validate:continuous-deployment-pipeline-v1`
- `validate:production-observability-platform-v1 → validate:continuous-deployment-pipeline-v1 → validate:production-observability-platform-v1`

### Repeated Validation Paths

- validate:continuous-deployment-pipeline-v1→validate:production-observability-platform-v1→validate:continuous-deployment-pipeline-v1 (2x)
- validate:production-observability-platform-v1→validate:continuous-deployment-pipeline-v1→validate:production-observability-platform-v1 (2x)

---

## Governance Recommendations (Evidence Only — Not Implemented)

| Action | Target | Est. Savings | Evidence |
|--------|--------|--------------|----------|
| CACHE | build outputs across validators | 31 min | validate:autonomous-build-execution-proof, validate:autonomous-fixing, validate:build-intent-classification-recovery-v1 |
| REUSE | preview servers across validators | 79 min | validate:action-visibility-engine, validate:auto-fix-runtime-foundation, validate:autonomous-founder-launch-authority-v1 |
| MERGE | UVL verification paths | 1 min | validate:connected-verification-execution, validate:founder-execution-proof, validate:uvl-maturity-verification-hub-v1 |
| TIER | AFLA validation to launch-only gate | 7.1 min | validate:afla-trust-calibration-v1, validate:autonomous-founder-launch-authority-v1, validate:founder-review-operator-dashboard-v1 |
| MERGE | high-duplicate regression validators | 1 min | validate:action-visibility-engine, validate:afla-trust-calibration-v1, validate:auto-fix-runtime-foundation |
| REUSE | nested validator results | 52 min | validate:brain-memory-visibility-stack, validate:canonical-ownership-v2, validate:chat-authority |
| REMOVE | circular validation paths | 0 min | validate:continuous-deployment-pipeline-v1 → validate:production-observability-platform-v1 → validate:continuous-deployment-pipeline-v1, validate:production-observability-platform-v1 → validate:continuous-deployment-pipeline-v1 → validate:production-observability-platform-v1 |
| TIER | launch-only validation | 7 min | validate:afla-trust-calibration-v1, validate:autonomous-founder-launch-authority-v1, validate:connected-launch-readiness-proof |
| CACHE | Playwright browser sessions | 26 min | validate:autonomous-founder-launch-authority-v1, validate:build-reality-autofix-engine-v1, validate:engineering-reality-v1 |
| KEEP | fast validators as always-on regression | 0 min | validate:adaptive-autofix-intelligence, validate:adoption-prediction-authority, validate:adoption-prediction-engine |

> **Note:** These are measurement-derived recommendations only. No caching, merging, tiering, or validator changes were applied in this phase.

---

## Artifacts

- `.validation-runtime-audit-v1/runtime-metrics.json`
- `.validation-runtime-audit-v1/validator-rankings.json`
- `.validation-runtime-audit-v1/duplicate-work-analysis.json`
- `.validation-runtime-audit-v1/dependency-graph.json`
- `.validation-runtime-audit-v1/bottlenecks.json`
- `.validation-runtime-audit-v1/governance-recommendations.json`

---

## Answers

| Question | Answer |
|----------|--------|
| Which validators are slowest? | See Top 20 Slowest — leader: `validate:build-reality-autofix-engine-v1` (2433s) |
| Which consume most resources? | See Top 20 Most Expensive — leader: `validate:build-reality-autofix-engine-v1` (CRITICAL) |
| Which duplicate work? | See Duplicate Work — leader: `validate:action-visibility-engine` (98%) |
| Where is runtime lost? | See Bottlenecks — #1: Repeated Playwright suites |
| What to optimize first? | CACHE: build outputs across validators |
